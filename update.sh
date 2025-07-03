#!/bin/bash

# ZenTasks Update Script
# This script updates an existing ZenTasks installation with new code
# It does NOT modify SSL certificates or Nginx configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="zentasks"
APP_USER="zentasks"
APP_DIR="/var/www/zentasks"
BACKUP_DIR="/var/backups/zentasks"
DATE=$(date +%Y%m%d_%H%M%S)

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_error "This script should not be run as root. Please run as a regular user with sudo privileges."
        exit 1
    fi
}

# Function to check if user has sudo privileges
check_sudo() {
    if ! sudo -n true 2>/dev/null; then
        print_error "This script requires sudo privileges. Please ensure your user can run sudo commands."
        exit 1
    fi
}

# Function to check if ZenTasks is installed
check_installation() {
    if [[ ! -d "$APP_DIR" ]]; then
        print_error "ZenTasks installation not found at $APP_DIR"
        print_error "Please run the initial setup.sh script first"
        exit 1
    fi

    if ! id "$APP_USER" &>/dev/null; then
        print_error "ZenTasks user '$APP_USER' not found"
        print_error "Please run the initial setup.sh script first"
        exit 1
    fi

    if [[ ! -f "$APP_DIR/package.json" ]]; then
        print_error "package.json not found in $APP_DIR"
        print_error "This doesn't appear to be a valid ZenTasks installation"
        exit 1
    fi
}

# Function to create backup
create_backup() {
    print_status "Creating backup of current installation..."
    
    # Create backup directory
    sudo mkdir -p "$BACKUP_DIR"
    
    # Create backup with timestamp
    BACKUP_FILE="$BACKUP_DIR/zentasks-backup-$DATE.tar.gz"
    
    # Backup application directory (excluding node_modules for space)
    sudo tar -czf "$BACKUP_FILE" \
        --exclude="$APP_DIR/node_modules" \
        --exclude="$APP_DIR/dist" \
        -C "$(dirname "$APP_DIR")" \
        "$(basename "$APP_DIR")"
    
    print_success "Backup created: $BACKUP_FILE"
    
    # Keep only last 5 backups
    sudo find "$BACKUP_DIR" -name "zentasks-backup-*.tar.gz" -type f | \
        sort -r | tail -n +6 | xargs -r sudo rm -f
    
    print_status "Cleaned up old backups (keeping last 5)"
}

# Function to stop the application
stop_application() {
    print_status "Stopping ZenTasks application..."
    
    # Stop PM2 process
    if sudo -u "$APP_USER" pm2 list | grep -q zentasks; then
        sudo -u "$APP_USER" pm2 stop zentasks
        print_success "Application stopped"
    else
        print_warning "Application was not running"
    fi
}

# Function to update application files
update_application_files() {
    print_status "Updating application files..."
    
    # Get current directory (where the update script is located)
    CURRENT_DIR=$(pwd)
    
    # Verify we're in a ZenTasks project directory
    if [[ ! -f "$CURRENT_DIR/package.json" ]]; then
        print_error "package.json not found in current directory"
        print_error "Please run this script from the ZenTasks project directory"
        exit 1
    fi
    
    # Copy new files to application directory
    print_status "Copying updated files..."
    
    # Copy all files except sensitive ones
    sudo rsync -av \
        --exclude='.git' \
        --exclude='node_modules' \
        --exclude='dist' \
        --exclude='server/data' \
        --exclude='.env' \
        --exclude='*.log' \
        "$CURRENT_DIR/" "$APP_DIR/"
    
    # Set proper ownership
    sudo chown -R "$APP_USER:$APP_USER" "$APP_DIR"
    
    print_success "Application files updated"
}

# Function to update dependencies
update_dependencies() {
    print_status "Updating dependencies..."
    
    cd "$APP_DIR"
    
    # Clear npm cache
    sudo -u "$APP_USER" npm cache clean --force
    
    # Remove node_modules and package-lock.json for clean install
    sudo -u "$APP_USER" rm -rf node_modules package-lock.json
    
    # Install dependencies
    print_status "Installing dependencies..."
    sudo -u "$APP_USER" npm install
    
    print_success "Dependencies updated"
}

# Function to build application
build_application() {
    print_status "Building application..."
    
    cd "$APP_DIR"
    
    # Remove old build
    sudo -u "$APP_USER" rm -rf dist
    
    # Build the application
    print_status "Building frontend with Vite..."
    sudo -u "$APP_USER" npm run build
    
    # Verify build output
    if [[ -d dist ]]; then
        print_success "Build completed successfully"
        print_status "Build output directory contents:"
        ls -la dist/
    else
        print_error "Build failed - dist directory not created"
        exit 1
    fi
    
    # Clean up dev dependencies to save space
    print_status "Cleaning up dev dependencies..."
    sudo -u "$APP_USER" npm prune --production
    
    print_success "Application built and optimized"
}

