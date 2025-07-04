# FocusFlow Kiosk Portal Setup Guide

## Overview

The FocusFlow Kiosk Portal is a tablet-optimized interface designed for public-facing installations. It provides a touch-friendly, dark-themed interface that connects to your existing FocusFlow API.

## Features

### 🎨 **Design Features**
- **Full Black Background** - Reduces screen burn-in on mounted tablets
- **Animated Profile Cards** - Soft-glow outlines with floating animations
- **Large Touch Targets** - Optimized for finger navigation
- **Modern Dark Theme** - Black, charcoal, indigo, and neon accents
- **Vivid Green Highlights** - For task completion feedback

### 🔧 **Functionality**
- **Profile Selection** - Animated cards showing user avatars and names
- **Task Management** - Large square buttons for each task
- **Completion Feedback** - Green checkmark animation with border effects
- **Auto-Return** - Returns to profile selection after 3 seconds of inactivity
- **Celebration Animation** - Confetti and emoji when all tasks are complete
- **Screen Sleep Prevention** - Keeps tablet display active

### 📱 **Tablet Optimization**
- **Fullscreen Mode** - Automatic fullscreen on load
- **Touch Gestures** - Optimized for touch interaction
- **Responsive Design** - Adapts to different tablet sizes
- **Idle Detection** - Smart timeout with visual warnings

## Installation

### Option 1: Direct File Access

1. **Download the kiosk.html file** to your FocusFlow server
2. **Place it in your web root** (same directory as your main application)
3. **Access via secure URL**: `https://yourdomain.com/kiosk.html`

### Option 2: Secure Random Path (Recommended)

1. **Create a random directory** for security:
   ```bash
   # Generate a random 16-character string
   RANDOM_PATH=$(openssl rand -hex 8)
   sudo mkdir -p /var/www/focusflow/kiosk_$RANDOM_PATH
   ```

2. **Copy the kiosk file**:
   ```bash
   sudo cp kiosk.html /var/www/focusflow/kiosk_$RANDOM_PATH/index.html
   sudo chown -R focusflow:focusflow /var/www/focusflow/kiosk_$RANDOM_PATH
   ```

3. **Configure Nginx** to serve the kiosk:
   ```nginx
   # Add to your existing Nginx config
   location /kiosk_$RANDOM_PATH/ {
       root /var/www/focusflow;
       try_files $uri $uri/ /kiosk_$RANDOM_PATH/index.html;
       
       # Cache static assets
       location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
   }
   ```

4. **Access via secure URL**: `https://yourdomain.com/kiosk_$RANDOM_PATH/`

### Option 3: Nginx Integration

Add to your existing FocusFlow Nginx configuration:

```nginx
# Kiosk Portal
location /kiosk/ {
    alias /var/www/focusflow/kiosk/;
    try_files $uri $uri/ /kiosk/index.html;
    
    # Security headers for kiosk
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Prevent caching of the main HTML file
    location = /kiosk/index.html {
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
```

## Configuration

### API Connection

The kiosk automatically detects the API endpoint:
- **Development**: `http://localhost:3001/api`
- **Production**: `/api` (same domain)

### Customization Options

Edit the JavaScript configuration in `kiosk.html`:

```javascript
// Configuration
const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001/api' : '/api';
const IDLE_TIMEOUT = 3000; // 3 seconds (adjust as needed)
const IDLE_WARNING_DURATION = 3000; // 3 seconds warning
```

### Tablet Settings

For optimal kiosk experience:

1. **Enable Fullscreen Mode** - The kiosk will attempt to auto-enter fullscreen
2. **Disable Screen Sleep** - The kiosk includes wake lock and video-based prevention
3. **Hide Browser UI** - Use kiosk mode in your browser if available
4. **Lock Orientation** - Set to landscape or portrait as preferred

## Usage

### For Users

1. **Select Profile** - Tap your profile card on the main screen
2. **Complete Tasks** - Tap task buttons to mark them complete
3. **View Progress** - See completion status in the header
4. **Celebration** - Enjoy the confetti animation when all tasks are done!
5. **Auto-Return** - Screen returns to profile selection after inactivity

### For Administrators

1. **Monitor Usage** - Check server logs for API calls
2. **Update Tasks** - Use the main FocusFlow interface to manage tasks
3. **Add Profiles** - Create new profiles in the main application
4. **Security** - Use random URLs and monitor access logs

## Security Considerations

### Access Control

- **Random URLs** - Use unpredictable paths like `/kiosk/a1b2c3d4e5f6g7h8/`
- **IP Restrictions** - Limit access to specific IP ranges if needed
- **No Authentication** - Kiosk is designed for public access
- **Read-Only Data** - Only task completion is allowed, no editing

### Privacy

- **No Personal Data** - Only shows assigned tasks and profile names
- **Session Isolation** - Each session is independent
- **Auto-Logout** - Returns to profile selection after inactivity
- **No Data Storage** - No local storage of sensitive information

## Troubleshooting

### Common Issues

1. **API Connection Failed**
   ```
   Check: Network connectivity, API server status, CORS settings
   Solution: Verify API endpoint and server logs
   ```

2. **Profiles Not Loading**
   ```
   Check: User data exists, profiles are configured
   Solution: Create profiles in main FocusFlow application
   ```

3. **Tasks Not Updating**
   ```
   Check: API write permissions, server logs
   Solution: Verify POST requests are reaching the server
   ```

4. **Screen Goes to Sleep**
   ```
   Check: Browser wake lock support, tablet settings
   Solution: Configure tablet power settings manually
   ```

### Browser Compatibility

**Recommended Browsers:**
- Chrome/Chromium (best support)
- Firefox (good support)
- Safari (limited wake lock support)
- Edge (good support)

**Required Features:**
- ES6+ JavaScript support
- CSS Grid and Flexbox
- Touch event handling
- Fullscreen API (optional)
- Wake Lock API (optional)

## Maintenance

### Regular Tasks

1. **Monitor Logs** - Check for API errors or unusual activity
2. **Update Content** - Refresh tasks and profiles as needed
3. **Clean Cache** - Clear browser cache if updates aren't appearing
4. **Check Connectivity** - Ensure stable network connection

### Updates

When updating FocusFlow:
1. **Backup Kiosk File** - Save your customized version
2. **Test API Compatibility** - Verify kiosk still works with new API
3. **Update Configuration** - Adjust settings if needed
4. **Deploy Changes** - Update kiosk file if necessary

## Advanced Configuration

### Custom Styling

Modify the CSS in `kiosk.html` to match your branding:

```css
/* Custom color scheme */
:root {
    --primary-color: #your-brand-color;
    --accent-color: #your-accent-color;
    --background-color: #000000; /* Keep black for burn-in prevention */
}
```

### Integration with Other Systems

The kiosk can be extended to integrate with:
- **Digital Signage** - Display alongside other content
- **Access Control** - Integrate with badge/card readers
- **Analytics** - Track usage patterns and completion rates
- **Notifications** - Send alerts when tasks are completed

### Performance Optimization

For high-traffic installations:
- **Enable Nginx Caching** - Cache static assets
- **Use CDN** - Serve assets from edge locations
- **Optimize Images** - Compress profile avatars
- **Monitor Resources** - Track CPU and memory usage

---

**Security Note**: The kiosk portal is designed for controlled environments. Always use HTTPS and consider additional security measures for public installations.