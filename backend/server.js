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

// Ensure demo directory exists
await fs.mkdir(DEMO_DIR, { recursive: true });

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

    const files = await fs.readdir(safePath);
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

    res.sendFile(safePath);
  } catch (error) {
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

// Delete file or folder
app.delete('/api/files/delete', async (req, res) => {
  try {
    const { filePath } = req.body;
    console.log(`[DELETE] Request: path="${filePath}"`);

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    const safePath = path.resolve(DEMO_DIR, path.relative(DEMO_DIR, filePath));
    console.log(`[DELETE] Resolved: "${safePath}"`);

    // Security check - ensure path is within demo directory
    if (!safePath.startsWith(DEMO_DIR)) {
      console.log('[DELETE] Access denied - Outside DEMO_DIR');
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if file/folder exists
    try {
      await fs.access(safePath);
    } catch (e) {
      return res.status(404).json({ error: 'File or folder not found' });
    }

    // Get metadata before deletion to check if it's a directory
    const metadata = await getFileMetadata(safePath);
    const itemType = metadata.isDirectory ? 'folder' : 'file';

    // Delete file or folder (recursive for folders)
    await fs.rm(safePath, { recursive: true, force: true });
    console.log('[DELETE] Success');

    // Remove from recent files if it exists
    const recentIndex = recentFiles.findIndex(f => f.path === safePath);
    if (recentIndex !== -1) {
      recentFiles.splice(recentIndex, 1);
    }

    res.json({
      success: true,
      message: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} deleted successfully`,
      itemType
    });
  } catch (error) {
    console.error('[DELETE] Error:', error);
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

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Demo directory: ${DEMO_DIR}`);
});
