'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Network } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export function CategorizationRules() {
  const [rules, setRules] = useState<Record<string, string[]> | null>(null);

  useEffect(() => {
    api.getCategoryRules().then(setRules).catch(console.error);
  }, []);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
            <Network className="w-4 h-4" />
            View Logic
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-card/95 backdrop-blur-xl border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Network className="w-5 h-5 text-primary" />
            Categorization Logic
          </DialogTitle>
          <DialogDescription>
            The backend engine (OS Simulation) uses these extension mappings to automatically organize files.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 border rounded-lg bg-muted/30 p-4 font-mono text-xs">
          <ScrollArea className="h-[400px] w-full pr-4">
            <div className="grid grid-cols-1 gap-6">
                {rules ? Object.entries(rules).map(([category, extensions]) => (
                    <div key={category} className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="text-primary font-bold uppercase tracking-wider">{category}</span>
                            <div className="h-[1px] flex-1 bg-border" />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {extensions.map(ext => (
                                <Badge key={ext} variant="secondary" className="bg-background border-border hover:bg-primary/20 hover:text-primary transition-colors cursor-help">
                                    {ext}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )) : (
                    <div className="flex items-center justify-center h-40 text-muted-foreground">
                        Loading logic map...
                    </div>
                )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
