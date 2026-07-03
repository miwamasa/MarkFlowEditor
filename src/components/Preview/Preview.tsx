import React, { useState, useMemo, useCallback } from 'react';
import { useApp } from '../../contexts/AppContext';
import { fileToMarkdown } from '../../utils/markdown';
import { collectFileVariables, resolveVariables } from '../../utils/variableResolver';
import { BlockRenderer } from './BlockRenderer';

export const Preview: React.FC = () => {
  const { state } = useApp();
  const [showMarkdown, setShowMarkdown] = useState(false);
  const currentFile = state.project.files.find(f => f.id === state.currentFileId);

  const resolve = useCallback(
    (content: string): string => {
      if (!currentFile) return content;
      return resolveVariables(
        content,
        collectFileVariables(state.project, currentFile),
        state.project,
        currentFile.id
      );
    },
    [state.project, currentFile]
  );

  const markdown = useMemo(() => {
    if (!currentFile) return '';
    return resolve(fileToMarkdown(currentFile, state.project.files));
  }, [currentFile, state.project.files, resolve]);

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(markdown).then(() => {
      console.log('Markdown copied to clipboard');
    }).catch(() => {
      console.error('Failed to copy markdown');
    });
  };

  if (!currentFile) {
    return (
      <div className="flex-1 bg-white border-l border-gray-200 flex items-center justify-center">
        <div className="text-gray-500 text-lg">
          Select a file to preview
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white border-l border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          {currentFile.name} - Preview
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowMarkdown(!showMarkdown)}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${
              showMarkdown
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {showMarkdown ? '📄 Rendered' : '🔤 Markdown'}
          </button>
          <button
            onClick={handleCopyMarkdown}
            className="bg-gray-600 text-white px-3 py-1.5 rounded text-sm hover:bg-gray-700 transition-colors"
          >
            📋 Copy Markdown
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        {showMarkdown ? (
          <pre className="whitespace-pre-wrap text-sm font-mono">
            {markdown}
          </pre>
        ) : (
          <div className="prose max-w-none">
            {currentFile.blocks.map(block => (
              <BlockRenderer
                key={block.id}
                block={block}
                resolve={resolve}
                files={state.project.files}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
