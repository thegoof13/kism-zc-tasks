import React, { useState } from 'react';
import { X, Send, Brain, Loader, MessageSquare, TrendingUp, Calendar, Target, Settings, TestTube, Save } from 'lucide-react';
import { AISettings, HistoryEntry, Task, UserProfile, TaskGroup } from '../types';
import { AIService } from '../services/aiService';

interface AIQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryEntry[];
  tasks: Task[];
  profiles: UserProfile[];
  groups: TaskGroup[];
  aiSettings: AISettings;
  onUpdateSettings: (updates: Partial<AISettings>) => void;
}

interface QueryResponse {
  id: string;
  query: string;
  response: string;
  timestamp: Date;
}

export function AIQueryModal({ isOpen, onClose, history, tasks, profiles, groups, aiSettings, onUpdateSettings }: AIQueryModalProps) {
  const [query, setQuery] = useState('');
  const [responses, setResponses] = useState<QueryResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  // Settings state
  const [tempSettings, setTempSettings] = useState<AISettings>(aiSettings);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const suggestedQueries = [
    "What are my task completion patterns?",
    "Which tasks do I complete most consistently?",
    "How many tasks did I accidentally check this week?",
    "What's my productivity trend over time?",
    "Which task groups need more attention?",
    "When am I most productive during the day?",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await AIService.queryTasks({
        query: query.trim(),
        history,
        tasks,
        profiles,
        groups,
        aiSettings,
      });

      const newResponse: QueryResponse = {
        id: Date.now().toString(),
        query: query.trim(),
        response,
        timestamp: new Date(),
      };

      setResponses(prev => [newResponse, ...prev]);
      setQuery('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get AI response');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestedQuery = (suggestedQuery: string) => {
    setQuery(suggestedQuery);
  };

  const handleTestConnection = async () => {
    setTestLoading(true);
    setTestResult(null);

    try {
      const testResponse = await AIService.queryTasks({
        query: "Test connection - please respond with 'Connection successful'",
        history: [],
        tasks: [],
        profiles: [],
        groups: [],
        aiSettings: tempSettings,
      });

      setTestResult('✅ Connection successful! AI is working properly.');
    } catch (err) {
      setTestResult(`❌ Connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setTestLoading(false);
    }
  };

  const handleSaveSettings = () => {
    onUpdateSettings(tempSettings);
    setShowSettings(false);
    setTestResult(null);
  };

  if (!isOpen) return null;

  // Show settings popup
  if (showSettings) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
        
        <div className="relative w-full max-w-md mx-4 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl animate-scale-in">
          <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center space-x-3">
              <Settings className="w-5 h-5 text-primary-500" />
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                AI Assistant Settings
              </h2>
            </div>
            <button
              onClick={() => setShowSettings(false)}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
            >
              <X className="w-5 h-5 text-neutral-500" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* Provider Selection */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                AI Provider
              </label>
              <select
                value={tempSettings.provider}
                onChange={(e) => setTempSettings(prev => ({ ...prev, provider: e.target.value as any }))}
                className="input-primary"
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="gemini">Google Gemini</option>
              </select>
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Model
              </label>
              <select
                value={tempSettings.model}
                onChange={(e) => setTempSettings(prev => ({ ...prev, model: e.target.value }))}
                className="input-primary"
              >
                {tempSettings.provider === 'openai' && (
                  <>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  </>
                )}
                {tempSettings.provider === 'anthropic' && (
                  <>
                    <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                    <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                    <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                  </>
                )}
                {tempSettings.provider === 'gemini' && (
                  <>
                    <option value="gemini-pro">Gemini Pro</option>
                    <option value="gemini-pro-vision">Gemini Pro Vision</option>
                  </>
                )}
              </select>
            </div>

            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                API Key
              </label>
              <input
                type="password"
                value={tempSettings.apiKey}
                onChange={(e) => setTempSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="Enter your API key..."
                className="input-primary"
              />
            </div>

            {/* Enable AI */}
            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={tempSettings.enabled}
                  onChange={(e) => setTempSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Enable AI Assistant
                </span>
              </label>
            </div>

            {/* Test Connection */}
            {tempSettings.apiKey && (
              <div>
                <button
                  onClick={handleTestConnection}
                  disabled={testLoading}
                  className="w-full flex items-center justify-center space-x-2 p-3 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-lg transition-colors duration-200"
                >
                  {testLoading ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <TestTube className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">
                    {testLoading ? 'Testing...' : 'Test Connection'}
                  </span>
                </button>
                
                {testResult && (
                  <div className={`mt-2 p-3 rounded-lg text-sm ${
                    testResult.startsWith('✅') 
                      ? 'bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400'
                      : 'bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-400'
                  }`}>
                    {testResult}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-3 p-6 border-t border-neutral-200 dark:border-neutral-700">
            <button
              onClick={() => setShowSettings(false)}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSettings}
              className="flex-1 btn-primary"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main AI interface
  if (!aiSettings.enabled || !aiSettings.apiKey) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative w-full max-w-md mx-4 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl animate-scale-in">
          <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center space-x-3">
              <Brain className="w-6 h-6 text-primary-500" />
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                AI Assistant
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
            >
              <X className="w-5 h-5 text-neutral-500" />
            </button>
          </div>

          <div className="p-6 text-center">
            <Brain className="w-12 h-12 mx-auto mb-4 text-neutral-400" />
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              AI Assistant Not Configured
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Configure your AI settings to get insights about your task patterns and productivity.
            </p>
            <button 
              onClick={() => setShowSettings(true)}
              className="btn-primary"
            >
              <Settings className="w-4 h-4 mr-2" />
              Configure AI Settings
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl mx-4 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl animate-scale-in max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center space-x-3">
            <Brain className="w-6 h-6 text-primary-500" />
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              AI Task Assistant
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
              title="AI Settings"
            >
              <Settings className="w-5 h-5 text-neutral-500" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
            >
              <X className="w-5 h-5 text-neutral-500" />
            </button>
          </div>
        </div>

        <div className="flex flex-col h-[calc(90vh-80px)]">
          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {responses.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-neutral-300 dark:text-neutral-600" />
                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                  Ask me anything about your tasks!
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                  I can analyze your task history, identify patterns, and provide insights.
                </p>
                
                {/* Suggested Queries */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                  {suggestedQueries.map((suggestedQuery, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestedQuery(suggestedQuery)}
                      className="p-3 text-left bg-neutral-50 dark:bg-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors duration-200"
                    >
                      <div className="flex items-start space-x-2">
                        <div className="w-6 h-6 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          {index < 2 ? <TrendingUp className="w-3 h-3 text-primary-600" /> :
                           index < 4 ? <Calendar className="w-3 h-3 text-primary-600" /> :
                           <Target className="w-3 h-3 text-primary-600" />}
                        </div>
                        <span className="text-sm text-neutral-700 dark:text-neutral-300">
                          {suggestedQuery}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {responses.map((response) => (
                  <div key={response.id} className="space-y-4">
                    {/* User Query */}
                    <div className="flex justify-end">
                      <div className="max-w-3xl bg-primary-500 text-white rounded-2xl rounded-tr-md px-4 py-3">
                        <p className="text-sm">{response.query}</p>
                      </div>
                    </div>
                    
                    {/* AI Response */}
                    <div className="flex justify-start">
                      <div className="max-w-3xl bg-neutral-100 dark:bg-neutral-700 rounded-2xl rounded-tl-md px-4 py-3">
                        <div className="flex items-start space-x-3">
                          <Brain className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                              {response.response.split('\n').map((line, index) => (
                                <p key={index} className="mb-2 last:mb-0 text-neutral-900 dark:text-neutral-100">
                                  {line}
                                </p>
                              ))}
                            </div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                              {response.timestamp.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-neutral-100 dark:bg-neutral-700 rounded-2xl rounded-tl-md px-4 py-3">
                  <div className="flex items-center space-x-3">
                    <Brain className="w-5 h-5 text-primary-500" />
                    <div className="flex items-center space-x-2">
                      <Loader className="w-4 h-4 animate-spin text-primary-500" />
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">
                        Analyzing your tasks...
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-4">
                <p className="text-error-700 dark:text-error-400 text-sm">
                  {error}
                </p>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-neutral-200 dark:border-neutral-700 p-4">
            <form onSubmit={handleSubmit} className="flex space-x-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about your task patterns, productivity, or specific insights..."
                className="flex-1 input-primary"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!query.trim() || loading}
                className="btn-primary px-6"
              >
                {loading ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}