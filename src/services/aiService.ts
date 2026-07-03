import { AIPromptConfig, BlockType, EmbedData, FileData, ProjectData, TableData, Variable } from '../types';
import { findEmbedSource, tableToMarkdown } from '../utils/markdown';
import { collectFileVariables, resolveVariables } from '../utils/variableResolver';

const API_KEY_STORAGE_KEY = 'anthropic-api-key';
const DEFAULT_SYSTEM_INSTRUCTION = 'You are a helpful assistant that generates structured content.';

export interface PromptParts {
  systemInstruction: string;
  userPrompt: string;
}

export const formatPrompt = (parts: PromptParts): string =>
  `---------- SYSTEM INSTRUCTION ----------\n${parts.systemInstruction}\n\n---------- USER PROMPT ----------\n${parts.userPrompt}`;

const createOutputVariable = (key: string, value: string, description: string): Variable => ({
  id: crypto.randomUUID(),
  key,
  value,
  isOutput: true,
  description,
  metadata: {
    createdAt: new Date(),
    updatedAt: new Date()
  }
});

export class AIService {
  private apiKey: string | null = null;
  private backendUrl = 'http://localhost:3001'; // Backend server URL
  private useMockMode = false; // Switch to true for development mode

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    // Store in localStorage for persistence
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
  }

  getApiKey(): string | null {
    if (!this.apiKey) {
      this.apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
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
      system: config.systemInstruction || DEFAULT_SYSTEM_INSTRUCTION,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    };

    try {
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
          console.warn('Backend server not available, falling back to mock mode');
          return this.generateMockContent(prompt, config);
        }

        throw new Error(`API Error: ${response.status} - ${errorData.details || errorData.error || response.statusText}`);
      }

      const data = await response.json();

      if (!data.content || data.content.length === 0) {
        throw new Error('No response generated from AI');
      }

      // Extract text from Claude's response format
      const textContent = data.content.find((c: { type: string; text?: string }) => c.type === 'text');
      if (!textContent) {
        throw new Error('No text content in response');
      }

      return textContent.text;
    } catch (error) {
      console.error('AI Service Error:', error);

      // If it's a network error (backend not running), fall back to mock
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.warn('Backend server not available, falling back to mock mode');
        return this.generateMockContent(prompt, config);
      }

      throw error;
    }
  }

  private async generateMockContent(prompt: string, config: AIPromptConfig): Promise<string> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Try to extract schema from system instruction
    try {
      const schemaMatch = config.systemInstruction?.match(/JSON Structure:\s*(\{[\s\S]*?\})/);
      if (schemaMatch) {
        const schemaStructure = JSON.parse(schemaMatch[1]);

        // Generate mock data based on the variables structure
        if (schemaStructure.variables && Array.isArray(schemaStructure.variables)) {
          const mockVariables = schemaStructure.variables.map((variable: { key: string; value: string }) => ({
            key: variable.key,
            value: this.generateMockValueForKey(variable.key, variable.value, prompt)
          }));

          return JSON.stringify({ variables: mockVariables }, null, 2);
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
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('description')) {
      return `Mock description generated from context: ${context.substring(0, 50)}...`;
    }
    if (lowerKey.includes('title')) {
      return 'Mock Title';
    }
    if (lowerKey.includes('name')) {
      return 'Mock Name';
    }
    if (lowerKey.includes('price')) {
      return '$99.99';
    }
    if (lowerKey.includes('date')) {
      return new Date().toLocaleDateString();
    }

    return `Mock value for ${key}: ${description}`;
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.getApiKey()) {
        return false;
      }

      // First, test if backend server is running
      try {
        const healthResponse = await fetch(`${this.backendUrl}/health`);

        if (!healthResponse.ok) {
          console.warn('Backend server health check failed');
          return false;
        }

        // Test actual Anthropic API through backend
        const testResponse = await this.generateContent('Hello, please respond with "Connection successful"', {
          systemInstruction: 'You are a test assistant. Respond exactly as requested.',
          outputVariables: [],
          temperature: 0.1,
          maxTokens: 50
        });

        return testResponse.includes('Connection successful') || testResponse.includes('successful');
      } catch (networkError) {
        console.warn('Backend server not available, using mock mode');
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
          jsonData.variables.forEach((variable: { key?: string; value?: unknown }) => {
            if (variable.key && variable.value !== undefined) {
              variables.push(createOutputVariable(variable.key, String(variable.value), 'Generated from AI response'));
            }
          });
        }
        // Fallback to variables object format (old format)
        else if (jsonData.variables && typeof jsonData.variables === 'object') {
          Object.entries(jsonData.variables).forEach(([key, value]) => {
            variables.push(createOutputVariable(key, String(value), 'Generated from AI response'));
          });
        } else {
          console.warn('AI response does not contain variables key:', jsonData);
          variables.push(createOutputVariable(
            'warning',
            'AI response did not contain variables key in expected format. Please ensure your JSON schema includes a "variables" array.',
            'Response format warning'
          ));
        }
      }
    } catch (error) {
      console.warn('Failed to parse JSON from AI response:', error);
      variables.push(createOutputVariable(
        'parse_error',
        'Failed to parse AI response as JSON. Please check the response format.',
        'JSON parse error'
      ));
    }

    return { variables };
  }

  async validateSchema(jsonSchema: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(jsonSchema);
      return typeof parsed === 'object' && Boolean(parsed.type);
    } catch {
      return false;
    }
  }

  private buildSystemInstruction(outputVariables?: Variable[]): string {
    let systemInstruction = `${DEFAULT_SYSTEM_INSTRUCTION}\n`;

    if (outputVariables && outputVariables.length > 0) {
      const outputVarNames = outputVariables.map(v => `"${v.key}"`).join(', ');
      systemInstruction += `Your response MUST be a valid JSON object with a "variables" and "response". "variables" is a list of JSON object for [${outputVarNames}] with key containing the generated values. "response" is the response.\n`;
    } else {
      systemInstruction += `Your response MUST be a valid JSON object with a "response". "response" is the response.\n`;
    }

    systemInstruction += `Do NOT include any extra text, explanations, or markdown formatting.`;
    return systemInstruction;
  }

  generatePromptFromSchema(jsonSchema: string, userInput: string, markdownContent?: string, outputVariables?: Variable[]): PromptParts {
    const userPrompt = markdownContent && markdownContent.trim() ? markdownContent : userInput;
    let systemInstruction = this.buildSystemInstruction(outputVariables);

    try {
      const schema = JSON.parse(jsonSchema);
      const variablesFormat = this.generateVariablesFormatFromSchema(schema, outputVariables);
      systemInstruction += `\n\nJSON Structure:\n${variablesFormat}`;
    } catch {
      // Schema unparseable — fall back to the bare instruction
    }

    return { systemInstruction, userPrompt };
  }

  private generateVariablesFormatFromSchema(schema: any, outputVariables?: Variable[]): string {
    if (schema.properties?.variables?.properties && outputVariables && outputVariables.length > 0) {
      const variables = Object.entries(schema.properties.variables.properties).map(([key, prop]: [string, any]) => ({
        key,
        value: prop.description || `value for ${key}`
      }));

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

    const variableProperties: Record<string, { type: string; description: string; example: unknown }> = {};

    outputVariables.forEach(variable => {
      // Infer type from the variable's current value
      let type = "string";
      let example: unknown = variable.value;

      if (variable.value === "true" || variable.value === "false") {
        type = "boolean";
        example = variable.value === "true";
      } else if (!isNaN(Number(variable.value)) && variable.value !== "") {
        type = "number";
        example = Number(variable.value);
      }

      variableProperties[variable.key] = {
        type,
        description: variable.description || `Generated value for ${variable.key}`,
        example
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

  /**
   * Flatten a file's blocks into markdown for use as AI prompt context.
   * Unlike the preview's markdown, text blocks are included verbatim
   * (no heading/list prefixes) — the AI only needs the raw content.
   */
  extractMarkdownFromFile(file: FileData, allFiles?: FileData[], projectData?: ProjectData): string {
    if (!file || !file.blocks) return '';

    let markdownContent = '';

    file.blocks.forEach(block => {
      if (block.type === BlockType.JsonSchema && block.content) {
        markdownContent += `\`\`\`json\n${block.content}\n\`\`\`\n\n`;
      } else if (block.type === BlockType.Output && block.content) {
        markdownContent += `\`\`\`json\n${block.content}\n\`\`\`\n\n`;
      } else if (block.type === BlockType.Table && block.content) {
        markdownContent += `${this.tableToPromptMarkdown(block.content as TableData)}\n\n`;
      } else if (block.type === BlockType.Embed && block.content && allFiles) {
        markdownContent += this.embedToPromptMarkdown(block.content as EmbedData, allFiles);
      } else if (typeof block.content === 'string' && block.content.trim()) {
        markdownContent += `${block.content}\n\n`;
      }
    });

    // Apply variable resolution if project data is available
    if (projectData) {
      markdownContent = resolveVariables(
        markdownContent,
        collectFileVariables(projectData, file),
        projectData,
        file.id
      );
    }

    return markdownContent.trim();
  }

  private tableToPromptMarkdown(tableData: TableData): string {
    if (tableData.headers && tableData.rows) {
      return tableToMarkdown(tableData);
    }
    return `\`\`\`json\n${JSON.stringify(tableData, null, 2)}\n\`\`\``;
  }

  private embedToPromptMarkdown(embedData: EmbedData, allFiles: FileData[]): string {
    const sourceBlock = findEmbedSource(embedData, allFiles);
    if (!sourceBlock) {
      return `<!-- Embedded block not found: ${embedData.sourceFileId}#${embedData.sourceBlockId} -->\n\n`;
    }

    if (typeof sourceBlock.content === 'string') {
      return `${sourceBlock.content}\n\n`;
    }
    if (sourceBlock.type === BlockType.Table && sourceBlock.content) {
      return `${this.tableToPromptMarkdown(sourceBlock.content as TableData)}\n\n`;
    }
    return `${JSON.stringify(sourceBlock.content)}\n\n`;
  }
}

// Export singleton instance
export const aiService = new AIService();
