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
const ACTIVITY_LOG_FILE = path.join(DATA_DIR, 'activity.log');
const TASK_ICONS_FILE = path.join(DATA_DIR, 'task_icons.json');

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['http://localhost', 'http://127.0.0.1', process.env.FRONTEND_URL].filter(Boolean)
    : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

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

// Activity logging function
async function logActivity(entry) {
  try {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] ${JSON.stringify(entry)}\n`;
    await fs.appendFile(ACTIVITY_LOG_FILE, logLine, 'utf8');
    console.log('Activity logged:', entry.action, entry.taskTitle || 'System');
  } catch (error) {
    console.error('Error writing to activity log:', error);
  }
}

// Helper function to read JSON file with error handling and validation
async function readJsonFile(filename) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    console.log('Reading file:', filePath);
    
    const data = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(data);
    
    console.log('Successfully read JSON file:', filename);
    console.log('Data keys:', Object.keys(parsed));
    console.log('Tasks count:', parsed.tasks?.length || 0);
    console.log('Groups count:', parsed.groups?.length || 0);
    console.log('Profiles count:', parsed.profiles?.length || 0);
    console.log('History count:', parsed.history?.length || 0);
    
    return parsed;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('File does not exist:', filename);
      return null; // File doesn't exist
    }
    console.error('Error reading JSON file:', filename, error);
    throw error;
  }
}

// Helper function to write JSON file with validation and backup
async function writeJsonFile(filename, data) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    const backupPath = `${filePath}.backup`;
    
    console.log('Writing to file:', filePath);
    console.log('Data to save - Tasks:', data.tasks?.length || 0);
    console.log('Data to save - Groups:', data.groups?.length || 0);
    console.log('Data to save - Profiles:', data.profiles?.length || 0);
    console.log('Data to save - History:', data.history?.length || 0);
    
    // Validate data structure
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid data structure - must be an object');
    }
    
    // Ensure required arrays exist
    const validatedData = {
      tasks: Array.isArray(data.tasks) ? data.tasks : [],
      groups: Array.isArray(data.groups) ? data.groups : [],
      profiles: Array.isArray(data.profiles) ? data.profiles : [],
      history: Array.isArray(data.history) ? data.history : [],
      settings: data.settings || {},
      activeProfileId: data.activeProfileId || '',
      ...data
    };
    
    // Create backup of existing file if it exists
    try {
      await fs.access(filePath);
      await fs.copyFile(filePath, backupPath);
      console.log('Created backup:', backupPath);
    } catch (backupError) {
      // File doesn't exist yet, no backup needed
      console.log('No existing file to backup');
    }
    
    // Write the new data
    const jsonString = JSON.stringify(validatedData, null, 2);
    await fs.writeFile(filePath, jsonString, 'utf8');
    
    // Verify the write was successful by reading it back
    const verification = await fs.readFile(filePath, 'utf8');
    const verifiedData = JSON.parse(verification);
    
    console.log('Successfully saved and verified file:', filePath);
    console.log('Verified - Tasks:', verifiedData.tasks?.length || 0);
    console.log('Verified - Groups:', verifiedData.groups?.length || 0);
    console.log('Verified - Profiles:', verifiedData.profiles?.length || 0);
    console.log('Verified - History:', verifiedData.history?.length || 0);
    
    // Log the save operation
    await logActivity({
      action: 'data_saved',
      timestamp: new Date().toISOString(),
      userId: filename.replace('user_', '').replace('.json', ''),
      details: `Saved ${verifiedData.tasks?.length || 0} tasks, ${verifiedData.groups?.length || 0} groups, ${verifiedData.profiles?.length || 0} profiles, ${verifiedData.history?.length || 0} history entries`
    });
    
  } catch (error) {
    console.error('Error writing JSON file:', filename, error);
    
    // Log the error
    await logActivity({
      action: 'data_save_error',
      timestamp: new Date().toISOString(),
      userId: filename.replace('user_', '').replace('.json', ''),
      details: `Failed to save data: ${error.message}`
    });
    
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
        enableDueDates: false,
        sortByDueDate: false,
        defaultNotifications: false,
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
        enableDueDates: true,
        sortByDueDate: true,
        defaultNotifications: false,
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
        enableDueDates: false,
        sortByDueDate: false,
        defaultNotifications: true,
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
        enableDueDates: true,
        sortByDueDate: true,
        defaultNotifications: false,
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
        isTaskCompetitor: true,
        permissions: {
          canEditTasks: true,
          canCreateTasks: true,
          canDeleteTasks: true,
        },
        mealTimes: {
          breakfast: '07:00',
          lunch: '12:00',
          dinner: '18:00',
          nightcap: '21:00',
        },
      },
    ],
    history: [],
    settings: {
      theme: 'system',
      showCompletedCount: true,
      enableNotifications: false,
      autoArchiveCompleted: false,
      archiveDays: 30,
      showTopCollaborator: true,
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

// Load activity log and merge with history
async function loadActivityLog() {
  try {
    const logData = await fs.readFile(ACTIVITY_LOG_FILE, 'utf8');
    const logEntries = logData.split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          const match = line.match(/^\[(.*?)\] (.*)$/);
          if (match) {
            const entry = JSON.parse(match[2]);
            entry.timestamp = match[1];
            return entry;
          }
          return null;
        } catch {
          return null;
        }
      })
      .filter(entry => entry !== null);
    
    console.log(`Loaded ${logEntries.length} activity log entries`);
    return logEntries;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('No activity log file found, starting fresh');
      return [];
    }
    console.error('Error reading activity log:', error);
    return [];
  }
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
      
      // Log the creation
      await logActivity({
        action: 'user_created',
        timestamp: new Date().toISOString(),
        userId: userId,
        details: 'Created new user with default data'
      });
    }
    
    // Load activity log and merge with history
    const activityLog = await loadActivityLog();
    
    // Merge activity log with existing history, avoiding duplicates
    const existingHistoryIds = new Set(userData.history?.map(h => h.id) || []);
    const newLogEntries = activityLog
      .filter(entry => !existingHistoryIds.has(entry.id))
      .map(entry => ({
        id: entry.id || `log-${Date.now()}-${Math.random()}`,
        taskId: entry.taskId || 'system',
        profileId: entry.profileId || 'system',
        action: entry.action,
        timestamp: new Date(entry.timestamp),
        taskTitle: entry.taskTitle || 'System Action',
        profileName: entry.profileName || 'System',
        details: entry.details || ''
      }));
    
    // Combine and sort by timestamp (newest first)
    const combinedHistory = [...(userData.history || []), ...newLogEntries]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    userData.history = combinedHistory;
    
    console.log('Sending user data for:', userId);
    console.log('Total history entries:', userData.history.length);
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
    
    console.log('Received save request for user:', userId);
    console.log('Data received - Tasks:', userData.tasks?.length || 0);
    console.log('Data received - Groups:', userData.groups?.length || 0);
    console.log('Data received - Profiles:', userData.profiles?.length || 0);
    console.log('Data received - History:', userData.history?.length || 0);
    
    // Remove loading flag before saving
    const { loading, taskUpdateStatuses, ...dataToSave } = userData;
    
    // Log any new history entries to the activity log
    if (userData.history && Array.isArray(userData.history)) {
      // Get existing data to compare
      const existingData = await readJsonFile(filename);
      const existingHistoryIds = new Set(existingData?.history?.map(h => h.id) || []);
      
      // Find new history entries
      const newHistoryEntries = userData.history.filter(entry => 
        !existingHistoryIds.has(entry.id)
      );
      
      // Log each new history entry to activity log
      for (const entry of newHistoryEntries) {
        await logActivity({
          id: entry.id,
          action: entry.action,
          taskId: entry.taskId,
          profileId: entry.profileId,
          timestamp: entry.timestamp,
          taskTitle: entry.taskTitle,
          profileName: entry.profileName,
          details: entry.details,
          userId: userId
        });
      }
      
      if (newHistoryEntries.length > 0) {
        console.log(`Logged ${newHistoryEntries.length} new history entries to activity log`);
      }
    }
    
    await writeJsonFile(filename, dataToSave);
    console.log('Successfully saved user data for:', userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving user data:', error);
    
    // Log the save error
    await logActivity({
      action: 'save_error',
      timestamp: new Date().toISOString(),
      userId: userId,
      details: `Failed to save user data: ${error.message}`
    });
    
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

// Get activity log
// Serve static files in production (after all API routes)
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

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Create API router
const apiRouter = express.Router();

// Move all API routes to the router
// Get user data
apiRouter.get('/data/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const filename = getUserDataFile(userId);
    let userData = await readJsonFile(filename);
    
    if (!userData) {
      console.log('Creating default data for user:', userId);
      userData = getDefaultUserData();
      await writeJsonFile(filename, userData);
      
      // Log the creation
      await logActivity({
        action: 'user_created',
        timestamp: new Date().toISOString(),
        userId: userId,
        details: 'Created new user with default data'
      });
    }
    
    // Load activity log and merge with history
    const activityLog = await loadActivityLog();
    
    // Merge activity log with existing history, avoiding duplicates
    const existingHistoryIds = new Set(userData.history?.map(h => h.id) || []);
    const newLogEntries = activityLog
      .filter(entry => !existingHistoryIds.has(entry.id))
      .map(entry => ({
        id: entry.id || `log-${Date.now()}-${Math.random()}`,
        taskId: entry.taskId || 'system',
        profileId: entry.profileId || 'system',
        action: entry.action,
        timestamp: new Date(entry.timestamp),
        taskTitle: entry.taskTitle || 'System Action',
        profileName: entry.profileName || 'System',
        details: entry.details || ''
      }));
    
    // Combine and sort by timestamp (newest first)
    const combinedHistory = [...(userData.history || []), ...newLogEntries]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    userData.history = combinedHistory;
    
    console.log('Sending user data for:', userId);
    console.log('Total history entries:', userData.history.length);
    res.json(userData);
  } catch (error) {
    console.error('Error reading user data:', error);
    res.status(500).json({ error: 'Failed to read user data' });
  }
});

// Save user data
apiRouter.post('/data/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userData = req.body;
    const filename = getUserDataFile(userId);
    
    console.log('Received save request for user:', userId);
    console.log('Data received - Tasks:', userData.tasks?.length || 0);
    console.log('Data received - Groups:', userData.groups?.length || 0);
    console.log('Data received - Profiles:', userData.profiles?.length || 0);
    console.log('Data received - History:', userData.history?.length || 0);
    
    // Remove loading flag before saving
    const { loading, taskUpdateStatuses, ...dataToSave } = userData;
    
    // Log any new history entries to the activity log
    if (userData.history && Array.isArray(userData.history)) {
      // Get existing data to compare
      const existingData = await readJsonFile(filename);
      const existingHistoryIds = new Set(existingData?.history?.map(h => h.id) || []);
      
      // Find new history entries
      const newHistoryEntries = userData.history.filter(entry => 
        !existingHistoryIds.has(entry.id)
      );
      
      // Log each new history entry to activity log
      for (const entry of newHistoryEntries) {
        await logActivity({
          id: entry.id,
          action: entry.action,
          taskId: entry.taskId,
          profileId: entry.profileId,
          timestamp: entry.timestamp,
          taskTitle: entry.taskTitle,
          profileName: entry.profileName,
          details: entry.details,
          userId: userId
        });
      }
      
      if (newHistoryEntries.length > 0) {
        console.log(`Logged ${newHistoryEntries.length} new history entries to activity log`);
      }
    }
    
    await writeJsonFile(filename, dataToSave);
    console.log('Successfully saved user data for:', userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving user data:', error);
    
    // Log the save error
    await logActivity({
      action: 'save_error',
      timestamp: new Date().toISOString(),
      userId: userId,
      details: `Failed to save user data: ${error.message}`
    });
    
    res.status(500).json({ error: 'Failed to save user data' });
  }
});

// Log AI queries
apiRouter.post('/ai/log', async (req, res) => {
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
apiRouter.get('/ai/logs', async (req, res) => {
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

// Get activity log
apiRouter.get('/activity/logs', async (req, res) => {
  try {
    const activityLog = await loadActivityLog();
    res.json(activityLog.slice(-200)); // Return last 200 entries
  } catch (error) {
    console.error('Error reading activity logs:', error);
    res.status(500).json({ error: 'Failed to read activity logs' });
  }
});

// Download data endpoints for backup
apiRouter.get('/data/:userId/download', async (req, res) => {
  try {
    const { userId } = req.params;
    const filename = getUserDataFile(userId);
    const userData = await readJsonFile(filename);
    
    if (!userData) {
      return res.status(404).json({ error: 'User data not found' });
    }
    
    // Set headers for file download
    const downloadFilename = `focusflow-data-${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
    
    res.json(userData);
  } catch (error) {
    console.error('Error downloading user data:', error);
    res.status(500).json({ error: 'Failed to download user data' });
  }
});

