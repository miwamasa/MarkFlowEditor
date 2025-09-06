import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { Block, EmbedData } from '../../types';

interface EmbedBlockProps {
  block: Block;
  fileId: string;
  isSelected: boolean;
  onSelect: () => void;
}

export const EmbedBlock: React.FC<EmbedBlockProps> = ({ 
  block, 
  fileId,
  isSelected, 
  onSelect 
}) => {
  const { state, actions } = useApp();
  const embedData = block.content as EmbedData;

  // Find the source file and block
  const sourceFile = state.project.files.find(f => f.id === embedData.sourceFileId);
  const sourceBlock = sourceFile?.blocks.find(b => b.id === embedData.sourceBlockId);

  const handleInline = () => {
    actions.inlineEmbeddedBlock(fileId, block.id);
  };

  const renderSourceContent = () => {
    if (!sourceBlock || !sourceFile) {
      return (
        <div className="text-red-500 italic p-2 border border-red-200 rounded bg-red-50">
          ⚠️ Referenced block not found (File: {embedData.sourceFileId}, Block: {embedData.sourceBlockId})
        </div>
      );
    }

    const getBlockTypeIcon = (type: string) => {
      switch (type) {
        case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6':
          return '📝';
        case 'p': return '📄';
        case 'code': return '💻';
        case 'ul': case 'ol': return '📋';
        case 'table': return '📊';
        case 'quote': return '💬';
        case 'jsonschema': return '📋';
        case 'output': return '📤';
        default: return '📄';
      }
    };

    return (
      <div className="border border-blue-200 bg-blue-50 rounded p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center text-sm text-blue-700">
            <span className="mr-2">{getBlockTypeIcon(sourceBlock.type)}</span>
            <span className="font-medium">
              {sourceFile.name} → {sourceBlock.name || `${sourceBlock.type} block`}
            </span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleInline}
              className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
              title="Convert to inline copy (remove link)"
            >
              📋 Inline
            </button>
          </div>
        </div>
        
        <div className="bg-white border border-blue-200 rounded p-2">
          {typeof sourceBlock.content === 'string' ? (
            <div className="text-gray-700 whitespace-pre-wrap">
              {sourceBlock.content}
            </div>
          ) : (
            <div className="text-gray-500 italic">
              [Complex content: {sourceBlock.type}]
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`relative group ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center mb-2">
        <span className="text-blue-600 font-medium text-sm">🔗 Embedded Block</span>
        {embedData.isLinked && (
          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
            Linked
          </span>
        )}
      </div>
      
      {renderSourceContent()}
      
      {/* Block controls */}
      {isSelected && (
        <div className="absolute top-0 right-0 bg-white border border-gray-300 rounded shadow-lg p-1 flex space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleInline();
            }}
            className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
            title="Convert to inline copy"
          >
            📋
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              actions.deleteBlock(fileId, block.id);
            }}
            className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
            title="Delete embed block"
          >
            🗑️
          </button>
        </div>
      )}
    </div>
  );
};