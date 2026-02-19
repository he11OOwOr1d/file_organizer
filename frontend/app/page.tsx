'use client';

import { useState, useEffect } from 'react';
import { api, FilesResponse, FileItem } from '@/lib/api';
import { FileExplorer } from '@/components/file-explorer';
import { AppSidebar } from '@/components/app-sidebar';
import { TopBar } from '@/components/top-bar';
import { FileDetailsDialog } from '@/components/file-details-dialog';
import { FileUpload } from '@/components/file-upload';
import { AllFilesView } from '@/components/all-files-view';
import { CreateFolderDialog } from '@/components/create-folder-dialog';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { RenameDialog } from '@/components/rename-dialog';
import { RecentFilesView } from '@/components/recent-files-view';
import { FilePreviewDialog } from '@/components/file-preview-dialog';
import { StorageAnalysisDialog } from '@/components/storage-analysis-dialog';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function Home() {
  // Data State
  const [filesData, setFilesData] = useState<FilesResponse | null>(null);
  const [allFilesData, setAllFilesData] = useState<(FileItem & { relativePath?: string })[]>([]);
  const [recentFilesData, setRecentFilesData] = useState<FileItem[]>([]);
  const [searchResults, setSearchResults] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Navigation & View State
  const [currentPath, setCurrentPath] = useState<string>('');
  const [rootPath, setRootPath] = useState<string>('');
  const [viewMode, setViewMode] = useState<'folders' | 'recent' | 'trash' | 'starred' | 'search'>('folders');
  const [fileViewType, setFileViewType] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');

  // Interaction State
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showStorageDialog, setShowStorageDialog] = useState(false);
  
  // Action Targets
  const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null);
  const [fileToRename, setFileToRename] = useState<FileItem | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Global Key Listener for Quick Look
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
         // Don't trigger if user is typing in an input
         if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
             return;
         }
         
         e.preventDefault();
         if (selectedFile) {
             console.log("Space pressed, toggling preview for", selectedFile.name);
             setShowPreviewDialog(prev => !prev);
         }
      }
      
      if (e.code === 'Escape' && showPreviewDialog) {
          setShowPreviewDialog(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFile, showPreviewDialog]);

  // Search Effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch(searchQuery);
      } else if (viewMode === 'search') {
        // If search cleared, go back to folders
        setViewMode('folders');
        loadData(currentPath);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearch = async (query: string) => {
    try {
      setLoading(true);
      setViewMode('search');
      const data = await api.searchFiles(query, currentPath);
      setSearchResults(data.files);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async (path?: string) => {
    try {
      setLoading(true);
      const files = await api.getFiles(path);
      setFilesData(files);
      setCurrentPath(files.currentPath);
      
      if (!rootPath) {
        setRootPath(files.currentPath);
      }
      
      if (path !== undefined) {
        setSelectedFile(null);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllFiles = async () => {
    try {
      setLoading(true);
      const data = await api.getAllFiles(currentPath);
      setAllFilesData(data.files);
    } catch (error) {
      console.error('Failed to load all files:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentFiles = async () => {
    try {
      setLoading(true);
      const data = await api.getRecentFiles();
      setRecentFilesData(data.files);
    } catch (error) {
      console.error('Failed to load recent files:', error);
    } finally {
      setLoading(false);
    }
  };

  // View Switching
  const handleViewChange = (view: 'folders' | 'recent' | 'trash' | 'starred') => {
    setViewMode(view);
    setSearchQuery(''); // Clear search on view change
    if (view === 'recent') {
      loadRecentFiles();
    } else if (view === 'folders') {
      loadData(currentPath);
    }
    // Trash and Starred are placeholders for now
  };

  // File Actions
  const handleFileClick = async (file: FileItem) => {
    // Toggle selection if already selected
    if (selectedFile?.path === file.path) {
        setSelectedFile(null);
        return;
    }

    setSelectedFile(file);
    if (!file.isDirectory) {
      try {
        const fullMetadata = await api.getFileMetadata(file.path);
        setSelectedFile(fullMetadata);
        // Don't auto-open details dialog on click, let user use Info button
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleFolderNavigate = (folderPath: string) => {
    loadData(folderPath);
  };

  const handleDelete = (file: FileItem) => {
    setFileToDelete(file);
    setShowDeleteDialog(true);
  };

  const handleRename = (file: FileItem) => {
    setFileToRename(file);
    setShowRenameDialog(true);
  };

  const handleInfo = (file: FileItem) => {
      setSelectedFile(file);
      setShowDetailsDialog(true);
  }

  const refreshCurrentView = () => {
    if (viewMode === 'folders') loadData(currentPath);
    else if (viewMode === 'recent') loadRecentFiles();
    else if (viewMode === 'search') handleSearch(searchQuery);
  };

  return (
    <main className="flex h-screen w-full bg-background overflow-hidden font-sans antialiased text-foreground">
      {/* 1. App Sidebar */}
      <AppSidebar 
        currentView={viewMode as any}
        onViewChange={handleViewChange}
        onStorageClick={() => setShowStorageDialog(true)}
        className="w-64 flex-shrink-0 hidden md:flex"
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-background/50 relative">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-96 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-full h-96 bg-purple-500/5 rounded-full blur-3xl translate-y-1/2 pointer-events-none" />

        {/* 3. Top Bar */}
        <TopBar 
          currentPath={currentPath}
          rootPath={rootPath}
          onNavigate={handleFolderNavigate}
          viewMode={fileViewType}
          onViewModeChange={setFileViewType}
          onUpload={() => setShowUpload(true)}
          onCreateFolder={() => setShowCreateFolder(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedFile={selectedFile}
          onRename={handleRename}
          onDelete={handleDelete}
          onInfo={handleInfo}
        />

        {/* 4. Content Content */}
        <div className="flex-1 overflow-hidden relative z-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground animate-in fade-in duration-500">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p>Loading...</p>
            </div>
          ) : (
            <div className="h-full w-full">
               {/* View Switcher Logic */}
               {viewMode === 'search' ? (
                   <div className="h-full flex flex-col">
                        <div className="px-6 py-4 border-b bg-muted/20">
                            <h2 className="font-semibold">Search Results</h2>
                            <p className="text-sm text-muted-foreground">Found {searchResults.length} results for "{searchQuery}"</p>
                        </div>
                        <AllFilesView 
                            files={searchResults}
                            onFileClick={handleFileClick}
                            onRename={handleRename}
                            onDelete={handleDelete}
                        />
                   </div>
               ) : viewMode === 'recent' ? (
                 <RecentFilesView 
                   files={recentFilesData}
                   onFileClick={handleFileClick}
                 />
                ) : viewMode === 'folders' && filesData ? (
                 <div className="h-full w-full">
                    {fileViewType === 'list' ? (
                        <div className="h-full flex flex-col">
                            <AllFilesView 
                                files={filesData.files}
                                onFileClick={handleFileClick}
                                onRename={handleRename}
                                onDelete={handleDelete}
                                onFolderNavigate={handleFolderNavigate}
                                hideSearch={true}
                                hidePath={true}
                            />
                        </div>
                    ) : (
                        <ScrollArea className="h-full w-full p-4">
                           <FileExplorer 
                             files={filesData.files} 
                             selectedFile={selectedFile}
                             onFileClick={handleFileClick}
                             onFolderNavigate={handleFolderNavigate}
                           />
                         </ScrollArea>
                    )}
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
                    <div className="bg-muted/50 p-6 rounded-full mb-4">
                        <Loader2 className="w-10 h-10 opacity-20" /> 
                    </div>
                    <p className="text-lg font-medium">Coming Soon</p>
                 </div>
               )}
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <FileUpload 
        open={showUpload} 
        onOpenChange={setShowUpload}
        onUploadSuccess={refreshCurrentView}
      />
      
      <CreateFolderDialog
        open={showCreateFolder}
        onOpenChange={setShowCreateFolder}
        currentPath={currentPath}
        onFolderCreated={refreshCurrentView}
      />

      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        file={fileToDelete}
        onDeleteSuccess={() => {
            refreshCurrentView();
            setSelectedFile(null); // Deselect after delete
        }}
      />

      <RenameDialog
        open={showRenameDialog}
        onOpenChange={setShowRenameDialog}
        file={fileToRename}
        onRenameSuccess={refreshCurrentView}
      />

      <FilePreviewDialog 
         file={selectedFile}
         open={showPreviewDialog}
         onOpenChange={setShowPreviewDialog}
      />

      <FileDetailsDialog 
        file={selectedFile}
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
      />
      
      <StorageAnalysisDialog 
         open={showStorageDialog}
         onOpenChange={setShowStorageDialog}
       />
    </main>
  );
}
