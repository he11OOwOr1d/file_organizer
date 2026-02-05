'use client';

import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileUp, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '@/lib/api';

interface FileUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess: () => void;
}

export function FileUpload({ open, onOpenChange, onUploadSuccess }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setSelectedFile(files[0]);
      setUploadStatus('idle');
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      setUploadStatus('idle');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setUploadStatus('idle');
      const response = await api.uploadFile(selectedFile);
      setUploadStatus('success');
      setUploadMessage(response.message || `File uploaded successfully to ${response.category} folder!`);
      
      // Wait a bit then close and refresh
      setTimeout(() => {
        onUploadSuccess();
        onOpenChange(false);
        resetState();
      }, 1500);
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStatus('error');
      setUploadMessage('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const resetState = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    setUploadMessage('');
    setIsDragging(false);
  };

  const handleClose = () => {
    if (!uploading) {
      resetState();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
          <DialogDescription>
            Files will be automatically organized by type
          </DialogDescription>
        </DialogHeader>

        <div
          className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
            isDragging
              ? 'border-primary bg-primary/10'
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-4 text-center">
            {uploadStatus === 'idle' && (
              <>
                <div className="p-4 bg-primary/10 rounded-full">
                  <FileUp className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="font-medium">
                    {selectedFile ? selectedFile.name : 'Drag and drop your file here'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or click to browse
                  </p>
                </div>
                <input
                  type="file"
                  id="file-input"
                  className="hidden"
                  onChange={handleFileSelect}
                  disabled={uploading}
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('file-input')?.click()}
                  disabled={uploading}
                >
                  Choose File
                </Button>
              </>
            )}

            {uploading && (
              <>
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="font-medium">Uploading...</p>
              </>
            )}

            {uploadStatus === 'success' && (
              <>
                <div className="p-4 bg-green-500/10 rounded-full">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <p className="font-medium text-green-500">{uploadMessage}</p>
              </>
            )}

            {uploadStatus === 'error' && (
              <>
                <div className="p-4 bg-red-500/10 rounded-full">
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
                <p className="font-medium text-red-500">{uploadMessage}</p>
                <Button variant="outline" onClick={() => setUploadStatus('idle')}>
                  Try Again
                </Button>
              </>
            )}
          </div>
        </div>

        {selectedFile && uploadStatus === 'idle' && (
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleClose} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={uploading} className="gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
