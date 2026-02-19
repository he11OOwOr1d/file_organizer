'use client';

import { 
  Folder, 
  Clock, 
  Trash2, 
  Star, 
  Settings, 
  HelpCircle,
  HardDrive,
  Cloud
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { api, StorageStats, formatFileSize } from '@/lib/api';

interface AppSidebarProps {
  currentView: 'folders' | 'recent' | 'trash' | 'starred';
  onViewChange: (view: 'folders' | 'recent' | 'trash' | 'starred') => void;
  onStorageClick?: () => void;
  className?: string;
}

export function AppSidebar({ currentView, onViewChange, onStorageClick, className }: AppSidebarProps) {
  const [storage, setStorage] = useState<StorageStats>({ used: 0, limit: 1, percentage: 0 });

  useEffect(() => {
    api.getStorageStats().then(setStorage).catch(console.error);
    
    // Refresh storage stats every 5 seconds to keep it live
    const interval = setInterval(() => {
         api.getStorageStats().then(setStorage).catch(console.error);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'folders', label: 'My Files', icon: Folder, variant: 'default' },
    { id: 'recent', label: 'Recent', icon: Clock, variant: 'default' },
    { id: 'trash', label: 'Trash', icon: Trash2, variant: 'destructive' },
  ] as const;

  return (
    <div className={cn("flex flex-col h-full bg-card/30 backdrop-blur-xl border-r p-4 gap-6", className)}>
      {/* ... header ... */}
      <div className="flex items-center gap-3 px-2 py-4">
        <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg shadow-blue-500/20">
          <Cloud className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-none">CloudBox</h1>
          <p className="text-xs text-muted-foreground mt-1">Personal Storage</p>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-semibold text-muted-foreground px-4 mb-2 uppercase tracking-wider">Browse</p>
        {navItems.map((item) => (
          <Button
            key={item.id}
            variant={currentView === item.id ? 'secondary' : 'ghost'}
            className={cn(
              "w-full justify-start gap-3 h-10 px-4 font-normal transition-all duration-200",
              currentView === item.id ? "bg-primary/10 text-primary hover:bg-primary/15" : "hover:bg-muted/50",
              item.id === 'trash' && currentView === item.id && "bg-red-500/10 text-red-500 hover:bg-red-500/15"
            )}
            onClick={() => onViewChange(item.id)}
          >
            <item.icon className={cn("w-4 h-4", currentView === item.id && "fill-current opacity-50")} />
            {item.label}
          </Button>
        ))}
      </div>

      <div className="mt-auto space-y-4">
        <div 
            className="px-4 py-4 bg-muted/30 rounded-xl border cursor-pointer hover:bg-muted/50 transition-colors group"
            onClick={onStorageClick}
        >
          <div className="flex items-center gap-3 mb-2">
            <HardDrive className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">Storage</span>
            <span className="ml-auto text-xs font-medium text-muted-foreground">{storage.percentage}%</span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${storage.percentage}%` }}
            /> 
          </div>
          <p className="text-xs text-muted-foreground mt-2 flex justify-between">
            <span>{formatFileSize(storage.used)} used</span>
            <span>{formatFileSize(storage.limit)} total</span>
          </p>
        </div>
      </div>
    </div>
  );
}
