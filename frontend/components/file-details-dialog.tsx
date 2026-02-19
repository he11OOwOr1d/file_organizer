'use client';

import { FileItem } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Calendar, HardDrive, Shield, FileType, Clock, Tag } from 'lucide-react';
import { formatFileSize, formatDate } from '@/lib/api';

interface FileDetailsDialogProps {
  file: FileItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FileDetailsDialog({ file, open, onOpenChange }: FileDetailsDialogProps) {
  if (!file) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileType className="w-5 h-5 text-blue-500" />
            File Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border">
            <div className="h-16 w-16 rounded-lg bg-background flex items-center justify-center border shadow-sm">
                <FileType className="w-8 h-8 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate" title={file.name}>
                    {file.name}
                </h3>
                <p className="text-sm text-muted-foreground truncate" title={file.path}>
                    {file.relativePath || '/'}
                </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Type</span>
                    <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium capitalize">{file.category}</span>
                    </div>
                </div>
                <div className="space-y-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Extension</span>
                    <Badge variant="outline" className="uppercase font-mono">
                        {file.extension || 'N/A'}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Size</span>
                    <div className="flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-orange-500" />
                        <span className="text-sm font-medium">{formatFileSize(file.size)}</span>
                    </div>
                </div>
                <div className="space-y-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Permissions</span>
                    <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium font-mono">{(file as any).mode || 'rw-r--r--'}</span>
                    </div>
                </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium">{formatDate(file.created)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Modified</span>
                    <span className="font-medium">{formatDate(file.modified)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Accessed</span>
                    <span className="font-medium">{formatDate(file.accessed || file.modified)}</span>
                </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
