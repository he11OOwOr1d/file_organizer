'use client';

import { useState, useEffect } from 'react';
import { api, FilesResponse, FileItem } from '@/lib/api';
import { FileExplorer } from '@/components/file-explorer';
import { OsConceptsSidebar } from '@/components/os-concepts-sidebar';
import { FileDetails } from '@/components/file-details';
import { BreadcrumbNav } from '@/components/breadcrumb-nav';
import { FileUpload } from '@/components/file-upload';
import { Loader2, RefreshCw, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CategorizationRules } from '@/components/categorization-rules';

export default function Home() {
  const [filesData, setFilesData] = useState<FilesResponse | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [concept, setConcept] = useState<'filesystem' | 'directory' | 'permissions' | 'storage' | 'general'>('general');
  const [currentPath, setCurrentPath] = useState<string>('');
  const [rootPath, setRootPath] = useState<string>('');
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (path?: string) => {
    try {
      setLoading(true);
      const files = await api.getFiles(path);
      setFilesData(files);
      setCurrentPath(files.currentPath);
      
      // Set root path on first load
      if (!rootPath) {
        setRootPath(files.currentPath);
      }
      
      // Deselect file when navigating to new directory
      if (path !== undefined) {
        setSelectedFile(null);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = async (file: FileItem) => {
    setSelectedFile(file);
    
    // Update concept based on file type or interaction
    if (file.isDirectory) {
      setConcept('directory');
    } else {
        // Fetch full metadata including mode for details view
        try {
            const fullMetadata = await api.getFileMetadata(file.path);
            setSelectedFile(fullMetadata);
            setConcept('permissions');
        } catch (e) {
            console.error(e);
            setConcept('storage');
        }
    }
  };

  const handleFolderNavigate = (folderPath: string) => {
    loadData(folderPath);
    setConcept('directory');
  };

  return (
    <main className="flex h-screen w-full bg-background">
      {/* Left Sidebar: OS Concepts */}
      <div className="w-[300px] flex-shrink-0 h-full">
        <OsConceptsSidebar topic={concept} className="h-full" />
      </div>

      {/* Main Content: File Explorer */}
      <div className="flex-1 flex flex-col items-center h-full overflow-hidden border-r">
        <div className="w-full p-4 border-b flex items-center justify-between bg-card/50 backdrop-blur-sm z-10">
          <div className="flex-1">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              File System Visualizer
            </h1>
            <div className="mt-1">
              <BreadcrumbNav 
                currentPath={currentPath}
                rootPath={rootPath}
                onNavigate={handleFolderNavigate}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowUpload(true)} className="gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </Button>
            <CategorizationRules />
            <Button variant="ghost" size="icon" onClick={() => loadData(currentPath)}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="flex-1 w-full overflow-hidden relative">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filesData ? (
            <ScrollArea className="h-full w-full">
              <FileExplorer 
                files={filesData.files} 
                selectedFile={selectedFile}
                onFileClick={handleFileClick}
                onFolderNavigate={handleFolderNavigate}
              />
            </ScrollArea>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No files found
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar: File Details */}
      <div className="w-[350px] flex-shrink-0 h-full overflow-hidden">
        <FileDetails file={selectedFile} onRefresh={() => loadData(currentPath)} />
      </div>

      {/* Upload Dialog */}
      <FileUpload 
        open={showUpload} 
        onOpenChange={setShowUpload}
        onUploadSuccess={() => loadData(currentPath)}
      />
    </main>
  );
}
