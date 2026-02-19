import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5002;

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Middleware
app.use(cors());
app.use(express.json());

// Demo files directory
const DEMO_DIR = path.join(__dirname, 'demo-files');
const TRASH_DIR = path.join(DEMO_DIR, '.trash');
const TRASH_METADATA_FILENAME = '.trash-metadata.json'; // Renamed for clarity
const TRASH_METADATA_FILE = path.join(TRASH_DIR, TRASH_METADATA_FILENAME);
const STARRED_FILENAME = '.starred.json';
const STARRED_FILE = path.join(DEMO_DIR, STARRED_FILENAME);

// Ensure demo and trash directories exist
await fs.mkdir(DEMO_DIR, { recursive: true });
await fs.mkdir(TRASH_DIR, { recursive: true });

// Initialize trash metadata if it doesn't exist
try {
  await fs.access(TRASH_METADATA_FILE);
} catch {
  await fs.writeFile(TRASH_METADATA_FILE, JSON.stringify({}, null, 2));
}

// Trash Metadata Helpers
async function getTrashMetadata() {
  try {
    const data = await fs.readFile(TRASH_METADATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

async function saveTrashMetadata(metadata) {
  await fs.writeFile(TRASH_METADATA_FILE, JSON.stringify(metadata, null, 2));
}

// Starred Files Helpers
async function getStarredFiles() {
  try {
    const data = await fs.readFile(STARRED_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    return [];
  }
}

async function saveStarredFiles(starred) {
  await fs.writeFile(STARRED_FILE, JSON.stringify(starred, null, 2));
}

// Recent files tracking (in-memory, limit to 20 most recent)
const recentFiles = [];

// Helper function to get file metadata
async function getFileMetadata(filePath) {
  const stats = await fs.stat(filePath);
  const ext = path.extname(filePath).toLowerCase();

  return {
    name: path.basename(filePath),
    path: filePath,
    size: stats.size,
    isDirectory: stats.isDirectory(),
    modified: stats.mtime,
    created: stats.birthtime,
    extension: ext,
    category: categorizeFile(ext),
    mode: (stats.mode & 0o777).toString(8), // Octal permissions
  };
}

// Categorize files by extension
function categorizeFile(extension) {
  const categories = {
    images: ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp'],
    documents: ['.pdf', '.doc', '.docx', '.txt', '.md', '.rtf', '.odt'],
    videos: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm'],
    audio: ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'],
    code: ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.go', '.rs'],
    compressed: ['.zip', '.rar', '.7z', '.tar', '.gz'],
    spreadsheets: ['.xlsx', '.xls', '.csv', '.ods'],
  };

  for (const [category, extensions] of Object.entries(categories)) {
    if (extensions.includes(extension)) {
      return category;
    }
  }

  return 'other';
}

// Helper to get MIME type
function getMimeType(extension) {
  const mimes = {
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4',
    '.flac': 'audio/flac',
    '.aac': 'audio/aac',
    '.mp4': 'video/mp4',
    '.avi': 'video/x-msvideo',
    '.mov': 'video/quicktime',
    '.wmv': 'video/x-ms-wmv',
    '.flv': 'video/x-flv',
    '.mkv': 'video/x-matroska',
    '.webm': 'video/webm',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.json': 'application/json',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.html': 'text/html'
  };
  return mimes[extension.toLowerCase()] || 'application/octet-stream';
}

// Helper function to track recently accessed files
function trackRecentFile(fileMetadata) {
  // Don't track directories
  if (fileMetadata.isDirectory) return;

  // Remove if already exists (to move to front)
  const existingIndex = recentFiles.findIndex(f => f.path === fileMetadata.path);
  if (existingIndex !== -1) {
    recentFiles.splice(existingIndex, 1);
  }

  // Add to front of array
  recentFiles.unshift({
    ...fileMetadata,
    accessedAt: new Date().toISOString()
  });

  // Limit to 20 most recent
  if (recentFiles.length > 20) {
    recentFiles.pop();
  }
}

// Recursively get all files from directory and subdirectories
async function getAllFilesRecursive(dirPath, baseDir = dirPath) {
  const allFiles = [];

  async function traverse(currentPath) {
    const items = await fs.readdir(currentPath);

    for (const item of items) {
      const itemPath = path.join(currentPath, item);

      // Skip trash directory and hidden/internal files
      if (itemPath === TRASH_DIR) continue;
      if (item.startsWith('.')) continue;

      const metadata = await getFileMetadata(itemPath);

      if (metadata.isDirectory) {
        // Add directory itself
        allFiles.push({
          ...metadata,
          relativePath: path.relative(baseDir, itemPath)
        });
        // Recursively process subdirectory
        await traverse(itemPath);
      } else {
        // Add file
        allFiles.push({
          ...metadata,
          relativePath: path.relative(baseDir, itemPath)
        });
      }
    }
  }

  await traverse(dirPath);
  return allFiles;
}

// API Routes

// Get all files in directory
app.get('/api/files', async (req, res) => {
  try {
    const dirPath = req.query.path || DEMO_DIR;
    const safePath = path.resolve(DEMO_DIR, path.relative(DEMO_DIR, dirPath));

    // Security check - ensure path is within demo directory
    if (!safePath.startsWith(DEMO_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const allEntries = await fs.readdir(safePath);
    // Filter out hidden/internal files (.trash, .starred.json, etc.)
    const files = allEntries.filter(f => !f.startsWith('.'));
    const fileDetails = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(safePath, file);
        return await getFileMetadata(filePath);
      })
    );

    res.json({
      currentPath: safePath,
      files: fileDetails,
      total: fileDetails.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific file metadata
app.get('/api/files/metadata', async (req, res) => {
  try {
    const filePath = req.query.path;
    if (!filePath) {
      return res.status(400).json({ error: 'Path is required' });
    }

    const safePath = path.resolve(DEMO_DIR, path.relative(DEMO_DIR, filePath));

    if (!safePath.startsWith(DEMO_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const metadata = await getFileMetadata(safePath);

    // Track file access for recent files
    trackRecentFile(metadata);

    res.json(metadata);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve raw file content
app.get('/api/files/content', async (req, res) => {
  try {
    const filePath = req.query.path;
    if (!filePath) {
      return res.status(400).json({ error: 'Path is required' });
    }

    const safePath = path.resolve(DEMO_DIR, path.relative(DEMO_DIR, filePath));

    if (!safePath.startsWith(DEMO_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if file exists
    try {
      await fs.access(safePath);
    } catch (e) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Explicitly set Content-Type
    const ext = path.extname(safePath);
    const mimeType = getMimeType(ext);

    console.log(`[CONTENT] Serving "${path.basename(safePath)}" as ${mimeType}`);
    res.setHeader('Content-Type', mimeType);

    res.sendFile(safePath);
  } catch (error) {
    console.error('[CONTENT] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get storage usage stats
app.get('/api/storage', async (req, res) => {
  try {
    const allFiles = await getAllFilesRecursive(DEMO_DIR);
    const totalUsed = allFiles.reduce((acc, file) => acc + file.size, 0);
    const totalLimit = 2 * 1024 * 1024 * 1024; // 2 GB limit for demo

    res.json({
      used: totalUsed,
      limit: totalLimit,
      percentage: Math.min(100, Math.round((totalUsed / totalLimit) * 100))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get file categorization statistics
app.get('/api/files/categorize', async (req, res) => {
  try {
    const dirPath = req.query.path || DEMO_DIR;
    const safePath = path.resolve(DEMO_DIR, path.relative(DEMO_DIR, dirPath));

    if (!safePath.startsWith(DEMO_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Use getAllFilesRecursive to include subdirectories
    const allFiles = await getAllFilesRecursive(safePath);
    const categories = {};
    let totalSize = 0;

    for (const file of allFiles) {
      if (!file.isDirectory) {
        const category = file.category; // file is already metadata here
        if (!categories[category]) {
          categories[category] = { count: 0, size: 0, files: [] };
        }
        categories[category].count++;
        categories[category].size += file.size;
        categories[category].files.push(file.name);
        totalSize += file.size;
      }
    }

    res.json({
      categories,
      totalFiles: allFiles.length,
      totalSize,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search files (recursive)
app.get('/api/files/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const dirPath = req.query.path || DEMO_DIR;
    const safePath = path.resolve(DEMO_DIR, path.relative(DEMO_DIR, dirPath));

    if (!safePath.startsWith(DEMO_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const allFiles = await getAllFilesRecursive(safePath, DEMO_DIR);
    const searchResults = allFiles.filter(file =>
      file.name.toLowerCase().includes(query.toLowerCase())
    );

    res.json({
      query,
      files: searchResults,
      total: searchResults.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all files recursively
app.get('/api/files/all', async (req, res) => {
  try {
    const dirPath = req.query.path || DEMO_DIR;
    const safePath = path.resolve(DEMO_DIR, path.relative(DEMO_DIR, dirPath));

    if (!safePath.startsWith(DEMO_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const allFiles = await getAllFilesRecursive(safePath, DEMO_DIR);

    res.json({
      basePath: DEMO_DIR,
      searchPath: safePath,
      files: allFiles,
      total: allFiles.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recently accessed files
app.get('/api/files/recent', async (req, res) => {
  try {
    res.json({
      files: recentFiles,
      total: recentFiles.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new folder
app.post('/api/folders/create', async (req, res) => {
  try {
    const { folderName, parentPath } = req.body;
    console.log(`[CREATE FOLDER] Request: folderName="${folderName}", parentPath="${parentPath}"`);

    if (!folderName) {
      return res.status(400).json({ error: 'Folder name is required' });
    }

    // Validate folder name - no special characters or path traversal
    const invalidChars = /[\/\\:*?"<>|]/;
    if (invalidChars.test(folderName) || folderName.includes('..')) {
      return res.status(400).json({ error: 'Invalid folder name. Avoid special characters and path traversal.' });
    }

    const parentDir = parentPath || DEMO_DIR;
    const safeParent = path.resolve(DEMO_DIR, path.relative(DEMO_DIR, parentDir));

    if (!safeParent.startsWith(DEMO_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const newFolderPath = path.join(safeParent, folderName);
    console.log(`[CREATE FOLDER] Creating: "${newFolderPath}"`);

    // Check if folder already exists
    try {
      await fs.access(newFolderPath);
      return res.status(400).json({ error: 'Folder already exists' });
    } catch (e) {
      // Folder doesn't exist, which is what we want
    }

    // Create the folder
    await fs.mkdir(newFolderPath, { recursive: false });
    console.log('[CREATE FOLDER] Success');

    // Get metadata for the created folder
    const metadata = await getFileMetadata(newFolderPath);

    res.json({
      success: true,
      folder: metadata,
      message: `Folder "${folderName}" created successfully`
    });
  } catch (error) {
    console.error('[CREATE FOLDER] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get categorization rules
app.get('/api/categories/rules', (req, res) => {
  const categories = {
    images: ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp'],
    documents: ['.pdf', '.doc', '.docx', '.txt', '.md', '.rtf', '.odt'],
    videos: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm'],
    audio: ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'],
    code: ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.go', '.rs'],
    compressed: ['.zip', '.rar', '.7z', '.tar', '.gz'],
    spreadsheets: ['.xlsx', '.xls', '.csv', '.ods'],
  };
  res.json(categories);
});

// Delete file or folder (Soft delete to trash)
app.delete('/api/files/delete', async (req, res) => {
  try {
    const { filePath, permanent } = req.body; // Add permanent flag
    console.log(`[DELETE] Request: path="${filePath}", permanent=${permanent}`);

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    const safePath = path.resolve(DEMO_DIR, path.relative(DEMO_DIR, filePath));
    // Check if it's already in trash
    const isInTrash = safePath.startsWith(TRASH_DIR);

    // Security check - ensure path is within demo directory
    if (!safePath.startsWith(DEMO_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if file/folder exists
    try {
      await fs.access(safePath);
    } catch (e) {
      return res.status(404).json({ error: 'File or folder not found' });
    }

    const metadata = await getFileMetadata(safePath);
    const itemType = metadata.isDirectory ? 'folder' : 'file';

    if (permanent || isInTrash) {
      // PERMANENT DELETE
      await fs.rm(safePath, { recursive: true, force: true });

      // If was in trash, remove from metadata
      if (isInTrash) {
        const trashMeta = await getTrashMetadata();
        const trashFileName = path.basename(safePath);
        if (trashMeta[trashFileName]) {
          delete trashMeta[trashFileName];
          await saveTrashMetadata(trashMeta);
        }
      }

      console.log('[DELETE] Permanent Success');

      // Remove from recent (if verified not needed, harmless)
      const recentIndex = recentFiles.findIndex(f => f.path === safePath);
      if (recentIndex !== -1) recentFiles.splice(recentIndex, 1);

      return res.json({
        success: true,
        message: `${itemType} permanently deleted`,
        itemType
      });
    } else {
      // SOFT DELETE (Move to Trash)
      const fileName = path.basename(safePath);
      // Create unique name in trash to avoid collisions
      const timestamp = Date.now();
      const trashFileName = `${timestamp}-${fileName}`;
      const trashPath = path.join(TRASH_DIR, trashFileName);

      // Ensure trash dir exists (in case it was manually deleted)
      await fs.mkdir(TRASH_DIR, { recursive: true });
      await fs.rename(safePath, trashPath);

      // Save original location
      const trashMeta = await getTrashMetadata();
      trashMeta[trashFileName] = {
        originalPath: safePath,
        originalName: fileName,
        deletedAt: new Date().toISOString(),
        size: metadata.size,
        type: itemType
      };
      await saveTrashMetadata(trashMeta);

      console.log(`[DELETE] Soft deleted to ${trashPath}`);

      // Remove from recent
      const recentIndex = recentFiles.findIndex(f => f.path === safePath);
      if (recentIndex !== -1) recentFiles.splice(recentIndex, 1);

      return res.json({
        success: true,
        message: `${itemType} moved to trash`,
        itemType
      });
    }

  } catch (error) {
    console.error('[DELETE] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Restore file from Trash
app.post('/api/files/restore', async (req, res) => {
  try {
    const { filePath } = req.body;
    if (!filePath) return res.status(400).json({ error: 'File path required' });

    // filePath comes as absolute path to the file in trash
    const trashFileName = path.basename(filePath);
    const safePath = path.resolve(TRASH_DIR, trashFileName);

    if (!safePath.startsWith(TRASH_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const trashMeta = await getTrashMetadata();
    const fileMeta = trashMeta[trashFileName];

    if (!fileMeta) {
      return res.status(404).json({ error: 'Restoration metadata not found' });
    }

    const { originalPath } = fileMeta;

    // Check if original directory exists, if not, put in root
    const originalDir = path.dirname(originalPath);
    let targetPath = originalPath;

    try {
      await fs.access(originalDir);
    } catch {
      // Directory missing, restore to root DEMO_DIR + original name
      targetPath = path.join(DEMO_DIR, fileMeta.originalName);
    }

    // Check if target already exists (collision)
    try {
      await fs.access(targetPath);
      // Append timestamp to avoid collision
      const ext = path.extname(targetPath);
      const name = path.basename(targetPath, ext);
      targetPath = path.join(path.dirname(targetPath), `${name}-restored-${Date.now()}${ext}`);
    } catch {
      // OK
    }

    await fs.rename(safePath, targetPath);

    // Cleanup metadata
    delete trashMeta[trashFileName];
    await saveTrashMetadata(trashMeta);

    res.json({ success: true, message: 'Restored successfully', newPath: targetPath });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Trash Items
app.get('/api/files/trash', async (req, res) => {
  try {
    const trashItems = await fs.readdir(TRASH_DIR);
    const trashMeta = await getTrashMetadata();
    const validItems = [];

    // Filter out .trash-metadata.json and system files
    const actualFiles = trashItems.filter(item => item !== '.trash-metadata.json' && !item.startsWith('.'));

    for (const item of actualFiles) {
      const itemPath = path.join(TRASH_DIR, item);
      try {
        const fileStats = await getFileMetadata(itemPath);
        const meta = trashMeta[item] || {};
        validItems.push({
          ...fileStats,
          originalPath: meta.originalPath || 'Unknown',
          deletedAt: meta.deletedAt,
          name: meta.originalName || fileStats.name // Display original name
        });
      } catch (e) {
        // Skip partial/corrupt
      }
    }

    res.json({ files: validItems, total: validItems.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rename file or folder
app.patch('/api/files/rename', async (req, res) => {
  try {
    const { filePath, newName } = req.body;
    console.log(`[RENAME] Request: path="${filePath}", newName="${newName}"`);

    if (!filePath || !newName) {
      return res.status(400).json({ error: 'File path and new name are required' });
    }

    // Validate new name - no special characters or path traversal
    const invalidChars = /[\/\\:*?"<>|]/;
    if (invalidChars.test(newName) || newName.includes('..')) {
      return res.status(400).json({ error: 'Invalid name. Avoid special characters and path traversal.' });
    }

    const safePath = path.resolve(DEMO_DIR, path.relative(DEMO_DIR, filePath));
    console.log(`[RENAME] Resolved: "${safePath}"`);

    // Security check - ensure path is within demo directory
    if (!safePath.startsWith(DEMO_DIR)) {
      console.log('[RENAME] Access denied - Outside DEMO_DIR');
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if source file/folder exists
    try {
      await fs.access(safePath);
    } catch (e) {
      return res.status(404).json({ error: 'File or folder not found' });
    }

    // Calculate new path
    const parentDir = path.dirname(safePath);
    const newPath = path.join(parentDir, newName);

    // Check if destination already exists
    try {
      await fs.access(newPath);
      return res.status(400).json({ error: 'A file or folder with this name already exists' });
    } catch (e) {
      // Destination doesn't exist, which is what we want
    }

    // Rename the file/folder
    await fs.rename(safePath, newPath);
    console.log(`[RENAME] Success: "${newPath}"`);

    // Update recent files if it exists
    const recentIndex = recentFiles.findIndex(f => f.path === safePath);
    if (recentIndex !== -1) {
      const metadata = await getFileMetadata(newPath);
      recentFiles[recentIndex] = {
        ...metadata,
        accessedAt: recentFiles[recentIndex].accessedAt
      };
    }

    // Get metadata for the renamed item
    const metadata = await getFileMetadata(newPath);

    res.json({
      success: true,
      file: metadata,
      message: `Renamed successfully to "${newName}"`
    });
  } catch (error) {
    console.error('[RENAME] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Move file or directory
app.post('/api/files/move', async (req, res) => {
  try {
    const { sourcePath, destinationPath } = req.body;
    console.log(`[MOVE] Request: source="${sourcePath}", dest="${destinationPath}"`);

    if (!sourcePath || !destinationPath) {
      console.log('[MOVE] Missing paths');
      return res.status(400).json({ error: 'Source and destination paths are required' });
    }

    const safeSource = path.resolve(DEMO_DIR, path.relative(DEMO_DIR, sourcePath));
    const safeDest = path.resolve(DEMO_DIR, path.relative(DEMO_DIR, destinationPath));
    console.log(`[MOVE] Resolved: source="${safeSource}", dest="${safeDest}"`);

    if (!safeSource.startsWith(DEMO_DIR) || !safeDest.startsWith(DEMO_DIR)) {
      console.log('[MOVE] Access denied - Outside DEMO_DIR');
      return res.status(403).json({ error: 'Access denied' });
    }

    let finalDest = safeDest;
    try {
      const destStats = await fs.stat(safeDest);
      if (destStats.isDirectory()) {
        finalDest = path.join(safeDest, path.basename(safeSource));
      }
    } catch (e) {
      // Destination doesn't exist, so it's a rename/move to new path
    }
    console.log(`[MOVE] Final Destination: "${finalDest}"`);

    await fs.rename(safeSource, finalDest);
    console.log('[MOVE] Success');
    res.json({ success: true, newPath: finalDest });
  } catch (error) {
    console.error('[MOVE] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload file with auto-categorization
app.post('/api/files/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const uploadedFile = req.file;
    const ext = path.extname(uploadedFile.originalname).toLowerCase();
    const category = categorizeFile(ext);

    console.log(`[UPLOAD] File: ${uploadedFile.originalname}, Category: ${category}`);

    // Map category to folder name (capitalize first letter)
    const folderName = category.charAt(0).toUpperCase() + category.slice(1);
    const categoryFolder = path.join(DEMO_DIR, folderName);

    // Create category folder if it doesn't exist
    await fs.mkdir(categoryFolder, { recursive: true });

    // Move file to category folder
    const finalPath = path.join(categoryFolder, uploadedFile.originalname);
    await fs.rename(uploadedFile.path, finalPath);

    console.log(`[UPLOAD] Moved to: ${finalPath}`);

    // Get metadata for the uploaded file
    const metadata = await getFileMetadata(finalPath);

    res.json({
      success: true,
      file: metadata,
      category,
      message: `File uploaded to ${folderName} folder`
    });
  } catch (error) {
    console.error('[UPLOAD] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Starred Files Endpoints ---

app.get('/api/files/starred', async (req, res) => {
  try {
    const starredPaths = await getStarredFiles();
    const validFiles = [];

    for (const filePath of starredPaths) {
      try {
        // Check if file still exists
        await fs.access(filePath);
        const stats = await getFileMetadata(filePath);
        validFiles.push({ ...stats, isStarred: true });
      } catch (e) {
        // File not found, skip
      }
    }

    res.json({ files: validFiles, total: validFiles.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/files/star', async (req, res) => {
  try {
    const { filePath } = req.body;
    if (!filePath) return res.status(400).json({ error: 'File path required' });

    const starred = await getStarredFiles();
    if (!starred.includes(filePath)) {
      starred.push(filePath);
      await saveStarredFiles(starred);
    }

    res.json({ success: true, message: 'File starred' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/files/unstar', async (req, res) => {
  try {
    const { filePath } = req.body;
    if (!filePath) return res.status(400).json({ error: 'File path required' });

    let starred = await getStarredFiles();
    starred = starred.filter(p => p !== filePath);
    await saveStarredFiles(starred);

    res.json({ success: true, message: 'File unstarred' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Demo directory: ${DEMO_DIR}`);
});
