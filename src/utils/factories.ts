import { Block, BlockType, EmbedData, FileData, ProjectData, TableData, Variable } from '../types';

export const createDefaultTableData = (): TableData => ({
  headers: ['Column 1', 'Column 2'],
  rows: [
    ['Cell 1', 'Cell 2'],
    ['Cell 3', 'Cell 4']
  ],
  alignments: ['left', 'left']
});

export const createBlock = (type: BlockType): Block => {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    type,
    content: type === BlockType.Table ? createDefaultTableData() : '',
    metadata: {
      createdAt: now,
      updatedAt: now,
      version: 1
    }
  };
};

export const createEmbedBlock = (sourceFileId: string, sourceBlockId: string): Block => {
  const now = new Date();
  const content: EmbedData = {
    sourceFileId,
    sourceBlockId,
    isLinked: true
  };
  return {
    id: crypto.randomUUID(),
    type: BlockType.Embed,
    content,
    metadata: {
      createdAt: now,
      updatedAt: now,
      version: 1
    }
  };
};

export const createVariable = (
  key: string,
  value: string,
  isOutput?: boolean,
  visibility?: 'public' | 'private' | 'protected'
): Variable => {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    key,
    value,
    isOutput,
    visibility,
    metadata: {
      createdAt: now,
      updatedAt: now
    }
  };
};

export const createFile = (name: string): FileData => {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    name,
    createdAt: now,
    updatedAt: now,
    localVariables: [],
    blocks: [],
    metadata: {
      createdAt: now,
      updatedAt: now,
      lastAccessedAt: now,
      blockCount: 0,
      variableCount: 0
    }
  };
};

export const createDefaultProject = (): ProjectData => {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    name: 'New Project',
    createdAt: now,
    updatedAt: now,
    globalVariables: [],
    files: [],
    metadata: {
      createdAt: now,
      updatedAt: now,
      lastAccessedAt: now,
      fileCount: 0,
      globalVariableCount: 0,
      totalBlockCount: 0,
      version: '1.0.0'
    }
  };
};
