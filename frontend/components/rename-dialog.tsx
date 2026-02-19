'use client';

import { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileItem | null;
  onRenameSuccess: () => void;
}

export function RenameDialog({
  open,
  onOpenChange,
  file,
  onRenameSuccess,
}: RenameDialogProps) {
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Update newName when file changes
  useEffect(() => {
    if (file) {
      setNewName(file.name);
    }
  }, [file]);

  const handleRename = async () => {
    if (!file || !newName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a valid name',
      });
      return;
    }

    if (newName === file.name) {
      onOpenChange(false);
      return;
    }

    try {
      setLoading(true);
      const result = await api.renameFile(file.path, newName);

      toast({
        title: 'Success',
        description: result.message,
      });

      setNewName('');
      onOpenChange(false);
      onRenameSuccess();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to rename',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleRename();
    }
  };

  if (!file) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="w-5 h-5" />
            Rename {file.isDirectory ? 'Folder' : 'File'}
          </DialogTitle>
          <DialogDescription>
            Enter a new name for the {file.isDirectory ? 'folder' : 'file'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="new-name">New Name</Label>
            <Input
              id="new-name"
              placeholder="Enter new name"
              value={newName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              autoFocus
              onFocus={(e) => e.target.select()}
            />
          </div>

          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Current:</span> {file.name}
          </div>

          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Location:</span> {file.path}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleRename} disabled={loading || !newName.trim()}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Rename
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
