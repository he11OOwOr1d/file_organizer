'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { FileItem, api } from '@/lib/api';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { FileText, Image as ImageIcon, Video, File, Music } from 'lucide-react';
import { useEffect, useState } from 'react';

interface FilePreviewDialogProps {
  file: FileItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FilePreviewDialog({ file, open, onOpenChange }: FilePreviewDialogProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && file && (file.category === 'code' || file.category === 'documents' || file.category === 'other')) {
      // Only fetch text content for relevant types
      setLoading(true);
      fetch(api.getFileContentUrl(file.path))
        .then(res => res.text())
        .then(text => setContent(text))
        .catch(err => {
          console.error("Failed to load content", err);
          setContent("Error loading content.");
        })
        .finally(() => setLoading(false));
    } else {
      setContent(null);
    }
  }, [open, file]);

  if (!file) return null;

  const contentUrl = api.getFileContentUrl(file.path);

  const renderContent = () => {
    switch (file.category) {
      case 'images':
        return (
          <div className="flex items-center justify-center p-4 h-full bg-black/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={contentUrl} 
              alt={file.name} 
              className="max-w-full max-h-[80vh] object-contain rounded shadow-lg"
            />
          </div>
        );
      case 'videos':
        return (
          <div className="flex items-center justify-center p-4 bg-black/90 h-[80vh]">
             <video 
               src={contentUrl} 
               controls 
               autoPlay 
               className="max-w-full max-h-full rounded"
             />
          </div>
        );
      case 'audio':
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-muted/30 h-[400px]">
                <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mb-8 animate-pulse">
                    <Music className="w-16 h-16 text-primary" />
                </div>
                <h3 className="text-xl font-medium mb-4">{file.name}</h3>
                <audio src={contentUrl} controls className="w-full max-w-md" />
            </div>
        );
      case 'code':
      case 'documents':
      case 'other':
        if (loading) return <div className="p-8 text-center">Loading...</div>;
        return (
          <div className="h-[80vh] overflow-auto p-4 bg-white dark:bg-zinc-900 font-mono text-sm whitespace-pre rounded-md border shadow-inner">
             {content || "No preview available."}
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground">
             <File className="w-24 h-24 mb-4 opacity-20" />
             <p className="text-lg">No preview available</p>
             <p className="text-sm">{file.category} file</p>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden border-none bg-transparent shadow-none">
        <VisuallyHidden>
            <DialogTitle>{file.name}</DialogTitle>
        </VisuallyHidden>
        <div className="relative bg-background/80 backdrop-blur-xl rounded-xl border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
           
           {/* Header */}
           <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/50 to-transparent text-white pointer-events-none">
                <div className="flex items-center gap-2">
                   <h2 className="font-medium drop-shadow-md text-shadow">{file.name}</h2>
                </div>
           </div>

           {/* Content */}
           {renderContent()}

        </div>
      </DialogContent>
    </Dialog>
  );
}
