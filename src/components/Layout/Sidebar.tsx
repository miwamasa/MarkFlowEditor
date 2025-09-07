import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { VariableEditor } from '../Variables/VariableEditor';

export const Sidebar: React.FC = () => {
  const { state, actions } = useApp();
  const [activeTab, setActiveTab] = useState<'files' | 'variables' | 'inspector'>('files');
  const [newFileName, setNewFileName] = useState('');
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [draggedFileIndex, setDraggedFileIndex] = useState<number | null>(null);
  const [selectedBlocks, setSelectedBlocks] = useState<{fileId: string, blockId: string, fileName: string, blockName: string}[]>([]);

  // Helper function to safely format dates
  const formatDate = (dateValue: Date | string): string => {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    return date instanceof Date && !isNaN(date.getTime()) ? date.toLocaleDateString() : 'Unknown';
  };

  const handleCreateFile = () => {
    if (newFileName.trim()) {
      actions.createFile(newFileName.trim());
      setNewFileName('');
      setIsCreatingFile(false);
    }
  };

  const handleFileSelect = (fileId: string) => {
    actions.setCurrentFile(fileId);
  };

  const handleDeleteFile = (fileId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (window.confirm('Are you sure you want to delete this file?')) {
      actions.deleteFile(fileId);
    }
  };

  const currentFile = state.project.files.find(f => f.id === state.currentFileId);
  const selectedBlock = currentFile?.blocks.find(b => b.id === state.selectedBlockId);

  const handleBlockToggle = (fileId: string, blockId: string, fileName: string, blockName: string) => {
    const blockKey = `${fileId}-${blockId}`;
    const isSelected = selectedBlocks.some(b => `${b.fileId}-${b.blockId}` === blockKey);
    
    if (isSelected) {
      setSelectedBlocks(prev => prev.filter(b => `${b.fileId}-${b.blockId}` !== blockKey));
    } else {
      setSelectedBlocks(prev => [...prev, { fileId, blockId, fileName, blockName }]);
    }
  };

  const handleEmbedSelected = () => {
    if (!state.currentFileId || selectedBlocks.length === 0) return;
    
    if (selectedBlocks.length > 1) {
      // Use batch embedding for multiple blocks
      const blocks = selectedBlocks.map(block => ({
        sourceFileId: block.fileId,
        sourceBlockId: block.blockId
      }));
      actions.embedMultipleBlocks(state.currentFileId, blocks);
    } else {
      // Single block embedding
      const block = selectedBlocks[0];
      actions.embedBlock(state.currentFileId, block.fileId, block.blockId);
    }
    
    // Clear selections after embedding
    setSelectedBlocks([]);
  };

  const handleClearSelection = () => {
    setSelectedBlocks([]);
  };

  const isBlockSelected = (fileId: string, blockId: string) => {
    return selectedBlocks.some(b => b.fileId === fileId && b.blockId === blockId);
  };

  const handleDragStart = (e: React.DragEvent, fileIndex: number) => {
    setDraggedFileIndex(fileIndex);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', fileIndex.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedFileIndex !== null && draggedFileIndex !== dropIndex) {
      actions.reorderFiles(draggedFileIndex, dropIndex);
    }
    setDraggedFileIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedFileIndex(null);
  };

  return (
    <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex">
          {[
            { key: 'files', label: '📁 Files', count: state.project.files.length },
            { key: 'variables', label: '🔤 Variables', count: state.project.globalVariables.length },
            { key: 'inspector', label: '🔍 Inspector', count: selectedBlock ? 1 : 0 }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className="ml-1 bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 overflow-auto">
        {/* Files Tab */}
        {activeTab === 'files' && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Project Files</h3>
              <button
                onClick={() => setIsCreatingFile(true)}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
              >
                + New File
              </button>
            </div>

            {/* Selected blocks control area */}
            {selectedBlocks.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-800">
                    {selectedBlocks.length} blocks selected for embedding
                  </span>
                </div>
                <div className="text-xs text-blue-600 mb-3">
                  {selectedBlocks.map(b => `${b.fileName}/${b.blockName}`).join(', ')}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleEmbedSelected}
                    disabled={!state.currentFileId}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    🔗 Embed Selected ({selectedBlocks.length})
                  </button>
                  <button
                    onClick={handleClearSelection}
                    className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
                  >
                    Clear
                  </button>
                </div>
                {!state.currentFileId && (
                  <div className="text-xs text-red-600 mt-1">
                    Please select a target file first
                  </div>
                )}
              </div>
            )}

            {isCreatingFile && (
              <div className="mb-4 p-3 bg-white rounded border">
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="Enter file name..."
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateFile()}
                  autoFocus
                />
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={handleCreateFile}
                    className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setIsCreatingFile(false);
                      setNewFileName('');
                    }}
                    className="bg-gray-400 text-white px-2 py-1 rounded text-xs hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {state.project.files.map((file, index) => (
                <div
                  key={file.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleFileSelect(file.id)}
                  className={`p-3 rounded cursor-pointer transition-colors select-none ${
                    draggedFileIndex === index
                      ? 'opacity-50'
                      : draggedFileIndex !== null
                      ? 'bg-gray-50 border-2 border-dashed border-blue-300'
                      : state.currentFileId === file.id
                      ? 'bg-blue-100 border border-blue-200'
                      : 'bg-white hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <div className="text-gray-400 mr-2 cursor-grab active:cursor-grabbing" title="Drag to reorder">
                        ⋮⋮
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          📄 {file.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {file.blocks.length} blocks • {file.localVariables.length} variables
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteFile(file.id, e)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      🗑️
                    </button>
                  </div>

                  {/* Named blocks */}
                  {file.blocks.filter(block => block.name).length > 0 && (
                    <div className="mt-2 ml-4 space-y-1">
                      {file.blocks
                        .filter(block => block.name)
                        .map(block => {
                          const isSelected = isBlockSelected(file.id, block.id);
                          const isCurrentFile = file.id === state.currentFileId;
                          
                          return (
                            <div
                              key={block.id}
                              className={`text-xs flex items-center justify-between group p-1 rounded transition-colors ${
                                isSelected ? 'bg-green-100' : 'hover:bg-gray-100'
                              }`}
                            >
                              <div className="flex items-center flex-1">
                                {!isCurrentFile && (
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleBlockToggle(file.id, block.id, file.name, block.name || `${block.type} block`)}
                                    className="mr-2 h-3 w-3 text-green-600 rounded border-gray-300"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                )}
                                <span className="mr-1">🔗</span>
                                <span className={`${isSelected ? 'text-green-700 font-medium' : 'text-gray-600'}`}>
                                  {block.name}
                                </span>
                                <span className="ml-1 text-gray-400">({block.type})</span>
                                {isSelected && (
                                  <span className="ml-2 text-xs bg-green-200 text-green-800 px-1 rounded">
                                    Selected
                                  </span>
                                )}
                              </div>
                              {isCurrentFile && (
                                <span className="text-xs text-gray-500">
                                  Current file
                                </span>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              ))}

              {state.project.files.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📄</div>
                  <div>No files yet</div>
                  <div className="text-sm">Create your first file to get started</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Variables Tab */}
        {activeTab === 'variables' && (
          <VariableEditor />
        )}

        {/* Inspector Tab */}
        {activeTab === 'inspector' && (
          <div className="p-4">
            <h3 className="font-medium text-gray-900 mb-4">Block Inspector</h3>
            
            {selectedBlock ? (
              <div className="space-y-4">
                <div className="bg-white p-3 rounded border">
                  <div className="text-sm font-medium text-gray-700 mb-2">Block Information</div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">ID:</span>
                      <code className="ml-2 bg-gray-100 px-1 rounded text-xs">
                        {selectedBlock.id}
                      </code>
                    </div>
                    <div>
                      <span className="text-gray-500">Type:</span>
                      <span className="ml-2 font-medium">{selectedBlock.type}</span>
                    </div>
                    {selectedBlock.name && (
                      <div>
                        <span className="text-gray-500">Name:</span>
                        <span className="ml-2 font-medium">{selectedBlock.name}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">Created:</span>
                      <span className="ml-2">{formatDate(selectedBlock.metadata.createdAt)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Updated:</span>
                      <span className="ml-2">{formatDate(selectedBlock.metadata.updatedAt)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Version:</span>
                      <span className="ml-2">{selectedBlock.metadata.version}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🔍</div>
                <div>No block selected</div>
                <div className="text-sm">Select a block to view its properties</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};