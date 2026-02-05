'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Folder, ArrowLeft, Loader2, Move } from "lucide-react";
import { api, FileItem } from "@/lib/api";

interface MoveFileDialogProps {
  files: FileItem[]; // Pass current files to navigate
  sourceFile: FileItem;
  onMove: (destinationPath: string) => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MoveFileDialog({ sourceFile, onMove, open, onOpenChange }: MoveFileDialogProps) {
  const [currentPath, setCurrentPath] = useState<string>(''); // Absolute path from API would be better, but we need to track relative for UI
  // Actually, we need to browse the file system.
  // The API `getFiles(path)` returns files in that path.
  // We need to maintain a navigation state here.
  
  const [navFiles, setNavFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]); // Track path history for "Back" interaction

  // Initial load: root of demo dir (or current dir of file?)
  // Let's start at root.
  // We need to know the root path or just use empty string for API to default to root.
  const [navPath, setNavPath] = useState<string>(''); 

  useEffect(() => {
    if (open) {
        loadDir('');
        setHistory([]);
    }
  }, [open]);

  const loadDir = async (path: string) => {
    try {
        setLoading(true);
        const res = await api.getFiles(path);
        // Filter only directories
        const dirs = res.files.filter(f => f.isDirectory && f.path !== sourceFile.path); // Don't move into self if directory
        setNavFiles(dirs);
        setNavPath(res.currentPath);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const handleEnterDir = (dir: FileItem) => {
      setHistory(prev => [...prev, navPath]);
      loadDir(dir.path);
  };

  const handleBack = () => {
      if (history.length === 0) return;
      const prev = history[history.length - 1];
      setHistory(prevStack => prevStack.slice(0, -1));
      loadDir(prev);
  };

  const handleConfirmMove = async () => {
      if (!navPath) {
          console.error("Move failed: navPath is empty");
          return;
      }
      console.log("Confirming move to:", navPath);
      await onMove(navPath);
      onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle>Move "{sourceFile?.name}"</DialogTitle>
          <DialogDescription>
            Select a destination folder.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center gap-2 py-2 px-1">
            <Button 
                variant="ghost" 
                size="icon" 
                disabled={history.length === 0 || loading}
                onClick={handleBack}
            >
                <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="text-sm text-muted-foreground truncate flex-1 font-mono">
                {navPath.split('/').pop() || 'Root'}
            </div>
        </div>

        <div className="h-[300px] border rounded-md bg-muted/20">
            <ScrollArea className="h-full p-2">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : navFiles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
                        <Folder className="w-8 h-8 mb-2 opacity-50" />
                        No subfolders here
                    </div>
                ) : (
                    <div className="space-y-1">
                        {navFiles.map(dir => (
                             <Button
                                key={dir.path}
                                variant="ghost"
                                className="w-full justify-start gap-2 h-10 font-normal"
                                onClick={() => handleEnterDir(dir)}
                             >
                                 <Folder className="w-4 h-4 text-blue-500" />
                                 {dir.name}
                             </Button>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleConfirmMove} className="gap-2" disabled={loading || !navPath}>
              <Move className="w-4 h-4" />
              Move Here
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
