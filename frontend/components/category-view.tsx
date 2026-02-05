'use client';

import { CategorizeResponse } from '@/lib/api';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileCode, FileText, FileImage, FileVideo, FileAudio, FileArchive, Files } from 'lucide-react';

interface CategoryViewProps {
  data: CategorizeResponse;
}

const categoryIcons: Record<string, any> = {
  code: FileCode,
  documents: FileText,
  images: FileImage,
  videos: FileVideo,
  audio: FileAudio,
  compressed: FileArchive,
  spreadsheets: Files,
  other: Files,
};

const categoryColors: Record<string, string> = {
  code: 'from-blue-500 to-cyan-500',
  documents: 'from-green-500 to-emerald-500',
  images: 'from-purple-500 to-pink-500',
  videos: 'from-pink-500 to-rose-500',
  audio: 'from-yellow-500 to-orange-500',
  compressed: 'from-orange-500 to-red-500',
  spreadsheets: 'from-teal-500 to-cyan-500',
  other: 'from-gray-500 to-slate-500',
};

export function CategoryView({ data }: CategoryViewProps) {
  const categories = Object.entries(data.categories);
  
  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass p-6">
          <div className="text-sm text-muted-foreground mb-1">Total Files</div>
          <div className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            {data.totalFiles}
          </div>
        </Card>
        
        <Card className="glass p-6">
          <div className="text-sm text-muted-foreground mb-1">Total Size</div>
          <div className="text-3xl font-bold bg-gradient-to-r from-green-500 to-cyan-500 bg-clip-text text-transparent">
            {(data.totalSize / 1024).toFixed(1)} KB
          </div>
        </Card>
        
        <Card className="glass p-6">
          <div className="text-sm text-muted-foreground mb-1">Categories</div>
          <div className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent">
            {categories.length}
          </div>
        </Card>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map(([category, stats], index) => {
          const Icon = categoryIcons[category];
          const gradient = categoryColors[category];
          const percentage = data.totalFiles > 0 ? (stats.count / data.totalFiles * 100).toFixed(1) : 0;
          
          return (
            <motion.div
              key={category}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
            >
              <Card className="glass-strong p-5 hover:scale-[1.02] transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient}`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold capitalize text-lg">{category}</h3>
                      <p className="text-sm text-muted-foreground">{stats.count} files</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-lg font-semibold">
                    {percentage}%
                  </Badge>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full bg-gradient-to-r ${gradient}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ delay: index * 0.1 + 0.2, duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
                
                <div className="mt-3 text-sm text-muted-foreground">
                  {(stats.size / 1024).toFixed(2)} KB total
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
