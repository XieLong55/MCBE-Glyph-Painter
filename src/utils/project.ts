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
      console.log(`Fetching default asset: /${asset}`);
      const response = await fetch(`/${asset}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      console.log(`Fetched ${asset}, size: ${blob.size}`);
      
      // Ensure correct MIME type
      const finalBlob = new Blob([blob], { type: 'image/png' });
      // Save to font/ directory
      await StorageService.saveFile(projectUuid, `font/${asset}`, finalBlob);
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
    let manifestFile = zip.file('manifest.json');
    
    if (!manifestFile) {
      // Try to find manifest.json in subdirectories
      const files = Object.keys(zip.files);
      const manifestPath = files.find(path => path.endsWith('manifest.json'));
      if (manifestPath) {
        manifestFile = zip.file(manifestPath);
      } else {
        throw new Error('manifest.json not found');
      }
    }

    let manifestContent = '';
    if (manifestFile) {
      manifestContent = await manifestFile.async('string');
    }

    // Clean up content to handle potential JSON issues (comments, trailing commas, BOM)
    // 0. Remove BOM (Byte Order Mark)
    manifestContent = manifestContent.replace(/^\uFEFF/, '');
    // 1. Remove single-line comments //
    manifestContent = manifestContent.replace(/\/\/.*$/gm, '');
    // 2. Remove multi-line comments /* */
    manifestContent = manifestContent.replace(/\/\*[\s\S]*?\*\//g, '');
    // 3. Remove trailing commas
    manifestContent = manifestContent.replace(/,(\s*[}\]])/g, '$1');

    return { manifest: JSON.parse(manifestContent), zip };
  } catch (error) {
    console.error('Failed to parse manifest', error);
    return null;
  }
};

export const exportProject = async (projectUuid: string): Promise<void> => {
  const project = await StorageService.getProject(projectUuid);
  if (!project) throw new Error('Project not found');

  const zip = new JSZip();
  const allFiles = await StorageService.getAllFiles(projectUuid);

  // Add all files to zip
  for (const [path, content] of Object.entries(allFiles)) {
    // If content is a Blob, we can pass it directly.
    // If it's a string, we can pass it directly.
    zip.file(path, content);
  }

  // Generate zip file
  const blob = await zip.generateAsync({ type: 'blob' });
  
  // Trigger download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mcpack`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
    
    // Check if the file is an image
    const isImage = /\.(png|jpg|jpeg|gif|bmp)$/i.test(filePath);
    
    let content: Blob | string;
    if (isImage) {
        const blob = await zip.file(filePath)!.async('blob');
        console.log(`Extracted image ${filePath}, size: ${blob.size}`);
        // Re-create blob with correct MIME type
        const mimeType = getMimeType(filePath);
        content = new Blob([blob], { type: mimeType });
    } else {
        // For other files, we can also store as blob to be safe, or text
        // Storing as blob is safer for binary integrity
        const blob = await zip.file(filePath)!.async('blob');
        console.log(`Extracted file ${filePath}, size: ${blob.size}`);
        content = blob;
    }
    
    await StorageService.saveFile(projectUuid, filePath, content);
  }

  // Save project metadata
  await StorageService.saveProject(project);

  return project;
};

function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'gif': return 'image/gif';
    case 'bmp': return 'image/bmp';
    case 'json': return 'application/json';
    default: return 'application/octet-stream';
  }
}
