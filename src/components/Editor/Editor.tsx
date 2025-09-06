import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { BlockType } from '../../types';
import { BlockEditor } from './BlockEditor';
import { BlockTypeSelector } from './BlockTypeSelector';

export const Editor: React.FC = () => {
  const { state, actions } = useApp();
  const [showBlockTypeSelector, setShowBlockTypeSelector] = useState(false);

  const currentFile = state.project.files.find(f => f.id === state.currentFileId);

  // Helper function to safely format dates
  const formatDate = (dateValue: Date | string): string => {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    return date instanceof Date && !isNaN(date.getTime()) ? date.toLocaleDateString() : 'Unknown';
  };

  const handleAddBlock = (type: BlockType) => {
    if (state.currentFileId) {
      actions.addBlock(state.currentFileId, type);
    }
  };

  if (!currentFile) {
    return (
      <div className="flex-1 bg-white p-8">
        <div className="text-center text-gray-500">
          <div className="text-6xl mb-4">📄</div>
          <h2 className="text-xl font-medium mb-2">No File Selected</h2>
          <p className="text-gray-400 mb-6">
            Select a file from the sidebar or create a new one to start editing
          </p>
          <button
            onClick={() => actions.createFile('Untitled Document')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Create New File
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white">
      {/* File Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">
              {currentFile.name}
            </h2>
            <p className="text-sm text-gray-500">
              {currentFile.blocks.length} blocks • Last updated {formatDate(currentFile.updatedAt)}
            </p>
          </div>
          <button
            className="text-gray-400 hover:text-gray-600"
            onClick={() => {
              const newName = window.prompt('Enter new file name:', currentFile.name);
              if (newName && newName.trim() !== currentFile.name) {
                actions.updateFile(currentFile.id, { name: newName.trim() });
              }
            }}
          >
            ✏️ Rename
          </button>
        </div>
      </div>

      {/* Blocks */}
      <div className="p-4 space-y-4">
        {currentFile.blocks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-lg font-medium mb-2">Empty Document</h3>
            <p className="text-gray-400 mb-6">
              Add your first block to start creating content
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { type: BlockType.Heading1, label: '# Heading', icon: '📋' },
                { type: BlockType.Paragraph, label: 'Paragraph', icon: '📄' },
                { type: BlockType.UnorderedList, label: 'List', icon: '📝' },
                { type: BlockType.Code, label: 'Code', icon: '💻' }
              ].map(block => (
                <button
                  key={block.type}
                  onClick={() => handleAddBlock(block.type)}
                  className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded text-sm transition-colors"
                >
                  {block.icon} {block.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {currentFile.blocks.map((block, index) => (
              <BlockEditor
                key={block.id}
                block={block}
                fileId={currentFile.id}
                isSelected={state.selectedBlockId === block.id}
                onSelect={() => actions.setSelectedBlock(block.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={() => setShowBlockTypeSelector(true)}
          className="bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-105"
        >
          <span className="text-2xl">+</span>
        </button>
      </div>

      {/* Block Type Selector Modal */}
      {showBlockTypeSelector && (
        <BlockTypeSelector
          onSelect={(type) => {
            if (state.currentFileId) {
              actions.addBlock(state.currentFileId, type);
            }
          }}
          onClose={() => setShowBlockTypeSelector(false)}
        />
      )}
    </div>
  );
};