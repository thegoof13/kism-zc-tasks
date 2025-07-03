#!/bin/bash

# ZenTasks Ubuntu Deployment Setup Script (LXC Compatible)
# This script automates the deployment of ZenTasks on Ubuntu with Nginx
# Compatible with LXC containers and traditional Ubuntu installations
# Now includes Kiosk Portal support with secure random paths
# Enhanced SSL detection with comprehensive debugging

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
CLOUDFLARE_EMAIL=""
CLOUDFLARE_API_TOKEN=""
SSL_CONFIG_DIR="/etc/letsencrypt/cloudflare"
IS_LXC_CONTAINER=false
KIOSK_PATH=""
ENABLE_KIOSK=false
EXISTING_SSL_CERT=""
EXISTING_SSL_KEY=""
DEBUG_MODE=true

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

print_debug() {
    if [[ "$DEBUG_MODE" == true ]]; then
        echo -e "${YELLOW}[DEBUG]${NC} $1"
    fi
}

# Function to detect if running in LXC container
detect_container_environment() {
    print_status "Detecting container environment..."
    
    if [[ -f /proc/1/environ ]] && grep -q "container=lxc" /proc/1/environ; then
        IS_LXC_CONTAINER=true
        print_warning "LXC container detected - using container-compatible installation methods"
    elif [[ -f /.dockerenv ]]; then
        print_warning "Docker container detected - some features may not work as expected"
    elif systemd-detect-virt -c >/dev/null 2>&1; then
        container_type=$(systemd-detect-virt -c)
        print_warning "Container detected: $container_type - adapting installation"
        if [[ "$container_type" == "lxc" ]]; then
            IS_LXC_CONTAINER=true
        fi
    else
        print_status "Running on bare metal or VM - full feature support available"
    fi
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

# Function to generate secure random string
generate_random_string() {
    openssl rand -hex 8
}

# Enhanced function to check if file exists and is readable (with sudo support)
file_accessible() {
    local file_path="$1"
    local use_sudo="${2:-false}"
    
    print_debug "Checking file accessibility: $file_path (sudo: $use_sudo)"
    
    if [[ "$use_sudo" == "true" ]]; then
        # Use sudo to check file
        if sudo test -f "$file_path" && sudo test -r "$file_path"; then
            print_debug "File accessible with sudo: $file_path"
            return 0
        else
            print_debug "File not accessible with sudo: $file_path"
            return 1
        fi
    else
        # Check without sudo
        if [[ -f "$file_path" && -r "$file_path" ]]; then
            print_debug "File accessible without sudo: $file_path"
            return 0
        else
            print_debug "File not accessible without sudo: $file_path"
            return 1
        fi
    fi
}

# Enhanced function to validate SSL certificate
validate_ssl_certificate() {
    local cert_path="$1"
    local key_path="$2"
    local domain="$3"
    local use_sudo="${4:-false}"
    
    print_debug "Validating SSL certificate for $domain..."
    print_debug "Certificate: $cert_path"
    print_debug "Private key: $key_path"
    print_debug "Using sudo: $use_sudo"
    
    # Check if files are accessible
    if ! file_accessible "$cert_path" "$use_sudo"; then
        print_debug "Certificate file not accessible: $cert_path"
        return 1
    fi
    
    if ! file_accessible "$key_path" "$use_sudo"; then
        print_debug "Private key file not accessible: $key_path"
        return 1
    fi
    
    print_debug "Both certificate and key files are accessible"
    
    # Test certificate format
    print_debug "Testing certificate format..."
    local cert_test_cmd="openssl x509 -in '$cert_path' -noout -text"
    if [[ "$use_sudo" == "true" ]]; then
        cert_test_cmd="sudo $cert_test_cmd"
    fi
    
    if ! eval "$cert_test_cmd" >/dev/null 2>&1; then
        print_debug "Certificate format validation failed"
        return 1
    fi
    print_debug "Certificate format is valid"
    
    # Test private key format
    print_debug "Testing private key format..."
    local key_test_cmd="openssl rsa -in '$key_path' -check -noout 2>/dev/null || openssl ec -in '$key_path' -check -noout 2>/dev/null"
    if [[ "$use_sudo" == "true" ]]; then
        key_test_cmd="sudo bash -c \"$key_test_cmd\""
    fi
    
    if ! eval "$key_test_cmd" >/dev/null 2>&1; then
        print_debug "Private key format validation failed"
        return 1
    fi
    print_debug "Private key format is valid"
    
    # Check certificate expiry
    print_debug "Checking certificate expiry..."
    local expiry_cmd="openssl x509 -in '$cert_path' -noout -enddate"
    if [[ "$use_sudo" == "true" ]]; then
        expiry_cmd="sudo $expiry_cmd"
    fi
    
    local expiry_output
    if ! expiry_output=$(eval "$expiry_cmd" 2>/dev/null); then
        print_debug "Failed to get certificate expiry date"
        return 1
    fi
    
    local expiry_date=$(echo "$expiry_output" | cut -d= -f2)
    print_debug "Certificate expiry date: $expiry_date"
    
    # Convert expiry date to epoch and check if it's in the future
    local expiry_epoch
    if ! expiry_epoch=$(date -d "$expiry_date" +%s 2>/dev/null); then
        print_debug "Failed to parse expiry date: $expiry_date"
        return 1
    fi
    
    local current_epoch=$(date +%s)
    local days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))
    
    if [[ $days_until_expiry -lt 0 ]]; then
        print_debug "Certificate has expired ($days_until_expiry days ago)"
        return 1
    elif [[ $days_until_expiry -lt 7 ]]; then
        print_warning "Certificate expires soon (in $days_until_expiry days)"
    else
        print_debug "Certificate is valid (expires in $days_until_expiry days)"
    fi
    
    # Check if certificate matches the domain
    print_debug "Checking domain matching..."
    local cert_info_cmd="openssl x509 -in '$cert_path' -noout -text"
    if [[ "$use_sudo" == "true" ]]; then
        cert_info_cmd="sudo $cert_info_cmd"
    fi
    
    local cert_info
    if ! cert_info=$(eval "$cert_info_cmd" 2>/dev/null); then
        print_debug "Failed to read certificate information"
        return 1
    fi
    
    print_debug "Successfully read certificate text"
    
    # Extract domains from certificate (SAN and CN)
    local cert_domains=""
    
    # Check Subject Alternative Names (SAN)
    print_debug "Looking for Subject Alternative Names..."
    if echo "$cert_info" | grep -A1 "Subject Alternative Name:" >/dev/null 2>&1; then
        local san_section=$(echo "$cert_info" | grep -A1 "Subject Alternative Name:" | tail -n1)
        print_debug "Found SAN section: $san_section"
        
        # Extract DNS names from SAN
        local san_domains=$(echo "$san_section" | grep -oE 'DNS:[^,]*' | sed 's/DNS://g' | tr ',' '\n' | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')
        if [[ -n "$san_domains" ]]; then
            cert_domains="$san_domains"
            print_debug "Found SAN domains: $(echo "$san_domains" | tr '\n' ' ')"
        fi
    fi
    
    # Check Common Name (CN) if no SAN found
    if [[ -z "$cert_domains" ]]; then
        print_debug "No SAN found, checking Common Name..."
        local cn_line=$(echo "$cert_info" | grep "Subject:" | grep -oE 'CN=[^,]*' | head -n1)
        if [[ -n "$cn_line" ]]; then
            local cn_domain=$(echo "$cn_line" | sed 's/CN=//')
            cert_domains="$cn_domain"
            print_debug "Found CN domain: $cn_domain"
        fi
    fi
    
    if [[ -z "$cert_domains" ]]; then
        print_debug "No domains found in certificate"
        return 1
    fi
    
    # Check if our domain matches any certificate domain
    print_debug "Checking domain '$domain' against certificate domains: $(echo "$cert_domains" | tr '\n' ' ')"
    local domain_match=false
    
    while IFS= read -r cert_domain; do
        [[ -z "$cert_domain" ]] && continue
        print_debug "Comparing certificate domain: '$cert_domain' with target: '$domain'"
        
        # Handle wildcard certificates
        if [[ "$cert_domain" == \*.* ]]; then
            local wildcard_base=$(echo "$cert_domain" | sed 's/^\*\.//')
            if [[ "$domain" == *".$wildcard_base" ]] || [[ "$domain" == "$wildcard_base" ]]; then
                print_debug "Wildcard match found: $cert_domain matches $domain"
                domain_match=true
                break
            fi
        elif [[ "${cert_domain,,}" == "${domain,,}" ]]; then
            print_debug "Exact match found: $cert_domain"
            domain_match=true
            break
        fi
    done <<< "$cert_domains"
    
    if [[ "$domain_match" == true ]]; then
        print_success "Domain matches certificate: $domain"
        return 0
    else
        print_debug "Domain does not match any certificate domains"
        return 1
    fi
}

