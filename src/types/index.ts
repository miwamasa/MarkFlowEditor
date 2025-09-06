export enum BlockType {
  Heading1 = 'h1',
  Heading2 = 'h2', 
  Heading3 = 'h3',
  Heading4 = 'h4',
  Heading5 = 'h5',
  Heading6 = 'h6',
  Paragraph = 'p',
  UnorderedList = 'ul',
  OrderedList = 'ol',
  Code = 'code',
  Table = 'table',
  Quote = 'quote',
  Image = 'image',
  Link = 'link',
  JsonSchema = 'jsonschema',
  Output = 'output',
  Embed = 'embed'
}

export interface BlockMetadata {
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface TableData {
  headers: string[];
  rows: string[][];
  alignments?: ('left' | 'center' | 'right')[];
}

export interface LinkData {
  targetFileId: string;
  targetBlockId?: string;
  displayMode: 'inline' | 'reference';
}

export interface EmbedData {
  sourceFileId: string;
  sourceBlockId: string;
  isLinked: boolean; // true = embedded link, false = inlined copy
}

export interface Block {
  id: string;
  type: BlockType;
  name?: string;
  content: string | TableData | LinkData | EmbedData;
  metadata: BlockMetadata;
}

export interface VariableMetadata {
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
}

export interface Variable {
  id: string;
  key: string;
  value: string;
  isOutput?: boolean;
  description?: string;
  metadata: VariableMetadata;
}

export interface FileMetadata {
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date;
  blockCount: number;
  variableCount: number;
}

export interface FileData {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  localVariables: Variable[];
  blocks: Block[];
  metadata: FileMetadata;
}

export interface ProjectMetadata {
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date;
  fileCount: number;
  globalVariableCount: number;
  totalBlockCount: number;
  version: string;
}

export interface ProjectData {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  globalVariables: Variable[];
  files: FileData[];
  metadata: ProjectMetadata;
}

export interface AIPromptConfig {
  systemInstruction: string;
  outputVariables: Variable[];
  temperature?: number;
  maxTokens?: number;
}

export interface AppState {
  project: ProjectData;
  currentFileId: string | null;
  selectedBlockId: string | null;
  previewMarkdown: string;
  isLoading: boolean;
  error: string | null;
  saveStatus: 'saved' | 'saving' | 'unsaved';
}

export type BlockContent = string | TableData | LinkData;

export interface MarkdownService {
  generateMarkdown(blocks: Block[], variables: Variable[]): string;
  resolveVariables(content: string, variables: Variable[]): string;
  parseMarkdown(markdown: string): Block[];
}

export interface StorageService {
  saveProject(project: ProjectData): Promise<void>;
  loadProject(): Promise<ProjectData | null>;
  exportProject(project: ProjectData): string;
  importProject(jsonData: string): ProjectData;
}

export interface AIService {
  generateContent(prompt: string, config: AIPromptConfig): Promise<string>;
  parseResponse(response: string): { variables: Variable[] };
}