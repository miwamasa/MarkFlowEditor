import React, { useState } from 'react';
import { aiService } from '../../services/aiService';

interface AISettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AISettings: React.FC<AISettingsProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState(aiService.getApiKey() || '');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleSave = () => {
    aiService.setApiKey(apiKey);
    onClose();
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setTestResult('Please enter an API key first');
      return;
    }

    setIsTestingConnection(true);
    setTestResult(null);

    try {
      aiService.setApiKey(apiKey);
      const isConnected = await aiService.testConnection();
      
      if (isConnected) {
        setTestResult('✅ Connection successful!');
      } else {
        setTestResult('⚠️ Connected, but unexpected response. API key might be valid.');
      }
    } catch (error) {
      setTestResult(`❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTestingConnection(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-96 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">AI Settings</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 mb-2">
              Anthropic API Key
            </label>
            <input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Anthropic API key..."
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Get your API key from{' '}
              <a
                href="https://console.anthropic.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Anthropic Console
              </a>
            </p>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handleTestConnection}
              disabled={isTestingConnection || !apiKey.trim()}
              className="flex-1 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isTestingConnection ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition-colors"
            >
              Save
            </button>
          </div>

          {testResult && (
            <div className={`p-3 rounded text-sm ${
              testResult.includes('✅') 
                ? 'bg-green-50 text-green-800 border border-green-200'
                : testResult.includes('⚠️')
                ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {testResult}
            </div>
          )}

          <div className="text-xs text-gray-500 border-t pt-3">
            <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800 font-medium mb-1">🚀 Backend Server Mode</p>
              <p className="text-green-700">Using backend server at localhost:3001 to handle Anthropic API calls. Falls back to mock if server is not running.</p>
            </div>
            <p className="mb-1"><strong>Setup:</strong> Start the backend server with <code>cd server && npm start</code></p>
            <p className="mb-1"><strong>API Key:</strong> Set your Anthropic API key in the server's .env file or pass via this interface.</p>
            <p className="mt-1"><strong>Variables Structure:</strong> Responses follow the variables array format for consistent parsing.</p>
          </div>
        </div>
      </div>
    </div>
  );
};