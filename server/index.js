import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(__dirname, 'data');
const AI_LOG_FILE = path.join(DATA_DIR, 'ai_queries.log');

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['http://localhost', 'http://127.0.0.1', process.env.FRONTEND_URL].filter(Boolean)
    : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  
  // Serve index.html for all non-API routes (SPA support)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
    console.log('Data directory exists:', DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    console.log('Created data directory:', DATA_DIR);
  }
}

// Helper function to read JSON file
async function readJsonFile(filename) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null; // File doesn't exist
    }
    console.error('Error reading JSON file:', error);
    throw error;
  }
}

// Helper function to write JSON file
async function writeJsonFile(filename, data) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log('Saved data to:', filePath);
  } catch (error) {
    console.error('Error writing JSON file:', error);
    throw error;
  }
}

// Helper function to append to AI log file
async function appendToAILog(logEntry) {
  try {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] ${JSON.stringify(logEntry)}\n`;
    await fs.appendFile(AI_LOG_FILE, logLine, 'utf8');
    console.log('AI query logged');
  } catch (error) {
    console.error('Error writing to AI log:', error);
    throw error;
  }
}

// Helper function to get user data file path
function getUserDataFile(userId) {
  return `user_${userId}.json`;
}

// Initialize default user data
function getDefaultUserData() {
  const now = new Date().toISOString();
  return {
    tasks: [
      {
        id: 'task-1',
        title: 'Morning meditation',
        groupId: 'personal',
        recurrence: 'daily',
        isCompleted: false,
        createdAt: now,
        profiles: ['default'],
        order: 0,
      },
      {
        id: 'task-2',
        title: 'Check emails',
        groupId: 'work',
        recurrence: 'work-daily',
        isCompleted: false,
        createdAt: now,
        profiles: ['default'],
        order: 0,
      },
      {
        id: 'task-3',
        title: 'Take vitamins',
        groupId: 'health',
        recurrence: 'breakfast',
        isCompleted: false,
        createdAt: now,
        profiles: ['default'],
        order: 0,
      },
      {
        id: 'task-4',
        title: 'Weekly meal prep',
        groupId: 'household',
        recurrence: 'weekly',
        isCompleted: false,
        createdAt: now,
        profiles: ['default'],
        order: 0,
      },
      {
        id: 'task-5',
        title: 'Exercise routine',
        groupId: 'health',
        recurrence: 'daily',
        isCompleted: false,
        createdAt: now,
        profiles: ['default'],
        order: 1,
      },
    ],
    groups: [
      {
        id: 'personal',
        name: 'Personal',
        color: '#6366F1',
        icon: 'User',
        completedDisplayMode: 'grey-out',
        isCollapsed: false,
        order: 0,
        createdAt: now,
      },
      {
        id: 'work',
        name: 'Work',
        color: '#10B981',
        icon: 'Briefcase',
        completedDisplayMode: 'grey-drop',
        isCollapsed: false,
        order: 1,
        createdAt: now,
      },
      {
        id: 'health',
        name: 'Health & Fitness',
        color: '#F59E0B',
        icon: 'Heart',
        completedDisplayMode: 'grey-out',
        isCollapsed: false,
        order: 2,
        createdAt: now,
      },
      {
        id: 'household',
        name: 'Household',
        color: '#8B5CF6',
        icon: 'Home',
        completedDisplayMode: 'separate-completed',
        isCollapsed: false,
        order: 3,
        createdAt: now,
      },
    ],
    profiles: [
      {
        id: 'default',
        name: 'Me',
        color: '#6366F1',
        avatar: '👤',
        isActive: true,
        createdAt: now,
      },
    ],
    history: [],
    settings: {
      theme: 'system',
      showCompletedCount: true,
      enableNotifications: false,
      autoArchiveCompleted: false,
      archiveDays: 30,
      ai: {
        apiKey: '',
        provider: 'openai',
        model: 'gpt-4',
        enabled: false,
      },
    },
    activeProfileId: 'default',
  };
}

// Routes

// Get user data
app.get('/api/data/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const filename = getUserDataFile(userId);
    let userData = await readJsonFile(filename);
    
    if (!userData) {
      console.log('Creating default data for user:', userId);
      userData = getDefaultUserData();
      await writeJsonFile(filename, userData);
    }
    
    console.log('Sending user data for:', userId);
    res.json(userData);
  } catch (error) {
    console.error('Error reading user data:', error);
    res.status(500).json({ error: 'Failed to read user data' });
  }
});

// Save user data
app.post('/api/data/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userData = req.body;
    const filename = getUserDataFile(userId);
    
    // Remove loading flag before saving
    const { loading, ...dataToSave } = userData;
    
    await writeJsonFile(filename, dataToSave);
    console.log('Saved user data for:', userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving user data:', error);
    res.status(500).json({ error: 'Failed to save user data' });
  }
});

// Log AI queries
app.post('/api/ai/log', async (req, res) => {
  try {
    const { query, response, timestamp } = req.body;
    
    const logEntry = {
      query,
      response: response.substring(0, 500) + (response.length > 500 ? '...' : ''), // Truncate long responses
      timestamp,
      userId: '1', // Simple user ID for now
    };
    
    await appendToAILog(logEntry);
    res.json({ success: true });
  } catch (error) {
    console.error('Error logging AI query:', error);
    res.status(500).json({ error: 'Failed to log AI query' });
  }
});

// Get AI query logs (optional endpoint for viewing logs)
app.get('/api/ai/logs', async (req, res) => {
  try {
    const logs = await fs.readFile(AI_LOG_FILE, 'utf8');
    const logEntries = logs.split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          const match = line.match(/^\[(.*?)\] (.*)$/);
          if (match) {
            return {
              timestamp: match[1],
              ...JSON.parse(match[2])
            };
          }
          return null;
        } catch {
          return null;
        }
      })
      .filter(entry => entry !== null)
      .slice(-100); // Return last 100 entries
    
    res.json(logEntries);
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.json([]); // No logs yet
    } else {
      console.error('Error reading AI logs:', error);
      res.status(500).json({ error: 'Failed to read AI logs' });
    }
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    dataDir: DATA_DIR,
    features: ['tasks', 'ai-logging'],
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function startServer() {
  try {
    await ensureDataDir();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 FocusFlow server running on port ${PORT}`);
      console.log(`📁 Data directory: ${DATA_DIR}`);
      console.log(`🤖 AI logging enabled: ${AI_LOG_FILE}`);
      console.log(`🌐 API available at: http://localhost:${PORT}/api`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
      
      if (process.env.NODE_ENV === 'production') {
        console.log(`📦 Serving static files from: ${path.join(__dirname, '..', 'dist')}`);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();