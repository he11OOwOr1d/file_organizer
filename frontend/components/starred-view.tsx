'use client';

import { FileItem, formatFileSize, formatDate } from '@/lib/api';
import { File, Folder, FileText, Image, Video, Music, FileCode, FileArchive, Table as TableIcon, Star } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface StarredViewProps {
    files: FileItem[];
    onFileClick: (file: FileItem) => void;
    onUnstar: (file: FileItem) => void;
}

function getFileIcon(file: FileItem) {
    if (file.isDirectory) {
        return <Folder className="w-4 h-4 text-blue-500" />;
    }

    switch (file.category) {
        case 'images':
            return <Image className="w-4 h-4 text-green-500" />;
        case 'videos':
            return <Video className="w-4 h-4 text-purple-500" />;
        case 'audio':
            return <Music className="w-4 h-4 text-pink-500" />;
        case 'documents':
            return <FileText className="w-4 h-4 text-orange-500" />;
        case 'code':
            return <FileCode className="w-4 h-4 text-cyan-500" />;
        case 'compressed':
            return <FileArchive className="w-4 h-4 text-yellow-500" />;
        case 'spreadsheets':
            return <TableIcon className="w-4 h-4 text-emerald-500" />;
        default:
            return <File className="w-4 h-4 text-gray-500" />;
    }
}

export function StarredView({ files, onFileClick, onUnstar }: StarredViewProps) {
    if (files.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <div className="bg-yellow-500/10 p-4 rounded-full mb-4">
                    <Star className="w-8 h-8 text-yellow-500" />
                </div>
                <h3 className="text-lg font-medium">No starred files</h3>
                <p className="text-sm">Star files to access them quickly from here.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b bg-card/50 backdrop-blur-sm">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" fill="currentColor" />
                    Starred Files
                </h2>
            </div>

            <ScrollArea className="flex-1">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead className="text-right">Size</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {files.map((file) => (
                            <TableRow
                                key={file.path}
                                className="hover:bg-muted/50 group cursor-pointer"
                                onClick={() => onFileClick(file)}
                            >
                                <TableCell>{getFileIcon(file)}</TableCell>
                                <TableCell className="font-medium">{file.name}</TableCell>
                                <TableCell className="text-muted-foreground text-sm truncate max-w-[200px]" title={file.path}>
                                    {file.path}
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                    {!file.isDirectory && formatFileSize(file.size)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-yellow-500 hover:text-yellow-600 hover:bg-yellow-100/20"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onUnstar(file);
                                        }}
                                        title="Remove from Starred"
                                    >
                                        <Star className="w-4 h-4" fill="currentColor" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </ScrollArea>
        </div>
    );
}
