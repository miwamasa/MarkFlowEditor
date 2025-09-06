import React, { useState } from 'react';
import { Block, BlockType, TableData } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { EmbedBlock } from './EmbedBlock';

interface BlockEditorProps {
  block: Block;
  fileId: string;
  isSelected: boolean;
  onSelect: () => void;
}

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

  const handleTableContentChange = (tableData: TableData) => {
    actions.updateBlock(fileId, block.id, { content: tableData });
  };

  const createDefaultTableData = (): TableData => ({
    headers: ['Column 1', 'Column 2'],
    rows: [
      ['Cell 1', 'Cell 2'],
      ['Cell 3', 'Cell 4']
    ],
    alignments: ['left', 'left']
  });

  const renderBlockContent = () => {
    const baseClass = `w-full border-none outline-none bg-transparent ${
      isSelected ? 'ring-2 ring-blue-500' : ''
    }`;
    const handleClick = (e: React.MouseEvent) => e.stopPropagation();

    switch (block.type) {
      case BlockType.Heading1:
        return (
          <input
            type="text"
            value={typeof block.content === 'string' ? block.content : ''}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Enter heading..."
            className={`${baseClass} text-2xl font-bold`}
            onClick={handleClick}
          />
        );

      case BlockType.Heading2:
        return (
          <input
            type="text"
            value={typeof block.content === 'string' ? block.content : ''}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Enter heading..."
            className={`${baseClass} text-xl font-bold`}
            onClick={handleClick}
          />
        );

      case BlockType.Heading3:
        return (
          <input
            type="text"
            value={typeof block.content === 'string' ? block.content : ''}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Enter heading..."
            className={`${baseClass} text-lg font-bold`}
            onClick={handleClick}
          />
        );

      case BlockType.Paragraph:
        return (
          <textarea
            value={typeof block.content === 'string' ? block.content : ''}
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
            value={typeof block.content === 'string' ? block.content : ''}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder={`Enter list items (one per line)...`}
            className={`${baseClass} resize-none min-h-24`}
            rows={4}
            onClick={handleClick}
          />
        );

      case BlockType.Code:
        return (
          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
            <textarea
              value={typeof block.content === 'string' ? block.content : ''}
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
            value={typeof block.content === 'string' ? block.content : ''}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Enter quote text..."
            className={`${baseClass} resize-none min-h-24 italic border-l-4 border-gray-300 pl-4`}
            rows={4}
            onClick={handleClick}
          />
        );

      case BlockType.Table:
        const tableData = typeof block.content === 'object' && 'headers' in block.content 
          ? block.content as TableData 
          : createDefaultTableData();
          
        return (
          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
            <div className="border border-gray-300 rounded overflow-hidden">
              <table className="w-full">
                {/* Headers */}
                <thead className="bg-gray-50">
                  <tr>
                    {tableData.headers.map((header, colIndex) => (
                      <th key={colIndex} className="border-b border-gray-300 p-2">
                        <input
                          type="text"
                          value={header}
                          onChange={(e) => {
                            const newHeaders = [...tableData.headers];
                            newHeaders[colIndex] = e.target.value;
                            handleTableContentChange({
                              ...tableData,
                              headers: newHeaders
                            });
                          }}
                          className="w-full bg-transparent outline-none font-medium"
                          placeholder={`Header ${colIndex + 1}`}
                        />
                      </th>
                    ))}
                    <th className="border-b border-gray-300 p-2 w-16">
                      <div className="flex space-x-1">
                        <button
                          onClick={() => {
                            const newHeaders = [...tableData.headers, `Column ${tableData.headers.length + 1}`];
                            const newRows = tableData.rows.map(row => [...row, '']);
                            const newAlignments: ('left' | 'center' | 'right')[] = [...(tableData.alignments || []), 'left'];
                            handleTableContentChange({
                              headers: newHeaders,
                              rows: newRows,
                              alignments: newAlignments
                            });
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                          title="Add Column"
                        >
                          +
                        </button>
                        {tableData.headers.length > 1 && (
                          <button
                            onClick={() => {
                              if (tableData.headers.length <= 1) return;
                              const newHeaders = tableData.headers.slice(0, -1);
                              const newRows = tableData.rows.map(row => row.slice(0, -1));
                              const newAlignments: ('left' | 'center' | 'right')[] = (tableData.alignments || []).slice(0, -1);
                              handleTableContentChange({
                                headers: newHeaders,
                                rows: newRows,
                                alignments: newAlignments
                              });
                            }}
                            className="text-red-600 hover:text-red-800 text-sm"
                            title="Remove Last Column"
                          >
                            -
                          </button>
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                {/* Rows */}
                <tbody>
                  {tableData.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, colIndex) => (
                        <td key={colIndex} className="border-b border-gray-200 p-2">
                          <input
                            type="text"
                            value={cell}
                            onChange={(e) => {
                              const newRows = [...tableData.rows];
                              newRows[rowIndex][colIndex] = e.target.value;
                              handleTableContentChange({
                                ...tableData,
                                rows: newRows
                              });
                            }}
                            className="w-full bg-transparent outline-none"
                            placeholder={`Row ${rowIndex + 1}, Col ${colIndex + 1}`}
                          />
                        </td>
                      ))}
                      <td className="border-b border-gray-200 p-2 w-16">
                        {tableData.rows.length > 1 && (
                          <button
                            onClick={() => {
                              const newRows = tableData.rows.filter((_, i) => i !== rowIndex);
                              handleTableContentChange({
                                ...tableData,
                                rows: newRows
                              });
                            }}
                            className="text-red-600 hover:text-red-800 text-sm"
                            title="Delete Row"
                          >
                            ×
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {/* Add Row Button */}
                  <tr>
                    <td colSpan={tableData.headers.length + 1} className="p-2">
                      <button
                        onClick={() => {
                          const newRow = Array(tableData.headers.length).fill('');
                          handleTableContentChange({
                            ...tableData,
                            rows: [...tableData.rows, newRow]
                          });
                        }}
                        className="w-full text-blue-600 hover:text-blue-800 text-sm py-1 border-2 border-dashed border-blue-300 rounded hover:border-blue-500"
                      >
                        + Add Row
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );

      case BlockType.Image:
        return (
          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={typeof block.content === 'string' ? block.content : ''}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Enter image URL..."
              className={`${baseClass} p-2 border border-gray-300 rounded`}
            />
            {typeof block.content === 'string' && block.content && (
              <div className="mt-2 p-2 border border-gray-200 rounded bg-gray-50">
                <img
                  src={block.content}
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

      case BlockType.Link:
        return (
          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={typeof block.content === 'string' ? block.content.split('|')[0] || '' : ''}
                onChange={(e) => {
                  const parts = typeof block.content === 'string' ? block.content.split('|') : ['', ''];
                  handleContentChange(`${e.target.value}|${parts[1] || ''}`);
                }}
                placeholder="Link text..."
                className={`${baseClass} p-2 border border-gray-300 rounded`}
              />
              <input
                type="url"
                value={typeof block.content === 'string' ? block.content.split('|')[1] || '' : ''}
                onChange={(e) => {
                  const parts = typeof block.content === 'string' ? block.content.split('|') : ['', ''];
                  handleContentChange(`${parts[0] || ''}|${e.target.value}`);
                }}
                placeholder="URL..."
                className={`${baseClass} p-2 border border-gray-300 rounded`}
              />
            </div>
            {typeof block.content === 'string' && block.content.includes('|') && (
              <div className="mt-2 p-2 border border-gray-200 rounded bg-gray-50">
                <a
                  href={block.content.split('|')[1]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  {block.content.split('|')[0] || 'Link'}
                </a>
              </div>
            )}
          </div>
        );

      case BlockType.JsonSchema:
        return (
          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-medium text-gray-700 mb-2">JSON Schema Definition</div>
            <textarea
              value={typeof block.content === 'string' ? block.content : ''}
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
                  const sampleSchema = JSON.stringify({
                    type: "object",
                    properties: {
                      title: { type: "string", description: "Document title" },
                      content: { type: "string", description: "Main content" },
                      tags: { type: "array", items: { type: "string" } }
                    },
                    required: ["title", "content"]
                  }, null, 2);
                  handleContentChange(sampleSchema);
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
              {typeof block.content === 'string' && block.content ? (
                <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800">
                  {block.content}
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

  const blockTypeOptions = [
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
                    {blockTypeOptions.map((option) => (
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