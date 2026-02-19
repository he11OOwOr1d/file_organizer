'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { api, CategorizeResponse, formatFileSize } from '@/lib/api';
import { Loader2, HardDrive, Image, Video, Music, FileText, FileCode, FileArchive, Table as TableIcon, File } from 'lucide-react';
import { useEffect, useState } from 'react';

interface StorageAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StorageAnalysisDialog({ open, onOpenChange }: StorageAnalysisDialogProps) {
  const [data, setData] = useState<CategorizeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const TOTAL_LIMIT = 2 * 1024 * 1024 * 1024; // 2 GB

  useEffect(() => {
    if (open) {
      setLoading(true);
      api.getCategorization()
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [open]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'images': return Image;
      case 'videos': return Video;
      case 'audio': return Music;
      case 'documents': return FileText;
      case 'code': return FileCode;
      case 'compressed': return FileArchive;
      case 'spreadsheets': return TableIcon;
      default: return File;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      images: 'bg-green-500 text-green-500',
      videos: 'bg-purple-500 text-purple-500',
      audio: 'bg-pink-500 text-pink-500',
      documents: 'bg-orange-500 text-orange-500',
      code: 'bg-cyan-500 text-cyan-500',
      compressed: 'bg-yellow-500 text-yellow-500',
      spreadsheets: 'bg-emerald-500 text-emerald-500',
      other: 'bg-gray-500 text-gray-500',
    };
    return colors[category] || colors.other;
  };

  const getCategoryBgParams = (category: string) => {
      // Returns just the color hex or tailwind class for the progress bar segment
      const colors: Record<string, string> = {
        images: 'bg-green-500',
        videos: 'bg-purple-500',
        audio: 'bg-pink-500',
        documents: 'bg-orange-500',
        code: 'bg-cyan-500',
        compressed: 'bg-yellow-500',
        spreadsheets: 'bg-emerald-500',
        other: 'bg-gray-500',
      };
      return colors[category] || colors.other;
  }

  // Calculate generic "Available" space
  const usedSize = data?.totalSize || 0;
  const availableSize = Math.max(0, TOTAL_LIMIT - usedSize);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-white/20">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
             <HardDrive className="w-5 h-5 text-blue-500" />
             Manage Storage
          </DialogTitle>
          <DialogDescription>
            Breakdown of your storage usage by file type.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Analyzing storage...</p>
          </div>
        ) : data ? (
          <div className="space-y-6 py-4">
             {/* Total Usage Bar */}
             <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                    <span>{formatFileSize(usedSize)} used</span>
                    <span className="text-muted-foreground">{formatFileSize(availableSize)} available</span>
                </div>
                <div className="h-4 w-full bg-muted/50 rounded-full overflow-hidden flex">
                    {/* Render segments for each category */}
                    {Object.entries(data.categories).map(([cat, stats]) => {
                         if (stats.size === 0) return null;
                         const width = (stats.size / TOTAL_LIMIT) * 100;
                         // Don't show tiny segments effectively
                         if (width < 0.5) return null; 
                         return (
                             <div 
                                key={cat}
                                className={getCategoryBgParams(cat)}
                                style={{ width: `${width}%` }}
                                title={`${cat}: ${formatFileSize(stats.size)}`}
                             />
                         );
                    })}
                </div>
                <div className="flex gap-4 flex-wrap text-xs text-muted-foreground justify-center pt-1">
                     {/* Legend for top 4 categories */}
                     {Object.entries(data.categories)
                        .sort(([, a], [, b]) => b.size - a.size)
                        .slice(0, 4)
                        .map(([cat]) => (
                            <div key={cat} className="flex items-center gap-1.5">
                                <div className={`w-2 h-2 rounded-full ${getCategoryBgParams(cat)}`} />
                                <span className="capitalize">{cat}</span>
                            </div>
                        ))
                     }
                </div>
             </div>

             {/* Detailed List */}
             <div className="space-y-3">
                 <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Details</h3>
                 <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-2">
                     {Object.entries(data.categories)
                        .sort(([, a], [, b]) => b.size - a.size)
                        .map(([category, stats]) => {
                            const Icon = getCategoryIcon(category);
                            const percent = (stats.size / TOTAL_LIMIT) * 100;
                            const colorClass = getCategoryColor(category);
                            
                            return (
                                <div key={category} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                    <div className={`p-2 rounded-md bg-opacity-10 ${colorClass.split(' ')[0]} bg-opacity-10`}>
                                        <Icon className={`w-5 h-5 ${colorClass.split(' ')[1]}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between mb-1">
                                            <span className="font-medium capitalize">{category}</span>
                                            <span className="text-sm text-muted-foreground">{formatFileSize(stats.size)}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full ${getCategoryBgParams(category)}`} 
                                                style={{ width: `${Math.max(2, (stats.size / usedSize) * 100)}%` }} 
                                            />
                                        </div>
                                    </div>
                                    <div className="text-right text-xs text-muted-foreground min-w-[60px]">
                                        {stats.count} files
                                    </div>
                                </div>
                            );
                        })
                     }
                 </div>
             </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
