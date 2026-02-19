'use client';

import { useState } from 'react';
import { api, FileItem } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, Loader2, Folder, File } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileItem | null;
  onDeleteSuccess: () => void;
}

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  file,
  onDeleteSuccess,
}: DeleteConfirmationDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!file) return;

    try {
      setLoading(true);
      const result = await api.deleteFile(file.path);
      
      toast({
        title: 'Success',
        description: result.message,
      });
      
      onOpenChange(false);
      onDeleteSuccess();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!file) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Delete {file.isDirectory ? 'Folder' : 'File'}
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the {file.isDirectory ? 'folder' : 'file'}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
            {file.isDirectory ? (
              <Folder className="w-5 h-5 text-blue-500" />
            ) : (
              <File className="w-5 h-5 text-gray-500" />
            )}
            <div className="flex-1 min-w-0 grid gap-0.5">
              <p className="font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground break-all line-clamp-3">{file.path}</p>
            </div>
          </div>
          
          {file.isDirectory && (
            <div className="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-500 bg-amber-500/10 p-3 rounded-md border border-amber-500/20">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>This folder and all its contents will be permanently deleted.</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={loading}
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
