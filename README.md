# Web Paint - Vanilla JS Bitmap Editor

A professional web-based bitmap drawing application built with vanilla JavaScript. Features include multi-layer support, advanced drawing tools, zoom/pan, and more.

## 🚀 Quick Start

1. Open the project in VS Code/Cursor
2. Start Live Server (right-click `index.html` → Open with Live Server)
3. Application opens at `http://127.0.0.1:5500/`

No build process required - runs directly in the browser!

## ✨ Features

### Drawing Tools
- **Pen Tool** (P): Freehand drawing with adjustable brush size
- **Eraser Tool** (E): True transparent erasing
- **Fill Tool** (F): Flood fill with tolerance control
- **Color Picker** (I): Sample colors from canvas
- **Shape Tools**: Rectangle (R), Ellipse (C), Line (L)

### Selection & Clipboard
- **Rectangle Selection** (S): Select rectangular areas
- **Lasso Selection** (A): Free-form selection with point-in-polygon detection
- **Copy/Cut/Paste** (Ctrl+C/X/V): Full clipboard support with drag-to-position

### Layer System
- Up to 20 layers with thumbnails
- Layer visibility toggle
- Opacity control (0-100%)
- 12 blend modes (Normal, Multiply, Screen, Overlay, etc.)
- Drag-and-drop reordering
- Merge down and flatten operations
- Double-click to rename layers

### View Controls
- **Zoom**: 10% - 500% (Ctrl+Wheel, Ctrl+0/+/-)
- **Pan**: Space + drag to move canvas
- **Fit to Screen**: Auto-fit canvas to viewport

### Other Features
- Undo/Redo (up to 10 steps)
- Canvas resize (scale or crop mode)
- Text tool with font family and size controls
- File operations: Open image (PNG/JPG/WebP), Save as PNG
- Drag-and-drop file upload
- Keyboard shortcuts help (? or H)

## 📁 Project Structure

```
/
├── index.html              # Main HTML structure
├── styles.css              # All styling (glass-morphism design)
├── js/
│   ├── app-constants.js    # Constants and canvas initialization
│   ├── app-state.js        # Application state and init
│   ├── drawing-tools.js    # Pen, eraser, shapes, fill, picker
│   ├── file-io.js          # File operations and loading indicators
│   ├── history.js          # Undo/redo system
│   ├── layer-core.js       # Layer system core functions
│   ├── layer-ui.js         # Layer panel UI and management
│   ├── selection-tools.js  # Selection, clipboard, lasso
│   ├── ui-handlers.js      # Event handlers and UI interactions
│   └── zoom-pan.js         # Zoom and pan functionality
├── CLAUDE.md               # Project specifications
├── WORKLOG.md              # Development history
└── README.md               # This file
```

## 🏗️ Architecture

### Module System
The application uses an IIFE + global namespace pattern (`window.App`):

```javascript
window.App = {
  Constants: { canvas, ctx, CONSTANTS },
  State: { state, init },
  DrawingTools: { drawPen, drawEraser, floodFill, ... },
  FileIO: { clearCanvas, saveImage, openImageFile, ... },
  History: { saveState, undo, redo, ... },
  Layers: { compositeAllLayers, getActiveLayer, ... },
  LayerUI: { addLayer, deleteLayer, updateLayerUI, ... },
  SelectionTools: { copySelection, pasteFromClipboard, ... },
  UI: { setupEventListeners, handlePointerDown, ... },
  ZoomPan: { setZoom, screenToCanvas, ... }
};
```

### Canvas Architecture
- **Display Canvas**: Read-only composite output shown to user
- **Layer Canvases**: Off-screen canvases for each layer
- **Compositing Engine**: Combines all layers with opacity/blend modes
- **Zoom/Pan**: CSS transforms for GPU-accelerated rendering
- **Coordinate Mapping**: Screen coordinates → canvas pixel coordinates

### History System
- Multi-layer snapshots using `ImageData`
- Max 10 snapshots (reduced for memory efficiency with 20 layers)
- Snapshots saved on commit (mouseup), not during drawing

## 🎮 Keyboard Shortcuts

### Tools
- **P**: Pen Tool
- **E**: Eraser Tool
- **F**: Fill Tool
- **I**: Color Picker
- **S**: Rectangle Selection
- **A**: Lasso Selection
- **T**: Text Tool

### Shapes
- **R**: Rectangle
- **C**: Ellipse (Circle)
- **L**: Line

### Edit
- **Ctrl+Z**: Undo
- **Ctrl+Y**: Redo
- **Ctrl+C**: Copy Selection
- **Ctrl+X**: Cut Selection
- **Ctrl+V**: Paste
- **Ctrl+O**: Open Image File

### View
- **Ctrl+Wheel**: Zoom In/Out
- **Ctrl++**: Zoom In
- **Ctrl+-**: Zoom Out
- **Ctrl+0**: Reset Zoom (100%)
- **Space+Drag**: Pan Canvas
- **Tab**: Toggle Toolbox Visibility

### Other
- **? or H**: Show Help Modal
- **Escape**: Cancel Paste/Text Mode

## 🔧 Development

### Recent Changes (2026-01-16)
- ✅ Refactored monolithic `main.js` (2800+ lines) into 10 modular files
- ✅ Fixed namespace reference errors after modularization
- ✅ All features verified and working correctly

### Code Quality
- Each module: 200-400 lines (manageable size)
- Clear separation of concerns
- Namespace pattern prevents naming conflicts
- Module-level documentation at file headers

### Performance Notes
- **Compositing 20 layers @ 800x600**: ~5-10ms (GPU-accelerated)
- **Flood fill**: Optimized scanline algorithm (3-5x faster)
- **History snapshots**: ~200-500ms for 20 layers (acceptable)
- **Zoom/pan**: GPU-accelerated CSS transforms (smooth 60fps)

## 📝 Known Limitations

- No ES6 modules (uses IIFE + global namespace)
- No build system/bundler
- History limited to 10 snapshots (memory constraint)
- Layer reordering uses drag-and-drop (no multi-select)
- No layer groups/folders

## 🎯 Future Enhancements

- Migrate to ES6 modules (`import`/`export`)
- Add bundler (Vite/Rollup) for production builds
- Implement lazy loading for non-critical modules
- Add TypeScript for type safety
- Layer groups and advanced blend modes
- Touch device optimizations

## 📚 Documentation

- **CLAUDE.md**: Product spec and requirements
- **WORKLOG.md**: Detailed development history with technical notes
- **README.md**: This file - quick reference and overview

## 🐛 Troubleshooting

### Application won't load
- Ensure Live Server is running
- Check browser console for errors
- Verify all 10 JS files loaded (Network tab)

### Functions undefined errors
- Check `App.*` namespace exists in console
- Verify module load order in `index.html`
- Clear browser cache and reload

### Performance issues
- Reduce number of layers (20 is max)
- Lower canvas resolution in resize dialog
- Clear history with canvas reset if needed

---

**Built with ❤️ using Vanilla JavaScript**
