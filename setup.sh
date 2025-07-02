#!/bin/bash

# ZenTasks Ubuntu Deployment Setup Script
# This script automates the deployment of ZenTasks on Ubuntu with Nginx

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
NODE_VERSION="18"
DOMAIN=""
EMAIL=""
USE_SSL=false

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

# Function to get user input
get_user_input() {
    echo -e "${BLUE}=== ZenTasks Deployment Configuration ===${NC}"
    echo
    
    read -p "Enter your domain name (e.g., zentasks.example.com): " DOMAIN
    if [[ -z "$DOMAIN" ]]; then
        print_error "Domain name is required"
        exit 1
    fi
    
    read -p "Enter your email for SSL certificate (optional): " EMAIL
    
    if [[ -n "$EMAIL" ]]; then
        read -p "Do you want to set up SSL with Let's Encrypt? (y/n): " ssl_choice
        if [[ "$ssl_choice" =~ ^[Yy]$ ]]; then
            USE_SSL=true
        fi
    fi
    
    echo
    print_status "Configuration:"
    print_status "Domain: $DOMAIN"
    print_status "Email: ${EMAIL:-'Not provided'}"
    print_status "SSL: ${USE_SSL}"
    echo
    
    read -p "Continue with deployment? (y/n): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        print_warning "Deployment cancelled"
        exit 0
    fi
}

# Function to update system
update_system() {
    print_status "Updating system packages..."
    sudo apt update
    sudo apt upgrade -y
    print_success "System updated"
}

# Function to install Node.js
install_nodejs() {
    print_status "Installing Node.js ${NODE_VERSION}..."
    
    # Install NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # Verify installation
    node_version=$(node --version)
    npm_version=$(npm --version)
    
    print_success "Node.js installed: $node_version"
    print_success "npm installed: $npm_version"
}

# Function to install Nginx
install_nginx() {
    print_status "Installing Nginx..."
    sudo apt install -y nginx
    
    # Start and enable Nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
    
    print_success "Nginx installed and started"
}

# Function to install PM2
install_pm2() {
    print_status "Installing PM2..."
    sudo npm install -g pm2
    
    print_success "PM2 installed"
}

# Function to install Certbot (for SSL)
install_certbot() {
    if [[ "$USE_SSL" == true ]]; then
        print_status "Installing Certbot for SSL certificates..."
        sudo apt install -y certbot python3-certbot-nginx
        print_success "Certbot installed"
    fi
}

# Function to create application user
create_app_user() {
    print_status "Creating application user: $APP_USER"
    
    if id "$APP_USER" &>/dev/null; then
        print_warning "User $APP_USER already exists"
    else
        sudo useradd -r -s /bin/bash -d $APP_DIR $APP_USER
        print_success "User $APP_USER created"
    fi
}

# Function to setup application directory
setup_app_directory() {
    print_status "Setting up application directory: $APP_DIR"
    
    # Create directory
    sudo mkdir -p $APP_DIR
    
    # Copy application files
    print_status "Copying application files..."
    sudo cp -r . $APP_DIR/
    
    # Set ownership
    sudo chown -R $APP_USER:$APP_USER $APP_DIR
    
    print_success "Application directory setup complete"
}

# Function to install application dependencies
install_app_dependencies() {
    print_status "Installing application dependencies..."
    
    cd $APP_DIR
    sudo -u $APP_USER npm install --production
    
    print_success "Dependencies installed"
}

# Function to build application
build_application() {
    print_status "Building application..."
    
    cd $APP_DIR
    sudo -u $APP_USER npm run build
    
    print_success "Application built"
}

# Function to create environment file
create_env_file() {
    print_status "Creating environment configuration..."
    
    cat > /tmp/zentasks.env << EOF
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://$DOMAIN
EOF
    
    sudo mv /tmp/zentasks.env $APP_DIR/.env
    sudo chown $APP_USER:$APP_USER $APP_DIR/.env
    
    print_success "Environment file created"
}

# Function to create PM2 ecosystem file
create_pm2_config() {
    print_status "Creating PM2 configuration..."
    
    cat > /tmp/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'zentasks',
    script: 'server/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/var/log/zentasks/error.log',
    out_file: '/var/log/zentasks/out.log',
    log_file: '/var/log/zentasks/combined.log',
    time: true
  }]
}
EOF
    
    sudo mv /tmp/ecosystem.config.js $APP_DIR/
    sudo chown $APP_USER:$APP_USER $APP_DIR/ecosystem.config.js
    
    # Create log directory
    sudo mkdir -p /var/log/zentasks
    sudo chown $APP_USER:$APP_USER /var/log/zentasks
    
    print_success "PM2 configuration created"
}

# Function to start application with PM2
start_application() {
    print_status "Starting application with PM2..."
    
    cd $APP_DIR
    sudo -u $APP_USER pm2 start ecosystem.config.js
    sudo -u $APP_USER pm2 save
    
    # Setup PM2 startup script
    sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $APP_USER --hp $APP_DIR
    
    print_success "Application started"
}

