import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useToast } from '../UI/Toast';
import { AISettings } from '../AI/AISettings';
import { PromptPreview } from '../AI/PromptPreview';
import { BlockType } from '../../types';

export const Header: React.FC = () => {
  const { state, actions } = useApp();
  const { addToast } = useToast();
  const [showAISettings, setShowAISettings] = useState(false);
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [currentSchema, setCurrentSchema] = useState('');
  const [currentMarkdown, setCurrentMarkdown] = useState('');

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

  const handleExecutePrompt = async () => {
    if (state.isLoading) return; // Prevent multiple concurrent requests
    
    if (!state.currentFileId) {
      actions.setError('Please select a file first');
      return;
    }

    const currentFile = state.project.files.find(f => f.id === state.currentFileId);
    if (!currentFile) {
      actions.setError('Current file not found');
      return;
    }

    // Find JsonSchema and Output blocks
    const jsonSchemaBlocks = currentFile.blocks.filter(b => b.type === 'jsonschema');
    const outputBlocks = currentFile.blocks.filter(b => b.type === 'output');

    // Get output variables (both global and local)
    const outputVariables = [
      ...state.project.globalVariables.filter(v => v.isOutput),
      ...currentFile.localVariables.filter(v => v.isOutput)
    ];

    try {
      actions.setError(null);
      actions.setLoading(true);
      
      // Import AI service dynamically to avoid circular dependencies
      const { aiService } = await import('../../services/aiService');
      
      let schemaContent = '';
      
      // Check if we have a JsonSchema block
      if (jsonSchemaBlocks.length > 0) {
        const schemaBlock = jsonSchemaBlocks[0];
        schemaContent = typeof schemaBlock.content === 'string' ? schemaBlock.content : '';
      }
      
      // If no schema block or empty schema, generate from output variables
      if (!schemaContent.trim() && outputVariables.length > 0) {
        console.log('📋 Generating schema from output variables:', outputVariables);
        schemaContent = aiService.generateSchemaFromOutputVariables(outputVariables);
      }
      
      // If still no schema, use default
      if (!schemaContent.trim()) {
        actions.setError('Please add a JsonSchema block or define output variables to structure the AI response');
        return;
      }
      
      // Validate API key
      if (!aiService.getApiKey()) {
        actions.setError('Please configure your Anthropic API key in AI Settings');
        return;
      }

      // Extract current markdown content from file with variable resolution
      const markdownContent = aiService.extractMarkdownFromFile(currentFile, state.project.files, state.project);
      
      // Generate prompt from schema with markdown context
      const promptData = aiService.generatePromptFromSchema(schemaContent, 'Generate content based on this schema', markdownContent, outputVariables);
      
      // Extract system instruction and user prompt
      const systemMatch = promptData.match(/---------- SYSTEM INSTRUCTION ----------\n([\s\S]*?)\n\n---------- USER PROMPT ----------/);
      const userMatch = promptData.match(/---------- USER PROMPT ----------\n([\s\S]*)$/);
      
      const systemInstruction = systemMatch ? systemMatch[1] : 'You are a helpful assistant that generates structured content.';
      const userPrompt = userMatch ? userMatch[1] : markdownContent || 'Generate content based on this schema';
      
      // Execute AI prompt
      const response = await aiService.generateContent(userPrompt, {
        systemInstruction,
        outputVariables: [],
        temperature: 0.7,
        maxTokens: 1000
      });

      // Find or create an Output block
      let outputBlock = outputBlocks[0];
      if (!outputBlock) {
        // Create a new Output block
        actions.addBlock(state.currentFileId, BlockType.Output);
        // Get updated blocks after adding
        const updatedFile = state.project.files.find(f => f.id === state.currentFileId);
        const newOutputBlocks = updatedFile?.blocks.filter(b => b.type === BlockType.Output) || [];
        outputBlock = newOutputBlocks[0];
      }

      if (outputBlock) {
        // Update the Output block with AI response
        actions.updateBlock(state.currentFileId, outputBlock.id, { content: response });

        // Parse and create/update variables from response
        try {
          const { variables } = aiService.parseResponse(response);
          variables.forEach(variable => {
            // Check if variable already exists (both global and local)
            const existingGlobalVar = state.project.globalVariables.find(v => v.key === variable.key);
            const existingLocalVar = currentFile.localVariables.find(v => v.key === variable.key);
            
            if (existingGlobalVar) {
              // Update existing global variable
              actions.updateVariable(null, existingGlobalVar.id, { 
                value: variable.value,
                isOutput: true,
                metadata: { ...existingGlobalVar.metadata, updatedAt: new Date() }
              });
              console.log(`🔄 Updated existing global variable: ${variable.key}`);
            } else if (existingLocalVar) {
              // Update existing local variable
              actions.updateVariable(state.currentFileId, existingLocalVar.id, { 
                value: variable.value,
                isOutput: true,
                metadata: { ...existingLocalVar.metadata, updatedAt: new Date() }
              });
              console.log(`🔄 Updated existing local variable: ${variable.key}`);
            } else {
              // Create new variable
              actions.addVariable(state.currentFileId, variable.key, variable.value, true);
              console.log(`➕ Created new variable: ${variable.key}`);
            }
          });
        } catch (parseError) {
          console.warn('Could not parse AI response as variables:', parseError);
        }
      }

      console.log('✅ AI prompt executed successfully');
      
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

  const handleViewPrompt = async () => {
    if (!state.currentFileId) {
      actions.setError('Please select a file first');
      return;
    }

    const currentFile = state.project.files.find(f => f.id === state.currentFileId);
    if (!currentFile) {
      actions.setError('Current file not found');
      return;
    }

    try {
      // Import AI service
      const { aiService } = await import('../../services/aiService');
      
      // Get output variables (both global and local)
      const outputVariables = [
        ...state.project.globalVariables.filter(v => v.isOutput),
        ...currentFile.localVariables.filter(v => v.isOutput)
      ];
      
      let schemaContent = '';
      
      // Check if we have a JsonSchema block
      const jsonSchemaBlocks = currentFile.blocks.filter(b => b.type === 'jsonschema');
      if (jsonSchemaBlocks.length > 0) {
        const schemaBlock = jsonSchemaBlocks[0];
        schemaContent = typeof schemaBlock.content === 'string' ? schemaBlock.content : '';
      }
      
      // If no schema block or empty schema, generate from output variables
      if (!schemaContent.trim() && outputVariables.length > 0) {
        schemaContent = aiService.generateSchemaFromOutputVariables(outputVariables);
      }
      
      // If still no schema, use default
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
      
      // Extract current markdown content from file with variable resolution
      const markdownContent = aiService.extractMarkdownFromFile(currentFile, state.project.files, state.project);
      
      // Generate prompt from schema with markdown context
      const prompt = aiService.generatePromptFromSchema(schemaContent, 'Generate content based on this schema', markdownContent, outputVariables);
      
      setCurrentSchema(schemaContent);
      setCurrentPrompt(prompt);
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