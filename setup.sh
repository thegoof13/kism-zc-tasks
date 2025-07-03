#!/bin/bash

# ZenTasks Ubuntu Deployment Setup Script (LXC Compatible)
# This script automates the deployment of ZenTasks on Ubuntu with Nginx
# Compatible with LXC containers and traditional Ubuntu installations
# Now includes Kiosk Portal support with secure random paths
# Enhanced with SSL certificate validation

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
EXISTING_SSL=false
SSL_CERT_PATH=""
SSL_KEY_PATH=""

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

# Function to validate SSL certificate
validate_ssl_certificate() {
    local domain="$1"
    local cert_path="$2"
    local key_path="$3"
    
    print_status "Validating SSL certificate for $domain..."
    
    # Check if certificate files exist and are readable
    if [[ ! -f "$cert_path" ]] || [[ ! -r "$cert_path" ]]; then
        print_warning "Certificate file not found or not readable: $cert_path"
        return 1
    fi
    
    if [[ ! -f "$key_path" ]] || [[ ! -r "$key_path" ]]; then
        print_warning "Private key file not found or not readable: $key_path"
        return 1
    fi
    
    print_status "Found certificate: $cert_path"
    print_status "Found private key: $key_path"
    
    # Check certificate expiry
    local expiry_date
    if ! expiry_date=$(sudo openssl x509 -enddate -noout -in "$cert_path" 2>/dev/null | cut -d= -f2); then
        print_warning "Failed to read certificate expiry date from $cert_path"
        return 1
    fi
    
    local expiry_epoch
    if ! expiry_epoch=$(date -d "$expiry_date" +%s 2>/dev/null); then
        print_warning "Failed to parse certificate expiry date: $expiry_date"
        return 1
    fi
    
    local current_epoch=$(date +%s)
    local days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))
    
    if [[ $days_until_expiry -le 0 ]]; then
        print_warning "Certificate has expired ($days_until_expiry days ago)"
        return 1
    fi
    
    if [[ $days_until_expiry -le 30 ]]; then
        print_warning "Certificate expires soon (in $days_until_expiry days)"
        print_warning "Consider renewing before deployment"
    else
        print_success "Certificate is valid (expires in $days_until_expiry days)"
    fi
    
    # Check if certificate matches domain
    local cert_domains=""
    
    # Try to get Subject Alternative Names first
    local san_domains
    if san_domains=$(sudo openssl x509 -text -noout -in "$cert_path" 2>/dev/null | grep -A1 "Subject Alternative Name" | tail -1 | sed 's/DNS://g' | tr ',' '\n' | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//' 2>/dev/null); then
        if [[ -n "$san_domains" ]]; then
            cert_domains="$san_domains"
        fi
    fi
    
    # If no SAN found, try to get CN from subject
    if [[ -z "$cert_domains" ]]; then
        local cn_domain
        if cn_domain=$(sudo openssl x509 -subject -noout -in "$cert_path" 2>/dev/null | sed -n 's/.*CN=\([^,/]*\).*/\1/p' 2>/dev/null); then
            if [[ -n "$cn_domain" ]]; then
                cert_domains="$cn_domain"
            fi
        fi
    fi
    
    if [[ -z "$cert_domains" ]]; then
        print_warning "Failed to extract domains from certificate"
        return 1
    fi
    
    print_status "Certificate covers domains: $(echo "$cert_domains" | tr '\n' ', ' | sed 's/, $//')"
    
    # Check if our domain is in the certificate
    local domain_found=false
    while IFS= read -r cert_domain; do
        if [[ -n "$cert_domain" ]]; then
            # Remove any whitespace
            cert_domain=$(echo "$cert_domain" | tr -d '[:space:]')
            
            # Handle wildcard certificates
            if [[ "$cert_domain" == "*."* ]]; then
                local wildcard_base="${cert_domain#*.}"
                if [[ "$domain" == *".$wildcard_base" ]] || [[ "$domain" == "$wildcard_base" ]]; then
                    domain_found=true
                    print_status "Domain matches wildcard certificate: $cert_domain"
                    break
                fi
            elif [[ "$cert_domain" == "$domain" ]]; then
                domain_found=true
                print_status "Domain matches certificate: $cert_domain"
                break
            fi
        fi
    done <<< "$cert_domains"
    
    if [[ "$domain_found" == true ]]; then
        print_success "Certificate is valid for domain: $domain"
        return 0
    else
        print_warning "Certificate does not cover domain: $domain"
        print_warning "Certificate covers: $(echo "$cert_domains" | tr '\n' ', ' | sed 's/, $//')"
        return 1
    fi
}

