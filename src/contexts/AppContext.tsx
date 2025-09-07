import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AppState, ProjectData, FileData, Block, Variable, BlockType, TableData, EmbedData } from '../types';
import { storageService } from '../services/storageService';

interface AppContextType {
  state: AppState;
  actions: {
    loadProject: () => void;
    saveProject: () => void;
    createFile: (name: string) => void;
    updateFile: (fileId: string, updates: Partial<FileData>) => void;
    deleteFile: (fileId: string) => void;
    reorderFiles: (fromIndex: number, toIndex: number) => void;
    setCurrentFile: (fileId: string | null) => void;
    addBlock: (fileId: string, type: BlockType, position?: number) => void;
    updateBlock: (fileId: string, blockId: string, updates: Partial<Block>) => void;
    deleteBlock: (fileId: string, blockId: string) => void;
    moveBlock: (fileId: string, blockId: string, newPosition: number) => void;
    setSelectedBlock: (blockId: string | null) => void;
    addVariable: (fileId: string | null, key: string, value: string, isOutput?: boolean, visibility?: 'public' | 'private' | 'protected') => void;
    updateVariable: (fileId: string | null, variableId: string, updates: Partial<Variable>) => void;
    deleteVariable: (fileId: string | null, variableId: string) => void;
    updatePreview: () => void;
    setError: (error: string | null) => void;
    clearError: () => void;
    setLoading: (loading: boolean) => void;
    setSaveStatus: (status: 'saved' | 'saving' | 'unsaved') => void;
    embedBlock: (targetFileId: string, sourceFileId: string, sourceBlockId: string, position?: number) => void;
    embedMultipleBlocks: (targetFileId: string, blocks: { sourceFileId: string; sourceBlockId: string }[]) => void;
    inlineEmbeddedBlock: (fileId: string, embedBlockId: string) => void;
  };
}

