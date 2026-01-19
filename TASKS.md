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

## Known Issues / Tech Debt
- History size reduced to 10 snapshots (from 50) due to multi-layer memory usage
- Layer thumbnails update on commit only (not real-time)
- Visibility/opacity changes don't create history entries (by design)

## Notes
- All tasks assume Vanilla JS only, no frameworks
- Performance target: smooth on 800x600 canvas
- Must maintain undo/redo compatibility
- Live Server verification required before merge to main
