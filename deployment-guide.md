# ZenTasks Deployment Guide

## Prerequisites

- Ubuntu server with Node.js 18+ installed
- Nginx installed
- PM2 for process management (optional but recommended)

## Installation Steps

### 1. Clone and Setup

```bash
# Clone the repository
git clone <your-repo-url> zentasks
cd zentasks

# Install dependencies
npm install

# Build the frontend
npm run build
```

### 2. Environment Configuration

Create a `.env` file in the project root:

```bash
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-domain.com
```

### 3. Install PM2 (Process Manager)

```bash
# Install PM2 globally
npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
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
    }
  }]
}
EOF

# Start the application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 4. Nginx Configuration

```bash
# Copy the example nginx config
sudo cp nginx.conf.example /etc/nginx/sites-available/zentasks

# Edit the configuration file
sudo nano /etc/nginx/sites-available/zentasks

# Update the following in the config:
# - server_name: your actual domain
# - ssl_certificate paths (if using HTTPS)
# - root path: /path/to/zentasks/dist

# Enable the site
sudo ln -s /etc/nginx/sites-available/zentasks /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### 5. Firewall Configuration

```bash
# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow SSH (if not already allowed)
sudo ufw allow 22

# Enable firewall
sudo ufw enable
```

### 6. SSL Certificate (Optional but Recommended)

Using Let's Encrypt with Certbot:

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is usually set up automatically
# Verify with: sudo certbot renew --dry-run
```

## File Structure

```
zentasks/
├── dist/                 # Built frontend files (served by Nginx)
├── server/              # Backend Node.js application
│   ├── data/           # JSON data files
│   └── index.js        # Main server file
├── src/                # Frontend source (not needed in production)
├── package.json
└── ecosystem.config.js  # PM2 configuration
```

## Monitoring and Maintenance

### PM2 Commands

```bash
# View running processes
pm2 list

# View logs
pm2 logs zentasks

# Restart application
pm2 restart zentasks

# Stop application
pm2 stop zentasks

# Monitor resources
pm2 monit
```

### Nginx Commands

```bash
# Check status
sudo systemctl status nginx

# Reload configuration
sudo systemctl reload nginx

# View error logs
sudo tail -f /var/log/nginx/error.log

# View access logs
sudo tail -f /var/log/nginx/access.log
```

### Backup Data

```bash
# Backup user data
cp -r server/data/ backup-$(date +%Y%m%d)/
```

## Troubleshooting

### Common Issues

1. **502 Bad Gateway**: Backend not running
   - Check: `pm2 list`
   - Restart: `pm2 restart zentasks`

2. **404 on API calls**: Nginx proxy not configured
   - Check nginx config `/api/` location block
   - Verify backend is running on port 3001

3. **Frontend not loading**: Static files not found
   - Verify `dist/` directory exists and has files
   - Check nginx root path in config

4. **CORS errors**: Frontend/backend URL mismatch
   - Check FRONTEND_URL environment variable
   - Verify CORS configuration in server/index.js

### Logs

- Application logs: `pm2 logs zentasks`
- Nginx access: `/var/log/nginx/access.log`
- Nginx errors: `/var/log/nginx/error.log`
- System logs: `journalctl -u nginx`

## Updates

To update the application:

```bash
# Pull latest changes
git pull

# Install new dependencies
npm install

# Rebuild frontend
npm run build

# Restart backend
pm2 restart zentasks

# Reload nginx (if config changed)
sudo systemctl reload nginx
```