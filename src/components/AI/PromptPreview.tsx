import React from 'react';

interface PromptPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: string;
  schema: string;
  markdownContent?: string;
}

export const PromptPreview: React.FC<PromptPreviewProps> = ({ 
  isOpen, 
  onClose, 
  prompt, 
  schema,
  markdownContent 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <h3 className="text-lg font-medium text-gray-900">
            👁️ Prompt Preview
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Markdown Content Section */}
          {markdownContent && markdownContent.trim() && (
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-2">
                📝 Current Markdown Content
              </h4>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-h-40 overflow-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {markdownContent}
                </pre>
              </div>
            </div>
          )}

          {/* JSON Schema Section */}
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-2">
              📋 JSON Schema
            </h4>
            <div className="bg-gray-50 border rounded-lg p-4">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
                {schema}
              </pre>
            </div>
          </div>

          {/* Generated Prompt Section */}
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-2">
              🤖 Generated Prompt
            </h4>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                {prompt}
              </pre>
            </div>
          </div>

          {/* Info Section */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="text-yellow-600 mr-2">💡</div>
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">How this works:</p>
                <ul className="list-disc ml-4 space-y-1">
                  <li>The JSON schema defines the expected structure of the AI response</li>
                  <li>The prompt instructs the AI to generate content matching this schema</li>
                  <li>All responses must include a "variables" key with the generated values</li>
                  <li>Variables with the same name will be updated automatically</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-t bg-gray-50 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};