# Function to configure Nginx
configure_nginx() {
    print_status "Configuring Nginx..."
    
    # Create Nginx configuration
    cat > /tmp/zentasks.nginx << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # API routes - proxy to Node.js backend
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Static files - serve from built frontend
    location / {
        root $APP_DIR/dist;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # Don't cache HTML files
        location ~* \.html$ {
            expires -1;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
        }
    }
    
    # Security: deny access to sensitive files
    location ~ /\. {
        deny all;
    }
    
    location ~ /(package\.json|server/|src/|node_modules/) {
        deny all;
    }
}
EOF
    
    # Install Nginx configuration
    sudo mv /tmp/zentasks.nginx /etc/nginx/sites-available/zentasks
    sudo ln -sf /etc/nginx/sites-available/zentasks /etc/nginx/sites-enabled/
    
    # Remove default site
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test Nginx configuration
    sudo nginx -t
    
    # Reload Nginx
    sudo systemctl reload nginx
    
    print_success "Nginx configured"
}

# Function to setup SSL with Let's Encrypt
setup_ssl() {
    if [[ "$USE_SSL" == true ]]; then
        print_status "Setting up SSL certificate with Let's Encrypt..."
        
        # Get SSL certificate
        sudo certbot --nginx -d $DOMAIN --email $EMAIL --agree-tos --non-interactive --redirect
        
        # Setup auto-renewal
        sudo systemctl enable certbot.timer
        
        print_success "SSL certificate installed and auto-renewal configured"
    fi
}

# Function to configure firewall
configure_firewall() {
    print_status "Configuring firewall..."
    
    # Check if UFW is installed
    if command -v ufw >/dev/null 2>&1; then
        sudo ufw --force enable
        sudo ufw allow ssh
        sudo ufw allow 'Nginx Full'
        print_success "Firewall configured"
    else
        print_warning "UFW not installed, skipping firewall configuration"
    fi
}

# Function to create systemd service for PM2
create_systemd_service() {
    print_status "Creating systemd service for PM2..."
    
    cat > /tmp/zentasks.service << EOF
[Unit]
Description=ZenTasks Application
After=network.target

[Service]
Type=forking
User=$APP_USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/pm2 start ecosystem.config.js
ExecReload=/usr/bin/pm2 reload ecosystem.config.js
ExecStop=/usr/bin/pm2 stop ecosystem.config.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
    
    sudo mv /tmp/zentasks.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable zentasks
    
    print_success "Systemd service created"
}

# Function to create backup script
create_backup_script() {
    print_status "Creating backup script..."
    
    cat > /tmp/backup-zentasks.sh << 'EOF'
#!/bin/bash

# ZenTasks Backup Script
BACKUP_DIR="/var/backups/zentasks"
APP_DIR="/var/www/zentasks"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup data
tar -czf $BACKUP_DIR/zentasks-data-$DATE.tar.gz -C $APP_DIR server/data

# Keep only last 7 days of backups
find $BACKUP_DIR -name "zentasks-data-*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/zentasks-data-$DATE.tar.gz"
EOF
    
    sudo mv /tmp/backup-zentasks.sh /usr/local/bin/
    sudo chmod +x /usr/local/bin/backup-zentasks.sh
    
    # Add to crontab for daily backups
    (sudo crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-zentasks.sh") | sudo crontab -
    
    print_success "Backup script created and scheduled"
}

# Function to display final information
display_final_info() {
    echo
    echo -e "${GREEN}=== ZenTasks Deployment Complete ===${NC}"
    echo
    print_success "Application URL: http${USE_SSL:+s}://$DOMAIN"
    print_success "Application directory: $APP_DIR"
    print_success "Application user: $APP_USER"
    print_success "Logs: /var/log/zentasks/"
    echo
    print_status "Useful commands:"
    echo "  View application status: sudo -u $APP_USER pm2 list"
    echo "  View application logs: sudo -u $APP_USER pm2 logs zentasks"
    echo "  Restart application: sudo -u $APP_USER pm2 restart zentasks"
    echo "  View Nginx status: sudo systemctl status nginx"
    echo "  View Nginx logs: sudo tail -f /var/log/nginx/error.log"
    echo "  Manual backup: sudo /usr/local/bin/backup-zentasks.sh"
    echo
    if [[ "$USE_SSL" == true ]]; then
        print_status "SSL certificate will auto-renew. Test renewal with:"
        echo "  sudo certbot renew --dry-run"
        echo
    fi
    print_warning "Please ensure your domain DNS points to this server's IP address"
    echo
}

# Main execution
main() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    ZenTasks Deployment                      ║"
    echo "║                  Ubuntu Setup Script                        ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    check_root
    check_sudo
    get_user_input
    
    print_status "Starting deployment process..."
    
    update_system
    install_nodejs
    install_nginx
    install_pm2
    install_certbot
    create_app_user
    setup_app_directory
    install_app_dependencies
    build_application
    create_env_file
    create_pm2_config
    start_application
    configure_nginx
    setup_ssl
    configure_firewall
    create_systemd_service
    create_backup_script
    
    display_final_info
}

# Run main function
main "$@"