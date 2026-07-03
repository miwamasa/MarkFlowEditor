import { ProjectData, Variable, CrossFileVariableRef, FileDependency, DependencyGraph } from '../types';

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class CrossFileVariableService {
  private dependencyGraph: DependencyGraph = { dependencies: [], circularRefs: [] };
  private resolvedCache = new Map<string, string>();

  /**
   * Parse cross-file variable references from content
   * Supports two syntaxes:
   * 1. ${file:./path/to/file.md:VARIABLE_NAME}
   * 2. {{filename.variableName}}
   */
  parseCrossFileReferences(content: string): CrossFileVariableRef[] {
    const refs: CrossFileVariableRef[] = [];
    
    // Parse ${file:path:VARIABLE} syntax
    const filePathRegex = /\$\{file:(\.{0,2}\/[^:]+):([A-Z_][A-Z0-9_]*)\}/g;
    let match;
    while ((match = filePathRegex.exec(content)) !== null) {
      const [, filePath, variableName] = match;
      refs.push({
        syntax: 'file-path',
        filePath: filePath.trim(),
        variableName: variableName.trim(),
        isRelative: filePath.startsWith('./') || filePath.startsWith('../'),
        status: 'pending'
      });
    }

    // Parse {{filename.variableName}} syntax
    const filenameRegex = /\{\{([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_]+)\}\}/g;
    while ((match = filenameRegex.exec(content)) !== null) {
      const [, filename, variableName] = match;
      refs.push({
        syntax: 'filename',
        filePath: filename.trim(),
        variableName: variableName.trim(),
        isRelative: false,
        status: 'pending'
      });
    }

    return refs;
  }

  /**
   * Resolve file path relative to current file
   */
  resolveFilePath(currentFileId: string, relativePath: string, project: ProjectData): string | null {
    const currentFile = project.files.find(f => f.id === currentFileId);
    if (!currentFile) return null;

    // For simplicity, we'll use file names as paths
    // In a real implementation, you'd handle directory structures
    if (relativePath.startsWith('./')) {
      const fileName = relativePath.slice(2);
      const targetFile = project.files.find(f => f.name === fileName);
      return targetFile?.id || null;
    }

    if (relativePath.startsWith('../')) {
      // Handle parent directory navigation
      const fileName = relativePath.split('/').pop();
      const targetFile = project.files.find(f => f.name === fileName);
      return targetFile?.id || null;
    }

    // Absolute path
    const fileName = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
    const targetFile = project.files.find(f => f.name === fileName);
    return targetFile?.id || null;
  }

  /**
   * Check if variable is accessible from source file
   */
  isVariableAccessible(variable: Variable, sourceFileId: string, targetFileId: string): boolean {
    if (!variable.visibility || variable.visibility === 'public') {
      return true;
    }

    if (variable.visibility === 'private') {
      return sourceFileId === targetFileId;
    }

    if (variable.visibility === 'protected') {
      // For now, treat protected as public
      // In a full implementation, you'd check directory relationships
      return true;
    }

    return false;
  }

  /**
   * Resolve a single cross-file variable reference
   * Supports both file-path and filename syntax
   */
  resolveCrossFileReference(
    ref: CrossFileVariableRef,
    currentFileId: string,
    project: ProjectData
  ): CrossFileVariableRef {
    const cacheKey = `${currentFileId}:${ref.syntax}:${ref.filePath}:${ref.variableName}`;

    if (this.resolvedCache.has(cacheKey)) {
      return {
        ...ref,
        resolvedValue: this.resolvedCache.get(cacheKey),
        status: 'resolved'
      };
    }

    // Resolve target file based on syntax
    let targetFileId: string | null = null;

    if (ref.syntax === 'filename') {
      // For {{filename.variableName}}, find file by name (without extension)
      const baseName = ref.filePath.replace(/\.(md|markdown)$/i, '');
      const targetFile = project.files.find(f => {
        const fileBaseName = f.name.replace(/\.(md|markdown)$/i, '');
        return fileBaseName === baseName;
      });
      targetFileId = targetFile?.id || null;
    } else {
      // For ${file:path:VARIABLE}, use existing path resolution
      targetFileId = this.resolveFilePath(currentFileId, ref.filePath, project);
    }

    const targetFile = targetFileId ? project.files.find(f => f.id === targetFileId) : undefined;
    if (!targetFileId || !targetFile) {
      return {
        ...ref,
        status: 'error',
        error: `File not found: ${ref.filePath}`
      };
    }

    // Look for variable in target file (local first, then global)
    const variable =
      targetFile.localVariables.find(v => v.key === ref.variableName) ||
      project.globalVariables.find(v => v.key === ref.variableName);

    if (!variable) {
      return {
        ...ref,
        resolvedFileId: targetFileId,
        status: 'not-found',
        error: `Variable '${ref.variableName}' not found in file ${ref.filePath}`
      };
    }

    if (!this.isVariableAccessible(variable, currentFileId, targetFileId)) {
      return {
        ...ref,
        resolvedFileId: targetFileId,
        status: 'error',
        error: `Variable '${ref.variableName}' is not accessible (${variable.visibility})`
      };
    }

    this.resolvedCache.set(cacheKey, variable.value);

    return {
      ...ref,
      resolvedValue: variable.value,
      resolvedFileId: targetFileId,
      status: 'resolved'
    };
  }

  /**
   * Resolve all cross-file variable references in content
   * Supports both ${file:path:VARIABLE} and {{filename.variableName}} syntax
   */
  resolveContent(content: string, currentFileId: string, project: ProjectData): string {
    const refs = this.parseCrossFileReferences(content);
    let resolvedContent = content;

    for (const ref of refs) {
      const resolved = this.resolveCrossFileReference(ref, currentFileId, project);
      
      // Create the appropriate regex pattern based on syntax
      const pattern = ref.syntax === 'filename'
        ? `\\{\\{${escapeRegExp(ref.filePath)}\\.${escapeRegExp(ref.variableName)}\\}\\}`
        : `\\$\\{file:${escapeRegExp(ref.filePath)}:${ref.variableName}\\}`;

      const regex = new RegExp(pattern, 'g');
      
      if (resolved.status === 'resolved' && resolved.resolvedValue) {
        resolvedContent = resolvedContent.replace(regex, resolved.resolvedValue);
      } else {
        // Leave unresolved references as-is or show error
        const errorMessage = resolved.error || 'Unresolved reference';
        resolvedContent = resolvedContent.replace(regex, `[ERROR: ${errorMessage}]`);
      }
    }

    return resolvedContent;
  }

  /**
   * Build dependency graph for the project
   */
  buildDependencyGraph(project: ProjectData): DependencyGraph {
    const dependencies: FileDependency[] = [];
    const fileRefs = new Map<string, Set<string>>();

    for (const file of project.files) {
      // Check all blocks for cross-file references
      for (const block of file.blocks) {
        if (typeof block.content === 'string') {
          const refs = this.parseCrossFileReferences(block.content);
          
          if (refs.length > 0) {
            const resolvedRefs = refs.map(ref => 
              this.resolveCrossFileReference(ref, file.id, project)
            );

            // Group by target file
            const refsByFile = new Map<string, CrossFileVariableRef[]>();
            for (const ref of resolvedRefs) {
              if (ref.resolvedFileId) {
                if (!refsByFile.has(ref.resolvedFileId)) {
                  refsByFile.set(ref.resolvedFileId, []);
                }
                refsByFile.get(ref.resolvedFileId)!.push(ref);

                // Track for circular reference detection
                if (!fileRefs.has(file.id)) {
                  fileRefs.set(file.id, new Set());
                }
                fileRefs.get(file.id)!.add(ref.resolvedFileId);
              }
            }

            // Create dependencies
            refsByFile.forEach((refs, targetFileId) => {
              dependencies.push({
                sourceFileId: file.id,
                targetFileId,
                variableRefs: refs
              });
            });
          }
        }
      }
    }

    // Detect circular references
    const circularRefs = this.detectCircularReferences(fileRefs);

    this.dependencyGraph = { dependencies, circularRefs };
    return this.dependencyGraph;
  }

  /**
   * Detect circular references using DFS
   */
  private detectCircularReferences(fileRefs: Map<string, Set<string>>): string[][] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[][] = [];

    const dfs = (node: string, path: string[]): void => {
      if (recursionStack.has(node)) {
        // Found cycle
        const cycleStart = path.indexOf(node);
        if (cycleStart !== -1) {
          cycles.push(path.slice(cycleStart).concat([node]));
        }
        return;
      }

      if (visited.has(node)) {
        return;
      }

      visited.add(node);
      recursionStack.add(node);

      const neighbors = fileRefs.get(node) || new Set();
      neighbors.forEach(neighbor => {
        dfs(neighbor, [...path, node]);
      });

      recursionStack.delete(node);
    };

    Array.from(fileRefs.keys()).forEach(node => {
      if (!visited.has(node)) {
        dfs(node, []);
      }
    });

    return cycles;
  }

  /**
   * Get all cross-file references for a specific file
   */
  getFileReferences(fileId: string, project: ProjectData): CrossFileVariableRef[] {
    const file = project.files.find(f => f.id === fileId);
    if (!file) return [];

    const allRefs: CrossFileVariableRef[] = [];

    for (const block of file.blocks) {
      if (typeof block.content === 'string') {
        const refs = this.parseCrossFileReferences(block.content);
        const resolvedRefs = refs.map(ref => 
          this.resolveCrossFileReference(ref, fileId, project)
        );
        allRefs.push(...resolvedRefs);
      }
    }

    return allRefs;
  }

  /**
   * Clear resolution cache
   */
  clearCache(): void {
    this.resolvedCache.clear();
  }

  /**
   * Get dependency graph
   */
  getDependencyGraph(): DependencyGraph {
    return this.dependencyGraph;
  }
}

export const crossFileVariableService = new CrossFileVariableService();