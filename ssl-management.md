# SSL Certificate Management with Cloudflare DNS

This document explains how SSL certificates are managed in the FocusFlow deployment using Cloudflare DNS challenges.

## Overview

The deployment uses Let's Encrypt SSL certificates with Cloudflare DNS challenges for domain validation. This approach offers several advantages:

- **No server downtime** during certificate renewal
- **Works behind firewalls** or load balancers
- **Supports wildcard certificates** (if needed)
- **More reliable** than HTTP challenges

## Setup Process

### 1. Cloudflare API Token

The setup script requires a Cloudflare API token with the following permissions:
- **Zone:Read** - To read zone information
- **DNS:Edit** - To create/delete DNS records for validation

Create your token at: https://dash.cloudflare.com/profile/api-tokens

### 2. Automatic Configuration

During setup, the script:
1. Installs Certbot with the Cloudflare DNS plugin
2. Stores your Cloudflare credentials securely
3. Obtains the initial SSL certificate
4. Configures Nginx for HTTPS
5. Sets up automatic renewal

## Certificate Renewal

### Weekly Renewal Checks

The system performs automatic renewal checks every **Monday at 3:00 AM** using a cron job.

### Renewal Logic

The renewal script (`/usr/local/bin/focusflow-ssl-renewal.sh`) follows this process:

1. **Check certificate expiry date**
2. **If expires within 21 days:**
   - Attempt renewal using Cloudflare DNS challenge
   - Reload Nginx if successful
   - Log all actions
3. **If expires later than 21 days:**
   - Skip renewal
   - Log status

### Manual Renewal

You can manually trigger a renewal check:

```bash
sudo /usr/local/bin/focusflow-ssl-renewal.sh
```

## File Locations

### Certificates
- **Certificate files**: `/etc/letsencrypt/live/your-domain.com/`
- **Cloudflare credentials**: `/etc/letsencrypt/cloudflare/cloudflare.ini`

### Logs
- **Renewal logs**: `/var/log/focusflow/ssl-renewal.log`
- **Certbot logs**: `/var/log/letsencrypt/`

### Scripts
- **Renewal script**: `/usr/local/bin/focusflow-ssl-renewal.sh`

## Monitoring

### Check Certificate Status

```bash
# View certificate details
sudo openssl x509 -text -noout -in /etc/letsencrypt/live/your-domain.com/cert.pem

# Check expiry date
sudo openssl x509 -enddate -noout -in /etc/letsencrypt/live/your-domain.com/cert.pem

# View renewal logs
sudo tail -f /var/log/focusflow/ssl-renewal.log
```

### Verify SSL Configuration

```bash
# Test SSL configuration
sudo nginx -t

# Check SSL grade (external tool)
curl -s "https://api.ssllabs.com/api/v3/analyze?host=your-domain.com"
```

## Troubleshooting

### Common Issues

1. **DNS propagation delays**
   - The script waits 60 seconds for DNS propagation
   - Increase if needed in the renewal script

2. **Cloudflare API rate limits**
   - Cloudflare has generous rate limits for DNS API
   - Renewal checks are weekly to avoid issues

3. **Invalid API token**
   - Verify token permissions at Cloudflare dashboard
   - Check credentials file: `/etc/letsencrypt/cloudflare/cloudflare.ini`

### Manual Certificate Renewal

If automatic renewal fails, you can manually renew:

```bash
# Manual renewal with Cloudflare DNS
sudo certbot renew \
  --dns-cloudflare \
  --dns-cloudflare-credentials /etc/letsencrypt/cloudflare/cloudflare.ini \
  --dns-cloudflare-propagation-seconds 60 \
  --cert-name your-domain.com

# Reload Nginx after successful renewal
sudo systemctl reload nginx
```

### Emergency HTTP Fallback

If SSL issues occur, you can temporarily disable HTTPS:

```bash
# Backup current config
sudo cp /etc/nginx/sites-available/focusflow /etc/nginx/sites-available/focusflow.ssl.backup

# Use HTTP-only config
sudo cp /etc/nginx/sites-available/focusflow.http /etc/nginx/sites-available/focusflow

# Reload Nginx
sudo nginx -t && sudo systemctl reload nginx
```

## Security Considerations

### Credential Protection

- Cloudflare credentials are stored with `600` permissions
- Only root can read the credentials file
- API token has minimal required permissions

### Certificate Security

- Private keys are protected by Let's Encrypt defaults
- Certificates use modern TLS configuration
- HSTS headers enforce HTTPS

### Monitoring

- All renewal attempts are logged
- Failed renewals should trigger alerts
- Certificate expiry monitoring recommended

## Cron Job Details

The renewal cron job is configured as:

```bash
# Check every Monday at 3 AM
0 3 * * 1 /usr/local/bin/focusflow-ssl-renewal.sh
```

### Why Monday at 3 AM?

- **Low traffic time** - Minimal user impact
- **Weekly frequency** - Sufficient for 21-day renewal window
- **Monday** - Allows weekend issue resolution if needed
- **3 AM** - Avoids peak usage hours

## Advanced Configuration

### Custom Renewal Threshold

To change the 21-day renewal threshold, edit the renewal script:

```bash
sudo nano /usr/local/bin/focusflow-ssl-renewal.sh

# Change this line:
if [[ $days_until_expiry -le 21 ]]; then
# To your preferred threshold (e.g., 30 days):
if [[ $days_until_expiry -le 30 ]]; then
```

### Different Renewal Schedule

To change the renewal schedule:

```bash
# Edit crontab
sudo crontab -e

# Examples:
# Daily at 2 AM: 0 2 * * *
# Twice weekly: 0 3 * * 1,4
# Monthly: 0 3 1 * *
```

### Notification Setup

Add email notifications to the renewal script:

```bash
# Add to renewal script after successful renewal
echo "SSL certificate renewed for $DOMAIN" | mail -s "SSL Renewal Success" admin@example.com

# Add after failed renewal
echo "SSL certificate renewal failed for $DOMAIN" | mail -s "SSL Renewal Failed" admin@example.com
```

## Best Practices

1. **Monitor renewal logs** regularly
2. **Test renewal process** periodically
3. **Keep Cloudflare credentials secure**
4. **Monitor certificate expiry** with external tools
5. **Have emergency procedures** for SSL failures
6. **Document any custom modifications**

## Support

For SSL-related issues:

1. Check renewal logs: `/var/log/focusflow/ssl-renewal.log`
2. Verify Cloudflare API access
3. Test DNS propagation
4. Check Nginx configuration
5. Review Let's Encrypt rate limits