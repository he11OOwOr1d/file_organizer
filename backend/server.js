import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5001;

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Middleware
app.use(cors());
app.use(express.json());

// Demo files directory
const DEMO_DIR = path.join(__dirname, 'demo-files');

// Ensure demo directory exists
await fs.mkdir(DEMO_DIR, { recursive: true });

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
    res.json(metadata);
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

    const files = await fs.readdir(safePath);
    const categories = {};
    let totalSize = 0;

    for (const file of files) {
      const filePath = path.join(safePath, file);
      const metadata = await getFileMetadata(filePath);

      if (!metadata.isDirectory) {
        const category = metadata.category;
        if (!categories[category]) {
          categories[category] = { count: 0, size: 0, files: [] };
        }
        categories[category].count++;
        categories[category].size += metadata.size;
        categories[category].files.push(metadata.name);
        totalSize += metadata.size;
      }
    }

    res.json({
      categories,
      totalFiles: files.length,
      totalSize,
    });
  } catch (error) {
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
