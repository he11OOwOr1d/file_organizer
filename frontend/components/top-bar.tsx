'use client';

import { Search, Bell, Info, Plus, ChevronRight, Home, LayoutGrid, List as ListIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BreadcrumbNav } from '@/components/breadcrumb-nav';
import { FileItem } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TopBarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  rootPath: string;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onUpload: () => void;
  onCreateFolder: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedFile: FileItem | null;
  onRename: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
  onInfo: (file: FileItem) => void;
}

export function TopBar({
  currentPath,
  onNavigate,
  rootPath,
  viewMode,
  onViewModeChange,
  onUpload,
  onCreateFolder,
  searchQuery,
  onSearchChange,
  selectedFile,
  onRename,
  onDelete,
  onInfo
}: TopBarProps) {
  return (
    <div className="h-16 border-b bg-background/50 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex-1 flex items-center gap-4">
        <BreadcrumbNav 
          currentPath={currentPath}
          rootPath={rootPath}
          onNavigate={onNavigate}
        />
      </div>

      <div className="flex-1 max-w-xl px-8">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search files, folders..." 
            className="pl-10 bg-muted/40 border-transparent focus:bg-background focus:border-primary/20 transition-all rounded-xl"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-end gap-3">
        {selectedFile ? (
          // Context Actions
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
             <div className="text-sm text-muted-foreground mr-2 hidden md:block">
                Selected: <span className="font-medium text-foreground">{selectedFile.name}</span>
             </div>
             <Button variant="secondary" size="sm" onClick={() => onRename(selectedFile)}>
               Rename
             </Button>
             <Button variant="destructive" size="sm" onClick={() => onDelete(selectedFile)}>
               Delete
             </Button>
             <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => onInfo(selectedFile)}>
               <Info className="w-4 h-4" />
             </Button>
          </div>
        ) : (
          // Default Actions
          <>
            <div className="flex items-center border rounded-lg p-0.5 bg-muted/40">
              <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 rounded-sm ${viewMode === 'list' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
                onClick={() => onViewModeChange('list')}
              >
                <ListIcon className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 rounded-sm ${viewMode === 'grid' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
                onClick={() => onViewModeChange('grid')} 
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>

            <div className="h-6 w-px bg-border mx-2" />

            <Button onClick={onUpload} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              Upload
            </Button>
            
            <Button onClick={onCreateFolder} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
              <Plus className="w-4 h-4" />
              New Folder
            </Button>
            
            <div className="h-6 w-px bg-border mx-2" />
            
            <Avatar className="h-8 w-8 ml-2 border cursor-pointer hover:ring-2 ring-primary/20 transition-all">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>NR</AvatarFallback>
            </Avatar>
          </>
        )}
      </div>
    </div>
  );
}
