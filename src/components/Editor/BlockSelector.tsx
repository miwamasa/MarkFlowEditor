import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Block, BlockType } from '../../types';

interface BlockSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBlock: (fileId: string, blockId: string) => void;
}

export const BlockSelector: React.FC<BlockSelectorProps> = ({
  isOpen,
  onClose,
  onSelectBlock
}) => {
  const { state } = useApp();
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  if (!isOpen) return null;

  const getBlockTypeIcon = (type: BlockType) => {
    switch (type) {
      case BlockType.Heading1:
      case BlockType.Heading2:
      case BlockType.Heading3:
      case BlockType.Heading4:
      case BlockType.Heading5:
      case BlockType.Heading6:
        return '📝';
      case BlockType.Paragraph: return '📄';
      case BlockType.Code: return '💻';
      case BlockType.UnorderedList:
      case BlockType.OrderedList: return '📋';
      case BlockType.Table: return '📊';
      case BlockType.Quote: return '💬';
      case BlockType.JsonSchema: return '📋';
      case BlockType.Output: return '📤';
      case BlockType.Embed: return '🔗';
      default: return '📄';
    }
  };

  const getBlockPreview = (block: Block) => {
    if (typeof block.content === 'string') {
      return block.content.length > 50 
        ? `${block.content.substring(0, 50)}...`
        : block.content;
    }
    return `[${block.type} content]`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <h3 className="text-lg font-medium text-gray-900">
            🔗 Select Block to Embed
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 h-full">
            {/* File List */}
            <div className="border-r border-gray-200">
              <div className="p-4 bg-gray-50 border-b">
                <h4 className="font-medium text-gray-800">Files</h4>
              </div>
              <div className="divide-y divide-gray-200">
                {state.project.files.map(file => (
                  <button
                    key={file.id}
                    onClick={() => setSelectedFileId(file.id)}
                    className={`w-full text-left p-3 hover:bg-blue-50 transition-colors ${
                      selectedFileId === file.id ? 'bg-blue-100 border-r-2 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="mr-2">📄</span>
                      <div>
                        <div className="font-medium text-gray-900">{file.name}</div>
                        <div className="text-sm text-gray-500">
                          {file.blocks.length} blocks
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Block List */}
            <div>
              <div className="p-4 bg-gray-50 border-b">
                <h4 className="font-medium text-gray-800">
                  {selectedFileId ? 'Blocks' : 'Select a file first'}
                </h4>
              </div>
              {selectedFileId ? (
                <div className="divide-y divide-gray-200">
                  {state.project.files
                    .find(f => f.id === selectedFileId)
                    ?.blocks.map(block => (
                      <button
                        key={block.id}
                        onClick={() => {
                          onSelectBlock(selectedFileId, block.id);
                          onClose();
                        }}
                        className="w-full text-left p-3 hover:bg-green-50 transition-colors"
                      >
                        <div className="flex items-start">
                          <span className="mr-2 mt-0.5">
                            {getBlockTypeIcon(block.type)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center mb-1">
                              <span className="text-sm font-medium text-gray-900 mr-2">
                                {block.name || `${block.type} block`}
                              </span>
                              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                                {block.type}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 truncate">
                              {getBlockPreview(block)}
                            </div>
                          </div>
                        </div>
                      </button>
                    )) || []}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <div className="text-4xl mb-2">🔗</div>
                  <p>Select a file to see its blocks</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-t bg-gray-50 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};