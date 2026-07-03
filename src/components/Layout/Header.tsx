import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useToast } from '../UI/Toast';
import { AISettings } from '../AI/AISettings';
import { PromptPreview } from '../AI/PromptPreview';
import { BlockType, FileData, Variable } from '../../types';
import { aiService, formatPrompt } from '../../services/aiService';

const DEFAULT_PROMPT_INPUT = 'Generate content based on this schema';

const collectOutputVariables = (globalVariables: Variable[], file: FileData): Variable[] => [
  ...globalVariables.filter(v => v.isOutput),
  ...file.localVariables.filter(v => v.isOutput)
];

/** Schema from the file's first JsonSchema block, else generated from output variables. */
const deriveSchemaContent = (file: FileData, outputVariables: Variable[]): string => {
  const schemaBlock = file.blocks.find(b => b.type === BlockType.JsonSchema);
  const schemaContent = typeof schemaBlock?.content === 'string' ? schemaBlock.content : '';

  if (!schemaContent.trim() && outputVariables.length > 0) {
    return aiService.generateSchemaFromOutputVariables(outputVariables);
  }
  return schemaContent;
};

export const Header: React.FC = () => {
  const { state, actions } = useApp();
  const { addToast } = useToast();
  const [showAISettings, setShowAISettings] = useState(false);
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [currentSchema, setCurrentSchema] = useState('');
  const [currentMarkdown, setCurrentMarkdown] = useState('');

  const getCurrentFile = (): FileData | null => {
    if (!state.currentFileId) {
      actions.setError('Please select a file first');
      return null;
    }
    const currentFile = state.project.files.find(f => f.id === state.currentFileId);
    if (!currentFile) {
      actions.setError('Current file not found');
      return null;
    }
    return currentFile;
  };

  const handleExport = () => {
    try {
      const exportData = JSON.stringify(state.project, null, 2);
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${state.project.name || 'markflow-project'}.json`;
      link.click();
      URL.revokeObjectURL(url);

      addToast({
        type: 'success',
        title: 'Export Successful',
        message: 'Project exported successfully!'
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Export Failed',
        message: `Failed to export project: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = e.target?.result as string;
        const project = JSON.parse(jsonData);
        // TODO: Implement project import logic
        console.log('Import project:', project);
      } catch (error) {
        actions.setError('Failed to import project file');
      }
    };
    reader.readAsText(file);
  };

  const applyResponseVariables = (currentFile: FileData, response: string) => {
    const { variables } = aiService.parseResponse(response);
    variables.forEach(variable => {
      const existingGlobalVar = state.project.globalVariables.find(v => v.key === variable.key);
      const existingLocalVar = currentFile.localVariables.find(v => v.key === variable.key);

      if (existingGlobalVar) {
        actions.updateVariable(null, existingGlobalVar.id, {
          value: variable.value,
          isOutput: true
        });
      } else if (existingLocalVar) {
        actions.updateVariable(currentFile.id, existingLocalVar.id, {
          value: variable.value,
          isOutput: true
        });
      } else {
        actions.addVariable(currentFile.id, variable.key, variable.value, true);
      }
    });
  };

  const handleExecutePrompt = async () => {
    if (state.isLoading) return; // Prevent multiple concurrent requests

    const currentFile = getCurrentFile();
    if (!currentFile) return;

    const outputVariables = collectOutputVariables(state.project.globalVariables, currentFile);

    try {
      actions.setError(null);
      actions.setLoading(true);

      const schemaContent = deriveSchemaContent(currentFile, outputVariables);
      if (!schemaContent.trim()) {
        actions.setError('Please add a JsonSchema block or define output variables to structure the AI response');
        return;
      }

      if (!aiService.getApiKey()) {
        actions.setError('Please configure your Anthropic API key in AI Settings');
        return;
      }

      // Extract current markdown content from file with variable resolution
      const markdownContent = aiService.extractMarkdownFromFile(currentFile, state.project.files, state.project);
      const { systemInstruction, userPrompt } = aiService.generatePromptFromSchema(
        schemaContent,
        DEFAULT_PROMPT_INPUT,
        markdownContent,
        outputVariables
      );

      const response = await aiService.generateContent(userPrompt, {
        systemInstruction,
        outputVariables: [],
        temperature: 0.7,
        maxTokens: 1000
      });

      // Write the response into the file's Output block, creating one if needed
      const outputBlock =
        currentFile.blocks.find(b => b.type === BlockType.Output) ||
        actions.addBlock(currentFile.id, BlockType.Output);
      actions.updateBlock(currentFile.id, outputBlock.id, { content: response });

      try {
        applyResponseVariables(currentFile, response);
      } catch (parseError) {
        console.warn('Could not parse AI response as variables:', parseError);
      }

      addToast({
        type: 'success',
        title: 'AI Execution Successful',
        message: 'AI prompt executed and output generated!'
      });
    } catch (error) {
      console.error('AI Execution Error:', error);
      actions.setError(`AI execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);

      addToast({
        type: 'error',
        title: 'AI Execution Failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      actions.setLoading(false);
    }
  };

  const handleViewPrompt = () => {
    const currentFile = getCurrentFile();
    if (!currentFile) return;

    try {
      const outputVariables = collectOutputVariables(state.project.globalVariables, currentFile);

      let schemaContent = deriveSchemaContent(currentFile, outputVariables);
      if (!schemaContent.trim()) {
        schemaContent = JSON.stringify({
          type: "object",
          properties: {
            variables: {
              type: "object",
              properties: {
                message: {
                  type: "string",
                  description: "Generated message"
                }
              }
            }
          }
        }, null, 2);
      }

      const markdownContent = aiService.extractMarkdownFromFile(currentFile, state.project.files, state.project);
      const promptParts = aiService.generatePromptFromSchema(
        schemaContent,
        DEFAULT_PROMPT_INPUT,
        markdownContent,
        outputVariables
      );

      setCurrentSchema(schemaContent);
      setCurrentPrompt(formatPrompt(promptParts));
      setCurrentMarkdown(markdownContent);
      setShowPromptPreview(true);
    } catch (error) {
      console.error('Error generating prompt preview:', error);
      actions.setError(`Failed to generate prompt preview: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">
            MarkFlow Editor
          </h1>
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-500">
              {state.project.name}
            </div>
            <div className="flex items-center space-x-1 text-xs">
              {state.saveStatus === 'saved' && (
                <span className="text-green-600 flex items-center">
                  ✓ Saved
                </span>
              )}
              {state.saveStatus === 'saving' && (
                <span className="text-blue-600 flex items-center">
                  ⏳ Saving...
                </span>
              )}
              {state.saveStatus === 'unsaved' && (
                <span className="text-amber-600 flex items-center">
                  ● Unsaved
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAISettings(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            🤖 AI Settings
          </button>

          <button
            onClick={handleExecutePrompt}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={state.isLoading}
          >
            {state.isLoading ? '⏳ Executing...' : '✨ Execute Prompt'}
          </button>

          <button
            onClick={handleViewPrompt}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            👁️ View Prompt
          </button>

          <button
            onClick={handleExport}
            className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
          >
            📤 Export
          </button>

          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              id="import-file"
            />
            <label
              htmlFor="import-file"
              className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors cursor-pointer inline-block"
            >
              📥 Import
            </label>
          </div>
        </div>
      </div>

      {state.error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex items-center">
            <div className="text-red-800 text-sm">
              {state.error}
            </div>
            <button
              onClick={actions.clearError}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <AISettings
        isOpen={showAISettings}
        onClose={() => setShowAISettings(false)}
      />

      <PromptPreview
        isOpen={showPromptPreview}
        onClose={() => setShowPromptPreview(false)}
        prompt={currentPrompt}
        schema={currentSchema}
        markdownContent={currentMarkdown}
      />
    </header>
  );
};
