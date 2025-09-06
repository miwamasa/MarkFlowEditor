import { ProjectData, StorageService } from '../types';

const STORAGE_KEY = 'markflow-editor-project';

export class LocalStorageService implements StorageService {
  async saveProject(project: ProjectData): Promise<void> {
    try {
      const serializedProject = JSON.stringify(project, (key, value) => {
        if (value instanceof Date) {
          return { __type: 'Date', value: value.toISOString() };
        }
        return value;
      });
      localStorage.setItem(STORAGE_KEY, serializedProject);
    } catch (error) {
      console.error('Failed to save project:', error);
      throw new Error('Failed to save project to local storage');
    }
  }

  async loadProject(): Promise<ProjectData | null> {
    try {
      const serializedProject = localStorage.getItem(STORAGE_KEY);
      if (!serializedProject) {
        return null;
      }

      const project = JSON.parse(serializedProject, (key, value) => {
        if (value && typeof value === 'object' && value.__type === 'Date') {
          return new Date(value.value);
        }
        return value;
      });

      return project as ProjectData;
    } catch (error) {
      console.error('Failed to load project:', error);
      throw new Error('Failed to load project from local storage');
    }
  }

  exportProject(project: ProjectData): string {
    return JSON.stringify(project, (key, value) => {
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    }, 2);
  }

  importProject(jsonData: string): ProjectData {
    try {
      const project = JSON.parse(jsonData, (key, value) => {
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
          return new Date(value);
        }
        return value;
      });

      this.validateProject(project);
      return project as ProjectData;
    } catch (error) {
      console.error('Failed to import project:', error);
      throw new Error('Invalid project data format');
    }
  }

  private validateProject(project: any): void {
    const requiredFields = ['id', 'name', 'createdAt', 'updatedAt', 'globalVariables', 'files', 'metadata'];
    
    for (const field of requiredFields) {
      if (!(field in project)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (!Array.isArray(project.files)) {
      throw new Error('Files must be an array');
    }

    if (!Array.isArray(project.globalVariables)) {
      throw new Error('Global variables must be an array');
    }
  }

  clearProject(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  hasStoredProject(): boolean {
    return localStorage.getItem(STORAGE_KEY) !== null;
  }
}

export const storageService = new LocalStorageService();