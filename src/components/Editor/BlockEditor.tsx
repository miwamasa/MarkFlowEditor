import React, { useState } from 'react';
import { Block, BlockType, TableData } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { createDefaultTableData } from '../../utils/factories';
import { EmbedBlock } from './EmbedBlock';
import { TableEditor } from './TableEditor';

interface BlockEditorProps {
  block: Block;
  fileId: string;
  isSelected: boolean;
  onSelect: () => void;
}

const HEADING_INPUT_STYLES: Partial<Record<BlockType, string>> = {
  [BlockType.Heading1]: 'text-2xl font-bold',
  [BlockType.Heading2]: 'text-xl font-bold',
  [BlockType.Heading3]: 'text-lg font-bold'
};

const BLOCK_TYPE_OPTIONS = [
  { type: BlockType.Heading1, label: '# Heading 1', icon: '📋' },
  { type: BlockType.Heading2, label: '## Heading 2', icon: '📋' },
  { type: BlockType.Heading3, label: '### Heading 3', icon: '📋' },
  { type: BlockType.Paragraph, label: 'Paragraph', icon: '📄' },
  { type: BlockType.UnorderedList, label: 'Bullet List', icon: '• ' },
  { type: BlockType.OrderedList, label: 'Numbered List', icon: '1.' },
  { type: BlockType.Code, label: 'Code Block', icon: '💻' },
  { type: BlockType.Table, label: 'Table', icon: '📊' },
  { type: BlockType.Quote, label: 'Quote', icon: '💬' },
  { type: BlockType.Image, label: 'Image', icon: '🖼️' },
  { type: BlockType.Link, label: 'Link', icon: '🔗' },
];

const SAMPLE_JSON_SCHEMA = JSON.stringify({
  type: "object",
  properties: {
    title: { type: "string", description: "Document title" },
    content: { type: "string", description: "Main content" },
    tags: { type: "array", items: { type: "string" } }
  },
  required: ["title", "content"]
}, null, 2);

