'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { FileItem, api } from '@/lib/api';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { FileText, Image as ImageIcon, Video, File, Music, Download, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface FilePreviewDialogProps {
  file: FileItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Determine the specific document subtype
function getDocSubtype(filename: string): 'pdf' | 'markdown' | 'text' | 'word' | 'other' {
  const ext = filename.toLowerCase().split('.').pop();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'md' || ext === 'markdown') return 'markdown';
  if (ext === 'txt' || ext === 'rtf' || ext === 'csv') return 'text';
  if (ext === 'doc' || ext === 'docx' || ext === 'odt' || ext === 'ppt' || ext === 'pptx' || ext === 'xls' || ext === 'xlsx') return 'word';
  return 'other';
}

// Simple Markdown → HTML renderer (no deps)
function renderMarkdown(md: string): string {
  return md
    .replace(/^### (.+)/gm, '<h3 class="text-lg font-bold mt-4 mb-1">$1</h3>')
    .replace(/^## (.+)/gm, '<h2 class="text-xl font-bold mt-5 mb-2">$1</h2>')
    .replace(/^# (.+)/gm, '<h1 class="text-2xl font-bold mt-6 mb-3">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm font-mono">$1</code>')
    .replace(/^> (.+)/gm, '<blockquote class="border-l-4 border-primary pl-4 italic text-muted-foreground my-2">$1</blockquote>')
    .replace(/^- (.+)/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^(\d+)\. (.+)/gm, '<li class="ml-4 list-decimal">$2</li>')
    .replace(/\n\n/g, '</p><p class="my-2">')
    .replace(/\n/g, '<br/>');
}

export function FilePreviewDialog({ file, open, onOpenChange }: FilePreviewDialogProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const docSubtype = file ? getDocSubtype(file.name) : 'other';

  useEffect(() => {
    if (!open || !file) {
      setContent(null);
      return;
    }

    const shouldFetchText =
      file.category === 'code' ||
      (file.category === 'documents' && (docSubtype === 'markdown' || docSubtype === 'text')) ||
      file.category === 'other';

    if (shouldFetchText) {
      setLoading(true);
      fetch(api.getFileContentUrl(file.path))
        .then(res => res.text())
        .then(text => setContent(text))
        .catch(() => setContent('Error loading content.'))
        .finally(() => setLoading(false));
    } else {
      setContent(null);
    }
  }, [open, file]);

  if (!file) return null;

  const contentUrl = api.getFileContentUrl(file.path);

  const renderContent = () => {
    switch (file.category) {
      // ─── Images ──────────────────────────────────────────────────────────────
      case 'images':
        return (
          <div className="flex items-center justify-center p-4 h-full bg-[repeating-conic-gradient(#80808020_0%_25%,transparent_0%_50%)] bg-[length:20px_20px] min-h-[60vh]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={contentUrl}
              alt={file.name}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        );

      // ─── Videos ──────────────────────────────────────────────────────────────
      case 'videos':
        return (
          <div className="flex items-center justify-center bg-black h-[80vh]">
            <video
              src={contentUrl}
              controls
              autoPlay
              className="max-w-full max-h-full"
            />
          </div>
        );

      // ─── Audio ───────────────────────────────────────────────────────────────
      case 'audio':
        return (
          <div className="flex flex-col items-center justify-center p-12 bg-gradient-to-br from-primary/10 to-primary/5 min-h-[360px] gap-6">
            <div className="w-28 h-28 bg-primary/15 rounded-full flex items-center justify-center shadow-lg animate-pulse">
              <Music className="w-14 h-14 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-center max-w-xs truncate">{file.name}</h3>
            <audio src={contentUrl} controls className="w-full max-w-sm rounded-lg" />
          </div>
        );

      // ─── Documents ───────────────────────────────────────────────────────────
      case 'documents': {
        // PDF → native browser renderer
        if (docSubtype === 'pdf') {
          return (
            <div className="h-[85vh] w-full flex flex-col">
              <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-muted/50 border-b">
                <span className="text-xs text-muted-foreground font-mono truncate">{file.name}</span>
                <a href={contentUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open in New Tab
                  </Button>
                </a>
              </div>
              <iframe
                src={`${contentUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                className="flex-1 w-full border-0"
                title={file.name}
              />
            </div>
          );
        }

        // Markdown → rendered HTML
        if (docSubtype === 'markdown') {
          if (loading) return <div className="p-10 text-center text-muted-foreground animate-pulse">Rendering…</div>;
          return (
            <div className="h-[80vh] overflow-auto p-8 bg-background">
              <article
                className="prose prose-sm dark:prose-invert max-w-none leading-relaxed"
                dangerouslySetInnerHTML={{ __html: content ? `<p class="my-2">${renderMarkdown(content)}</p>` : '<p class="text-muted-foreground">Empty file.</p>' }}
              />
            </div>
          );
        }

        // Plain text / RTF / CSV
        if (docSubtype === 'text') {
          if (loading) return <div className="p-10 text-center text-muted-foreground animate-pulse">Loading…</div>;
          return (
            <div className="h-[80vh] overflow-auto bg-zinc-950 dark:bg-zinc-900">
              <div className="flex">
                {/* Line numbers */}
                <div className="select-none text-right py-4 px-3 text-zinc-600 font-mono text-xs leading-relaxed bg-zinc-900/60 border-r border-zinc-800 min-w-[3rem]">
                  {(content || '').split('\n').map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>
                {/* Content */}
                <pre className="flex-1 py-4 px-5 font-mono text-sm text-zinc-100 leading-relaxed whitespace-pre">
                  {content || 'Empty file.'}
                </pre>
              </div>
            </div>
          );
        }

        // Word / unsupported doc formats
        return (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 p-8 text-center bg-muted/20">
            <div className="w-20 h-20 rounded-2xl bg-blue-500/10 flex items-center justify-center">
              <FileText className="w-10 h-10 text-blue-500" />
            </div>
            <div>
              <p className="text-base font-semibold mb-1">Preview not available</p>
              <p className="text-sm text-muted-foreground max-w-sm">
                <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">.{file.name.split('.').pop()}</span>{' '}
                files can't be previewed directly. Open in a compatible application.
              </p>
            </div>
            <a href={contentUrl} download={file.name}>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Download File
              </Button>
            </a>
          </div>
        );
      }

      // ─── Code ────────────────────────────────────────────────────────────────
      case 'code':
        if (loading) return <div className="p-10 text-center text-muted-foreground animate-pulse">Loading…</div>;
        return (
          <div className="h-[80vh] overflow-auto bg-zinc-950 dark:bg-zinc-900">
            <div className="flex">
              <div className="select-none text-right py-4 px-3 text-zinc-600 font-mono text-xs leading-relaxed bg-zinc-900/60 border-r border-zinc-800 min-w-[3rem]">
                {(content || '').split('\n').map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <pre className="flex-1 py-4 px-5 font-mono text-sm text-zinc-100 leading-relaxed whitespace-pre">
                {content || ''}
              </pre>
            </div>
          </div>
        );

      // ─── Default / Unknown ────────────────────────────────────────────────────
      default:
        return (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-8 text-center text-muted-foreground">
            <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center">
              <File className="w-10 h-10 opacity-30" />
            </div>
            <p className="text-base font-medium">No preview available</p>
            <p className="text-sm">{file.name}</p>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden border-none bg-transparent shadow-none">
        <VisuallyHidden>
          <DialogTitle>{file.name}</DialogTitle>
        </VisuallyHidden>
        <div className="relative bg-background/90 backdrop-blur-2xl rounded-xl border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Floating header overlay (only for image/video) */}
          {(file.category === 'images' || file.category === 'videos') && (
            <div className="absolute top-0 left-0 right-0 p-3 flex items-center z-10 bg-gradient-to-b from-black/60 to-transparent text-white pointer-events-none">
              <h2 className="text-sm font-medium drop-shadow-md truncate">{file.name}</h2>
            </div>
          )}

          {/* Header for non-media types */}
          {file.category !== 'images' && file.category !== 'videos' && file.category !== 'audio' && !(file.category === 'documents' && docSubtype === 'pdf') && (
            <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
              <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <h2 className="text-sm font-medium truncate">{file.name}</h2>
            </div>
          )}

          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
