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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-hidden">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] min-h-[400px] flex flex-col">
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

        <div className="flex-1 overflow-auto p-4">
          {/* Generated Prompt Section Only */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 h-full overflow-auto">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap">
              {prompt}
            </pre>
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