# Function to check for existing SSL certificates
check_existing_ssl() {
    local domain="$1"
    
    print_status "Checking for existing SSL certificates for $domain..."
    
    # Primary Let's Encrypt location (most common)
    local letsencrypt_cert="/etc/letsencrypt/live/$domain/fullchain.pem"
    local letsencrypt_key="/etc/letsencrypt/live/$domain/privkey.pem"
    
    # Check Let's Encrypt first (most likely location)
    if [[ -f "$letsencrypt_cert" ]] && [[ -f "$letsencrypt_key" ]]; then
        print_status "Found Let's Encrypt certificate for $domain"
        if validate_ssl_certificate "$domain" "$letsencrypt_cert" "$letsencrypt_key"; then
            SSL_CERT_PATH="$letsencrypt_cert"
            SSL_KEY_PATH="$letsencrypt_key"
            EXISTING_SSL=true
            return 0
        fi
    fi
    
    # Alternative certificate locations
    local cert_locations=(
        "/etc/ssl/certs/$domain.crt"
        "/etc/ssl/certs/$domain.pem"
        "/etc/nginx/ssl/$domain.crt"
        "/etc/nginx/ssl/$domain.pem"
        "/usr/local/etc/ssl/certs/$domain.crt"
        "/usr/local/etc/ssl/certs/$domain.pem"
        "/etc/pki/tls/certs/$domain.crt"
        "/etc/pki/tls/certs/$domain.pem"
    )
    
    local key_locations=(
        "/etc/ssl/private/$domain.key"
        "/etc/nginx/ssl/$domain.key"
        "/usr/local/etc/ssl/private/$domain.key"
        "/etc/pki/tls/private/$domain.key"
    )
    
    # Check each certificate location
    for cert_path in "${cert_locations[@]}"; do
        if [[ -f "$cert_path" ]]; then
            print_status "Found certificate at: $cert_path"
            
            # Find corresponding private key
            for key_path in "${key_locations[@]}"; do
                if [[ -f "$key_path" ]]; then
                    print_status "Found private key at: $key_path"
                    
                    # Validate the certificate
                    if validate_ssl_certificate "$domain" "$cert_path" "$key_path"; then
                        print_success "Valid SSL certificate found!"
                        SSL_CERT_PATH="$cert_path"
                        SSL_KEY_PATH="$key_path"
                        EXISTING_SSL=true
                        return 0
                    else
                        print_warning "Certificate validation failed for $cert_path"
                    fi
                fi
            done
            
            print_warning "No matching private key found for certificate: $cert_path"
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
    
    # Check for existing SSL certificates first
    if check_existing_ssl "$DOMAIN"; then
        print_success "Existing valid SSL certificate found for $DOMAIN"
        print_status "Certificate: $SSL_CERT_PATH"
        print_status "Private Key: $SSL_KEY_PATH"
        
        read -p "Do you want to use the existing SSL certificate? (y/n): " use_existing_ssl
        if [[ "$use_existing_ssl" =~ ^[Yy]$ ]]; then
            USE_SSL=true
            print_success "Will use existing SSL certificate"
        else
            print_status "Will proceed with new SSL certificate setup"
            EXISTING_SSL=false
        fi
    else
        print_status "No valid existing SSL certificate found"
    fi
    
    # Only ask for SSL setup if no existing certificate is being used
    if [[ "$EXISTING_SSL" == false ]]; then
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
        print_status "Kiosk Portal will be available at: https://$DOMAIN/kiosk/$KIOSK_PATH/"
    fi
    
    echo
    print_status "Configuration:"
    print_status "Domain: $DOMAIN"
    print_status "Email: ${EMAIL:-'Not provided'}"
    print_status "SSL: ${USE_SSL}"
    if [[ "$USE_SSL" == true ]]; then
        if [[ "$EXISTING_SSL" == true ]]; then
            print_status "SSL Method: Using existing certificate"
            print_status "Certificate: $SSL_CERT_PATH"
        else
            print_status "SSL Method: New Let's Encrypt with Cloudflare DNS"
        fi
    fi
    print_status "Kiosk Portal: ${ENABLE_KIOSK}"
    if [[ "$ENABLE_KIOSK" == true ]]; then
        print_status "Kiosk URL: https://$DOMAIN/kiosk/$KIOSK_PATH/"
    fi
    print_status "Container Environment: ${IS_LXC_CONTAINER}"
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
    if [[ "$USE_SSL" == true ]] && [[ "$EXISTING_SSL" == false ]]; then
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
    else
        print_status "Skipping Certbot installation (using existing SSL or no SSL)"
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
FRONTEND_URL=https://$DOMAIN
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
    ssl_certificate $SSL_CERT_PATH;
    ssl_certificate_key $SSL_KEY_PATH;
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
    if [[ "$USE_SSL" == true ]] && [[ "$EXISTING_SSL" == false ]]; then
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
    if [[ "$USE_SSL" == true ]] && [[ "$EXISTING_SSL" == false ]]; then
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
            
            # Update SSL paths to use new certificate
            SSL_CERT_PATH="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"
            SSL_KEY_PATH="/etc/letsencrypt/live/$DOMAIN/privkey.pem"
            
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
    elif [[ "$USE_SSL" == true ]] && [[ "$EXISTING_SSL" == true ]]; then
        print_success "Using existing SSL certificate"
        print_status "Certificate: $SSL_CERT_PATH"
        print_status "Private Key: $SSL_KEY_PATH"
    fi
}

