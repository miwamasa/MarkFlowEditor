import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Variable } from '../../types';

interface VariableEditorProps {
  variable: Variable;
  fileId?: string;
  onUpdate: (updates: Partial<Variable>) => void;
  onDelete: () => void;
}

const VariableItem: React.FC<VariableEditorProps> = ({ variable, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editKey, setEditKey] = useState(variable.key);
  const [editValue, setEditValue] = useState(variable.value);

  const handleSave = () => {
    onUpdate({
      key: editKey.trim(),
      value: editValue.trim()
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditKey(variable.key);
    setEditValue(variable.value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-white p-3 rounded border space-y-2">
        <div>
          <label className="text-xs font-medium text-gray-500">Variable Key</label>
          <input
            type="text"
            value={editKey}
            onChange={(e) => setEditKey(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded px-2 py-1 mt-1"
            placeholder="variable_name"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">Value</label>
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded px-2 py-1 mt-1 resize-none"
            rows={2}
            placeholder="Variable value..."
          />
        </div>
        <div>
          <label className="flex items-center text-xs">
            <input
              type="checkbox"
              checked={variable.isOutput || false}
              onChange={(e) => onUpdate({ isOutput: e.target.checked })}
              className="mr-1"
            />
            AI Output Variable
          </label>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleSave}
            className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            className="bg-gray-400 text-white px-2 py-1 rounded text-xs hover:bg-gray-500"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-2 rounded border text-sm">
      <div className="flex items-center justify-between mb-1">
        <code className="bg-gray-100 px-1 rounded text-xs">
          {`{{${variable.key}}}`}
        </code>
        <div className="flex space-x-1">
          <button
            onClick={() => setIsEditing(true)}
            className="text-blue-500 hover:text-blue-700 text-xs"
          >
            ✏️
          </button>
          <button
            onClick={onDelete}
            className="text-red-500 hover:text-red-700 text-xs"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="text-gray-600 text-xs break-words">
        {variable.value || '(empty)'}
      </div>
      {variable.isOutput && (
        <div className="text-blue-600 text-xs mt-1">
          ⚡ AI Output Variable
        </div>
      )}
    </div>
  );
};

interface AddVariableFormProps {
  isGlobal: boolean;
  onCancel: () => void;
  onSubmit: (key: string, value: string, isOutput: boolean) => void;
}

const AddVariableForm: React.FC<AddVariableFormProps> = ({ isGlobal, onCancel, onSubmit }) => {
  const [localKey, setLocalKey] = useState('');
  const [localValue, setLocalValue] = useState('');
  const [localIsOutput, setLocalIsOutput] = useState(false);

  const handleSubmit = () => {
    if (!localKey.trim()) return;
    onSubmit(localKey.trim(), localValue.trim(), localIsOutput);
    
    // Reset form
    setLocalKey('');
    setLocalValue('');
    setLocalIsOutput(false);
  };

  return (
    <div className="bg-gray-50 p-3 rounded border space-y-2">
      <div>
        <label className="text-xs font-medium text-gray-700">Variable Key</label>
        <input
          type="text"
          value={localKey}
          onChange={(e) => setLocalKey(e.target.value)}
          className="w-full text-sm border border-gray-300 rounded px-2 py-1 mt-1"
          placeholder="variable_name"
          autoFocus
        />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-700">Value</label>
        <textarea
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          className="w-full text-sm border border-gray-300 rounded px-2 py-1 mt-1 resize-none"
          rows={2}
          placeholder="Variable value..."
        />
      </div>
      <div>
        <label className="flex items-center text-xs">
          <input
            type="checkbox"
            checked={localIsOutput}
            onChange={(e) => setLocalIsOutput(e.target.checked)}
            className="mr-1"
          />
          AI Output Variable
        </label>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
          disabled={!localKey.trim()}
        >
          Add Variable
        </button>
        <button
          onClick={onCancel}
          className="bg-gray-400 text-white px-2 py-1 rounded text-xs hover:bg-gray-500"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export const VariableEditor: React.FC = () => {
  const { state, actions } = useApp();
  const [showAddGlobal, setShowAddGlobal] = useState(false);
  const [showAddLocal, setShowAddLocal] = useState(false);

  const currentFile = state.project.files.find(f => f.id === state.currentFileId);

  const handleUpdateVariable = (fileId: string | null, variableId: string, updates: Partial<Variable>) => {
    actions.updateVariable(fileId, variableId, updates);
  };

  const handleDeleteVariable = (fileId: string | null, variableId: string) => {
    if (window.confirm('Delete this variable?')) {
      actions.deleteVariable(fileId, variableId);
    }
  };

  const handleAddGlobalVariable = (key: string, value: string, isOutput: boolean) => {
    actions.addVariable(null, key, value, isOutput);
    setShowAddGlobal(false);
  };

  const handleAddLocalVariable = (key: string, value: string, isOutput: boolean) => {
    actions.addVariable(state.currentFileId, key, value, isOutput);
    setShowAddLocal(false);
  };

  return (
    <div className="p-4 space-y-6">
      <h3 className="font-medium text-gray-900 mb-4">Variables</h3>
      
      {/* Global Variables */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-700">🌐 Global Variables</h4>
          <button
            onClick={() => setShowAddGlobal(true)}
            className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
          >
            + Add
          </button>
        </div>

        {showAddGlobal && (
          <div className="mb-2">
            <AddVariableForm
              isGlobal={true}
              onCancel={() => setShowAddGlobal(false)}
              onSubmit={handleAddGlobalVariable}
            />
          </div>
        )}

        <div className="space-y-2">
          {state.project.globalVariables.map(variable => (
            <VariableItem
              key={variable.id}
              variable={variable}
              onUpdate={(updates) => handleUpdateVariable(null, variable.id, updates)}
              onDelete={() => handleDeleteVariable(null, variable.id)}
            />
          ))}
          {state.project.globalVariables.length === 0 && !showAddGlobal && (
            <div className="text-center py-4 text-gray-500 text-sm">
              No global variables
            </div>
          )}
        </div>
      </div>

      {/* Local Variables */}
      {currentFile && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">📁 Local Variables ({currentFile.name})</h4>
            <button
              onClick={() => setShowAddLocal(true)}
              className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
            >
              + Add
            </button>
          </div>

          {showAddLocal && (
            <div className="mb-2">
              <AddVariableForm
                isGlobal={false}
                onCancel={() => setShowAddLocal(false)}
                onSubmit={handleAddLocalVariable}
              />
            </div>
          )}

          <div className="space-y-2">
            {currentFile.localVariables.map(variable => (
              <VariableItem
                key={variable.id}
                variable={variable}
                fileId={currentFile.id}
                onUpdate={(updates) => handleUpdateVariable(currentFile.id, variable.id, updates)}
                onDelete={() => handleDeleteVariable(currentFile.id, variable.id)}
              />
            ))}
            {currentFile.localVariables.length === 0 && !showAddLocal && (
              <div className="text-center py-4 text-gray-500 text-sm">
                No local variables
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};