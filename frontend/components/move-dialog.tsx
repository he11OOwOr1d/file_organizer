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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Folder, ArrowLeft, Loader2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface MoveDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    file: FileItem | null;
    onMoveSuccess: () => void;
    currentPath: string; // Current location of the file to avoid moving to same place
}

export function MoveDialog({
    open,
    onOpenChange,
    file,
    onMoveSuccess,
    currentPath: initialPath,
}: MoveDialogProps) {
    const [currentPath, setCurrentPath] = useState(''); // Navigation path within dialog
    const [folders, setFolders] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [moving, setMoving] = useState(false);
    const { toast } = useToast();

    // Reset to root when opened
    useEffect(() => {
        if (open) {
            setCurrentPath('');
            loadFolders('');
        }
    }, [open]);

    const loadFolders = async (path: string) => {
        try {
            setLoading(true);
            const data = await api.getFiles(path);
            // Filter only directories
            const dirs = data.files.filter(f => f.isDirectory);
            setFolders(dirs);
        } catch (error) {
            console.error('Failed to load folders:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to load folders',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleNavigate = (path: string) => {
        setCurrentPath(path);
        loadFolders(path);
    };

    const handleUp = () => {
        if (!currentPath) return; // at root
        const parentPath = currentPath.split('/').slice(0, -1).join('/');
        // Check if we are at root level explicitly
        const newPath = currentPath.includes('/') ? parentPath : '';
        console.log(`Up from ${currentPath} to ${newPath}`);
        handleNavigate(newPath);
    };

    const handleMove = async () => {
        if (!file) return;

        // Prevent moving into itself
        if (file.isDirectory && currentPath.startsWith(file.path)) {
            toast({
                variant: 'destructive',
                title: 'Invalid Move',
                description: 'Cannot move a folder into itself.',
            });
            return;
        }

        try {
            setMoving(true);
            await api.moveFile(file.path, currentPath);

            toast({
                title: 'Success',
                description: `Moved ${file.name} successfully`,
            });

            onOpenChange(false);
            onMoveSuccess();
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to move file',
            });
        } finally {
            setMoving(false);
        }
    };

    if (!file) return null;

    const isCurrentFolder = currentPath === (file.path.split('/').slice(0, -1).join('/') || '');
    // Note: Comparing exact paths might be tricky depending on how backend returns them (absolute vs relative).
    // But assuming api.getFiles returns consistent paths.

    // Actually, we can just check if file.path starts with currentPath and has same parent.
    // Let's rely on backend error if it's same location, or check equality.

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] h-[500px] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ArrowLeft
                            className={cn("w-5 h-5 cursor-pointer hover:bg-muted rounded-full p-0.5 transition-colors", !currentPath && "opacity-20 pointer-events-none")}
                            onClick={handleUp}
                        />
                        Move {file.name}
                    </DialogTitle>
                    <DialogDescription>
                        Select a destination folder
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 border rounded-md overflow-hidden bg-muted/10 relative">
                    {/* Current Path Header */}
                    <div className="p-2 border-b bg-muted/20 text-xs font-mono truncate px-4">
                        {currentPath || 'Root'}
                    </div>

                    <ScrollArea className="h-full">
                        <div className="p-2 space-y-1">
                            {loading ? (
                                <div className="flex justify-center p-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : folders.length === 0 ? (
                                <div className="text-center p-8 text-muted-foreground text-sm">
                                    No subfolders here
                                </div>
                            ) : (
                                folders.map(folder => (
                                    <div
                                        key={folder.path}
                                        className={cn(
                                            "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors hover:bg-accent",
                                            // Highlight if it's the folder itself
                                            file.path === folder.path && "opacity-50 pointer-events-none bg-muted"
                                        )}
                                        onClick={() => handleNavigate(folder.path)}
                                    >
                                        <div className="bg-blue-500/10 p-1.5 rounded-md text-blue-500">
                                            <Folder className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium truncate flex-1">{folder.name}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>

                <DialogFooter className="flex-shrink-0 mt-4">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={moving}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleMove} disabled={moving || loading}>
                        {moving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Move Here
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