# Function to check for existing SSL certificates
check_existing_ssl() {
    local domain="$1"
    
    print_status "Checking for existing SSL certificates for $domain..."
    print_debug "Target domain: $domain"
    
    # Method 1: Check direct Let's Encrypt path
    print_debug "Checking direct Let's Encrypt path:"
    local le_cert_path="/etc/letsencrypt/live/$domain/fullchain.pem"
    local le_key_path="/etc/letsencrypt/live/$domain/privkey.pem"
    print_debug "  Certificate: $le_cert_path"
    print_debug "  Private key: $le_key_path"
    
    # Check if files exist (with sudo)
    if sudo test -f "$le_cert_path" && sudo test -f "$le_key_path"; then
        print_debug "Direct certificate files exist"
        print_status "Found direct Let's Encrypt certificate for $domain"
        
        if validate_ssl_certificate "$le_cert_path" "$le_key_path" "$domain" "true"; then
            print_success "Certificate is valid for domain: $domain"
            EXISTING_SSL_CERT="$le_cert_path"
            EXISTING_SSL_KEY="$le_key_path"
            return 0
        else
            print_debug "Direct certificate validation failed"
        fi
    else
        print_debug "Direct certificate files do not exist"
    fi
    
    # Method 2: Scan all Let's Encrypt certificates
    print_status "Direct path not found, scanning all Let's Encrypt certificates..."
    if [[ -d "/etc/letsencrypt/live" ]]; then
        print_debug "Let's Encrypt directory exists: /etc/letsencrypt/live"
        
        local cert_dirs
        if cert_dirs=$(sudo ls -1 /etc/letsencrypt/live 2>/dev/null); then
            print_debug "Found Let's Encrypt certificate directories:"
            while IFS= read -r cert_dir; do
                [[ -z "$cert_dir" ]] && continue
                print_debug "  - $cert_dir"
                
                local cert_path="/etc/letsencrypt/live/$cert_dir/fullchain.pem"
                local key_path="/etc/letsencrypt/live/$cert_dir/privkey.pem"
                
                print_debug "Checking paths:"
                print_debug "  Certificate: $cert_path"
                print_debug "  Private key: $key_path"
                
                if sudo test -f "$cert_path" && sudo test -f "$key_path"; then
                    print_debug "Certificate files exist for $cert_dir"
                    print_status "Checking certificate: $cert_dir"
                    
                    if validate_ssl_certificate "$cert_path" "$key_path" "$domain" "true"; then
                        print_success "Found valid certificate for $domain in $cert_dir"
                        EXISTING_SSL_CERT="$cert_path"
                        EXISTING_SSL_KEY="$key_path"
                        return 0
                    else
                        print_debug "Certificate $cert_dir does not match domain $domain"
                    fi
                else
                    print_debug "Certificate files missing for $cert_dir"
                fi
            done <<< "$cert_dirs"
        else
            print_debug "Cannot access Let's Encrypt directory (permission denied)"
        fi
    else
        print_debug "Let's Encrypt directory does not exist"
    fi
    
    # Method 3: Check alternative certificate locations
    print_status "Checking alternative certificate locations..."
    local alt_locations=(
        "/etc/ssl/certs/$domain.crt:/etc/ssl/private/$domain.key"
        "/etc/ssl/certs/$domain.pem:/etc/ssl/private/$domain.pem"
        "/etc/nginx/ssl/$domain.crt:/etc/nginx/ssl/$domain.key"
        "/etc/nginx/ssl/$domain.pem:/etc/nginx/ssl/$domain.pem"
        "/usr/local/etc/ssl/certs/$domain.crt:/usr/local/etc/ssl/private/$domain.key"
        "/usr/local/etc/ssl/certs/$domain.pem:/usr/local/etc/ssl/private/$domain.pem"
        "/etc/pki/tls/certs/$domain.crt:/etc/pki/tls/private/$domain.key"
        "/etc/pki/tls/certs/$domain.pem:/etc/pki/tls/private/$domain.pem"
    )
    
    for location in "${alt_locations[@]}"; do
        local cert_path="${location%:*}"
        local key_path="${location#*:}"
        
        print_debug "Checking alternative certificate: $cert_path"
        
        if [[ -f "$cert_path" && -f "$key_path" ]]; then
            print_status "Found alternative certificate: $cert_path"
            
            if validate_ssl_certificate "$cert_path" "$key_path" "$domain" "false"; then
                print_success "Found valid alternative certificate for $domain"
                EXISTING_SSL_CERT="$cert_path"
                EXISTING_SSL_KEY="$key_path"
                return 0
            fi
        fi
    done
    
    print_status "No valid existing SSL certificates found for $domain"
    return 1
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
    
    # Check for existing SSL certificates
    if check_existing_ssl "$DOMAIN"; then
        print_success "Existing valid SSL certificate found for $DOMAIN"
        print_status "Certificate: $EXISTING_SSL_CERT"
        print_status "Private key: $EXISTING_SSL_KEY"
        USE_SSL=true
        
        read -p "Use existing SSL certificate? (y/n): " use_existing_ssl
        if [[ ! "$use_existing_ssl" =~ ^[Yy]$ ]]; then
            print_status "Will set up new SSL certificate"
            EXISTING_SSL_CERT=""
            EXISTING_SSL_KEY=""
            USE_SSL=false
        else
            print_success "Will use existing SSL certificate"
        fi
    else
        print_status "No valid existing SSL certificate found"
    fi
    
    # Only ask for SSL setup if no existing certificate or user chose not to use it
    if [[ -z "$EXISTING_SSL_CERT" ]]; then
        read -p "Enter your email for SSL certificate (optional): " EMAIL
        
        if [[ -n "$EMAIL" ]]; then
            read -p "Do you want to set up SSL with Let's Encrypt using Cloudflare DNS? (y/n): " ssl_choice
            if [[ "$ssl_choice" =~ ^[Yy]$ ]]; then
                USE_SSL=true
                
                echo
                print_status "Cloudflare DNS SSL Configuration"
                print_warning "You need a Cloudflare API token with Zone:Read and DNS:Edit permissions"
                print_warning "Create one at: https://dash.cloudflare.com/profile/api-tokens"
                echo
                
                read -s -p "Enter your Cloudflare API token: " CLOUDFLARE_API_TOKEN
                echo
                if [[ -z "$CLOUDFLARE_API_TOKEN" ]]; then
                    print_error "Cloudflare API token is required for DNS SSL"
                    exit 1
                fi
            fi
        fi
    fi
    
    # Kiosk Portal Configuration
    echo
    read -p "Do you want to enable the Kiosk Portal for tablet access? (y/n): " kiosk_choice
    if [[ "$kiosk_choice" =~ ^[Yy]$ ]]; then
        ENABLE_KIOSK=true
        KIOSK_PATH=$(generate_random_string)
        print_status "Kiosk Portal will be available at: http${USE_SSL:+s}://$DOMAIN/kiosk/$KIOSK_PATH/"
    fi
    
    echo
    print_status "Configuration:"
    print_status "Domain: $DOMAIN"
    print_status "Email: ${EMAIL:-'Not provided'}"
    print_status "SSL: ${USE_SSL}"
    if [[ -n "$EXISTING_SSL_CERT" ]]; then
        print_status "Using existing SSL certificate: $EXISTING_SSL_CERT"
    fi
    print_status "Kiosk Portal: ${ENABLE_KIOSK}"
    if [[ "$ENABLE_KIOSK" == true ]]; then
        print_status "Kiosk URL: http${USE_SSL:+s}://$DOMAIN/kiosk/$KIOSK_PATH/"
    fi
    print_status "Container Environment: ${IS_LXC_CONTAINER}"
    if [[ "$USE_SSL" == true && -z "$EXISTING_SSL_CERT" ]]; then
        print_status "SSL Method: Cloudflare DNS Challenge (API Token)"
    fi
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
    
    # Install essential packages
    sudo apt install -y curl wget gnupg2 software-properties-common apt-transport-https ca-certificates build-essential
    
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

# Function to install Certbot with Cloudflare plugin (Ubuntu 24.04 compatible)
install_certbot() {
    if [[ "$USE_SSL" == true && -z "$EXISTING_SSL_CERT" ]]; then
        print_status "Installing Certbot with Cloudflare DNS plugin..."
        
        # Check Ubuntu version
        ubuntu_version=$(lsb_release -rs)
        print_status "Detected Ubuntu version: $ubuntu_version"
        
        # Always use apt-based installation for better compatibility
        print_status "Using apt-based installation with virtual environment..."
        
        # Install system dependencies
        sudo apt update
        sudo apt install -y python3-venv python3-pip python3-dev libffi-dev libssl-dev
        
        # Create dedicated virtual environment for certbot
        print_status "Creating dedicated virtual environment for Certbot..."
        sudo rm -rf /opt/certbot-venv
        sudo python3 -m venv /opt/certbot-venv
        
        # Upgrade pip in virtual environment
        sudo /opt/certbot-venv/bin/pip install --upgrade pip setuptools wheel
        
        # Install certbot and cloudflare plugin in virtual environment
        print_status "Installing Certbot and Cloudflare plugin..."
        sudo /opt/certbot-venv/bin/pip install certbot certbot-dns-cloudflare
        
        # Create wrapper script for certbot
        print_status "Creating Certbot wrapper script..."
        cat > /tmp/certbot-wrapper << 'EOF'
#!/bin/bash
# Certbot wrapper script for virtual environment

VENV_PATH="/opt/certbot-venv"
CERTBOT_BIN="$VENV_PATH/bin/certbot"

# Check if virtual environment exists
if [[ ! -f "$CERTBOT_BIN" ]]; then
    echo "Error: Certbot virtual environment not found at $VENV_PATH"
    exit 1
fi

# Execute certbot with all arguments
exec "$CERTBOT_BIN" "$@"
EOF
        
        sudo mv /tmp/certbot-wrapper /usr/local/bin/certbot-cloudflare
        sudo chmod +x /usr/local/bin/certbot-cloudflare
        
        # Create symlink for standard certbot command
        sudo ln -sf /usr/local/bin/certbot-cloudflare /usr/local/bin/certbot
        
        # Verify installation
        print_status "Verifying Certbot installation..."
        if /usr/local/bin/certbot-cloudflare --version >/dev/null 2>&1; then
            certbot_version=$(/usr/local/bin/certbot-cloudflare --version 2>&1 | head -n1)
            print_success "Certbot installed successfully: $certbot_version"
        else
            print_error "Certbot installation verification failed"
            exit 1
        fi
        
        # Test cloudflare plugin
        if /usr/local/bin/certbot-cloudflare plugins | grep -q "dns-cloudflare"; then
            print_success "Cloudflare DNS plugin available"
        else
            print_error "Cloudflare DNS plugin not found"
            exit 1
        fi
        
        print_success "Certbot with Cloudflare plugin installed successfully"
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

# Function to setup kiosk portal
setup_kiosk_portal() {
    if [[ "$ENABLE_KIOSK" == true ]]; then
        print_status "Setting up Kiosk Portal..."
        
        # Create kiosk directory with random path
        KIOSK_DIR="$APP_DIR/kiosk/$KIOSK_PATH"
        sudo mkdir -p "$KIOSK_DIR"
        
        # Copy kiosk.html to the secure directory
        if [[ -f "kiosk.html" ]]; then
            sudo cp kiosk.html "$KIOSK_DIR/index.html"
            sudo chown -R $APP_USER:$APP_USER "$APP_DIR/kiosk"
            print_success "Kiosk Portal installed at: $KIOSK_DIR"
        else
            print_warning "kiosk.html not found - Kiosk Portal not installed"
            ENABLE_KIOSK=false
        fi
    fi
}

# Function to install application dependencies
install_app_dependencies() {
    print_status "Installing application dependencies..."
    
    cd $APP_DIR
    
    # Install all dependencies (including dev dependencies for build)
    print_status "Installing all dependencies (including dev dependencies for build)..."
    sudo -u $APP_USER npm install
    
    print_success "Dependencies installed"
}

# Function to build application
build_application() {
    print_status "Building application..."
    
    cd $APP_DIR
    
    # Ensure we're in the right directory and have the right permissions
    print_status "Current directory: $(pwd)"
    print_status "Checking package.json..."
    if [[ ! -f package.json ]]; then
        print_error "package.json not found in $APP_DIR"
        exit 1
    fi
    
    # Check if vite is available
    print_status "Checking for Vite..."
    if [[ -f node_modules/.bin/vite ]]; then
        print_status "Vite found in node_modules/.bin/"
    else
        print_warning "Vite not found in node_modules/.bin/, checking global installation..."
        if ! command -v vite >/dev/null 2>&1; then
            print_status "Installing Vite globally as fallback..."
            sudo npm install -g vite
        fi
    fi
    
    # Build the application using npx to ensure we use the local version
    print_status "Building frontend with Vite..."
    sudo -u $APP_USER npx vite build
    
    # Verify build output
    if [[ -d dist ]]; then
        print_success "Build completed successfully"
        print_status "Build output directory contents:"
        ls -la dist/
    else
        print_error "Build failed - dist directory not created"
        exit 1
    fi
    
    # Clean up dev dependencies to save space (optional)
    print_status "Cleaning up dev dependencies..."
    sudo -u $APP_USER npm prune --production
    
    print_success "Application built and optimized"
}

# Function to create environment file
create_env_file() {
    print_status "Creating environment configuration..."
    
    cat > /tmp/zentasks.env << EOF
NODE_ENV=production
PORT=3001
FRONTEND_URL=http${USE_SSL:+s}://$DOMAIN
EOF
    
    sudo mv /tmp/zentasks.env $APP_DIR/.env
    sudo chown $APP_USER:$APP_USER $APP_DIR/.env
    
    print_success "Environment file created"
}

# Function to create PM2 ecosystem file
create_pm2_config() {
    print_status "Creating PM2 configuration..."
    
    # Create ecosystem.config.cjs (CommonJS) to avoid ES module conflicts
    cat > /tmp/ecosystem.config.cjs << 'EOF'
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
    
    sudo mv /tmp/ecosystem.config.cjs $APP_DIR/
    sudo chown $APP_USER:$APP_USER $APP_DIR/ecosystem.config.cjs
    
    # Create log directory
    sudo mkdir -p /var/log/zentasks
    sudo chown $APP_USER:$APP_USER /var/log/zentasks
    
    print_success "PM2 configuration created (ecosystem.config.cjs)"
}

# Function to start application with PM2
start_application() {
    print_status "Starting application with PM2..."
    
    cd $APP_DIR
    sudo -u $APP_USER pm2 start ecosystem.config.cjs
    sudo -u $APP_USER pm2 save
    
    # Setup PM2 startup script
    sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $APP_USER --hp $APP_DIR
    
    print_success "Application started"
}

# Function to configure Nginx
configure_nginx() {
    print_status "Configuring Nginx..."
    
    # Create Nginx configuration with HTTP to HTTPS redirect and Kiosk support
    cat > /tmp/zentasks.nginx << EOF
# HTTP server - redirect all traffic to HTTPS
server {
    listen 80;
    server_name $DOMAIN;
    
    # Redirect all HTTP traffic to HTTPS
    return 301 https://\$server_name\$request_uri;
}

# HTTPS server (or HTTP if SSL not enabled)
server {
EOF

    if [[ "$USE_SSL" == true ]]; then
        cat >> /tmp/zentasks.nginx << EOF
    listen 443 ssl http2;
    server_name $DOMAIN;
    
    # SSL configuration
EOF
        if [[ -n "$EXISTING_SSL_CERT" ]]; then
            cat >> /tmp/zentasks.nginx << EOF
    ssl_certificate $EXISTING_SSL_CERT;
    ssl_certificate_key $EXISTING_SSL_KEY;
EOF
        else
            cat >> /tmp/zentasks.nginx << EOF
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
EOF
        fi
        cat >> /tmp/zentasks.nginx << EOF
    ssl_session_timeout 1d;
    ssl_session_cache shared:MozTLS:10m;
    ssl_session_tickets off;
    
    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;
EOF
    else
        cat >> /tmp/zentasks.nginx << EOF
    listen 80;
    server_name $DOMAIN;
EOF
    fi

    cat >> /tmp/zentasks.nginx << EOF
    
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
EOF

    # Add Kiosk Portal configuration if enabled
    if [[ "$ENABLE_KIOSK" == true ]]; then
        cat >> /tmp/zentasks.nginx << EOF
    
    # Kiosk Portal - Secure random path
    location /kiosk/$KIOSK_PATH/ {
        alias $APP_DIR/kiosk/$KIOSK_PATH/;
        try_files \$uri \$uri/ /kiosk/$KIOSK_PATH/index.html;
        
        # Additional security headers for kiosk
        add_header X-Frame-Options "DENY" always;
        add_header Content-Security-Policy "default-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https:; img-src 'self' data: https:;" always;
        
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
EOF
    fi

    cat >> /tmp/zentasks.nginx << EOF
    
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
    
    print_success "Nginx configured with HTTP to HTTPS redirect"
    if [[ "$ENABLE_KIOSK" == true ]]; then
        print_success "Kiosk Portal configured at: /kiosk/$KIOSK_PATH/"
    fi
}

# Function to setup Cloudflare credentials
setup_cloudflare_credentials() {
    if [[ "$USE_SSL" == true && -z "$EXISTING_SSL_CERT" ]]; then
        print_status "Setting up Cloudflare credentials..."
        
        # Create SSL config directory
        sudo mkdir -p $SSL_CONFIG_DIR
        
        # Create Cloudflare credentials file with API token only
        # Note: When using API token, email is not needed and causes errors
        cat > /tmp/cloudflare.ini << EOF
# Cloudflare API token for DNS challenge
# Note: When using API token, email is not required
dns_cloudflare_api_token = $CLOUDFLARE_API_TOKEN
EOF
        
        sudo mv /tmp/cloudflare.ini $SSL_CONFIG_DIR/
        sudo chmod 600 $SSL_CONFIG_DIR/cloudflare.ini
        
        print_success "Cloudflare credentials configured (API token only)"
    fi
}

# Function to setup SSL with Let's Encrypt using Cloudflare DNS
setup_ssl() {
    if [[ "$USE_SSL" == true && -z "$EXISTING_SSL_CERT" ]]; then
        print_status "Setting up SSL certificate with Let's Encrypt using Cloudflare DNS..."
        
        # Use our custom certbot wrapper
        CERTBOT_CMD="/usr/local/bin/certbot-cloudflare"
        print_status "Using Certbot wrapper: $CERTBOT_CMD"
        
        # Verify certbot is working
        if ! $CERTBOT_CMD --version >/dev/null 2>&1; then
            print_error "Certbot is not working properly"
            print_status "Attempting to diagnose the issue..."
            
            # Check virtual environment
            if [[ -f /opt/certbot-venv/bin/certbot ]]; then
                print_status "Virtual environment exists, testing directly..."
                /opt/certbot-venv/bin/certbot --version || true
            fi
            
            print_error "SSL setup failed - continuing without SSL"
            USE_SSL=false
            return 1
        fi
        
        # Get SSL certificate using DNS challenge
        print_status "Requesting SSL certificate for $DOMAIN..."
        print_status "Using Cloudflare API token for DNS validation..."
        
        if sudo $CERTBOT_CMD certonly \
            --dns-cloudflare \
            --dns-cloudflare-credentials $SSL_CONFIG_DIR/cloudflare.ini \
            --dns-cloudflare-propagation-seconds 60 \
            -d $DOMAIN \
            --email $EMAIL \
            --agree-tos \
            --non-interactive; then
            
            print_success "SSL certificate obtained successfully"
            
            # Update Nginx configuration for SSL
            update_nginx_ssl_config
            
            # Setup weekly SSL renewal check
            setup_ssl_renewal_cron
        else
            print_error "Failed to obtain SSL certificate"
            print_status "Check the logs for more details:"
            print_status "  - Certbot logs: /var/log/letsencrypt/letsencrypt.log"
            print_status "  - Verify your Cloudflare API token has correct permissions"
            print_status "  - Ensure your domain is managed by Cloudflare"
            print_warning "Continuing without SSL..."
            USE_SSL=false
        fi
    fi
}

# Function to update Nginx configuration for SSL
update_nginx_ssl_config() {
    if [[ -z "$EXISTING_SSL_CERT" ]]; then
        print_status "Updating Nginx configuration for SSL..."
        
        # Replace the temporary SSL certificate paths with the real ones
        sudo sed -i "s|ssl_certificate /etc/ssl/certs/ssl-cert-snakeoil.pem;|ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;|g" /etc/nginx/sites-available/zentasks
        sudo sed -i "s|ssl_certificate_key /etc/ssl/private/ssl-cert-snakeoil.key;|ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;|g" /etc/nginx/sites-available/zentasks
        
        # Test and reload Nginx
        sudo nginx -t && sudo systemctl reload nginx
        
        print_success "Nginx SSL configuration updated"
    fi
}

# Function to create SSL renewal script
setup_ssl_renewal_cron() {
    print_status "Setting up SSL certificate renewal..."
    
    # Create renewal script
    cat > /tmp/ssl-renewal.sh << EOF
#!/bin/bash

# ZenTasks SSL Certificate Renewal Script
# Checks if certificate expires within 21 days and renews if needed

DOMAIN="$DOMAIN"
LOG_FILE="/var/log/zentasks/ssl-renewal.log"
CLOUDFLARE_CREDS="$SSL_CONFIG_DIR/cloudflare.ini"
CERTBOT_CMD="/usr/local/bin/certbot-cloudflare"

# Function to log messages
log_message() {
    echo "\$(date '+%Y-%m-%d %H:%M:%S') - \$1" >> \$LOG_FILE
}

# Function to check certificate expiry
check_cert_expiry() {
    local cert_file="/etc/letsencrypt/live/\$DOMAIN/cert.pem"
    
    if [[ ! -f "\$cert_file" ]]; then
        log_message "ERROR: Certificate file not found: \$cert_file"
        return 1
    fi
    
    # Get certificate expiry date
    local expiry_date=\$(openssl x509 -enddate -noout -in "\$cert_file" | cut -d= -f2)
    local expiry_epoch=\$(date -d "\$expiry_date" +%s)
    local current_epoch=\$(date +%s)
    local days_until_expiry=\$(( (expiry_epoch - current_epoch) / 86400 ))
    
    log_message "Certificate expires in \$days_until_expiry days"
    
    # Return 0 if renewal needed (expires within 21 days), 1 otherwise
    if [[ \$days_until_expiry -le 21 ]]; then
        return 0
    else
        return 1
    fi
}

# Function to renew certificate
renew_certificate() {
    log_message "Starting certificate renewal for \$DOMAIN"
    
    # Verify certbot is working
    if ! \$CERTBOT_CMD --version >/dev/null 2>&1; then
        log_message "ERROR: Certbot command not working: \$CERTBOT_CMD"
        return 1
    fi
    
    # Attempt renewal using API token
    if \$CERTBOT_CMD renew \
        --dns-cloudflare \
        --dns-cloudflare-credentials "\$CLOUDFLARE_CREDS" \
        --dns-cloudflare-propagation-seconds 60 \
        --cert-name "\$DOMAIN" \
        --quiet; then
        
        log_message "Certificate renewed successfully"
        
        # Reload Nginx to use new certificate
        if systemctl reload nginx; then
            log_message "Nginx reloaded successfully"
        else
            log_message "ERROR: Failed to reload Nginx"
            return 1
        fi
        
        return 0
    else
        log_message "ERROR: Certificate renewal failed"
        return 1
    fi
}

# Main execution
main() {
    log_message "Starting SSL renewal check"
    
    if check_cert_expiry; then
        log_message "Certificate renewal needed"
        
        if renew_certificate; then
            log_message "Certificate renewal completed successfully"
        else
            log_message "Certificate renewal failed"
            exit 1
        fi
    else
        log_message "Certificate renewal not needed"
    fi
    
    log_message "SSL renewal check completed"
}

# Create log directory if it doesn't exist
mkdir -p \$(dirname "\$LOG_FILE")

# Run main function
main
EOF
    
    # Install renewal script
    sudo mv /tmp/ssl-renewal.sh /usr/local/bin/zentasks-ssl-renewal.sh
    sudo chmod +x /usr/local/bin/zentasks-ssl-renewal.sh
    
    # Add to crontab for weekly renewal check (Monday at 3 AM)
    (sudo crontab -l 2>/dev/null | grep -v "zentasks-ssl-renewal"; echo "0 3 * * 1 /usr/local/bin/zentasks-ssl-renewal.sh") | sudo crontab -
    
    print_success "SSL renewal script created and scheduled for weekly checks"
}

# Function to configure firewall
configure_firewall() {
    print_status "Configuring firewall..."
    
    # Check if UFW is available and not in container
    if command -v ufw >/dev/null 2>&1 && [[ "$IS_LXC_CONTAINER" == false ]]; then
        sudo ufw --force enable
        sudo ufw allow ssh
        sudo ufw allow 'Nginx Full'
        print_success "Firewall configured"
    else
        print_warning "UFW not available or running in container - skipping firewall configuration"
        print_warning "Please configure firewall rules on the host system if needed"
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
ExecStart=/usr/bin/pm2 start ecosystem.config.cjs
ExecReload=/usr/bin/pm2 reload ecosystem.config.cjs
ExecStop=/usr/bin/pm2 stop ecosystem.config.cjs
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
    (sudo crontab -l 2>/dev/null | grep -v "backup-zentasks"; echo "0 2 * * * /usr/local/bin/backup-zentasks.sh") | sudo crontab -
    
    print_success "Backup script created and scheduled"
}

# Function to save kiosk configuration
save_kiosk_config() {
    if [[ "$ENABLE_KIOSK" == true ]]; then
        print_status "Saving Kiosk Portal configuration..."
        
        # Create kiosk config file for future reference
        cat > /tmp/kiosk-config.txt << EOF
# ZenTasks Kiosk Portal Configuration
# Generated on: $(date)

KIOSK_ENABLED=true
KIOSK_PATH=$KIOSK_PATH
KIOSK_URL=http${USE_SSL:+s}://$DOMAIN/kiosk/$KIOSK_PATH/
KIOSK_DIRECTORY=$APP_DIR/kiosk/$KIOSK_PATH

# Security Notes:
# - The kiosk path is randomly generated for security
# - Access is controlled via the random URL path
# - No authentication is required for kiosk access
# - Only task completion is allowed, no editing

# To disable the kiosk:
# 1. Remove the kiosk location block from Nginx config
# 2. Remove the kiosk directory: rm -rf $APP_DIR/kiosk
# 3. Reload Nginx: sudo systemctl reload nginx
EOF
        
        sudo mv /tmp/kiosk-config.txt $APP_DIR/kiosk-config.txt
        sudo chown $APP_USER:$APP_USER $APP_DIR/kiosk-config.txt
        
        print_success "Kiosk configuration saved to: $APP_DIR/kiosk-config.txt"
    fi
}

# Function to display final information
display_final_info() {
    echo
    echo -e "${GREEN}=== ZenTasks Deployment Complete ===${NC}"
    echo
    print_success "Application URL: http${USE_SSL:+s}://$DOMAIN"
    if [[ "$ENABLE_KIOSK" == true ]]; then
        print_success "Kiosk Portal URL: http${USE_SSL:+s}://$DOMAIN/kiosk/$KIOSK_PATH/"
    fi
    print_success "Application directory: $APP_DIR"
    print_success "Application user: $APP_USER"
    print_success "Logs: /var/log/zentasks/"
    print_success "Container Environment: ${IS_LXC_CONTAINER}"
    print_success "PM2 Config: ecosystem.config.cjs (CommonJS format)"
    if [[ -n "$EXISTING_SSL_CERT" ]]; then
        print_success "Using existing SSL certificate: $EXISTING_SSL_CERT"
    fi
    echo
    print_status "Useful commands:"
    echo "  View application status: sudo -u $APP_USER pm2 list"
    echo "  View application logs: sudo -u $APP_USER pm2 logs zentasks"
    echo "  Restart application: sudo -u $APP_USER pm2 restart zentasks"
    echo "  View Nginx status: sudo systemctl status nginx"
    echo "  View Nginx logs: sudo tail -f /var/log/nginx/error.log"
    echo "  Manual backup: sudo /usr/local/bin/backup-zentasks.sh"
    echo
    if [[ "$ENABLE_KIOSK" == true ]]; then
        print_status "Kiosk Portal:"
        echo "  Kiosk URL: http${USE_SSL:+s}://$DOMAIN/kiosk/$KIOSK_PATH/"
        echo "  Kiosk Directory: $APP_DIR/kiosk/$KIOSK_PATH/"
        echo "  Kiosk Config: $APP_DIR/kiosk-config.txt"
        echo "  Security: Access controlled by random URL path"
        echo
    fi
    if [[ "$USE_SSL" == true ]]; then
        if [[ -n "$EXISTING_SSL_CERT" ]]; then
            print_status "SSL certificate management:"
            echo "  Using existing certificate: $EXISTING_SSL_CERT"
            echo "  Certificate location: $(dirname "$EXISTING_SSL_CERT")"
            echo "  No automatic renewal configured for existing certificates"
        else
            print_status "SSL certificate management:"
            echo "  Manual renewal check: sudo /usr/local/bin/zentasks-ssl-renewal.sh"
            echo "  View SSL renewal logs: sudo tail -f /var/log/zentasks/ssl-renewal.log"
            echo "  Certificate location: /etc/letsencrypt/live/$DOMAIN/"
            echo "  Cloudflare credentials: $SSL_CONFIG_DIR/cloudflare.ini"
            echo "  Certbot command: /usr/local/bin/certbot-cloudflare (virtual environment wrapper)"
            echo "  Test certbot: /usr/local/bin/certbot-cloudflare --version"
            echo
            print_success "SSL certificate will be checked weekly on Mondays at 3 AM"
            print_success "Renewal will occur automatically if certificate expires within 21 days"
        fi
        echo
        print_status "SSL Configuration Notes:"
        if [[ -z "$EXISTING_SSL_CERT" ]]; then
            echo "  - Using Cloudflare API token (no email required)"
            echo "  - DNS challenge method for validation"
            echo "  - 60-second DNS propagation wait time"
        fi
        echo "  - HTTP traffic automatically redirects to HTTPS"
        echo
    fi
    print_warning "Please ensure your domain DNS points to this server's IP address"
    if [[ "$USE_SSL" == true && -z "$EXISTING_SSL_CERT" ]]; then
        print_warning "Make sure your domain is managed by Cloudflare for DNS challenges to work"
        print_warning "Verify your API token has Zone:Read and DNS:Edit permissions"
    fi
    if [[ "$IS_LXC_CONTAINER" == true ]]; then
        print_warning "Running in LXC container - some system features may be limited"
        print_warning "Firewall configuration should be handled on the host system"
        print_warning "Certbot installed in isolated virtual environment for PEP 668 compliance"
    fi
    echo
}

# Main execution
main() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    ZenTasks Deployment                      ║"
    echo "║         Ubuntu Setup Script (LXC Compatible)               ║"
    echo "║              PEP 668 Compliant (Ubuntu 24.04)              ║"
    echo "║            Fixed Cloudflare API Token Support              ║"
    echo "║              Now with Kiosk Portal Support                 ║"
    echo "║            Enhanced SSL Certificate Detection              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    check_root
    check_sudo
    detect_container_environment
    get_user_input
    
    print_status "Starting deployment process..."
    
    update_system
    install_nodejs
    install_nginx
    install_pm2
    install_certbot
    create_app_user
    setup_app_directory
    setup_kiosk_portal
    install_app_dependencies
    build_application
    create_env_file
    create_pm2_config
    start_application
    configure_nginx
    setup_cloudflare_credentials
    setup_ssl
    configure_firewall
    create_systemd_service
    create_backup_script
    save_kiosk_config
    
    display_final_info
}

# Run main function
main "$@"