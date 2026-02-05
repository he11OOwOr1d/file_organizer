'use client';

import { Home, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BreadcrumbNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  rootPath: string;
}

export function BreadcrumbNav({ currentPath, onNavigate, rootPath }: BreadcrumbNavProps) {
  // Parse the path into segments
  const getPathSegments = () => {
    if (!currentPath || currentPath === rootPath) {
      return [];
    }
    
    const relativePath = currentPath.replace(rootPath, '');
    const segments = relativePath.split('/').filter(Boolean);
    return segments;
  };

  const segments = getPathSegments();

  const handleSegmentClick = (index: number) => {
    if (index === -1) {
      // Navigate to root
      onNavigate(rootPath);
    } else {
      // Build path up to this segment
      const pathSegments = segments.slice(0, index + 1);
      const newPath = rootPath + '/' + pathSegments.join('/');
      onNavigate(newPath);
    }
  };

  return (
    <div className="flex items-center gap-1 text-sm">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 gap-1.5 text-muted-foreground hover:text-foreground"
        onClick={() => handleSegmentClick(-1)}
      >
        <Home className="w-3.5 h-3.5" />
        <span>Root</span>
      </Button>

      {segments.map((segment, index) => (
        <div key={index} className="flex items-center gap-1">
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-muted-foreground hover:text-foreground"
            onClick={() => handleSegmentClick(index)}
          >
            {segment}
          </Button>
        </div>
      ))}
    </div>
  );
}