type Action =
  | { type: 'LOAD_PROJECT_SUCCESS'; payload: ProjectData }
  | { type: 'LOAD_PROJECT_ERROR'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CREATE_FILE'; payload: FileData }
  | { type: 'UPDATE_FILE'; payload: { fileId: string; updates: Partial<FileData> } }
  | { type: 'DELETE_FILE'; payload: string }
  | { type: 'REORDER_FILES'; payload: { fromIndex: number; toIndex: number } }
  | { type: 'SET_CURRENT_FILE'; payload: string | null }
  | { type: 'ADD_BLOCK'; payload: { fileId: string; block: Block; position?: number } }
  | { type: 'UPDATE_BLOCK'; payload: { fileId: string; blockId: string; updates: Partial<Block> } }
  | { type: 'DELETE_BLOCK'; payload: { fileId: string; blockId: string } }
  | { type: 'MOVE_BLOCK'; payload: { fileId: string; blockId: string; newPosition: number } }
  | { type: 'SET_SELECTED_BLOCK'; payload: string | null }
  | { type: 'ADD_VARIABLE'; payload: { fileId: string | null; variable: Variable } }
  | { type: 'UPDATE_VARIABLE'; payload: { fileId: string | null; variableId: string; updates: Partial<Variable> } }
  | { type: 'DELETE_VARIABLE'; payload: { fileId: string | null; variableId: string } }
  | { type: 'UPDATE_PREVIEW'; payload: string }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_SAVE_STATUS'; payload: 'saved' | 'saving' | 'unsaved' }
  | { type: 'EMBED_BLOCK'; payload: { targetFileId: string; sourceFileId: string; sourceBlockId: string; position?: number } }
  | { type: 'EMBED_MULTIPLE_BLOCKS'; payload: { targetFileId: string; blocks: { sourceFileId: string; sourceBlockId: string }[] } }
  | { type: 'INLINE_EMBEDDED_BLOCK'; payload: { fileId: string; embedBlockId: string } };

const createDefaultProject = (): ProjectData => {
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

const initialState: AppState = {
  project: createDefaultProject(),
  currentFileId: null,
  selectedBlockId: null,
  previewMarkdown: '',
  isLoading: false,
  error: null,
  saveStatus: 'saved'
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOAD_PROJECT_SUCCESS':
      return {
        ...state,
        project: action.payload,
        isLoading: false,
        error: null
      };
    
    case 'LOAD_PROJECT_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    
    case 'CREATE_FILE':
      return {
        ...state,
        project: {
          ...state.project,
          files: [...state.project.files, action.payload],
          updatedAt: new Date(),
          metadata: {
            ...state.project.metadata,
            fileCount: state.project.files.length + 1,
            updatedAt: new Date()
          }
        },
        saveStatus: 'unsaved'
      };
    
    case 'UPDATE_FILE':
      return {
        ...state,
        project: {
          ...state.project,
          files: state.project.files.map(file =>
            file.id === action.payload.fileId 
              ? { ...file, ...action.payload.updates, updatedAt: new Date() }
              : file
          ),
          updatedAt: new Date()
        },
        saveStatus: 'unsaved'
      };
    
    case 'DELETE_FILE':
      return {
        ...state,
        project: {
          ...state.project,
          files: state.project.files.filter(file => file.id !== action.payload),
          updatedAt: new Date(),
          metadata: {
            ...state.project.metadata,
            fileCount: state.project.files.length - 1,
            updatedAt: new Date()
          }
        },
        currentFileId: state.currentFileId === action.payload ? null : state.currentFileId,
        saveStatus: 'unsaved'
      };

    case 'REORDER_FILES':
      const { fromIndex, toIndex } = action.payload;
      const files = [...state.project.files];
      const [movedFile] = files.splice(fromIndex, 1);
      files.splice(toIndex, 0, movedFile);
      
      return {
        ...state,
        project: {
          ...state.project,
          files,
          updatedAt: new Date(),
          metadata: {
            ...state.project.metadata,
            updatedAt: new Date()
          }
        },
        saveStatus: 'unsaved'
      };
    
    case 'SET_CURRENT_FILE':
      return {
        ...state,
        currentFileId: action.payload,
        selectedBlockId: null
      };
    
    case 'ADD_BLOCK':
      return {
        ...state,
        project: {
          ...state.project,
          files: state.project.files.map(file =>
            file.id === action.payload.fileId
              ? {
                  ...file,
                  blocks: action.payload.position !== undefined
                    ? [
                        ...file.blocks.slice(0, action.payload.position),
                        action.payload.block,
                        ...file.blocks.slice(action.payload.position)
                      ]
                    : [...file.blocks, action.payload.block],
                  updatedAt: new Date()
                }
              : file
          ),
          updatedAt: new Date()
        },
        saveStatus: 'unsaved'
      };
    
    case 'UPDATE_BLOCK':
      return {
        ...state,
        project: {
          ...state.project,
          files: state.project.files.map(file =>
            file.id === action.payload.fileId
              ? {
                  ...file,
                  blocks: file.blocks.map(block =>
                    block.id === action.payload.blockId
                      ? { ...block, ...action.payload.updates, metadata: { ...block.metadata, updatedAt: new Date() } }
                      : block
                  ),
                  updatedAt: new Date()
                }
              : file
          ),
          updatedAt: new Date()
        },
        saveStatus: 'unsaved'
      };
    
    case 'DELETE_BLOCK':
      return {
        ...state,
        project: {
          ...state.project,
          files: state.project.files.map(file =>
            file.id === action.payload.fileId
              ? {
                  ...file,
                  blocks: file.blocks.filter(block => block.id !== action.payload.blockId),
                  updatedAt: new Date()
                }
              : file
          ),
          updatedAt: new Date()
        },
        selectedBlockId: state.selectedBlockId === action.payload.blockId ? null : state.selectedBlockId,
        saveStatus: 'unsaved'
      };
    
    case 'MOVE_BLOCK':
      return {
        ...state,
        project: {
          ...state.project,
          files: state.project.files.map(file => {
            if (file.id !== action.payload.fileId) return file;
            
            const blockIndex = file.blocks.findIndex(b => b.id === action.payload.blockId);
            if (blockIndex === -1) return file;
            
            const newBlocks = [...file.blocks];
            const [movedBlock] = newBlocks.splice(blockIndex, 1);
            newBlocks.splice(action.payload.newPosition, 0, movedBlock);
            
            return {
              ...file,
              blocks: newBlocks,
              updatedAt: new Date()
            };
          }),
          updatedAt: new Date()
        },
        saveStatus: 'unsaved'
      };
    
    case 'SET_SELECTED_BLOCK':
      return {
        ...state,
        selectedBlockId: action.payload
      };
    
    case 'ADD_VARIABLE':
      if (action.payload.fileId) {
        return {
          ...state,
          project: {
            ...state.project,
            files: state.project.files.map(file =>
              file.id === action.payload.fileId
                ? {
                    ...file,
                    localVariables: [...file.localVariables, action.payload.variable],
                    updatedAt: new Date()
                  }
                : file
            ),
            updatedAt: new Date()
          },
          saveStatus: 'unsaved'
        };
      } else {
        return {
          ...state,
          project: {
            ...state.project,
            globalVariables: [...state.project.globalVariables, action.payload.variable],
            updatedAt: new Date()
          },
          saveStatus: 'unsaved'
        };
      }
    
    case 'UPDATE_VARIABLE':
      if (action.payload.fileId) {
        return {
          ...state,
          project: {
            ...state.project,
            files: state.project.files.map(file =>
              file.id === action.payload.fileId
                ? {
                    ...file,
                    localVariables: file.localVariables.map(variable =>
                      variable.id === action.payload.variableId
                        ? { ...variable, ...action.payload.updates, metadata: { ...variable.metadata, updatedAt: new Date() } }
                        : variable
                    ),
                    updatedAt: new Date()
                  }
                : file
            ),
            updatedAt: new Date()
          },
          saveStatus: 'unsaved'
        };
      } else {
        return {
          ...state,
          project: {
            ...state.project,
            globalVariables: state.project.globalVariables.map(variable =>
              variable.id === action.payload.variableId
                ? { ...variable, ...action.payload.updates, metadata: { ...variable.metadata, updatedAt: new Date() } }
                : variable
            ),
            updatedAt: new Date()
          },
          saveStatus: 'unsaved'
        };
      }
    
    case 'DELETE_VARIABLE':
      if (action.payload.fileId) {
        return {
          ...state,
          project: {
            ...state.project,
            files: state.project.files.map(file =>
              file.id === action.payload.fileId
                ? {
                    ...file,
                    localVariables: file.localVariables.filter(variable => variable.id !== action.payload.variableId),
                    updatedAt: new Date()
                  }
                : file
            ),
            updatedAt: new Date()
          },
          saveStatus: 'unsaved'
        };
      } else {
        return {
          ...state,
          project: {
            ...state.project,
            globalVariables: state.project.globalVariables.filter(variable => variable.id !== action.payload.variableId),
            updatedAt: new Date()
          },
          saveStatus: 'unsaved'
        };
      }
    
    case 'UPDATE_PREVIEW':
      return {
        ...state,
        previewMarkdown: action.payload
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    
    case 'SET_SAVE_STATUS':
      return {
        ...state,
        saveStatus: action.payload
      };
    
    case 'EMBED_BLOCK':
      const { targetFileId, sourceFileId, sourceBlockId, position } = action.payload;
      const newEmbedBlock: Block = {
        id: crypto.randomUUID(),
        type: BlockType.Embed,
        content: {
          sourceFileId,
          sourceBlockId,
          isLinked: true
        } as EmbedData,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1
        }
      };
      
      return {
        ...state,
        project: {
          ...state.project,
          files: state.project.files.map(file => {
            if (file.id === targetFileId) {
              const blocks = [...file.blocks];
              if (position !== undefined && position >= 0 && position <= blocks.length) {
                blocks.splice(position, 0, newEmbedBlock);
              } else {
                blocks.push(newEmbedBlock);
              }
              return {
                ...file,
                blocks,
                updatedAt: new Date()
              };
            }
            return file;
          }),
          updatedAt: new Date()
        },
        saveStatus: 'unsaved'
      };
    
    case 'EMBED_MULTIPLE_BLOCKS':
      const newEmbedBlocks: Block[] = action.payload.blocks.map(({ sourceFileId, sourceBlockId }) => ({
        id: crypto.randomUUID(),
        type: BlockType.Embed,
        content: {
          sourceFileId,
          sourceBlockId,
          isLinked: true
        } as EmbedData,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1
        }
      }));
      
      return {
        ...state,
        project: {
          ...state.project,
          files: state.project.files.map(file => {
            if (file.id === action.payload.targetFileId) {
              return {
                ...file,
                blocks: [...file.blocks, ...newEmbedBlocks],
                updatedAt: new Date()
              };
            }
            return file;
          }),
          updatedAt: new Date()
        },
        saveStatus: 'unsaved'
      };
    
    case 'INLINE_EMBEDDED_BLOCK':
      return {
        ...state,
        project: {
          ...state.project,
          files: state.project.files.map(file => {
            if (file.id === action.payload.fileId) {
              return {
                ...file,
                blocks: file.blocks.map(block => {
                  if (block.id === action.payload.embedBlockId && block.type === BlockType.Embed) {
                    const embedData = block.content as EmbedData;
                    const sourceFile = state.project.files.find(f => f.id === embedData.sourceFileId);
                    const sourceBlock = sourceFile?.blocks.find(b => b.id === embedData.sourceBlockId);
                    
                    if (sourceBlock) {
                      // Convert embed to a copy of the source block
                      return {
                        ...block,
                        type: sourceBlock.type,
                        content: sourceBlock.content,
                        name: sourceBlock.name,
                        metadata: {
                          ...block.metadata,
                          updatedAt: new Date(),
                          version: block.metadata.version + 1
                        }
                      };
                    }
                  }
                  return block;
                }),
                updatedAt: new Date()
              };
            }
            return file;
          }),
          updatedAt: new Date()
        },
        saveStatus: 'unsaved'
      };
    
    default:
      return state;
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const actions = React.useMemo(() => ({
    loadProject: async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const project = await storageService.loadProject();
        if (project) {
          dispatch({ type: 'LOAD_PROJECT_SUCCESS', payload: project });
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        dispatch({ type: 'LOAD_PROJECT_ERROR', payload: 'Failed to load project' });
      }
    },

    saveProject: async () => {
      dispatch({ type: 'SET_SAVE_STATUS', payload: 'saving' });
      try {
        await storageService.saveProject(state.project);
        dispatch({ type: 'SET_SAVE_STATUS', payload: 'saved' });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to save project' });
        dispatch({ type: 'SET_SAVE_STATUS', payload: 'unsaved' });
      }
    },

    createFile: (name: string) => {
      const now = new Date();
      const newFile: FileData = {
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
      dispatch({ type: 'CREATE_FILE', payload: newFile });
    },

    updateFile: (fileId: string, updates: Partial<FileData>) => {
      dispatch({ type: 'UPDATE_FILE', payload: { fileId, updates } });
    },

    deleteFile: (fileId: string) => {
      dispatch({ type: 'DELETE_FILE', payload: fileId });
    },

    reorderFiles: (fromIndex: number, toIndex: number) => {
      dispatch({ type: 'REORDER_FILES', payload: { fromIndex, toIndex } });
    },

    setCurrentFile: (fileId: string | null) => {
      dispatch({ type: 'SET_CURRENT_FILE', payload: fileId });
    },

    addBlock: (fileId: string, type: BlockType, position?: number) => {
      const now = new Date();
      
      let content: string | TableData = '';
      if (type === BlockType.Table) {
        content = {
          headers: ['Column 1', 'Column 2'],
          rows: [
            ['Cell 1', 'Cell 2'],
            ['Cell 3', 'Cell 4']
          ],
          alignments: ['left', 'left']
        } as TableData;
      }
      
      const newBlock: Block = {
        id: crypto.randomUUID(),
        type,
        content,
        metadata: {
          createdAt: now,
          updatedAt: now,
          version: 1
        }
      };
      dispatch({ type: 'ADD_BLOCK', payload: { fileId, block: newBlock, position } });
    },

    updateBlock: (fileId: string, blockId: string, updates: Partial<Block>) => {
      dispatch({ type: 'UPDATE_BLOCK', payload: { fileId, blockId, updates } });
    },

    deleteBlock: (fileId: string, blockId: string) => {
      dispatch({ type: 'DELETE_BLOCK', payload: { fileId, blockId } });
    },

    moveBlock: (fileId: string, blockId: string, newPosition: number) => {
      dispatch({ type: 'MOVE_BLOCK', payload: { fileId, blockId, newPosition } });
    },

    setSelectedBlock: (blockId: string | null) => {
      dispatch({ type: 'SET_SELECTED_BLOCK', payload: blockId });
    },

    addVariable: (fileId: string | null, key: string, value: string, isOutput?: boolean, visibility?: 'public' | 'private' | 'protected') => {
      const now = new Date();
      const newVariable: Variable = {
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
      dispatch({ type: 'ADD_VARIABLE', payload: { fileId, variable: newVariable } });
    },

    updateVariable: (fileId: string | null, variableId: string, updates: Partial<Variable>) => {
      dispatch({ type: 'UPDATE_VARIABLE', payload: { fileId, variableId, updates } });
    },

    deleteVariable: (fileId: string | null, variableId: string) => {
      dispatch({ type: 'DELETE_VARIABLE', payload: { fileId, variableId } });
    },

    updatePreview: () => {
      dispatch({ type: 'UPDATE_PREVIEW', payload: '' });
    },

    setError: (error: string | null) => {
      dispatch({ type: 'SET_ERROR', payload: error });
    },

    clearError: () => {
      dispatch({ type: 'CLEAR_ERROR' });
    },

    setLoading: (loading: boolean) => {
      dispatch({ type: 'SET_LOADING', payload: loading });
    },

    setSaveStatus: (status: 'saved' | 'saving' | 'unsaved') => {
      dispatch({ type: 'SET_SAVE_STATUS', payload: status });
    },
    embedBlock: (targetFileId: string, sourceFileId: string, sourceBlockId: string, position?: number) => {
      dispatch({ 
        type: 'EMBED_BLOCK', 
        payload: { targetFileId, sourceFileId, sourceBlockId, position } 
      });
    },
    embedMultipleBlocks: (targetFileId: string, blocks: { sourceFileId: string; sourceBlockId: string }[]) => {
      dispatch({ 
        type: 'EMBED_MULTIPLE_BLOCKS', 
        payload: { targetFileId, blocks } 
      });
    },
    inlineEmbeddedBlock: (fileId: string, embedBlockId: string) => {
      dispatch({ 
        type: 'INLINE_EMBEDDED_BLOCK', 
        payload: { fileId, embedBlockId } 
      });
    }
  }), [state.project]);

  useEffect(() => {
    actions.loadProject();
  }, []);

  // Debounced auto-save effect
  useEffect(() => {
    if (!state.isLoading && state.project.id && state.saveStatus !== 'saving') {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Mark as unsaved immediately
      if (state.saveStatus !== 'unsaved') {
        dispatch({ type: 'SET_SAVE_STATUS', payload: 'unsaved' });
      }
      
      // Set debounced save (2 seconds)
      saveTimeoutRef.current = setTimeout(async () => {
        dispatch({ type: 'SET_SAVE_STATUS', payload: 'saving' });
        try {
          await storageService.saveProject(state.project);
          dispatch({ type: 'SET_SAVE_STATUS', payload: 'saved' });
        } catch (error) {
          dispatch({ type: 'SET_ERROR', payload: 'Failed to save project' });
          dispatch({ type: 'SET_SAVE_STATUS', payload: 'unsaved' });
        }
      }, 2000);
    }
  }, [state.project, state.isLoading, state.saveStatus]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <AppContext.Provider value={{ state, actions }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};