# Function to update Nginx configuration for SSL
update_nginx_ssl_config() {
    print_status "Updating Nginx configuration for SSL..."
    
    # Replace the SSL certificate paths with the real ones
    sudo sed -i "s|ssl_certificate .*;|ssl_certificate $SSL_CERT_PATH;|g" /etc/nginx/sites-available/zentasks
    sudo sed -i "s|ssl_certificate_key .*;|ssl_certificate_key $SSL_KEY_PATH;|g" /etc/nginx/sites-available/zentasks
    
    # Test and reload Nginx
    sudo nginx -t && sudo systemctl reload nginx
    
    print_success "Nginx SSL configuration updated"
}

# Function to create SSL renewal script
setup_ssl_renewal_cron() {
    if [[ "$EXISTING_SSL" == false ]]; then
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
    else
        print_status "Skipping SSL renewal setup (using existing certificate)"
    fi
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
KIOSK_URL=https://$DOMAIN/kiosk/$KIOSK_PATH/
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
        print_status "SSL certificate management:"
        if [[ "$EXISTING_SSL" == true ]]; then
            echo "  Using existing SSL certificate: $SSL_CERT_PATH"
            echo "  Private key: $SSL_KEY_PATH"
            echo "  Note: Automatic renewal not configured for existing certificates"
        else
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
        echo "  - HTTP traffic automatically redirects to HTTPS"
        if [[ "$EXISTING_SSL" == false ]]; then
            echo "  - Using Cloudflare API token (no email required)"
            echo "  - DNS challenge method for validation"
            echo "  - 60-second DNS propagation wait time"
        fi
        echo
    fi
    print_warning "Please ensure your domain DNS points to this server's IP address"
    if [[ "$USE_SSL" == true ]] && [[ "$EXISTING_SSL" == false ]]; then
        print_warning "Make sure your domain is managed by Cloudflare for DNS challenges to work"
        print_warning "Verify your API token has Zone:Read and DNS:Edit permissions"
    fi
    if [[ "$IS_LXC_CONTAINER" == true ]]; then
        print_warning "Running in LXC container - some system features may be limited"
        print_warning "Firewall configuration should be handled on the host system"
        if [[ "$EXISTING_SSL" == false ]]; then
            print_warning "Certbot installed in isolated virtual environment for PEP 668 compliance"
        fi
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
    echo "║            Enhanced SSL Certificate Detection               ║"
    echo "║              Now with Kiosk Portal Support                 ║"
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