import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { VariableEditor } from '../Variables/VariableEditor';
import { BlockSelector } from '../Editor/BlockSelector';

export const Sidebar: React.FC = () => {
  const { state, actions } = useApp();
  const [activeTab, setActiveTab] = useState<'files' | 'variables' | 'inspector'>('files');
  const [newFileName, setNewFileName] = useState('');
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [showBlockSelector, setShowBlockSelector] = useState(false);

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

  const handleEmbedBlock = (sourceFileId: string, sourceBlockId: string) => {
    if (state.currentFileId) {
      actions.embedBlock(state.currentFileId, sourceFileId, sourceBlockId);
    }
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
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowBlockSelector(true)}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                  disabled={!state.currentFileId}
                  title="Embed block from another file"
                >
                  🔗 Embed
                </button>
                <button
                  onClick={() => setIsCreatingFile(true)}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                >
                  + New File
                </button>
              </div>
            </div>

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
              {state.project.files.map(file => (
                <div
                  key={file.id}
                  onClick={() => handleFileSelect(file.id)}
                  className={`p-3 rounded cursor-pointer transition-colors ${
                    state.currentFileId === file.id
                      ? 'bg-blue-100 border border-blue-200'
                      : 'bg-white hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        📄 {file.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {file.blocks.length} blocks • {file.localVariables.length} variables
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
                        .map(block => (
                          <div
                            key={block.id}
                            className="text-xs text-gray-600 flex items-center justify-between group"
                          >
                            <div className="flex items-center">
                              <span className="mr-1">🔗</span>
                              {block.name}
                              <span className="ml-1 text-gray-400">({block.type})</span>
                            </div>
                            {file.id !== state.currentFileId && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEmbedBlock(file.id, block.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 text-white px-1 py-0.5 rounded text-xs hover:bg-blue-700"
                                title={`Embed "${block.name}" in current file`}
                              >
                                📎
                              </button>
                            )}
                          </div>
                        ))}
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
      
      {/* Block Selector Modal */}
      <BlockSelector
        isOpen={showBlockSelector}
        onClose={() => setShowBlockSelector(false)}
        onSelectBlock={handleEmbedBlock}
      />
    </div>
  );
};