# Function to update PM2 configuration
update_pm2_config() {
    print_status "Updating PM2 configuration..."
    
    cd "$APP_DIR"
    
    # Check if ecosystem config exists and update if needed
    if [[ -f "ecosystem.config.cjs" ]]; then
        print_status "PM2 configuration file found"
        
        # Reload PM2 configuration
        sudo -u "$APP_USER" pm2 reload ecosystem.config.cjs
        print_success "PM2 configuration updated"
    else
        print_warning "PM2 configuration file not found - using existing configuration"
    fi
}

# Function to start the application
start_application() {
    print_status "Starting ZenTasks application..."
    
    cd "$APP_DIR"
    
    # Start or restart the application
    if sudo -u "$APP_USER" pm2 list | grep -q zentasks; then
        sudo -u "$APP_USER" pm2 restart zentasks
        print_success "Application restarted"
    else
        sudo -u "$APP_USER" pm2 start ecosystem.config.cjs
        print_success "Application started"
    fi
    
    # Save PM2 configuration
    sudo -u "$APP_USER" pm2 save
    
    # Wait a moment for the application to start
    sleep 3
    
    # Check if application is running
    if sudo -u "$APP_USER" pm2 list | grep -q "zentasks.*online"; then
        print_success "Application is running successfully"
    else
        print_error "Application failed to start properly"
        print_status "Check logs with: sudo -u $APP_USER pm2 logs zentasks"
        exit 1
    fi
}

# Function to verify update
verify_update() {
    print_status "Verifying update..."
    
    # Check if the application responds
    local max_attempts=10
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -s -f http://localhost:3001/api/health >/dev/null 2>&1; then
            print_success "Application health check passed"
            break
        else
            print_status "Waiting for application to respond... (attempt $attempt/$max_attempts)"
            sleep 2
            ((attempt++))
        fi
    done
    
    if [[ $attempt -gt $max_attempts ]]; then
        print_warning "Application health check failed, but this might be normal if the backend is not configured"
        print_status "Check application logs: sudo -u $APP_USER pm2 logs zentasks"
    fi
    
    # Check if static files are being served
    if [[ -f "$APP_DIR/dist/index.html" ]]; then
        print_success "Frontend build files are present"
    else
        print_error "Frontend build files are missing"
        exit 1
    fi
}

# Function to display update summary
display_update_summary() {
    echo
    echo -e "${GREEN}=== ZenTasks Update Complete ===${NC}"
    echo
    print_success "Application has been updated successfully"
    print_success "Backup created: $BACKUP_FILE"
    print_success "Application directory: $APP_DIR"
    print_success "Application user: $APP_USER"
    echo
    print_status "Useful commands:"
    echo "  View application status: sudo -u $APP_USER pm2 list"
    echo "  View application logs: sudo -u $APP_USER pm2 logs zentasks"
    echo "  Restart application: sudo -u $APP_USER pm2 restart zentasks"
    echo "  View Nginx status: sudo systemctl status nginx"
    echo "  View Nginx logs: sudo tail -f /var/log/nginx/error.log"
    echo
    print_status "If you encounter issues:"
    echo "  1. Check application logs: sudo -u $APP_USER pm2 logs zentasks"
    echo "  2. Check Nginx logs: sudo tail -f /var/log/nginx/error.log"
    echo "  3. Restore from backup if needed: $BACKUP_FILE"
    echo
    print_warning "Note: This update script does not modify SSL certificates or Nginx configuration"
    print_warning "If you need to update those, please run the full setup.sh script"
    echo
}

# Function to handle rollback
rollback_update() {
    print_error "Update failed. Would you like to rollback to the previous version?"
    read -p "Rollback? (y/n): " rollback_choice
    
    if [[ "$rollback_choice" =~ ^[Yy]$ ]]; then
        print_status "Rolling back to previous version..."
        
        # Stop current application
        sudo -u "$APP_USER" pm2 stop zentasks 2>/dev/null || true
        
        # Restore from backup
        if [[ -f "$BACKUP_FILE" ]]; then
            sudo rm -rf "$APP_DIR"
            sudo mkdir -p "$(dirname "$APP_DIR")"
            sudo tar -xzf "$BACKUP_FILE" -C "$(dirname "$APP_DIR")"
            sudo chown -R "$APP_USER:$APP_USER" "$APP_DIR"
            
            # Restart application
            cd "$APP_DIR"
            sudo -u "$APP_USER" pm2 start ecosystem.config.cjs 2>/dev/null || true
            
            print_success "Rollback completed"
        else
            print_error "Backup file not found: $BACKUP_FILE"
        fi
    fi
}

# Main execution
main() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    ZenTasks Update Script                   ║"
    echo "║              Update Existing Installation                   ║"
    echo "║          (Does not modify SSL or Nginx config)             ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    # Trap errors for rollback option
    trap rollback_update ERR
    
    check_root
    check_sudo
    check_installation
    
    print_status "Starting ZenTasks update process..."
    
    create_backup
    stop_application
    update_application_files
    update_dependencies
    build_application
    update_pm2_config
    start_application
    verify_update
    
    display_update_summary
    
    # Remove error trap
    trap - ERR
}

# Run main function
main "$@"