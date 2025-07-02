# ZenTasks - Smart Task Management

A beautiful, production-ready task management application with smart recurring tasks, multi-profile support, and AI-powered insights.

## Features

- 🎯 **Smart Recurring Tasks** - Daily, weekly, meal-based, and custom recurrence patterns
- 👥 **Multi-Profile Support** - Assign tasks to different family members or team members
- 🎨 **Beautiful UI** - Modern, responsive design with dark mode support
- 🤖 **AI Insights** - Analyze your productivity patterns with AI assistance
- 📊 **Detailed History** - Track completion patterns and productivity trends
- 🔄 **Flexible Task States** - Complete, uncheck, reset with full history preservation
- 📱 **Mobile Friendly** - Optimized for all devices
- 🚀 **Production Ready** - Built for deployment with Nginx and PM2

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development servers (frontend + backend)
npm run dev
```

The application will be available at `http://localhost:5173`

### Production Deployment (Ubuntu)

For a complete automated deployment on Ubuntu with Nginx, SSL, and all dependencies:

```bash
# Make setup script executable
chmod +x setup.sh

# Run the deployment script
./setup.sh
```

The script will:
- Install Node.js, Nginx, PM2, and Certbot
- Configure the application with proper security settings
- Set up SSL certificates with Let's Encrypt
- Configure automatic backups
- Set up monitoring and logging

### Manual Deployment

If you prefer manual deployment, see [deployment-guide.md](deployment-guide.md) for detailed instructions.

## Architecture

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express
- **Data Storage**: JSON files (easily replaceable with database)
- **Process Management**: PM2
- **Web Server**: Nginx (reverse proxy)
- **AI Integration**: OpenAI, Anthropic, or Google Gemini APIs

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-domain.com
```

### AI Configuration

Configure AI settings in the application settings panel:
- Choose provider (OpenAI, Anthropic, or Gemini)
- Add your API key
- Select model
- Enable AI insights

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/data/:userId` - Get user data
- `POST /api/data/:userId` - Save user data
- `POST /api/ai/log` - Log AI queries
- `GET /api/ai/logs` - Get AI query logs

## File Structure

```
zentasks/
├── src/                    # Frontend React application
│   ├── components/         # React components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom hooks
│   ├── services/          # API services
│   ├── types/             # TypeScript types
│   └── utils/             # Utility functions
├── server/                # Backend Node.js application
│   ├── data/              # JSON data storage
│   └── index.js           # Main server file
├── dist/                  # Built frontend (production)
├── setup.sh               # Ubuntu deployment script
├── nginx.conf.example     # Nginx configuration template
└── deployment-guide.md    # Manual deployment guide
```

## Task Recurrence Types

- **Meal-based**: Breakfast, Lunch, Dinner
- **Daily**: Every day, Work days only, Weekends only
- **Periodic**: Weekly, Fortnightly, Monthly, Quarterly, Half-yearly, Yearly

## Multi-Profile Features

- Create multiple user profiles
- Assign tasks to specific profiles
- Track completion by profile
- Switch between profiles
- Collaborative task management

## AI Insights

Ask questions about your productivity:
- "What are my task completion patterns?"
- "Which tasks do I complete most consistently?"
- "When am I most productive during the day?"
- "How many tasks did I accidentally check this week?"

## Security Features

- CORS protection
- Security headers
- Input validation
- Rate limiting ready
- SSL/TLS support
- Firewall configuration

## Monitoring

- PM2 process monitoring
- Application logs
- Nginx access/error logs
- Automatic backups
- Health check endpoint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the deployment guide
2. Review the logs
3. Open an issue on GitHub

## Roadmap

- [ ] Database integration (PostgreSQL/MySQL)
- [ ] Real-time notifications
- [ ] Mobile app
- [ ] Team collaboration features
- [ ] Advanced analytics dashboard
- [ ] Integration with calendar apps
- [ ] Webhook support
- [ ] API rate limiting
- [ ] User authentication system