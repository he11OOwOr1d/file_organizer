# 📁 CloudBox — File Organizer

A full-stack, web-based personal file manager with a beautiful dark UI. Supports uploading, organizing, previewing, starring, soft-delete (Trash), and searching files — all backed by a real filesystem.

---

## ✨ Features

| Feature | Description |
|---|---|
| **Browse files** | Navigate folders with breadcrumb navigation, list or grid view |
| **Upload files** | Drag-and-drop or click-to-upload with progress feedback |
| **Create folders** | Instantly create new directories at any path |
| **Rename** | Rename files or folders inline; input auto-selects current name |
| **Move** | Move any file or folder to another directory via a tree picker |
| **Delete → Trash** | Soft-delete sends items to Trash; they can be restored |
| **Restore from Trash** | One-click restore to original location |
| **Delete Forever** | Permanently remove items from Trash |
| **Star / Unstar** | Bookmark important files; access them from the Starred view |
| **Search** | Global full-name search across all files and folders (hidden files excluded) |
| **File Preview** | Preview images, video, audio, PDFs (iframe), Markdown (rendered), plain-text with line numbers |
| **Recent Files** | Auto-tracked last-accessed files |
| **Storage Stats** | Live sidebar widget showing used / total storage |
| **File Details** | Metadata panel: size, type, modified date, full path |
| **Category View** | Files grouped by category (documents, images, audio, video, code, etc.) |

---

## 🖥️ Tech Stack

### Frontend
| Tech | Version | Purpose |
|---|---|---|
| Next.js | 16.1.6 | React framework (App Router) |
| React | 19.2.3 | UI library |
| TypeScript | ^5 | Type safety |
| Tailwind CSS | ^4 | Utility-first styling |
| Radix UI | ^1.4 | Accessible components (dialogs, etc.) |
| Lucide React | ^0.563 | Icon set |
| Framer Motion | ^12 | Animations |

### Backend
| Tech | Version | Purpose |
|---|---|---|
| Node.js | ≥ 20 | Runtime |
| Express | ^4.18 | HTTP server |
| Multer | ^2.0 | File upload handling |
| `fs/promises` | built-in | Async filesystem operations |

---

## 🏗️ Project Structure

```
file_organizer/
├── backend/
│   ├── server.js              # Express API server (all 20 endpoints)
│   ├── demo-files/            # Root storage directory
│   │   ├── Audio/
│   │   ├── Documents/
│   │   ├── Images/
│   │   ├── Videos/
│   │   ├── Other/
│   │   ├── .trash/            # Soft-deleted files (hidden from UI)
│   │   └── .starred.json      # Starred file paths (hidden from UI)
│   └── package.json
│
└── frontend/
    ├── app/
    │   └── page.tsx           # Root page — all state & view routing
    ├── components/
    │   ├── app-sidebar.tsx    # Sidebar: My Files, Recent, Starred, Trash + storage
    │   ├── top-bar.tsx        # Contextual action bar (rename, move, delete, star, info)
    │   ├── file-explorer.tsx  # Directory listing with list/grid toggle
    │   ├── all-files-view.tsx # Flat file list for search results
    │   ├── recent-files-view.tsx
    │   ├── starred-view.tsx
    │   ├── trash-view.tsx
    │   ├── file-preview-dialog.tsx  # Type-aware file preview
    │   ├── move-dialog.tsx          # Folder tree picker for moving files
    │   ├── rename-dialog.tsx
    │   ├── delete-confirmation-dialog.tsx
    │   ├── create-folder-dialog.tsx
    │   ├── file-details-dialog.tsx
    │   ├── file-upload.tsx
    │   └── storage-analysis-dialog.tsx
    └── lib/
        └── api.ts             # Typed fetch wrappers for all backend endpoints
```

---

## 🔌 API Reference

Base URL: `http://localhost:5002`

### Files
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/files?path=` | List directory contents |
| `GET` | `/api/files/all` | Recursive list of all files |
| `GET` | `/api/files/metadata?path=` | Get metadata for a file/folder |
| `GET` | `/api/files/content?path=` | Read file content (text) |
| `GET` | `/api/files/search?query=` | Search by name across all files |
| `GET` | `/api/files/recent` | Get recently accessed files |
| `GET` | `/api/files/categorize` | Files grouped by category |
| `POST` | `/api/files/upload` | Upload a file (`multipart/form-data`) |
| `POST` | `/api/folders/create` | Create a new folder |
| `PATCH` | `/api/files/rename` | Rename a file or folder |
| `POST` | `/api/files/move` | Move a file or folder |
| `DELETE` | `/api/files/delete` | Soft-delete (→ Trash) or permanent delete |

### Trash
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/files/trash` | List Trash contents |
| `POST` | `/api/files/restore` | Restore an item from Trash |

### Starred
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/files/starred` | List starred files |
| `POST` | `/api/files/star` | Star a file |
| `POST` | `/api/files/unstar` | Unstar a file |

### System
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/storage` | Storage usage stats |
| `GET` | `/api/categories/rules` | File categorization rules |
| `GET` | `/api/health` | Health check |

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 20
- npm

### 1. Clone the repo
```bash
git clone https://github.com/he11OOwOr1d/file_organizer.git
cd file_organizer
```

### 2. Start the Backend
```bash
cd backend
npm install
npm run dev        # starts on http://localhost:5002 with --watch (auto-restart)
```

### 3. Start the Frontend
```bash
cd frontend
npm install
npm run dev        # starts on http://localhost:3000
```

### 4. Open the app
Visit **http://localhost:3000** in your browser.

---

## 🔑 Key Design Decisions

- **Soft Delete** — Files moved to Trash are stored in `demo-files/.trash/` with a timestamp prefix and metadata JSON to remember the original path for restore.
- **Hidden files** — Internal files (`.trash/`, `.starred.json`) are filtered from all API responses so they never appear in the UI.
- **Single-page app** — All views (My Files, Recent, Starred, Trash, Search) are controlled by a single `viewMode` state in `page.tsx`, keeping navigation instant with no HTTP routing.
- **Type-aware previews** — The preview dialog detects MIME type and renders accordingly: `<img>` for images, `<video>` for video, `<iframe>` for PDF, rendered HTML for Markdown, syntax-highlighted `<pre>` for code and text.
- **2 GB storage cap** — Configurable constant in `server.js`; storage widget shows live usage percentage.

---

## 📝 License

MIT