apiRouter.get('/activity/download', async (req, res) => {
  try {
    const activityLog = await loadActivityLog();
    
    // Format as log file content
    const logContent = activityLog.map(entry => 
      `[${entry.timestamp}] ${JSON.stringify(entry)}`
    ).join('\n');
    
    // Set headers for file download
    const downloadFilename = `focusflow-activity-${new Date().toISOString().split('T')[0]}.log`;
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
    
    res.send(logContent);
  } catch (error) {
    console.error('Error downloading activity log:', error);
    res.status(500).json({ error: 'Failed to download activity log' });
  }
});

// Get task icons for kiosk
apiRouter.get('/task-icons', async (req, res) => {
  try {
    const taskIconsData = await readJsonFile('task_icons.json');
    res.json(taskIconsData || {});
  } catch (error) {
    console.error('Error reading task icons:', error);
    res.json({});
  }
});

// Generate task icons using AI
apiRouter.post('/generate-task-icons', async (req, res) => {
  try {
    const { tasks, groups, aiSettings } = req.body;
    
    if (!aiSettings.enabled || !aiSettings.apiKey) {
      return res.status(400).json({ error: 'AI is not configured' });
    }
    
    const taskIcons = await generateTaskIcons(tasks, groups, aiSettings);
    
    // Save task icons to file
    await writeJsonFile('task_icons.json', taskIcons);
    
    res.json(taskIcons);
  } catch (error) {
    console.error('Error generating task icons:', error);
    res.status(500).json({ error: 'Failed to generate task icons' });
  }
});

// Health check
apiRouter.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    dataDir: DATA_DIR,
    features: ['tasks', 'ai-logging', 'activity-logging', 'task-icons'],
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mount API router BEFORE static file serving
app.use('/api', apiRouter);

// Start server
async function startServer() {
  try {
    await ensureDataDir();
    
    // Initialize activity log
    await logActivity({
      action: 'server_started',
      timestamp: new Date().toISOString(),
      details: `FocusFlow server started on port ${PORT}`
    });
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 FocusFlow server running on port ${PORT}`);
      console.log(`📁 Data directory: ${DATA_DIR}`);
      console.log(`🤖 AI logging enabled: ${AI_LOG_FILE}`);
      console.log(`📊 Activity logging enabled: ${ACTIVITY_LOG_FILE}`);
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