import localforage from 'localforage';
import type { Project } from '../types';

// Instance for storing project metadata
const projectsStore = localforage.createInstance({
  name: 'mcbe-glyph-painter',
  storeName: 'projects'
});

// Instance for storing project files
const filesStore = localforage.createInstance({
  name: 'mcbe-glyph-painter',
  storeName: 'files'
});

export const StorageService = {
  // Projects
  async getAllProjects(): Promise<Project[]> {
    const projects: Project[] = [];
    await projectsStore.iterate((value: Project) => {
      projects.push(value);
    });
    return projects.sort((a, b) => b.updated_at - a.updated_at);
  },

  async getProject(uuid: string): Promise<Project | null> {
    return await projectsStore.getItem<Project>(uuid);
  },

  async saveProject(project: Project): Promise<void> {
    await projectsStore.setItem(project.uuid, project);
  },

  async deleteProject(uuid: string): Promise<void> {
    await projectsStore.removeItem(uuid);
    // Also delete all associated files
    const keys = await filesStore.keys();
    const projectKeys = keys.filter(key => key.startsWith(`${uuid}/`));
    for (const key of projectKeys) {
      await filesStore.removeItem(key);
    }
  },

  // Files
  // Save file content (Blob or string)
  // Path is relative to project root
  async saveFile(projectUuid: string, path: string, content: Blob | string): Promise<void> {
    const key = `${projectUuid}/${path}`;
    await filesStore.setItem(key, content);
  },

  // Get file content
  async getFile(projectUuid: string, path: string): Promise<Blob | string | null> {
    const key = `${projectUuid}/${path}`;
    return await filesStore.getItem<Blob | string>(key);
  },
  
  // Get all files for a project
  async getAllFiles(projectUuid: string): Promise<Record<string, Blob | string>> {
    const files: Record<string, Blob | string> = {};
    const keys = await filesStore.keys();
    // Filter keys that belong to this project
    const projectKeys = keys.filter(key => key.startsWith(`${projectUuid}/`));
    
    for (const key of projectKeys) {
      const content = await filesStore.getItem<Blob | string>(key);
      if (content) {
        // Remove uuid prefix to get relative path
        const relativePath = key.substring(projectUuid.length + 1);
        files[relativePath] = content;
      }
    }
    return files;
  }
};
