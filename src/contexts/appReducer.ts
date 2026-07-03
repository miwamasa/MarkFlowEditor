import { AppState, Block, BlockType, EmbedData, FileData, ProjectData, ProjectMetadata, Variable } from '../types';
import { createDefaultProject } from '../utils/factories';

export type Action =
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
  | { type: 'EMBED_BLOCKS'; payload: { targetFileId: string; blocks: Block[]; position?: number } }
  | { type: 'INLINE_EMBEDDED_BLOCK'; payload: { fileId: string; embedBlockId: string } };

export const initialState: AppState = {
  project: createDefaultProject(),
  currentFileId: null,
  selectedBlockId: null,
  previewMarkdown: '',
  isLoading: false,
  error: null,
  saveStatus: 'saved'
};

/** Apply project-level updates, refresh timestamps, and mark the project unsaved. */
const withProject = (
  state: AppState,
  updates: Partial<ProjectData>,
  metadataUpdates?: Partial<ProjectMetadata>
): AppState => ({
  ...state,
  project: {
    ...state.project,
    ...updates,
    updatedAt: new Date(),
    metadata: metadataUpdates
      ? { ...state.project.metadata, ...metadataUpdates, updatedAt: new Date() }
      : state.project.metadata
  },
  saveStatus: 'unsaved'
});

/** Apply an update to a single file (refreshing its timestamp) and mark the project unsaved. */
const withFile = (
  state: AppState,
  fileId: string,
  updater: (file: FileData) => Partial<FileData>
): AppState =>
  withProject(state, {
    files: state.project.files.map(file =>
      file.id === fileId
        ? { ...file, ...updater(file), updatedAt: new Date() }
        : file
    )
  });

const insertBlocks = (blocks: Block[], newBlocks: Block[], position?: number): Block[] => {
  if (position !== undefined && position >= 0 && position <= blocks.length) {
    return [...blocks.slice(0, position), ...newBlocks, ...blocks.slice(position)];
  }
  return [...blocks, ...newBlocks];
};

const updateVariableList = (
  variables: Variable[],
  variableId: string,
  updates: Partial<Variable>
): Variable[] =>
  variables.map(variable =>
    variable.id === variableId
      ? { ...variable, ...updates, metadata: { ...variable.metadata, updatedAt: new Date() } }
      : variable
  );

export function appReducer(state: AppState, action: Action): AppState {
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
      return { ...state, isLoading: action.payload };

    case 'CREATE_FILE':
      return withProject(
        state,
        { files: [...state.project.files, action.payload] },
        { fileCount: state.project.files.length + 1 }
      );

    case 'UPDATE_FILE':
      return withFile(state, action.payload.fileId, () => action.payload.updates);

    case 'DELETE_FILE':
      return {
        ...withProject(
          state,
          { files: state.project.files.filter(file => file.id !== action.payload) },
          { fileCount: state.project.files.length - 1 }
        ),
        currentFileId: state.currentFileId === action.payload ? null : state.currentFileId
      };

    case 'REORDER_FILES': {
      const { fromIndex, toIndex } = action.payload;
      const files = [...state.project.files];
      const [movedFile] = files.splice(fromIndex, 1);
      files.splice(toIndex, 0, movedFile);
      return withProject(state, { files }, {});
    }

    case 'SET_CURRENT_FILE':
      return {
        ...state,
        currentFileId: action.payload,
        selectedBlockId: null
      };

    case 'ADD_BLOCK':
      return withFile(state, action.payload.fileId, file => ({
        blocks: insertBlocks(file.blocks, [action.payload.block], action.payload.position)
      }));

    case 'UPDATE_BLOCK':
      return withFile(state, action.payload.fileId, file => ({
        blocks: file.blocks.map(block =>
          block.id === action.payload.blockId
            ? { ...block, ...action.payload.updates, metadata: { ...block.metadata, updatedAt: new Date() } }
            : block
        )
      }));

    case 'DELETE_BLOCK':
      return {
        ...withFile(state, action.payload.fileId, file => ({
          blocks: file.blocks.filter(block => block.id !== action.payload.blockId)
        })),
        selectedBlockId: state.selectedBlockId === action.payload.blockId ? null : state.selectedBlockId
      };

    case 'MOVE_BLOCK':
      return withFile(state, action.payload.fileId, file => {
        const blockIndex = file.blocks.findIndex(b => b.id === action.payload.blockId);
        if (blockIndex === -1) return {};

        const newBlocks = [...file.blocks];
        const [movedBlock] = newBlocks.splice(blockIndex, 1);
        newBlocks.splice(action.payload.newPosition, 0, movedBlock);
        return { blocks: newBlocks };
      });

    case 'SET_SELECTED_BLOCK':
      return { ...state, selectedBlockId: action.payload };

    case 'ADD_VARIABLE':
      if (action.payload.fileId) {
        return withFile(state, action.payload.fileId, file => ({
          localVariables: [...file.localVariables, action.payload.variable]
        }));
      }
      return withProject(state, {
        globalVariables: [...state.project.globalVariables, action.payload.variable]
      });

    case 'UPDATE_VARIABLE':
      if (action.payload.fileId) {
        return withFile(state, action.payload.fileId, file => ({
          localVariables: updateVariableList(file.localVariables, action.payload.variableId, action.payload.updates)
        }));
      }
      return withProject(state, {
        globalVariables: updateVariableList(state.project.globalVariables, action.payload.variableId, action.payload.updates)
      });

    case 'DELETE_VARIABLE':
      if (action.payload.fileId) {
        return withFile(state, action.payload.fileId, file => ({
          localVariables: file.localVariables.filter(variable => variable.id !== action.payload.variableId)
        }));
      }
      return withProject(state, {
        globalVariables: state.project.globalVariables.filter(variable => variable.id !== action.payload.variableId)
      });

    case 'UPDATE_PREVIEW':
      return { ...state, previewMarkdown: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'SET_SAVE_STATUS':
      return { ...state, saveStatus: action.payload };

    case 'EMBED_BLOCKS':
      return withFile(state, action.payload.targetFileId, file => ({
        blocks: insertBlocks(file.blocks, action.payload.blocks, action.payload.position)
      }));

    case 'INLINE_EMBEDDED_BLOCK':
      return withFile(state, action.payload.fileId, file => ({
        blocks: file.blocks.map(block => {
          if (block.id !== action.payload.embedBlockId || block.type !== BlockType.Embed) {
            return block;
          }

          const embedData = block.content as EmbedData;
          const sourceFile = state.project.files.find(f => f.id === embedData.sourceFileId);
          const sourceBlock = sourceFile?.blocks.find(b => b.id === embedData.sourceBlockId);
          if (!sourceBlock) return block;

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
        })
      }));

    default:
      return state;
  }
}
