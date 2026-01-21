# auoi-paint-web Tasks & Suggestions

## Current State
- ✅ Core painting tools (pen, eraser, shapes, fill, picker, selection, lasso, text)
- ✅ Undo/Redo (10 steps - reduced for multi-layer memory efficiency)
- ✅ Fill tolerance slider (0-60)
- ✅ Copy/Cut/Paste with positioning
- ✅ Save as PNG (flattened composite)
- ✅ Keyboard shortcuts help modal
- ✅ Canvas resize functionality (Scale/Crop modes)
- ✅ Zoom & Pan (10%-500%, Ctrl+Wheel, Space+drag)
- ✅ Canvas-centric UX with floating, draggable toolbox
- ✅ Multi-layer system (up to 20 layers with visibility, opacity, reordering, merge, flatten)
- ✅ Advanced color palette system (Primary/Secondary colors, history, presets)
- ✅ Dark mode with theme toggle and localStorage persistence

## Suggested Next Tasks (Priority Order)

### 0. [COMPLETED] ~~Canvas-Centric UX Redesign~~
**Status:** ✅ Completed (2026-01-12)
- Full-screen canvas layout (95%+ viewport)
- Floating, draggable toolbox with glass-morphism effect
- Tab key to toggle toolbox visibility
- Minimize/expand button on toolbox
- localStorage persistence for toolbox position
- Modern UI design (Procreate/Figma inspired)
- All tools organized in logical sections

---

