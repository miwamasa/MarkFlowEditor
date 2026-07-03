import { FileData, ProjectData, Variable } from '../types';
import { crossFileVariableService } from '../services/crossFileVariableService';

const GLOBAL_PREFIX = 'GLOBAL.';

/**
 * Resolve variable references in content.
 * Handles, in order:
 * 1. Cross-file references (`${file:path:VAR}` and `{{filename.variable}}`)
 * 2. Explicit global scope (`{{GLOBAL.key}}`)
 * 3. Plain `{{key}}` lookups against the provided variables
 */
export const resolveVariables = (
  content: string,
  variables: Variable[],
  project: ProjectData,
  currentFileId?: string | null
): string => {
  let resolved = content;

  if (currentFileId) {
    resolved = crossFileVariableService.resolveContent(resolved, currentFileId, project);
  }

  const variableMap = new Map(variables.map(v => [v.key, v.value]));

  return resolved.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const trimmedKey = key.trim();

    if (trimmedKey.startsWith(GLOBAL_PREFIX)) {
      const globalKey = trimmedKey.substring(GLOBAL_PREFIX.length);
      const globalVar = project.globalVariables.find(v => v.key === globalKey);
      return globalVar ? globalVar.value : `[Unknown Global: ${globalKey}]`;
    }

    return variableMap.get(trimmedKey) || `[Unknown: ${trimmedKey}]`;
  });
};

/** Global variables followed by the file's local variables (locals win on lookup collisions). */
export const collectFileVariables = (project: ProjectData, file: FileData): Variable[] => [
  ...project.globalVariables,
  ...file.localVariables
];