export const BlockEditor: React.FC<BlockEditorProps> = ({
  block,
  fileId,
  isSelected,
  onSelect
}) => {
  const { state, actions } = useApp();
  const [showTypeSelector, setShowTypeSelector] = useState(false);

  const currentFile = state.project.files.find(f => f.id === fileId);
  const currentBlockIndex = currentFile ? currentFile.blocks.findIndex(b => b.id === block.id) : -1;
  const totalBlocks = currentFile ? currentFile.blocks.length : 0;

  const textContent = typeof block.content === 'string' ? block.content : '';

  const handleContentChange = (content: string) => {
    actions.updateBlock(fileId, block.id, { content });
  };

  const handleNameChange = (name: string) => {
    actions.updateBlock(fileId, block.id, { name: name.trim() || undefined });
  };

  const handleTypeChange = (newType: BlockType) => {
    actions.updateBlock(fileId, block.id, { type: newType });
    setShowTypeSelector(false);
  };

  const handleDelete = () => {
    if (window.confirm('Delete this block?')) {
      actions.deleteBlock(fileId, block.id);
    }
  };

  const handleMoveUp = () => {
    if (currentBlockIndex > 0) {
      actions.moveBlock(fileId, block.id, currentBlockIndex - 1);
    }
  };

  const handleMoveDown = () => {
    if (currentBlockIndex < totalBlocks - 1) {
      actions.moveBlock(fileId, block.id, currentBlockIndex + 1);
    }
  };

  const renderBlockContent = () => {
    const baseClass = `w-full border-none outline-none bg-transparent ${
      isSelected ? 'ring-2 ring-blue-500' : ''
    }`;
    const handleClick = (e: React.MouseEvent) => e.stopPropagation();
    const headingStyle = HEADING_INPUT_STYLES[block.type];

    if (headingStyle) {
      return (
        <input
          type="text"
          value={textContent}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Enter heading..."
          className={`${baseClass} ${headingStyle}`}
          onClick={handleClick}
        />
      );
    }

    switch (block.type) {
      case BlockType.Paragraph:
        return (
          <textarea
            value={textContent}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Enter paragraph text..."
            className={`${baseClass} resize-none min-h-20`}
            rows={3}
            onClick={handleClick}
          />
        );

      case BlockType.UnorderedList:
      case BlockType.OrderedList:
        return (
          <textarea
            value={textContent}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Enter list items (one per line)..."
            className={`${baseClass} resize-none min-h-24`}
            rows={4}
            onClick={handleClick}
          />
        );

      case BlockType.Code:
        return (
          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
            <textarea
              value={textContent}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Enter code..."
              className={`${baseClass} font-mono text-sm bg-gray-50 p-3 rounded border min-h-32`}
              rows={6}
            />
          </div>
        );

      case BlockType.Quote:
        return (
          <textarea
            value={textContent}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Enter quote text..."
            className={`${baseClass} resize-none min-h-24 italic border-l-4 border-gray-300 pl-4`}
            rows={4}
            onClick={handleClick}
          />
        );

      case BlockType.Table: {
        const tableData = typeof block.content === 'object' && 'headers' in block.content
          ? block.content as TableData
          : createDefaultTableData();
        return (
          <TableEditor
            tableData={tableData}
            onChange={(newTableData) => actions.updateBlock(fileId, block.id, { content: newTableData })}
          />
        );
      }

      case BlockType.Image:
        return (
          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={textContent}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Enter image URL..."
              className={`${baseClass} p-2 border border-gray-300 rounded`}
            />
            {textContent && (
              <div className="mt-2 p-2 border border-gray-200 rounded bg-gray-50">
                <img
                  src={textContent}
                  alt="Preview"
                  className="max-w-full h-auto max-h-48 rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        );

      case BlockType.Link: {
        const [linkText = '', linkUrl = ''] = textContent.split('|');
        return (
          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={linkText}
                onChange={(e) => handleContentChange(`${e.target.value}|${linkUrl}`)}
                placeholder="Link text..."
                className={`${baseClass} p-2 border border-gray-300 rounded`}
              />
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => handleContentChange(`${linkText}|${e.target.value}`)}
                placeholder="URL..."
                className={`${baseClass} p-2 border border-gray-300 rounded`}
              />
            </div>
            {textContent.includes('|') && (
              <div className="mt-2 p-2 border border-gray-200 rounded bg-gray-50">
                <a
                  href={linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  {linkText || 'Link'}
                </a>
              </div>
            )}
          </div>
        );
      }

      case BlockType.JsonSchema:
        return (
          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-medium text-gray-700 mb-2">JSON Schema Definition</div>
            <textarea
              value={textContent}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Enter JSON Schema definition..."
              className={`${baseClass} font-mono text-sm bg-gray-50 p-3 rounded border min-h-32`}
              rows={8}
            />
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Define the structure for AI input/output</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleContentChange(SAMPLE_JSON_SCHEMA);
                }}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Insert sample
              </button>
            </div>
          </div>
        );

      case BlockType.Output:
        return (
          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
              <span>AI Output Block</span>
              <span className="text-xs text-gray-500">Read-only</span>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded p-3 min-h-24">
              {textContent ? (
                <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800">
                  {textContent}
                </pre>
              ) : (
                <div className="text-gray-500 italic">
                  AI output will appear here after generation...
                </div>
              )}
            </div>
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Generated content from AI API calls</span>
              <div className="flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (block.content && navigator.clipboard) {
                      navigator.clipboard.writeText(block.content as string);
                    }
                  }}
                  className="text-blue-600 hover:text-blue-800 underline"
                  disabled={!block.content}
                >
                  Copy output
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Clear the AI output content?')) {
                      handleContentChange('');
                    }
                  }}
                  className="text-red-600 hover:text-red-800 underline"
                  disabled={!block.content}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        );

      case BlockType.Embed:
        return (
          <EmbedBlock
            block={block}
            fileId={fileId}
            isSelected={isSelected}
            onSelect={onSelect}
          />
        );

      default:
        return (
          <div className="text-gray-500 italic p-4 border-2 border-dashed border-gray-300 rounded">
            {block.type} block (implementation pending)
          </div>
        );
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`border rounded-lg p-4 transition-all cursor-pointer group ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      {/* Block Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowTypeSelector(!showTypeSelector);
              }}
              className="bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-xs font-medium uppercase transition-colors"
            >
              {block.type}
            </button>

            {/* Type Selector Dropdown */}
            {showTypeSelector && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48">
                <div className="p-2">
                  <div className="text-xs font-medium text-gray-500 mb-2">Change block type:</div>
                  <div className="space-y-1">
                    {BLOCK_TYPE_OPTIONS.map((option) => (
                      <button
                        key={option.type}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTypeChange(option.type);
                        }}
                        className={`w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                          block.type === option.type
                            ? 'bg-blue-100 text-blue-800'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        {option.icon} {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Block Name Input */}
          <input
            type="text"
            value={block.name || ''}
            onChange={(e) => {
              e.stopPropagation();
              handleNameChange(e.target.value);
            }}
            placeholder="Block name (optional)"
            className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Block Controls */}
        <div className={`flex items-center space-x-1 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
          <button
            className={`p-1 rounded hover:bg-white transition-colors ${
              currentBlockIndex === 0
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-400 hover:text-gray-600'
            }`}
            title="Move Up"
            onClick={(e) => {
              e.stopPropagation();
              handleMoveUp();
            }}
            disabled={currentBlockIndex === 0}
          >
            ↑
          </button>
          <button
            className={`p-1 rounded hover:bg-white transition-colors ${
              currentBlockIndex === totalBlocks - 1
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-400 hover:text-gray-600'
            }`}
            title="Move Down"
            onClick={(e) => {
              e.stopPropagation();
              handleMoveDown();
            }}
            disabled={currentBlockIndex === totalBlocks - 1}
          >
            ↓
          </button>
          <button
            className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-white"
            title="Delete Block"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Block Content */}
      <div className="space-y-2">
        {renderBlockContent()}
      </div>

      {/* Block Name Display */}
      {block.name && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <span className="inline-flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
            🔗 Named Block: {block.name}
          </span>
        </div>
      )}
    </div>
  );
};
