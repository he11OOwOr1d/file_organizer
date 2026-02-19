'use client';

import { FileItem, formatFileSize, formatDate } from '@/lib/api';
import { File, Folder, FileText, Image, Video, Music, FileCode, FileArchive, Table as TableIcon, Edit2, Trash2 } from 'lucide-react';
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
import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';

interface AllFilesViewProps {
  files: (FileItem & { relativePath?: string })[];
  onFileClick: (file: FileItem) => void;
  onRename: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
  onFolderNavigate?: (path: string) => void;
  hideSearch?: boolean;
  hidePath?: boolean;
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

export function AllFilesView({ 
  files, 
  onFileClick, 
  onRename, 
  onDelete,
  onFolderNavigate,
  hideSearch = false,
  hidePath = false
}: AllFilesViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'modified' | 'category'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // ... unchanged useMemo ...
  const filteredAndSortedFiles = useMemo(() => {
    let result = files.filter(file => 
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (file.relativePath || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    result.sort((a, b) => {
      let compareA: any;
      let compareB: any;

      switch (sortBy) {
        case 'name':
          compareA = a.name.toLowerCase();
          compareB = b.name.toLowerCase();
          break;
        case 'size':
          compareA = a.size;
          compareB = b.size;
          break;
        case 'modified':
          compareA = new Date(a.modified).getTime();
          compareB = new Date(b.modified).getTime();
          break;
        case 'category':
          compareA = a.category;
          compareB = b.category;
          break;
      }

      if (compareA < compareB) return sortOrder === 'asc' ? -1 : 1;
      if (compareA > compareB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [files, searchQuery, sortBy, sortOrder]);

  const handleSort = (column: 'name' | 'size' | 'modified' | 'category') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {!hideSearch && (
        <div className="p-4 border-b bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">All Files</h2>
            <span className="text-sm text-muted-foreground">
              {filteredAndSortedFiles.length} items
            </span>
          </div>
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
      )}

      <ScrollArea className="flex-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-accent/50 w-[30%]"
                onClick={() => handleSort('name')}
              >
                Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-accent/50 w-[15%]"
                onClick={() => handleSort('category')}
              >
                Category {sortBy === 'category' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              {!hidePath && <TableHead className="w-[30%]">Path</TableHead>}
              <TableHead 
                className="cursor-pointer hover:bg-accent/50 text-right w-[10%]"
                onClick={() => handleSort('size')}
              >
                Size {sortBy === 'size' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              {/* Hidden on small screens to save space */}
              <TableHead 
                className="cursor-pointer hover:bg-accent/50 hidden md:table-cell w-[15%]"
                onClick={() => handleSort('modified')}
              >
                Modified {sortBy === 'modified' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="text-center w-[100px] sticky right-0 bg-background shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.1)]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedFiles.map((file, index) => (
              <TableRow 
                key={`${file.path}-${index}`}
                className="hover:bg-accent/50 group cursor-pointer"
                onClick={() => onFileClick(file)}
                onDoubleClick={() => {
                  if (file.isDirectory && onFolderNavigate) {
                    onFolderNavigate(file.path);
                  }
                }}
              >
                <TableCell>{getFileIcon(file)}</TableCell>
                <TableCell className="font-medium truncate max-w-[200px]" title={file.name}>{file.name}</TableCell>
                <TableCell>
                  <Badge className={getCategoryColor(file.category)} variant="outline">
                    {file.category}
                  </Badge>
                </TableCell>
                {!hidePath && (
                    <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]" title={file.relativePath || '/'}>
                    {file.relativePath || '/'}
                    </TableCell>
                )}
                <TableCell className="text-right text-sm whitespace-nowrap">
                  {!file.isDirectory && formatFileSize(file.size)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground hidden md:table-cell whitespace-nowrap">
                  {formatDate(file.modified)}
                </TableCell>
                <TableCell className="sticky right-0 bg-background shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.1)] group-hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-100/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRename(file);
                      }}
                      title="Rename"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-100/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(file);
                      }}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
