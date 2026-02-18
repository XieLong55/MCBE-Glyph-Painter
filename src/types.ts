export interface Project {
  uuid: string;
  name: string;
  description: string;
  header_description?: string;
  modules_description?: string;
  version: [number, number, number];
  created_at: number;
  updated_at: number;
}

export interface ProjectFile {
  path: string;
  content: Blob | string;
}

export interface Manifest {
  format_version: number;
  header: {
    description: string;
    name: string;
    uuid: string;
    version: [number, number, number];
    min_engine_version?: [number, number, number];
  };
  modules: Array<{
    description: string;
    type: string;
    uuid: string;
    version: [number, number, number];
  }>;
}
