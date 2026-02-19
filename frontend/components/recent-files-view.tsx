'use client';

import { FileItem, formatFileSize, formatDate } from '@/lib/api';
import { File, Folder, FileText, Image, Video, Music, FileCode, FileArchive, Table as TableIcon, Clock } from 'lucide-react';
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

interface RecentFilesViewProps {
  files: (FileItem & { accessedAt?: string })[];
  onFileClick: (file: FileItem) => void;
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

function getCategoryColor(category: string) {
  const colors: Record<string, string> = {
    images: 'bg-green-500/10 text-green-500 border-green-500/20',
    videos: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    audio: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
    documents: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    code: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
    compressed: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    spreadsheets: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    other: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  };
  return colors[category] || colors.other;
}

export function RecentFilesView({ files, onFileClick }: RecentFilesViewProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Recently Accessed</h2>
          </div>
          <span className="text-sm text-muted-foreground">
            {files.length} {files.length === 1 ? 'file' : 'files'}
          </span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <Clock className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground text-lg font-medium">No recent files</p>
            <p className="text-muted-foreground text-sm mt-2">Files you access will appear here</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Path</TableHead>
                <TableHead className="text-right">Size</TableHead>
                <TableHead>Last Accessed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file, index) => (
                <TableRow 
                  key={`${file.path}-${index}`}
                  className="cursor-pointer hover:bg-accent/50"
                  onClick={() => onFileClick(file)}
                >
                  <TableCell>{getFileIcon(file)}</TableCell>
                  <TableCell className="font-medium">{file.name}</TableCell>
                  <TableCell>
                    <Badge className={getCategoryColor(file.category)} variant="outline">
                      {file.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {file.path}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {!file.isDirectory && formatFileSize(file.size)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {file.accessedAt ? formatDate(file.accessedAt) : formatDate(file.modified)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </ScrollArea>
    </div>
  );
}