### 0.1. [COMPLETED] ~~UI Refinement & Visual Polish~~
**Status:** ✅ Completed but needs redesign (2026-01-09)
- CSS variable system implemented (colors, shadows, transitions)
- Modern purple-blue gradient color palette
- Enhanced button states with hover/active/disabled effects
- Premium canvas styling with checkered background
- **Issue:** 고정 툴바가 캔버스 공간 차지, Canvas-Centric 재설계 필요 (Task #0)

### 1. [COMPLETED] ~~Keyboard Shortcuts Help UI~~
**Status:** ✅ Completed (2026-01-08)
- Help button added to toolbar
- Modal with organized sections (Tools, Shapes, Edit, Help)
- Keyboard toggle with ? or H key
- Clean kbd styling

### 2. [COMPLETED] ~~Canvas Resize Functionality~~
**Status:** ✅ Completed (2026-01-08)
- Width/Height input fields (100-2000px range)
- Resize button with Scale/Crop mode options
- Working implementation verified

### 3. [COMPLETED] ~~Text Tool~~
**Status:** ✅ Completed (2026-01-09)
- Click to place text with overlay input
- Font family selection (5 fonts)
- Font size control (8-200px)
- Text rasterized to canvas on commit

### 4. [COMPLETED] ~~Free-form Selection (Lasso Tool)~~
**Status:** ✅ Completed (2026-01-09)
- Freehand lasso path drawing
- Auto-close path on mouse release
- Ray casting algorithm for point-in-polygon
- Copy/cut/paste with lasso selection
- Marquee persists across tool changes

### 5. [COMPLETED] ~~Zoom & Pan~~
**Status:** ✅ Completed (2026-01-09)
- Zoom range: 10% - 500%
- Zoom methods: Ctrl+Wheel (toward cursor), +/- buttons, slider
- Pan: Space + drag (hand cursor)
- UI: Zoom level display, Fit to Screen, Reset (100%)
- All drawing tools work accurately at any zoom level
- Hybrid CSS transform + coordinate mapping architecture
- GPU-accelerated, smooth performance

### 6. [COMPLETED] ~~Layer Support~~
**Status:** ✅ Completed (2026-01-13)
**Effort:** Very High (16+ hours)
**Value:** High for advanced users
**Scope:**
- Multiple canvas layers (up to 20 layers)
- Layer visibility toggle
- Layer opacity control (0-100%)
- Layer reordering (move up/down buttons)
- Merge down & flatten all operations
- Layer panel UI with thumbnails
- Major architecture refactor (off-screen layer canvases + compositing)
- History system adapted for multi-layer snapshots
- All drawing tools work on active layer

### 7. [COMPLETED] ~~UI Improvements v2~~
**Status:** ✅ Completed (2026-01-19)
**Effort:** Medium (3-4 hours)
**Value:** High - improved usability and modern aesthetics
**Scope:**

**UI Polish:**
- Improved button icons with clearer Unicode characters
- Enhanced spacing and alignment throughout toolbox
- Section backgrounds with hover effects
- Color accent bars on section labels

**Advanced Color Palette System:**
- Primary/Secondary color system with visual swatches
- Swap colors button (or X keyboard shortcut)
- Color history (16 recent colors, persisted to localStorage)
- Preset color palette (36 Material Design colors)
- Left-click sets primary, right-click sets secondary color

**Dark Mode:**
- CSS variable-based theme system
- Light/Dark theme toggle in header (☀️/🌙)
- Keyboard shortcut: Ctrl+Shift+D
- Theme preference saved to localStorage
- Smooth transitions between themes

### 8. [COMPLETED] ~~Layer Performance Optimization~~
**Status:** ✅ Completed (2026-01-20)
**Effort:** High (4-5 hours)
**Value:** Very High - enables 2.5x more layers with better memory efficiency
**Scope:**

**Incremental History System:**
- Only saves changed layers (not all layers every time)
- Full snapshot every 5 saves for safety
- Force full snapshot on layer structure changes (add/delete/merge/reorder)
- 80-90% memory reduction for typical drawing workflows

**Dynamic History Size:**
- History size adjusts based on layer count
- 1 layer: 20 snapshots
- 50 layers: 10 snapshots
- Linear interpolation between

**Increased Layer Limit:**
- MAX_LAYERS: 20 → 50
- Tested with Jest unit tests (31 passing tests)

**Testing:**
- Jest + jsdom + canvas-mock setup
- 16 tests for history system
- 15 tests for layer system
- All tests passing

### 9. [COMPLETED] ~~Symmetry/Mirror Drawing~~
**Status:** ✅ Completed (2026-01-21)
**Effort:** Low (2 hours)
**Value:** High - enables creative symmetrical artwork
**Scope:**
- Symmetry modes: None, Horizontal, Vertical, Radial (4-way)
- Toggle buttons in toolbar
- Real-time mirrored strokes for Pen and Eraser tools
- Works with all drawing operations
- Radial symmetry around canvas center

### 10. [COMPLETED] ~~Grid & Guides~~
**Status:** ✅ Completed (2026-01-21)
**Effort:** Low (1.5 hours)
**Value:** High - precision drawing aid
**Scope:**
- Toggle grid overlay with checkbox
- Configurable grid size (10-100px)
- Semi-transparent blue grid lines
- Snap to Grid option for automatic alignment
- Applied to all drawing tools (pen, shapes, etc.)

### 11. [COMPLETED] ~~Export Formats~~
**Status:** ✅ Completed (2026-01-21)
**Effort:** Low (1 hour)
**Value:** Medium - user convenience
**Scope:**
- PNG (lossless, no quality control)
- JPEG (with quality slider 0-100%)
- WebP (with quality slider 0-100%)
- Format selector in Export section
- Quality slider hidden for PNG format

### 12. [COMPLETED] ~~Gradient Tool~~
**Status:** ✅ Completed (2026-01-21)
**Effort:** Medium (2 hours)
**Value:** High - professional effect tool
**Scope:**
- Linear gradient (start to end point)
- Radial gradient (center outward)
- Uses Primary → Secondary color
- Drag to define gradient direction/radius
- Preview while dragging
- Fills entire layer

---

## Future Task Suggestions (Not Started)

### 13. Filters & Image Adjustments
**Priority:** Medium
**Effort:** High (8-12 hours)
**Value:** High - adds professional image editing capabilities
**Scope:**
- **Basic Filters:**
  - Blur (Gaussian)
  - Sharpen
  - Brightness/Contrast
  - Saturation/Hue
  - Invert colors
  - Grayscale
- **Advanced:**
  - Levels adjustment
  - Curves
  - Color balance
- **UI:**
  - Filter panel with live preview
  - Slider controls
  - Apply/Cancel buttons
- **Implementation:**
  - WebGL shaders for performance (optional)
  - Or Canvas 2D ImageData manipulation

### 14. ES6 Module Migration
**Priority:** Low (technical improvement)
**Effort:** High (6-8 hours)
**Value:** Medium - better maintainability
**Scope:**
- Convert IIFE to ES6 modules (`import`/`export`)
- Remove global `App` namespace
- Add bundler (Vite recommended)
- Update test setup for ES6 modules
- Production build optimization

### 15. TypeScript Migration
**Priority:** Low (technical improvement)
**Effort:** Very High (12-16 hours)
**Value:** High for long-term maintainability
**Scope:**
- Add TypeScript configuration
- Create type definitions for all modules
- Migrate JS files to TS incrementally
- Update tests to TypeScript
- Type-safe state management

### 16. Touch Device Optimization
**Priority:** Medium
**Effort:** Medium (5-7 hours)
**Value:** High - enables mobile/tablet use
**Scope:**
- Touch event handlers
- Pinch-to-zoom gesture
- Two-finger pan
- Pressure sensitivity (Apple Pencil support)
- Touch-friendly UI (larger buttons)
- Virtual keyboard handling

### 17. Layer Groups/Folders
**Priority:** Medium
**Effort:** Very High (10-14 hours)
**Value:** High for complex projects
**Scope:**
- Hierarchical layer structure
- Collapse/expand groups
- Group opacity/blend modes
- Drag layers between groups
- UI redesign for tree view

### 18. Performance Profiling & Optimization
**Priority:** Low
**Effort:** Medium (3-5 hours)
**Value:** Medium - ensure smooth performance
**Scope:**
- Performance benchmarks
- Memory profiling
- Identify bottlenecks
- Optimize hot paths
- Document performance characteristics

---

## Known Issues / Tech Debt
- Layer thumbnails update on commit only (not real-time)
- Visibility/opacity changes don't create history entries (by design)
- Pixel-level unit tests not possible (canvas mock limitations)

## Notes
- All tasks assume Vanilla JS only, no frameworks
- Performance target: smooth on 800x600 canvas
- Must maintain undo/redo compatibility
- Live Server verification required before merge to main
