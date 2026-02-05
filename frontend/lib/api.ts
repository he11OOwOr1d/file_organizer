// API client for file system backend

const API_URL = 'http://localhost:5001/api';

export interface FileItem {
  name: string;
  path: string;
  size: number;
  isDirectory: boolean;
  modified: string;
  created: string;
  extension: string;
  category: string;
  mode?: string;
}

export interface FilesResponse {
  currentPath: string;
  files: FileItem[];
  total: number;
}

export interface CategoryStats {
  count: number;
  size: number;
  files: string[];
}

export interface CategorizeResponse {
  categories: Record<string, CategoryStats>;
  totalFiles: number;
  totalSize: number;
}

export const api = {
  async getFiles(path?: string): Promise<FilesResponse> {
    const url = path ? `${API_URL}/files?path=${encodeURIComponent(path)}` : `${API_URL}/files`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch files');
    return response.json();
  },

  async getFileMetadata(path: string): Promise<FileItem> {
    const response = await fetch(`${API_URL}/files/metadata?path=${encodeURIComponent(path)}`);
    if (!response.ok) throw new Error('Failed to fetch file metadata');
    return response.json();
  },

  async getCategorization(path?: string): Promise<CategorizeResponse> {
    const url = path ? `${API_URL}/files/categorize?path=${encodeURIComponent(path)}` : `${API_URL}/files/categorize`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch categorization');
    return response.json();
  },

  async getCategoryRules(): Promise<Record<string, string[]>> {
    const response = await fetch(`${API_URL}/categories/rules`);
    if (!response.ok) throw new Error('Failed to fetch categorization rules');
    return response.json();
  },

  async moveFile(sourcePath: string, destinationPath: string): Promise<void> {
    const response = await fetch(`${API_URL}/files/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourcePath, destinationPath }),
    });
    if (!response.ok) throw new Error('Failed to move file');
  },

  async uploadFile(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/files/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Failed to upload file');
    return response.json();
  },
};

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
