import { AISettings, HistoryEntry, Task, UserProfile, TaskGroup } from '../types';

interface QueryContext {
  query: string;
  history: HistoryEntry[];
  tasks: Task[];
  profiles: UserProfile[];
  groups: TaskGroup[];
  aiSettings: AISettings;
}

export class AIService {
  private static async callOpenAI(prompt: string, apiKey: string, model: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant that analyzes task management data. Provide clear, actionable insights based on the user\'s task history and patterns. Be concise but thorough in your analysis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API request failed');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'No response generated';
  }

  private static async callAnthropic(prompt: string, apiKey: string, model: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `You are a helpful AI assistant that analyzes task management data. Provide clear, actionable insights based on the user's task history and patterns. Be concise but thorough in your analysis.\n\n${prompt}`
          }
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Anthropic API request failed');
    }

    const data = await response.json();
    return data.content[0]?.text || 'No response generated';
  }

  private static async callGemini(prompt: string, apiKey: string, model: string): Promise<string> {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are a helpful AI assistant that analyzes task management data. Provide clear, actionable insights based on the user's task history and patterns. Be concise but thorough in your analysis.\n\n${prompt}`
              }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Gemini API request failed');
    }

    const data = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || 'No response generated';
  }

  private static generatePrompt(context: QueryContext): string {
    const { query, history, tasks, profiles, groups } = context;

    // Generate statistics
    const stats = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.isCompleted).length,
      totalHistory: history.length,
      completedActions: history.filter(h => h.action === 'completed').length,
      uncheckedActions: history.filter(h => h.action === 'unchecked').length,
      resetActions: history.filter(h => h.action === 'reset').length,
      restoredActions: history.filter(h => h.action === 'restored').length,
    };

    // Group tasks by category
    const tasksByGroup = groups.map(group => ({
      name: group.name,
      tasks: tasks.filter(t => t.groupId === group.id),
      completed: tasks.filter(t => t.groupId === group.id && t.isCompleted).length,
      total: tasks.filter(t => t.groupId === group.id).length,
    }));

    // Recent history (last 30 entries)
    const recentHistory = history.slice(0, 30);

    const prompt = `
User Query: "${query}"

TASK DATA ANALYSIS:

Current Statistics:
- Total Tasks: ${stats.totalTasks}
- Completed Tasks: ${stats.completedTasks}
- Completion Rate: ${Math.round((stats.completedTasks / stats.totalTasks) * 100)}%

Action History (Total: ${stats.totalHistory} entries):
- Completed: ${stats.completedActions}
- Unchecked: ${stats.uncheckedActions}
- Reset: ${stats.resetActions}
- Restored: ${stats.restoredActions}

Tasks by Category:
${tasksByGroup.map(group => 
  `- ${group.name}: ${group.completed}/${group.total} completed (${Math.round((group.completed / group.total) * 100)}%)`
).join('\n')}

Recent Activity (Last 30 actions):
${recentHistory.map(entry => 
  `- ${entry.timestamp.toLocaleDateString()}: ${entry.action} "${entry.taskTitle}" by ${entry.profileName}`
).join('\n')}

Task Recurrence Patterns:
${tasks.map(task => 
  `- "${task.title}": ${task.recurrence} (${task.isCompleted ? 'completed' : 'pending'})`
).join('\n')}

Please analyze this data and provide insights relevant to the user's question. Focus on:
1. Patterns and trends in task completion
2. Areas for improvement
3. Productivity insights
4. Specific answers to their question

Be specific with numbers and dates when relevant, and provide actionable recommendations.
`;

    return prompt;
  }

  static async queryTasks(context: QueryContext): Promise<string> {
    const { aiSettings } = context;

    if (!aiSettings.enabled || !aiSettings.apiKey) {
      throw new Error('AI is not configured. Please set up your API key in settings.');
    }

    const prompt = this.generatePrompt(context);

    try {
      let response: string;

      switch (aiSettings.provider) {
        case 'openai':
          response = await this.callOpenAI(prompt, aiSettings.apiKey, aiSettings.model);
          break;
        case 'anthropic':
          response = await this.callAnthropic(prompt, aiSettings.apiKey, aiSettings.model);
          break;
        case 'gemini':
          response = await this.callGemini(prompt, aiSettings.apiKey, aiSettings.model);
          break;
        default:
          throw new Error(`Unsupported AI provider: ${aiSettings.provider}`);
      }

      // Log the query to server
      await this.logQuery(context.query, response);

      return response;
    } catch (error) {
      console.error('AI query failed:', error);
      throw error;
    }
  }

  private static async logQuery(query: string, response: string): Promise<void> {
    try {
      await fetch('/api/ai/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          response,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.warn('Failed to log AI query:', error);
      // Don't throw - logging is not critical
    }
  }
}