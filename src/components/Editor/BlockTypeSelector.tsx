import React from 'react';
import { BlockType } from '../../types';

interface BlockTypeSelectorProps {
  onSelect: (type: BlockType) => void;
  onClose: () => void;
}

export const BlockTypeSelector: React.FC<BlockTypeSelectorProps> = ({ 
  onSelect, 
  onClose 
}) => {
  const blockTypes = [
    {
      category: 'Text',
      blocks: [
        { type: BlockType.Heading1, label: 'Heading 1', icon: '📋', description: 'Large section heading' },
        { type: BlockType.Heading2, label: 'Heading 2', icon: '📋', description: 'Medium section heading' },
        { type: BlockType.Heading3, label: 'Heading 3', icon: '📋', description: 'Small section heading' },
        { type: BlockType.Paragraph, label: 'Paragraph', icon: '📄', description: 'Plain text paragraph' },
      ]
    },
    {
      category: 'Lists',
      blocks: [
        { type: BlockType.UnorderedList, label: 'Bullet List', icon: '•', description: 'List with bullet points' },
        { type: BlockType.OrderedList, label: 'Numbered List', icon: '1.', description: 'List with numbers' },
      ]
    },
    {
      category: 'Media & Code',
      blocks: [
        { type: BlockType.Code, label: 'Code Block', icon: '💻', description: 'Code with syntax highlighting' },
        { type: BlockType.Image, label: 'Image', icon: '🖼️', description: 'Embed an image' },
        { type: BlockType.Quote, label: 'Quote', icon: '💬', description: 'Block quote' },
      ]
    },
    {
      category: 'Advanced',
      blocks: [
        { type: BlockType.Table, label: 'Table', icon: '📊', description: 'Data table with rows and columns' },
        { type: BlockType.Link, label: 'Block Link', icon: '🔗', description: 'Link to other blocks' },
        { type: BlockType.JsonSchema, label: 'JSON Schema', icon: '⚙️', description: 'AI output schema definition' },
        { type: BlockType.Output, label: 'AI Output', icon: '⚡', description: 'AI-generated content placeholder' },
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full m-4 max-h-80vh overflow-auto">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Add Block</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-4">
          {blockTypes.map((category) => (
            <div key={category.category} className="mb-6 last:mb-0">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                {category.category}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {category.blocks.map((block) => (
                  <button
                    key={block.type}
                    onClick={() => {
                      onSelect(block.type);
                      onClose();
                    }}
                    className="text-left p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-lg">{block.icon}</span>
                      <div>
                        <div className="font-medium text-gray-900">{block.label}</div>
                        <div className="text-xs text-gray-500 mt-1">{block.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500">
            💡 Tip: You can change block types anytime by clicking the block type label
          </div>
        </div>
      </div>
    </div>
  );
};