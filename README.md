# ZenTasks - Smart Task Management System

A beautiful, production-ready task management application with smart recurring tasks, multi-profile support, AI-powered insights, and advanced collaboration features.

![ZenTasks](https://img.shields.io/badge/ZenTasks-v1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node.js](https://img.shields.io/badge/node.js-18+-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.3-blue.svg)

## 🌟 Features

### 🎯 **Smart Task Management**
- **Recurring Tasks** - Daily, weekly, meal-based (breakfast/lunch/dinner), and custom recurrence patterns
- **Due Date Support** - Set due dates with automatic notifications and overdue tracking
- **Task Permissions** - Granular control over who can create, edit, or delete tasks
- **Flexible Display Modes** - Grey out, drop down, or separate completed tasks

### 👥 **Multi-Profile System**
- **Profile Management** - Create unlimited user profiles with custom avatars and colors
- **PIN Protection** - Secure profiles with PIN codes for privacy
- **Permission Control** - Set individual permissions for task creation, editing, and deletion
- **Profile Switching** - Quick profile switching with PIN bypass options

### 🏆 **Competition & Collaboration**
- **Task Competition** - Compete with other profiles for task completion rankings
- **Collaboration Tracking** - Monitor collaborative task completion across profiles
- **Live Leaderboards** - Real-time competition status with trophy system
- **Achievement History** - Track winner changes and competition milestones

### 🤖 **AI-Powered Insights**
- **Multiple AI Providers** - Support for OpenAI, Anthropic (Claude), and Google Gemini
- **Productivity Analysis** - Get insights about task patterns and completion trends
- **Smart Recommendations** - AI-powered suggestions for improving productivity
- **Query History** - Track and review AI interactions

### 📊 **Advanced Analytics**
- **Completion Statistics** - Detailed analytics on task completion patterns
- **Productivity Trends** - Track performance over time with visual insights
- **Profile Comparisons** - Compare performance across different profiles
- **Historical Data** - Comprehensive activity logging and history tracking

### 🔒 **Security & Privacy**
- **Settings Password Protection** - Secure access to configuration settings
- **Profile PIN Protection** - Individual profile security with PIN codes
- **Data Encryption** - Secure data storage and transmission
- **Access Control** - Granular permissions for different user roles

### 🎨 **Beautiful Design**
- **Modern UI** - Clean, intuitive interface with smooth animations
- **Dark Mode Support** - Automatic theme switching with system preference detection
- **Responsive Design** - Optimized for desktop, tablet, and mobile devices
- **Touch Gestures** - Swipe actions for mobile task management

## 🚀 Quick Start

### Option 1: Automated Setup (Ubuntu)

For a complete automated deployment on Ubuntu with Nginx, SSL, and all dependencies:

```bash
# Download and extract ZenTasks
wget https://github.com/your-repo/zentasks/archive/main.zip
unzip main.zip
cd zentasks-main

# Make setup script executable
chmod +x setup.sh

# Run the automated deployment
./setup.sh
```

The setup script will:
- ✅ Install Node.js, Nginx, PM2, and Certbot
- ✅ Configure SSL certificates with Let's Encrypt
- ✅ Set up automatic backups and monitoring
- ✅ Configure firewall and security settings
- ✅ Deploy the application with production optimizations

### Option 2: Development Setup

For local development:

```bash
# Clone the repository
git clone https://github.com/your-repo/zentasks.git
cd zentasks

# Install dependencies
npm install

# Start development servers (frontend + backend)
npm run dev
```

The application will be available at `http://localhost:5173`

## 📖 User Guide

### Getting Started

1. **Profile Setup**
   - Create your first profile with a custom name and avatar
   - Set up PIN protection if desired
   - Configure task permissions (create, edit, delete)

2. **Creating Task Groups**
   - Organize tasks into logical groups (Personal, Work, Health, etc.)
   - Choose display modes for completed tasks
   - Enable due dates for time-sensitive groups
   - Customize colors and icons

3. **Adding Tasks**
   - Create tasks with smart recurrence patterns
   - Assign tasks to multiple profiles for collaboration
   - Set due dates with automatic notifications
   - Organize with drag-and-drop ordering

### Task Management

#### **Recurrence Types**
- **Meal-based**: Breakfast, Lunch, Dinner
- **Daily**: Every day, Work days only, Weekends only
- **Periodic**: Weekly, Fortnightly, Monthly, Quarterly, Half-yearly, Yearly

#### **Task Actions**
- **Complete**: Mark task as done (✓)
- **Uncheck**: Remove completion but keep history
- **Reset**: Uncheck and preserve completion history
- **Restore**: Remove all completion history
- **Edit**: Modify task details and settings
- **Delete**: Remove task permanently

#### **Mobile Gestures**
- **Swipe Left**: Access quick actions (edit, delete, uncheck)
- **Tap**: Complete/uncomplete tasks
- **Long Press**: Access context menu

### Profile Management

#### **Creating Profiles**
1. Go to Settings → Profiles
2. Click "Add Profile"
3. Set name, avatar, and color
4. Configure permissions:
   - **Can Create Tasks**: Allow task creation
   - **Can Edit Tasks**: Allow task modification
   - **Can Delete Tasks**: Allow task deletion
5. Enable "Task Competitor" for leaderboard participation
6. Set PIN protection if desired

#### **Profile Permissions**
- **Full Access**: Can create, edit, and delete all tasks
- **Editor**: Can edit existing tasks but not create/delete
- **Viewer**: Can only complete tasks, no modifications
- **Custom**: Mix and match permissions as needed

### Competition System

#### **Task Competition**
- Enable "Task Competitor" in profile settings
- Compete based on task completion over 14-day periods
- Rankings consider both quantity and accuracy
- View live leaderboard via trophy button in header

#### **Collaboration Tracking**
- Tasks assigned to multiple profiles count as collaborative
- Separate leaderboard for collaborative task completion
- Toggle visibility in Settings → General → Show Top Collaborator

### AI Assistant

#### **Setup**
1. Go to Settings → AI Assistant
2. Choose provider (OpenAI, Anthropic, or Gemini)
3. Enter your API key
4. Select model
5. Enable AI insights

#### **Usage**
- Ask questions about productivity patterns
- Get insights on task completion trends
- Analyze collaborative performance
- Request recommendations for improvement

#### **Example Queries**
- "What are my task completion patterns?"
- "Which tasks do I complete most consistently?"
- "How many tasks did I accidentally check this week?"
- "When am I most productive during the day?"

### Notifications

#### **Due Date Notifications**
- **25% Time Remaining**: Early warning notification
- **Due Today**: Day-of-due-date reminder
- **Overdue**: Alerts for missed deadlines

#### **Setup**
1. Enable notifications in Settings → General
2. Grant browser notification permissions
3. Configure due dates on relevant task groups

## 🛠 Administration

### Settings Overview

#### **General Settings**
- **Theme**: Light, Dark, or System preference
- **Notifications**: Enable/disable due date alerts
- **Completed Count**: Show progress in header
- **Auto-archive**: Automatically archive old completed tasks
- **Top Collaborator**: Show/hide collaboration leaderboard

#### **Security Settings**
- **Settings Password**: Protect settings access
- **Profile PINs**: Individual profile protection
- **Permission Management**: Control task access levels

#### **AI Configuration**
- **Provider Selection**: OpenAI, Anthropic, or Gemini
- **Model Selection**: Choose specific AI models
- **API Key Management**: Secure credential storage
- **Query Logging**: Track AI interactions

### Data Management

#### **Backup & Restore**
- Automatic daily backups (via setup script)
- Manual backup: `/usr/local/bin/backup-zentasks.sh`
- Backup location: `/var/backups/zentasks/`
- Retention: 7 days of automatic backups

#### **Data Export**
- User data stored in JSON format
- Location: `server/data/user_*.json`
- Includes tasks, groups, profiles, history, and settings

#### **Data Import**
- Replace JSON files in `server/data/`
- Restart application: `sudo -u zentasks pm2 restart zentasks`
- Verify data integrity via health check

## 🔧 Deployment

### Production Deployment

#### **Automated Setup (Recommended)**

The `setup.sh` script provides a complete production deployment:

```bash
./setup.sh
```

**Features:**
- ✅ **SSL Certificates**: Automatic Let's Encrypt with Cloudflare DNS
- ✅ **Web Server**: Nginx with optimized configuration
- ✅ **Process Management**: PM2 with auto-restart
- ✅ **Security**: Firewall, headers, and access controls
- ✅ **Monitoring**: Health checks and logging
- ✅ **Backups**: Automated daily backups
- ✅ **Updates**: SSL renewal and maintenance scripts

#### **Manual Deployment**

For custom deployments, see [deployment-guide.md](deployment-guide.md) for detailed instructions.

### System Requirements

#### **Minimum Requirements**
- **OS**: Ubuntu 20.04+ (or compatible Linux distribution)
- **Memory**: 1GB RAM
- **Storage**: 2GB available space
- **Network**: Internet connection for dependencies and SSL

#### **Recommended Requirements**
- **OS**: Ubuntu 22.04 LTS
- **Memory**: 2GB RAM
- **Storage**: 5GB available space
- **CPU**: 2+ cores for better performance

### Environment Configuration

#### **Environment Variables**
```bash
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-domain.com
```

#### **SSL Configuration**
- **Provider**: Let's Encrypt with Cloudflare DNS
- **Renewal**: Automatic weekly checks
- **Monitoring**: Renewal logs and alerts

## 🔄 Updates & Maintenance

### Updating ZenTasks

#### **Using Update Script (Recommended)**

For updating an existing installation:

```bash
# Extract updated code over existing installation
unzip zentasks-updated.zip

# Run update script
chmod +x update.sh
./update.sh
```

**The update script:**
- ✅ **Safe Updates**: Creates automatic backups
- ✅ **Preserves Data**: Keeps user data and configurations
- ✅ **No Downtime**: Minimal service interruption
- ✅ **Rollback Support**: Automatic rollback on failure
- ✅ **Dependency Management**: Updates npm packages
- ✅ **Build Process**: Fresh frontend compilation

#### **What Gets Updated**
- ✅ Application source code
- ✅ Dependencies and packages
- ✅ Frontend build assets
- ✅ Configuration files
- ✅ PM2 process configuration

#### **What Gets Preserved**
- ❌ User data (`server/data/`)
- ❌ Environment variables (`.env`)
- ❌ SSL certificates
- ❌ Nginx configuration
- ❌ Log files

### Monitoring & Maintenance

#### **Application Monitoring**
```bash
# Check application status
sudo -u zentasks pm2 list

# View application logs
sudo -u zentasks pm2 logs zentasks

# Monitor resources
sudo -u zentasks pm2 monit

# Restart if needed
sudo -u zentasks pm2 restart zentasks
```

#### **System Monitoring**
```bash
# Check Nginx status
sudo systemctl status nginx

# View Nginx logs
sudo tail -f /var/log/nginx/error.log

# Check SSL certificate
sudo openssl x509 -enddate -noout -in /etc/letsencrypt/live/your-domain.com/cert.pem

# View SSL renewal logs
sudo tail -f /var/log/zentasks/ssl-renewal.log
```

#### **Health Checks**
- **Application**: `http://your-domain.com/api/health`
- **Frontend**: Verify main page loads
- **Database**: Check data persistence
- **SSL**: Verify certificate validity

### Backup Management

#### **Automatic Backups**
- **Schedule**: Daily at 2:00 AM
- **Location**: `/var/backups/zentasks/`
- **Retention**: 7 days
- **Content**: User data and configurations

#### **Manual Backup**
```bash
# Create manual backup
sudo /usr/local/bin/backup-zentasks.sh

# Restore from backup
sudo tar -xzf /var/backups/zentasks/zentasks-data-YYYYMMDD.tar.gz -C /var/www/zentasks/
sudo systemctl restart zentasks
```

## 🔍 Troubleshooting

### Common Issues

#### **Application Won't Start**
```bash
# Check PM2 status
sudo -u zentasks pm2 list

# View error logs
sudo -u zentasks pm2 logs zentasks --err

# Restart application
sudo -u zentasks pm2 restart zentasks

# Check port availability
sudo netstat -tlnp | grep :3001
```

#### **Frontend Not Loading**
```bash
# Check Nginx status
sudo systemctl status nginx

# Verify build files
ls -la /var/www/zentasks/dist/

# Check Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

#### **SSL Certificate Issues**
```bash
# Check certificate expiry
sudo openssl x509 -enddate -noout -in /etc/letsencrypt/live/your-domain.com/cert.pem

# Manual renewal
sudo /usr/local/bin/zentasks-ssl-renewal.sh

# Check renewal logs
sudo tail -f /var/log/zentasks/ssl-renewal.log
```

#### **Database/Data Issues**
```bash
# Check data files
ls -la /var/www/zentasks/server/data/

# Verify file permissions
sudo chown -R zentasks:zentasks /var/www/zentasks/server/data/

# Check API health
curl http://localhost:3001/api/health
```

### Performance Optimization

#### **Application Performance**
- Monitor memory usage with `pm2 monit`
- Optimize task group organization
- Regular cleanup of old history entries
- Use task archiving for completed items

#### **Server Performance**
- Monitor disk space usage
- Regular log rotation
- Database optimization (if using external DB)
- CDN integration for static assets

### Getting Help

#### **Log Locations**
- **Application**: `sudo -u zentasks pm2 logs zentasks`
- **Nginx Access**: `/var/log/nginx/access.log`
- **Nginx Errors**: `/var/log/nginx/error.log`
- **SSL Renewal**: `/var/log/zentasks/ssl-renewal.log`
- **System**: `journalctl -u nginx`

#### **Support Resources**
1. Check application logs for error details
2. Verify system requirements and dependencies
3. Review configuration files for syntax errors
4. Test with minimal configuration
5. Check GitHub issues for known problems

## 🏗 Architecture

### Technology Stack

#### **Frontend**
- **Framework**: React 18.3 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Icons**: Lucide React icon library
- **Build Tool**: Vite for fast development and building
- **State Management**: React Context with useReducer

#### **Backend**
- **Runtime**: Node.js 18+ with Express.js
- **Data Storage**: JSON files (easily replaceable with database)
- **API**: RESTful API with CORS support
- **Process Management**: PM2 for production deployment

#### **Infrastructure**
- **Web Server**: Nginx (reverse proxy and static file serving)
- **SSL**: Let's Encrypt with Cloudflare DNS challenges
- **Deployment**: Ubuntu with automated setup scripts
- **Monitoring**: PM2 monitoring and health checks

### File Structure

```
zentasks/
├── src/                    # Frontend React application
│   ├── components/         # React components
│   ├── contexts/          # React contexts (state management)
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API services and external integrations
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions and helpers
├── server/                # Backend Node.js application
│   ├── data/              # JSON data storage
│   └── index.js           # Main server file
├── dist/                  # Built frontend (production)
├── public/                # Static assets
├── setup.sh               # Ubuntu deployment script
├── update.sh              # Update script for existing installations
├── nginx.conf.example     # Nginx configuration template
└── deployment-guide.md    # Manual deployment guide
```

### API Endpoints

#### **Core API**
- `GET /api/health` - Health check and system status
- `GET /api/data/:userId` - Retrieve user data
- `POST /api/data/:userId` - Save user data

#### **AI Integration**
- `POST /api/ai/log` - Log AI queries for analytics
- `GET /api/ai/logs` - Retrieve AI query history

#### **Data Format**
```json
{
  "tasks": [...],
  "groups": [...],
  "profiles": [...],
  "history": [...],
  "settings": {...},
  "activeProfileId": "string"
}
```

## 🤝 Contributing

### Development Setup

```bash
# Clone repository
git clone https://github.com/your-repo/zentasks.git
cd zentasks

# Install dependencies
npm install

# Start development servers
npm run dev

# Run linting
npm run lint

# Build for production
npm run build
```

### Code Standards

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting (if configured)
- **Component Structure**: Functional components with hooks
- **File Organization**: Modular architecture with clear separation

### Contribution Guidelines

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with proper TypeScript types
4. Add tests if applicable
5. Ensure all linting passes
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Team** - For the excellent React framework
- **Tailwind CSS** - For the utility-first CSS framework
- **Lucide** - For the beautiful icon library
- **Vite** - For the fast build tool
- **Let's Encrypt** - For free SSL certificates
- **Cloudflare** - For DNS and CDN services

## 📞 Support

For support and questions:

1. **Documentation**: Check this README and deployment guide
2. **Issues**: Open an issue on GitHub
3. **Discussions**: Use GitHub Discussions for questions
4. **Security**: Report security issues privately

---

**ZenTasks** - Bringing zen to your task management experience! 🧘‍♀️✨