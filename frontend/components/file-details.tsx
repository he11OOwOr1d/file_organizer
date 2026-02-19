'use client';

import { FileItem } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, HardDrive, Shield, FileType, Clock, Edit, Move, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MoveFileDialog } from './move-file-dialog';
import { useState } from 'react';
import { api } from '@/lib/api';

interface FileDetailsProps {
    file: FileItem | null;
    onRefresh?: () => void;
    onRename?: (file: FileItem) => void;
    onDelete?: (file: FileItem) => void;
}

export function FileDetails({ file, onRefresh, onRename, onDelete }: FileDetailsProps) {
  const [showMoveDialog, setShowMoveDialog] = useState(false);

  const handleMove = async (destinationPath: string) => {
      if (!file) return;
      try {
          await api.moveFile(file.path, destinationPath);
          // Refresh the file list after successful move
          if (onRefresh) {
              onRefresh();
          }
      } catch (e) {
          console.error("Failed to move file", e);
          alert("Failed to move file. See console.");
      }
  };

  if (!file) {
    return (
      <Card className="h-full flex flex-col items-center justify-center p-6 text-muted-foreground bg-card/50 backdrop-blur-xl">
        <FileType className="w-12 h-12 mb-4 opacity-20" />
        <p>Select a file to view detailed metadata</p>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  return (
    <>
        <Card className="h-full flex flex-col bg-card/50 backdrop-blur-xl border-l">
        <div className="p-6 border-b bg-muted/20">
            <h3 className="font-semibold text-lg truncate" title={file.name}>
            {file.name}
            </h3>
            <div className="flex gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                    {file.extension || 'n/a'}
                </Badge>
                <Badge variant="outline" className="text-xs">
                    {file.category}
                </Badge>
            </div>
        </div>
        
        <div className="p-6 space-y-6">
            <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Storage Info</h4>
                
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-md text-blue-500">
                        <HardDrive className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-sm font-medium">Size</p>
                        <p className="text-xs text-muted-foreground">{file.size} bytes</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-md text-green-500">
                        <Shield className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-sm font-medium">Permissions</p>
                        <p className="text-xs text-muted-foreground font-mono">
                            {/* Fallback if mode isn't available yet */}
                            {(file as any).mode ? (file as any).mode : 'rw-r--r--'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Timestamps</h4>
                
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/10 rounded-md text-orange-500">
                        <Clock className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-sm font-medium">Created</p>
                        <p className="text-xs text-muted-foreground">{formatDate(file.created)}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-md text-purple-500">
                        <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-sm font-medium">Last Modified</p>
                        <p className="text-xs text-muted-foreground">{formatDate(file.modified)}</p>
                    </div>
                </div>
            </div>
            
            <div className="p-4 bg-muted/30 rounded-lg border mt-6 space-y-3">
                <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-primary">OS Insight:</span> Metadata like this is stored in the <strong>inode</strong> table.
                </p>
            </div>

            <div className="pt-4 border-t space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Actions</h4>
                <div className="grid grid-cols-3 gap-2">
                    <Button 
                        variant="outline" 
                        className="flex flex-col h-14 gap-1 hover:bg-muted text-blue-500"
                        onClick={() => file && onRename?.(file)}
                        disabled={!onRename}
                    >
                        <Edit className="w-4 h-4" />
                        <span className="text-[10px]">Rename</span>
                    </Button>
                    <Button 
                        variant="outline" 
                        className="flex flex-col h-14 gap-1 hover:bg-muted text-orange-500"
                        onClick={() => setShowMoveDialog(true)}
                    >
                        <Move className="w-4 h-4" />
                        <span className="text-[10px]">Move</span>
                    </Button>
                    <Button 
                        variant="outline" 
                        className="flex flex-col h-14 gap-1 hover:bg-muted text-red-500"
                        onClick={() => file && onDelete?.(file)}
                        disabled={!onDelete}
                    >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-[10px]">Delete</span>
                    </Button>
                </div>
            </div>
        </div>
        </Card>

        {showMoveDialog && (
            <MoveFileDialog 
                open={showMoveDialog} 
                onOpenChange={setShowMoveDialog}
                sourceFile={file}
                onMove={handleMove}
                files={[]} // Not needed as dialog fetches its own files
            />
        )}
    </>
  );
}

