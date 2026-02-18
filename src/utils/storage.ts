import localforage from 'localforage';
import type { Project } from '../types';

// Configure global settings
localforage.config({
  driver: [localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE],
  name: 'mcbe-glyph-painter'
});

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

// Debug initialization
// let initPromise: Promise<void>;

const initStorage = async () => {
  console.group('Storage Initialization Debug');
  try {
    // 1. Check browser support
    console.log('Checking browser support...');
    console.log('IndexedDB support:', !!window.indexedDB);
    console.log('LocalStorage support:', !!window.localStorage);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.log('WebSQL support:', !!(window as any).openDatabase);

    // 2. Try to initialize specifically with IndexedDB first
    try {
        console.log('Attempting to initialize projects store with INDEXEDDB...');
        await projectsStore.setDriver(localforage.INDEXEDDB);
        await projectsStore.ready();
        console.log('SUCCESS: Projects store initialized with INDEXEDDB');
    } catch (e) {
        console.error('FAILED to initialize projects store with INDEXEDDB:', e);
        console.log('Falling back to default driver selection...');
        
        // Force reset to default drivers if specific driver fails
        // IMPORTANT: Set BOTH stores to fallback to avoid mixed states and ensure consistency
        const fallbackDrivers = [localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE];
        await projectsStore.setDriver(fallbackDrivers);
        await filesStore.setDriver(fallbackDrivers); 
    }

    await projectsStore.ready();
    console.log(`[Storage] Projects store ready.`);
    console.log(`[Storage] Active Driver: ${projectsStore.driver()}`); 

    // 3. Try to initialize files store
    try {
      // If we haven't already set the driver for filesStore in the catch block above,
      // we might want to ensure it matches projectsStore if projectsStore is using IndexedDB.
      if (projectsStore.driver() === localforage.INDEXEDDB) {
          await filesStore.setDriver(localforage.INDEXEDDB);
      }
      await filesStore.ready();
    } catch (e) {
       console.error('FAILED to initialize files store:', e);
       await filesStore.setDriver([localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE]);
       await filesStore.ready();
    }

    // 4. Ensure files store is ready
    console.log(`[Storage] Files store ready.`);
    console.log(`[Storage] Active Driver: ${filesStore.driver()}`);

    // Expose for debugging in console
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).debugStorage = {
        projects: projectsStore,
        files: filesStore,
        check: async () => {
            console.log('--- Storage Check ---');
            console.log('Projects Driver:', projectsStore.driver());
            console.log('Files Driver:', filesStore.driver());
            try {
                const pKeys = await projectsStore.keys();
                console.log(`Projects (${pKeys.length}):`, pKeys);
            } catch (e) {
                console.error('Failed to list project keys:', e);
            }
            try {
                const fKeys = await filesStore.keys();
                console.log(`Files (${fKeys.length}):`, fKeys);
            } catch (e) {
                console.error('Failed to list file keys:', e);
            }
            console.log('---------------------');
        },
        reset: async () => {
            console.log('Clearing all stores...');
            await projectsStore.clear();
            await filesStore.clear();
            console.log('Stores cleared.');
        }
    };
    console.log('[Storage] Debug tool available via `window.debugStorage.check()`');

  } catch (err) {
    console.error('CRITICAL: Storage initialization failed:', err);
    // Last resort fallback
    try {
        console.warn('Attempting LAST RESORT fallback to LocalStorage...');
        await projectsStore.setDriver(localforage.LOCALSTORAGE);
        await filesStore.setDriver(localforage.LOCALSTORAGE);
        console.warn('Fallback successful (Performance may be degraded)');
    } catch (fallbackErr) {
        console.error('FATAL: All storage methods failed.', fallbackErr);
    }
  }
  console.groupEnd();
};

const initPromise = initStorage();

export const StorageService = {
  // Projects
  async getAllProjects(): Promise<Project[]> {
    await initPromise;
    const projects: Project[] = [];
    try {
      await projectsStore.iterate((value: Project) => {
        projects.push(value);
      });
    } catch (err) {
      console.error('Failed to iterate projects:', err);
    }
    return projects.sort((a, b) => b.updated_at - a.updated_at);
  },

  async getProject(uuid: string): Promise<Project | null> {
    await initPromise;
    try {
      return await projectsStore.getItem<Project>(uuid);
    } catch (err) {
      console.error(`Failed to get project ${uuid}:`, err);
      return null;
    }
  },

  async saveProject(project: Project): Promise<void> {
    await initPromise;
    try {
      await projectsStore.setItem(project.uuid, project);
      console.log(`Project metadata saved: ${project.uuid}`);
    } catch (err) {
      console.error(`Failed to save project ${project.uuid}:`, err);
      throw err;
    }
  },

  async deleteProject(uuid: string): Promise<void> {
    await initPromise;
    try {
      await projectsStore.removeItem(uuid);
      // Also delete all associated files
      const keys = await filesStore.keys();
      const projectKeys = keys.filter(key => key.startsWith(`${uuid}/`));
      for (const key of projectKeys) {
        await filesStore.removeItem(key);
      }
      console.log(`Project deleted: ${uuid}`);
    } catch (err) {
      console.error(`Failed to delete project ${uuid}:`, err);
      throw err;
    }
  },

  // Files
  // Save file content (Blob or string)
  // Path is relative to project root
  async saveFile(projectUuid: string, path: string, content: Blob | string): Promise<void> {
    await initPromise;
    const key = `${projectUuid}/${path}`;
    try {
      // Log before saving to ensure we have content
      if (content instanceof Blob) {
        console.log(`Saving file (Blob): ${key}, size=${content.size}, type=${content.type}`);
      } else {
        console.log(`Saving file (String): ${key}, length=${content.length}`);
      }
      
      await filesStore.setItem(key, content);
      
      // Verify save
      const saved = await filesStore.getItem(key);
      if (!saved) {
        console.error(`VERIFICATION FAILED: File ${key} was not found after saving!`);
      } else {
        console.log(`Successfully saved and verified: ${key}`);
      }
    } catch (err) {
      console.error(`Failed to save file ${key}:`, err);
      throw err;
    }
  },

  // Get file content
  async getFile(projectUuid: string, path: string): Promise<Blob | string | null> {
    await initPromise;
    const key = `${projectUuid}/${path}`;
    try {
      const item = await filesStore.getItem<Blob | string>(key);
      if (!item) {
        console.warn(`File not found: ${key}`);
      }
      return item;
    } catch (err) {
      console.error(`Failed to get file ${key}:`, err);
      return null;
    }
  },
  
  // Get all files for a project
  async getAllFiles(projectUuid: string): Promise<Record<string, Blob | string>> {
    await initPromise;
    const files: Record<string, Blob | string> = {};
    try {
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
    } catch (err) {
      console.error(`Failed to get all files for project ${projectUuid}:`, err);
    }
    return files;
  },

  // Debugging utility
  async debugPrintAllKeys() {
    await initPromise;
    console.group('Storage Debug Info');
    try {
        const pKeys = await projectsStore.keys();
        console.log('Projects Store Keys:', pKeys);
        const fKeys = await filesStore.keys();
        console.log('Files Store Keys:', fKeys);
    } catch (e) {
        console.error('Debug print failed', e);
    }
    console.groupEnd();
  }
};
