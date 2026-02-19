'use client';

import { FileItem } from '@/lib/api';
import { motion } from 'framer-motion';
import { File, Folder, FileCode, FileText, FileImage, FileVideo, FileAudio, FileArchive } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface FileExplorerProps {
  files: FileItem[];
  onFileClick?: (file: FileItem) => void;
  onFileDoubleClick?: (file: FileItem) => void;
  onFolderNavigate?: (path: string) => void;
  selectedFile?: FileItem | null;
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

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    code: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    documents: 'bg-green-500/20 text-green-400 border-green-500/30',
    images: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    videos: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    audio: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    compressed: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    spreadsheets: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    other: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };
  return colors[category] || colors.other;
};

export function FileExplorer({ files, onFileClick, onFileDoubleClick, onFolderNavigate, selectedFile }: FileExplorerProps) {
  const handleItemClick = (file: FileItem) => {
    onFileClick?.(file);
  };

  const handleItemDoubleClick = (file: FileItem) => {
    if (file.isDirectory && onFolderNavigate) {
      onFolderNavigate(file.path);
    } else if (!file.isDirectory && onFileClick) {
      // Allow double click to trigger a separate action if needed, 
      // but for now let's just ensure it calls a prop we can hook into for preview
      // Actually, let's add a specific prop for this
      onFileDoubleClick?.(file);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
      {files.map((file, index) => {
        const Icon = getFileIcon(file);
        const isSelected = selectedFile?.path === file.path;

        return (
          <motion.div
            key={file.path}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.03, duration: 0.2 }}
          >
            <Card
              className={`p-4 cursor-pointer transition-all duration-200 group border relative overflow-hidden ${isSelected
                ? 'bg-primary/10 border-primary ring-1 ring-primary'
                : 'hover:bg-muted/50 hover:border-primary/50 bg-card/50 backdrop-blur-sm'
                }`}
              onClick={() => handleItemClick(file)}
              onDoubleClick={() => handleItemDoubleClick(file)}
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <div className={`p-3 rounded-xl transition-colors ${isSelected
                  ? 'bg-primary/20 text-primary'
                  : file.isDirectory
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                    : getCategoryColor(file.category)
                  }`}>
                  <Icon className="w-8 h-8" />
                </div>

                <div className="w-full min-w-0">
                  <p className={`font-medium text-sm truncate transition-colors ${isSelected ? 'text-primary' : 'text-foreground'
                    }`}>
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {file.isDirectory ? 'Folder' : `${(file.size / 1024).toFixed(1)} KB`}
                  </p>
                </div>
              </div>

              {file.isDirectory && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                    Double-click to open
                  </Badge>
                </div>
              )}
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
