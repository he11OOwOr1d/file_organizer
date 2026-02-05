'use client';

import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';

type ConceptTopic = 'filesystem' | 'directory' | 'permissions' | 'storage' | 'general';

interface OsConceptsSidebarProps {
  topic?: ConceptTopic;
  className?: string;
}

const concepts = {
  general: {
    title: 'Operating System Concepts',
    content: (
      <div className="space-y-4">
        <p>
          An <strong>Operating System (OS)</strong> acts as an intermediary between users and computer hardware.
          One of its critical roles is <strong>File System Management</strong>.
        </p>
        <div className="space-y-2">
          <h4 className="font-semibold text-primary">Key Responsibilities:</h4>
          <ul className="list-disc pl-4 space-y-1 text-sm text-muted-foreground">
            <li>Organizing data into files and directories.</li>
            <li>Tracking data location on storage media.</li>
            <li>Managing access permissions and security.</li>
            <li>Optimizing storage space usage.</li>
          </ul>
        </div>
      </div>
    ),
  },
  filesystem: {
    title: 'File System Basics',
    content: (
      <div className="space-y-4">
        <p>
          A <strong>File System</strong> controls how data is stored and retrieved. Without it, information placed in a storage medium would be one large body of data with no way to tell where one piece of information stops and the next begins.
        </p>
        <div className="p-3 bg-muted/50 rounded-lg">
          <h4 className="font-semibold text-sm mb-1">Common File Systems:</h4>
          <p className="text-xs text-muted-foreground">NTFS (Windows), APFS (macOS), ext4 (Linux).</p>
        </div>
      </div>
    ),
  },
  directory: {
    title: 'Directory Structures',
    content: (
      <div className="space-y-4">
        <p>
          Files are organized into <strong>Directories</strong> (folders). This creates a <strong>Hierarchical Structure</strong>.
        </p>
        <p>
          The OS maintains a table (like a phone book) to map file names to their physical locations on the disk (blocks/inodes).
        </p>
        <div className="space-y-2">
          <h4 className="font-semibold text-primary">Did you know?</h4>
          <p className="text-sm text-muted-foreground">
             In Unix-like systems, "everything is a file", including directories themselves! A directory is just a special file containing a list of other files.
          </p>
        </div>
      </div>
    ),
  },
  permissions: {
    title: 'Access Control',
    content: (
      <div className="space-y-4">
        <p>
          <strong>File Permissions</strong> determine who can read, write, or execute a file. This is crucial for system security.
        </p>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 border rounded">
            <strong>R</strong><br/>Read
          </div>
          <div className="p-2 border rounded">
            <strong>W</strong><br/>Write
          </div>
          <div className="p-2 border rounded">
            <strong>X</strong><br/>Execute
          </div>
        </div>
      </div>
    ),
  },
  storage: {
    title: 'Storage & Metadata',
    content: (
      <div className="space-y-4">
        <p>
          Every file has <strong>Metadata</strong> associated with it, not just the content.
        </p>
        <ul className="list-disc pl-4 space-y-1 text-sm text-muted-foreground">
          <li><strong>Size:</strong> Bytes occupied.</li>
          <li><strong>Timestamps:</strong> Creation, usage, modification.</li>
          <li><strong>Owner:</strong> User ID creating the file.</li>
        </ul>
        <p className="text-sm">
          This data is often stored in a structure called an <strong>inode</strong> (Index Node) in Unix systems.
        </p>
      </div>
    ),
  },
};

export function OsConceptsSidebar({ topic = 'general', className }: OsConceptsSidebarProps) {
  const activeConcept = concepts[topic] || concepts.general;

  return (
    <Card className={`h-full flex flex-col bg-card/50 backdrop-blur-xl border-r ${className}`}>
        <div className="p-6 border-b">
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                OS Concepts
            </h2>
        </div>
      <ScrollArea className="flex-1 p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={topic}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-lg font-semibold mb-4">{activeConcept.title}</h3>
            <div className="text-sm text-muted-foreground leading-relaxed">
              {activeConcept.content}
            </div>
          </motion.div>
        </AnimatePresence>
      </ScrollArea>
    </Card>
  );
}
