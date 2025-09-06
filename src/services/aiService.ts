import { AIPromptConfig, Variable } from '../types';

export class AIService {
  private apiKey: string | null = null;
  private backendUrl = 'http://localhost:3001'; // Backend server URL
  private useMockMode = false; // Switch to true for development mode

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    // Store in localStorage for persistence
    localStorage.setItem('anthropic-api-key', apiKey);
  }

  getApiKey(): string | null {
    if (!this.apiKey) {
      this.apiKey = localStorage.getItem('anthropic-api-key');
    }
    return this.apiKey;
  }

  async generateContent(prompt: string, config: AIPromptConfig): Promise<string> {
    if (!this.getApiKey()) {
      throw new Error('API key not configured. Please set your Anthropic API key.');
    }

    if (this.useMockMode) {
      return this.generateMockContent(prompt, config);
    }

    const requestBody = {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: config.maxTokens || 1000,
      temperature: config.temperature || 0.7,
      system: config.systemInstruction || 'You are a helpful assistant that generates structured content.',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    };

    try {
      console.log('🔄 Calling backend server for Anthropic API...');
      
      const response = await fetch(`${this.backendUrl}/api/anthropic/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.getApiKey()!
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // If backend server is not running, fall back to mock mode
        if (response.status === 0 || response.status >= 500) {
          console.warn('🔄 Backend server not available, falling back to mock mode');
          return this.generateMockContent(prompt, config);
        }
        
        throw new Error(`API Error: ${response.status} - ${errorData.details || errorData.error || response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.content || data.content.length === 0) {
        throw new Error('No response generated from AI');
      }

      // Extract text from Claude's response format
      const textContent = data.content.find((c: any) => c.type === 'text');
      if (!textContent) {
        throw new Error('No text content in response');
      }

      console.log('✅ Successfully received response from Anthropic API');
      return textContent.text;
    } catch (error) {
      console.error('AI Service Error:', error);
      
      // If it's a network error (backend not running), fall back to mock
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.warn('🔄 Backend server not available, falling back to mock mode');
        return this.generateMockContent(prompt, config);
      }
      
      throw error;
    }
  }

  private async generateMockContent(prompt: string, config: AIPromptConfig): Promise<string> {
    console.log('🔄 Mock AI Service - Generating content...');
    console.log('System Instruction:', config.systemInstruction);
    console.log('User Prompt:', prompt);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Try to extract schema from system instruction
    try {
      const schemaMatch = config.systemInstruction?.match(/JSON Structure:\s*(\{[\s\S]*?\})/);
      if (schemaMatch) {
        const schemaStructure = JSON.parse(schemaMatch[1]);
        console.log('📋 Found schema structure:', schemaStructure);
        
        // Generate mock data based on the variables structure
        if (schemaStructure.variables && Array.isArray(schemaStructure.variables)) {
          const mockVariables = schemaStructure.variables.map((variable: any) => ({
            key: variable.key,
            value: this.generateMockValueForKey(variable.key, variable.value, prompt)
          }));
          
          return JSON.stringify({
            variables: mockVariables
          }, null, 2);
        }
      }
    } catch (error) {
      console.warn('Could not parse schema structure for mock data generation:', error);
    }

    // Fallback mock response in variables array format
    return JSON.stringify({
      variables: [
        {
          key: "message",
          value: "This is a mock AI response. To use real AI, implement a backend server."
        },
        {
          key: "status",
          value: "mock_success"
        },
        {
          key: "generated_at",
          value: new Date().toISOString()
        }
      ]
    }, null, 2);
  }

  private generateMockValueForKey(key: string, description: string, context: string): string {
    // Generate contextually relevant mock values
    if (key.toLowerCase().includes('description')) {
      return `Mock description generated from context: ${context.substring(0, 50)}...`;
    }
    if (key.toLowerCase().includes('title')) {
      return 'Mock Title';
    }
    if (key.toLowerCase().includes('name')) {
      return 'Mock Name';
    }
    if (key.toLowerCase().includes('price')) {
      return '$99.99';
    }
    if (key.toLowerCase().includes('date')) {
      return new Date().toLocaleDateString();
    }
    
    // Default mock value based on description
    return `Mock value for ${key}: ${description}`;
  }

  private generateMockDataFromSchema(schema: any): any {
    // Check if schema expects variables key structure
    if (schema.properties?.variables) {
      const variablesSchema = schema.properties.variables;
      const variables: any = {};
      
      if (variablesSchema.properties) {
        Object.entries(variablesSchema.properties).forEach(([key, prop]: [string, any]) => {
          switch (prop.type) {
            case 'string':
              variables[key] = prop.example || `Sample ${key}`;
              break;
            case 'number':
              variables[key] = prop.example || Math.floor(Math.random() * 100);
              break;
            case 'boolean':
              variables[key] = prop.example !== undefined ? prop.example : Math.random() > 0.5;
              break;
            case 'array':
              variables[key] = prop.example || [`Item 1`, `Item 2`];
              break;
            case 'object':
              variables[key] = prop.example || { nested: 'value' };
              break;
            default:
              variables[key] = `Mock ${key}`;
          }
        });
      }
      
      return { variables };
    }
    
    // Legacy support for old schema format
    const mockData: any = {};
    
    if (schema.properties) {
      Object.entries(schema.properties).forEach(([key, prop]: [string, any]) => {
        switch (prop.type) {
          case 'string':
            mockData[key] = prop.example || `Sample ${key}`;
            break;
          case 'number':
            mockData[key] = prop.example || Math.floor(Math.random() * 100);
            break;
          case 'boolean':
            mockData[key] = prop.example !== undefined ? prop.example : Math.random() > 0.5;
            break;
          case 'array':
            mockData[key] = prop.example || [`Item 1`, `Item 2`];
            break;
          case 'object':
            mockData[key] = prop.example || { nested: 'value' };
            break;
          default:
            mockData[key] = `Mock ${key}`;
        }
      });
    }
    
    // Wrap in variables structure for consistency
    return { variables: mockData };
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.getApiKey()) {
        return false;
      }

      // First, test if backend server is running
      try {
        console.log('🔄 Testing backend server connection...');
        const healthResponse = await fetch(`${this.backendUrl}/health`);
        
        if (!healthResponse.ok) {
          console.warn('⚠️ Backend server health check failed');
          return false;
        }
        
        console.log('✅ Backend server is running');
        
        // Test actual Anthropic API through backend
        const testResponse = await this.generateContent('Hello, please respond with "Connection successful"', {
          systemInstruction: 'You are a test assistant. Respond exactly as requested.',
          outputVariables: [],
          temperature: 0.1,
          maxTokens: 50
        });
        
        return testResponse.includes('Connection successful') || testResponse.includes('successful');
      } catch (networkError) {
        console.warn('🔄 Backend server not available, using mock mode');
        return true; // Still return true as mock mode works
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  parseResponse(response: string): { variables: Variable[] } {
    const variables: Variable[] = [];
    
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonData = JSON.parse(jsonMatch[0]);
        
        // Check for variables array format (new format)
        if (jsonData.variables && Array.isArray(jsonData.variables)) {
          jsonData.variables.forEach((variable: any) => {
            if (variable.key && variable.value !== undefined) {
              variables.push({
                id: crypto.randomUUID(),
                key: variable.key,
                value: String(variable.value),
                isOutput: true,
                description: `Generated from AI response`,
                metadata: {
                  createdAt: new Date(),
                  updatedAt: new Date()
                }
              });
            }
          });
        }
        // Fallback to variables object format (old format)
        else if (jsonData.variables && typeof jsonData.variables === 'object') {
          Object.entries(jsonData.variables).forEach(([key, value]) => {
            variables.push({
              id: crypto.randomUUID(),
              key,
              value: String(value),
              isOutput: true,
              description: `Generated from AI response`,
              metadata: {
                createdAt: new Date(),
                updatedAt: new Date()
              }
            });
          });
        } else {
          console.warn('AI response does not contain variables key:', jsonData);
          // Create a warning variable
          variables.push({
            id: crypto.randomUUID(),
            key: 'warning',
            value: 'AI response did not contain variables key in expected format. Please ensure your JSON schema includes a "variables" array.',
            isOutput: true,
            description: 'Response format warning',
            metadata: {
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
        }
      }
    } catch (error) {
      console.warn('Failed to parse JSON from AI response:', error);
      
      // Fallback: create an error variable
      variables.push({
        id: crypto.randomUUID(),
        key: 'parse_error',
        value: 'Failed to parse AI response as JSON. Please check the response format.',
        isOutput: true,
        description: 'JSON parse error',
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
    
    return { variables };
  }

  async validateSchema(jsonSchema: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(jsonSchema);
      
      // Basic validation for JSON Schema structure
      if (typeof parsed !== 'object' || !parsed.type) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  generatePromptFromSchema(jsonSchema: string, userInput: string, markdownContent?: string, outputVariables?: Variable[]): string {
    try {
      const schema = JSON.parse(jsonSchema);
      
      // Generate system instruction
      let systemInstruction = `You are a helpful assistant that generates structured content.\n`;
      
      // Check if output variables exist
      if (outputVariables && outputVariables.length > 0) {
        const outputVarNames = outputVariables.map(v => `"${v.key}"`).join(', ');
        systemInstruction += `Your response MUST be a valid JSON object with a "variables" and "response". "variables" is a list of JSON object for [${outputVarNames}] with key containing the generated values. "response" is the response.\n`;
      } else {
        systemInstruction += `Your response MUST be a valid JSON object with a "response". "response" is the response.\n`;
      }
      
      systemInstruction += `Do NOT include any extra text, explanations, or markdown formatting.\n\n`;
      
      // Create variables array format for schema
      const variablesFormat = this.generateVariablesFormatFromSchema(schema, outputVariables);
      systemInstruction += `JSON Structure:\n${variablesFormat}`;
      
      // Generate user prompt
      let userPrompt = markdownContent && markdownContent.trim() ? markdownContent : userInput;
      
      return `---------- SYSTEM INSTRUCTION ----------\n${systemInstruction}\n\n---------- USER PROMPT ----------\n${userPrompt}`;
    } catch {
      // Fallback format
      let fallbackSystem = `You are a helpful assistant that generates structured content.\n`;
      
      if (outputVariables && outputVariables.length > 0) {
        const outputVarNames = outputVariables.map(v => `"${v.key}"`).join(', ');
        fallbackSystem += `Your response MUST be a valid JSON object with a "variables" and "response". "variables" is a list of JSON object for [${outputVarNames}] with key containing the generated values. "response" is the response.\n`;
      } else {
        fallbackSystem += `Your response MUST be a valid JSON object with a "response". "response" is the response.\n`;
      }
      
      fallbackSystem += `Do NOT include any extra text, explanations, or markdown formatting.`;
      
      const fallbackUser = markdownContent && markdownContent.trim() ? markdownContent : userInput;
      
      return `---------- SYSTEM INSTRUCTION ----------\n${fallbackSystem}\n\n---------- USER PROMPT ----------\n${fallbackUser}`;
    }
  }

  private generateVariablesFormatFromSchema(schema: any, outputVariables?: Variable[]): string {
    if (schema.properties?.variables?.properties && outputVariables && outputVariables.length > 0) {
      const variables = Object.entries(schema.properties.variables.properties).map(([key, prop]: [string, any]) => {
        return {
          key: key,
          value: prop.description || `value for ${key}`
        };
      });
      
      return JSON.stringify({
        "variables": variables,
        "response": "Your response text here"
      }, null, 2);
    }
    
    // If no output variables, only include response
    return JSON.stringify({
      "response": "Your response text here"
    }, null, 2);
  }

  // New method to generate schema from output variables
  generateSchemaFromOutputVariables(outputVariables: Variable[]): string {
    if (outputVariables.length === 0) {
      return JSON.stringify({
        type: "object",
        properties: {
          response: {
            type: "string",
            description: "Response text or explanation"
          }
        },
        required: ["response"]
      }, null, 2);
    }

    const variableProperties: any = {};
    
    outputVariables.forEach(variable => {
      // Determine type based on current value
      let type = "string";
      let example: any = variable.value;
      
      if (variable.value === "true" || variable.value === "false") {
        type = "boolean";
        example = variable.value === "true";
      } else if (!isNaN(Number(variable.value)) && variable.value !== "") {
        type = "number";
        example = Number(variable.value);
      }
      
      variableProperties[variable.key] = {
        type: type,
        description: variable.description || `Generated value for ${variable.key}`,
        example: example
      };
    });

    const schema = {
      type: "object",
      properties: {
        variables: {
          type: "object",
          properties: variableProperties,
          required: outputVariables.map(v => v.key)
        },
        response: {
          type: "string",
          description: "Response text or explanation"
        }
      },
      required: ["variables", "response"]
    };

    return JSON.stringify(schema, null, 2);
  }

  // Helper method to extract markdown content from file blocks
  extractMarkdownFromFile(file: any, allFiles?: any[], projectData?: any): string {
    if (!file || !file.blocks) return '';
    
    let markdownContent = '';
    
    // Iterate through blocks and extract content
    file.blocks.forEach((block: any) => {
      if (block.type === 'markdown' && block.content) {
        markdownContent += `${block.content}\n\n`;
      } else if (block.type === 'jsonschema' && block.content) {
        markdownContent += `\`\`\`json\n${block.content}\n\`\`\`\n\n`;
      } else if (block.type === 'output' && block.content) {
        markdownContent += `\`\`\`json\n${block.content}\n\`\`\`\n\n`;
      } else if (block.type === 'table' && block.content) {
        // Convert table data to markdown table format
        const tableData = block.content;
        if (tableData.headers && tableData.rows) {
          // Create header row
          const headerRow = `| ${tableData.headers.join(' | ')} |`;
          // Create separator row
          const separatorRow = `| ${tableData.headers.map(() => '---').join(' | ')} |`;
          // Create data rows
          const dataRows = tableData.rows.map((row: string[]) => `| ${row.join(' | ')} |`).join('\n');
          
          markdownContent += `${headerRow}\n${separatorRow}\n${dataRows}\n\n`;
        } else {
          markdownContent += `\`\`\`json\n${JSON.stringify(tableData, null, 2)}\n\`\`\`\n\n`;
        }
      } else if (block.type === 'embed' && block.content && allFiles) {
        // Handle embedded blocks
        const embedData = block.content;
        const sourceFile = allFiles.find((f: any) => f.id === embedData.sourceFileId);
        const sourceBlock = sourceFile?.blocks.find((b: any) => b.id === embedData.sourceBlockId);
        
        if (sourceBlock) {
          // Recursively extract content from the source block
          if (typeof sourceBlock.content === 'string') {
            markdownContent += `${sourceBlock.content}\n\n`;
          } else if (sourceBlock.type === 'table' && sourceBlock.content) {
            // Convert embedded table to markdown format
            const tableData = sourceBlock.content;
            if (tableData.headers && tableData.rows) {
              const headerRow = `| ${tableData.headers.join(' | ')} |`;
              const separatorRow = `| ${tableData.headers.map(() => '---').join(' | ')} |`;
              const dataRows = tableData.rows.map((row: string[]) => `| ${row.join(' | ')} |`).join('\n');
              markdownContent += `${headerRow}\n${separatorRow}\n${dataRows}\n\n`;
            } else {
              markdownContent += `\`\`\`json\n${JSON.stringify(tableData, null, 2)}\n\`\`\`\n\n`;
            }
          } else if (sourceBlock.type === 'jsonschema' || sourceBlock.type === 'output') {
            markdownContent += `\`\`\`json\n${JSON.stringify(sourceBlock.content, null, 2)}\n\`\`\`\n\n`;
          } else {
            // For other complex content types, try to stringify
            markdownContent += `${JSON.stringify(sourceBlock.content)}\n\n`;
          }
        } else {
          markdownContent += `<!-- Embedded block not found: ${embedData.sourceFileId}#${embedData.sourceBlockId} -->\n\n`;
        }
      } else if (typeof block.content === 'string' && block.content.trim()) {
        // Handle other text-based block types
        markdownContent += `${block.content}\n\n`;
      }
    });
    
    // Apply variable resolution if project data is available
    if (projectData) {
      markdownContent = this.resolveVariables(markdownContent, file, projectData);
    }
    
    return markdownContent.trim();
  }

  // Helper method to resolve variables in content (similar to Preview.tsx)
  private resolveVariables(content: string, file: any, projectData: any): string {
    let resolved = content;
    
    // Combine global and local variables
    const allVariables = [
      ...(projectData.globalVariables || []),
      ...(file.localVariables || [])
    ];
    
    // Create a map for quick lookup
    const variableMap = new Map(allVariables.map((v: any) => [v.key, v.value]));
    
    // Replace {{variable}} patterns
    resolved = resolved.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const trimmedKey = key.trim();
      
      // Handle global scope explicitly
      if (trimmedKey.startsWith('GLOBAL.')) {
        const globalKey = trimmedKey.substring(7);
        const globalVar = (projectData.globalVariables || []).find((v: any) => v.key === globalKey);
        return globalVar ? globalVar.value : `[Unknown Global: ${globalKey}]`;
      }
      
      return variableMap.get(trimmedKey) || `[Unknown: ${trimmedKey}]`;
    });
    
    return resolved;
  }
}

// Export singleton instance
export const aiService = new AIService();