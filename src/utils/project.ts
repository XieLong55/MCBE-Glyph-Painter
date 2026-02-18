import { v4 as uuidv4 } from 'uuid';
import JSZip from 'jszip';
import type { Manifest, Project } from '../types';
import { StorageService } from './storage';

export const createNewProject = async (
  name: string,
  description: string,
  version: [number, number, number] = [1, 0, 0],
  moduleDescription?: string
): Promise<Project> => {
  const projectUuid = uuidv4();
  const moduleUuid = uuidv4();

  const manifest: Manifest = {
    format_version: 1,
    header: {
      description: description,
      name: name,
      uuid: projectUuid,
      version: version
    },
    modules: [
      {
        description: moduleDescription || description,
        type: 'resources',
        uuid: moduleUuid,
        version: version
      }
    ]
  };

  const project: Project = {
    uuid: projectUuid,
    name,
    description,
    header_description: description,
    modules_description: moduleDescription || description,
    version,
    created_at: Date.now(),
    updated_at: Date.now()
  };

  // Save manifest
  await StorageService.saveFile(
    projectUuid,
    'manifest.json',
    JSON.stringify(manifest, null, 2)
  );

  // Copy default assets from public folder
  const defaultAssets = ['glyph_E0.png', 'glyph_E1.png'];
  for (const asset of defaultAssets) {
    try {
      const response = await fetch(`/${asset}`);
      const blob = await response.blob();
      await StorageService.saveFile(projectUuid, asset, blob);
    } catch (error) {
      console.error(`Failed to load default asset: ${asset}`, error);
    }
  }

  // Save project metadata
  await StorageService.saveProject(project);

  return project;
};

export const parseProjectManifest = async (file: File): Promise<{ manifest: Manifest, zip: JSZip } | null> => {
  try {
    const zip = await JSZip.loadAsync(file);
    const manifestFile = zip.file('manifest.json');
    
    if (!manifestFile) {
      // Try to find manifest.json in subdirectories
      const files = Object.keys(zip.files);
      const manifestPath = files.find(path => path.endsWith('manifest.json'));
      if (!manifestPath) {
        throw new Error('manifest.json not found');
      }
      const content = await zip.file(manifestPath)!.async('string');
      // Strip comments if any (JSON doesn't support comments but MC sometimes has them, though strict JSON parser will fail)
      // For now assume valid JSON
      return { manifest: JSON.parse(content), zip };
    }

    const content = await manifestFile.async('string');
    return { manifest: JSON.parse(content), zip };
  } catch (error) {
    console.error('Failed to parse manifest', error);
    return null;
  }
};

export const saveImportedProject = async (
  manifest: Manifest,
  zip: JSZip
): Promise<Project> => {
  const projectUuid = manifest.header.uuid;
  
  const project: Project = {
    uuid: projectUuid,
    name: manifest.header.name,
    description: manifest.header.description,
    header_description: manifest.header.description,
    modules_description: manifest.modules?.[0]?.description,
    version: manifest.header.version,
    created_at: Date.now(),
    updated_at: Date.now()
  };

  // Save all files
  const files = Object.keys(zip.files);
  for (const filePath of files) {
    if (zip.files[filePath].dir) continue;
    
    const content = await zip.file(filePath)!.async('blob');
    // If manifest was in a subdir, we might want to normalize paths?
    // For now, save as is.
    await StorageService.saveFile(projectUuid, filePath, content);
  }

  // Save project metadata
  await StorageService.saveProject(project);

  return project;
};
