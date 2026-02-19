'use client';

import { FileItem } from '@/lib/api';
import { motion } from 'framer-motion';
import { File, Folder, FileCode, FileText, FileImage, FileVideo, FileAudio, FileArchive, Trash2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatFileSize, formatDate } from '@/lib/api';

interface TrashViewProps {
    files: FileItem[];
    onRestore: (file: FileItem) => void;
    onDeleteForever: (file: FileItem) => void;
}

const getFileIcon = (file: FileItem) => {
    if (file.isDirectory) return Folder;

    switch (file.category) {
        case 'code':
            return FileCode;
        case 'documents':
            return FileText;
        case 'images':
            return FileImage;
        case 'videos':
            return FileVideo;
        case 'audio':
            return FileAudio;
        case 'compressed':
            return FileArchive;
        default:
            return File;
    }
};

export function TrashView({ files, onRestore, onDeleteForever }: TrashViewProps) {
    if (files.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <div className="bg-muted/50 p-6 rounded-full mb-4">
                    <Trash2 className="w-10 h-10 opacity-20" />
                </div>
                <p className="text-lg font-medium">Trash is empty</p>
                <p className="text-sm">Items moved to trash will appear here</p>
            </div>
        );
    }

    return (
        <div className="p-6 h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Trash2 className="w-5 h-5" /> Trash
                    </h2>
                    <p className="text-sm text-muted-foreground">Items in trash are eventually deleted</p>
                </div>
                <Button variant="destructive" size="sm" onClick={() => {/* TODO: Empty Trash Logic if needed globally */ }}>
                    Empty Trash
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-2">
                {files.map((file, index) => {
                    const Icon = getFileIcon(file);
                    // @ts-ignore - originalPath exists on trash items
                    const originalPath = file.originalPath || 'Unknown Location';

                    return (
                        <motion.div
                            key={file.path}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                                <div className="flex items-center gap-4 overflow-hidden">
                                    <div className={`p-2 rounded-lg bg-muted text-muted-foreground`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-medium truncate">{file.name}</p>
                                        <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                                            <span>Size: {file.isDirectory ? '-' : formatFileSize(file.size)}</span>
                                            <span>Original: {originalPath}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 gap-2"
                                        onClick={() => onRestore(file)}
                                    >
                                        <RotateCcw className="w-3 h-3" /> Restore
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        className="h-8 gap-2"
                                        onClick={() => onDeleteForever(file)}
                                    >
                                        <Trash2 className="w-3 h-3" /> Delete Forever
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
