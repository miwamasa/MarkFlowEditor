import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AppState, FileData, Block, Variable, BlockType } from '../types';
import { storageService } from '../services/storageService';
import { crossFileVariableService } from '../services/crossFileVariableService';
import { appReducer, initialState } from './appReducer';
import { createBlock, createEmbedBlock, createFile, createVariable } from '../utils/factories';

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
    addBlock: (fileId: string, type: BlockType, position?: number) => Block;
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

const AUTO_SAVE_DELAY_MS = 2000;

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
      dispatch({ type: 'CREATE_FILE', payload: createFile(name) });
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

    addBlock: (fileId: string, type: BlockType, position?: number): Block => {
      const block = createBlock(type);
      dispatch({ type: 'ADD_BLOCK', payload: { fileId, block, position } });
      return block;
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
      crossFileVariableService.clearCache();
      dispatch({ type: 'ADD_VARIABLE', payload: { fileId, variable: createVariable(key, value, isOutput, visibility) } });
    },

    updateVariable: (fileId: string | null, variableId: string, updates: Partial<Variable>) => {
      crossFileVariableService.clearCache();
      dispatch({ type: 'UPDATE_VARIABLE', payload: { fileId, variableId, updates } });
    },

    deleteVariable: (fileId: string | null, variableId: string) => {
      crossFileVariableService.clearCache();
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
        type: 'EMBED_BLOCKS',
        payload: { targetFileId, blocks: [createEmbedBlock(sourceFileId, sourceBlockId)], position }
      });
    },

    embedMultipleBlocks: (targetFileId: string, blocks: { sourceFileId: string; sourceBlockId: string }[]) => {
      dispatch({
        type: 'EMBED_BLOCKS',
        payload: {
          targetFileId,
          blocks: blocks.map(({ sourceFileId, sourceBlockId }) => createEmbedBlock(sourceFileId, sourceBlockId))
        }
      });
    },

    inlineEmbeddedBlock: (fileId: string, embedBlockId: string) => {
      dispatch({ type: 'INLINE_EMBEDDED_BLOCK', payload: { fileId, embedBlockId } });
    }
  }), [state.project]);

  useEffect(() => {
    actions.loadProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced auto-save effect
  useEffect(() => {
    if (!state.isLoading && state.project.id && state.saveStatus !== 'saving') {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Mark as unsaved immediately
      if (state.saveStatus !== 'unsaved') {
        dispatch({ type: 'SET_SAVE_STATUS', payload: 'unsaved' });
      }

      saveTimeoutRef.current = setTimeout(async () => {
        dispatch({ type: 'SET_SAVE_STATUS', payload: 'saving' });
        try {
          await storageService.saveProject(state.project);
          dispatch({ type: 'SET_SAVE_STATUS', payload: 'saved' });
        } catch (error) {
          dispatch({ type: 'SET_ERROR', payload: 'Failed to save project' });
          dispatch({ type: 'SET_SAVE_STATUS', payload: 'unsaved' });
        }
      }, AUTO_SAVE_DELAY_MS);
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
