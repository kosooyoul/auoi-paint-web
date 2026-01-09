# Work Log

## 2026-01-09 - Add Lasso (Free-form Selection) Tool

### What Changed
- Added lasso tool for free-form selection
- Implemented point-in-polygon detection for irregular shapes
- Enhanced copy/cut operations to work with lasso selections
- Selection marquee now persists across tool changes

### Technical Details

#### UI Changes
- Added lasso tool button (⚬) to toolbar with keyboard shortcut (A)
- Lasso path drawn with dashed line during selection
- Closed path creates selection marquee
- Updated help modal with lasso tool shortcuts

#### Algorithm Implementation
- **Path Drawing**: Freehand path tracking with point throttling (min 3px distance)
- **Auto-close**: Path automatically closes on mouse release
- **Ray Casting**: Point-in-polygon detection using ray casting algorithm
- **Selective Copy/Cut**: Only pixels inside polygon are copied/cut, outside pixels set to transparent

#### State Management
- Added `lassoPath` array to track selection points
- Selection object stores both relative and absolute paths
- `lassoPathAbsolute` used for marquee redrawing
- Marquee persists when using other tools (pen, eraser, shapes, text)

### How Verified
✅ Draw complex free-form shapes
✅ Path closes correctly on mouse release
✅ Copy only copies pixels inside lasso
✅ Cut only removes pixels inside lasso
✅ Paste works same as rectangle selection
✅ Marquee persists across tool changes
✅ Selection cleared on undo/redo
✅ No console errors

### Known Limitations
- Ray casting can be slow for very complex paths (1000+ points)
- No anti-aliasing on selection edges
- Cannot edit lasso path after creation

---

## 2026-01-09 - Add Text Tool

### What Changed
- Added text tool for placing text on canvas
- Font family and size controls
- Click-to-place text input with overlay

### Technical Details

#### UI Changes
- Added text tool button (T) to toolbar
- Font family dropdown (Arial, Courier, Georgia, Times, Verdana)
- Font size input (8-200px, default 24px)
- Overlay text input appears at click position
- Help modal updated with text tool shortcuts

#### Implementation
- **Text Input Overlay**: Positioned absolutely at click coordinates
- **Font Styling**: Input styled to match selected font/size/color
- **Commit/Cancel**: Enter commits text to canvas, Escape cancels
- **Canvas Rendering**: Text rasterized using `ctx.fillText()`
- Undo/redo support through normal state saving

#### State Management
- Added `fontFamily`, `fontSize` to state
- Added `textMode`, `textX`, `textY` for tracking text placement
- Text uses current color from color picker

### How Verified
✅ Text tool activates with T key
✅ Font family changes apply correctly
✅ Font size changes apply correctly
✅ Click positions text input accurately
✅ Enter commits text to canvas
✅ Escape cancels without adding text
✅ Text uses selected color
✅ Undo/redo works after text placement

### Known Limitations
- No text editing after placement (rasterized immediately)
- No bold/italic/underline options
- No text alignment options
- Cannot drag text before committing

---

## 2026-01-09 - Add Canvas Resize Functionality

### What Changed
- Added canvas resize feature with two modes
- Width/height input fields for custom dimensions
- Scale or crop existing content when resizing

### Technical Details

#### UI Changes
- Width/height number inputs (100-2000px range)
- Radio buttons for Scale vs Crop mode
- Resize button with confirmation dialog
- Input validation with error alerts

#### Resize Modes
- **Scale Mode**: Content stretched/shrunk to new dimensions using `drawImage()`
- **Crop Mode**: Content kept at original size, canvas expanded/cropped
- Both modes fill new areas with white background

#### Implementation
- Creates temporary canvas to preserve content during resize
- Updates canvas width/height attributes
- Redraws content based on selected mode
- Clears selection after resize
- Saves state for undo/redo

### How Verified
✅ Scale mode enlarges content correctly
✅ Scale mode shrinks content correctly
✅ Crop mode expands canvas (adds white space)
✅ Crop mode crops canvas (cuts off edges)
✅ Invalid dimensions show error alert
✅ Confirmation dialog appears
✅ Undo/redo works after resize
✅ Selection cleared after resize

### Known Limitations
- Cannot maintain aspect ratio automatically
- No preset size buttons (e.g., 1024x768, 1920x1080)
- Scale mode may cause quality loss
- Cannot undo just the resize mode choice

---

## 2026-01-09 - Add Keyboard Shortcuts Help Modal

### What Changed
- Added help button and modal displaying all keyboard shortcuts
- Organized shortcuts by category (Tools, Shapes, Edit, Text, Help)
- Toggle with ? or H key

### Technical Details

#### UI Changes
- Help button (❓) added to toolbar
- Modal overlay with centered content card
- Close button (×) in header
- Shortcuts displayed in organized tables with `<kbd>` styling
- Click outside modal to close

#### Implementation
- Modal hidden by default with `display: none`
- Toggle with `.active` class using flexbox
- Event listeners: button click, close button, outside click, keyboard toggle
- Keyboard shortcuts: ? or H key (prevents conflicts with tool shortcuts)

#### Content
- **Tools**: P, E, F, I, S, A, T shortcuts
- **Shapes**: R, C, L shortcuts
- **Edit**: Ctrl+Z/Y/C/X/V, Escape
- **Text**: Enter (commit), Escape (cancel)
- **Help**: ? or H to toggle modal

### How Verified
✅ Help button opens modal
✅ ? key toggles modal
✅ H key toggles modal
✅ × button closes modal
✅ Click outside closes modal
✅ All shortcuts listed correctly
✅ Modal scrollable if content overflows

### Known Limitations
- Shortcuts are read-only (cannot be customized)
- No search/filter functionality
- No printable version

---

## 2026-01-08 - Add Fill Tolerance Slider

### What Changed
- Added tolerance slider to bucket fill tool
- Enhanced flood fill algorithm to support color tolerance

### Technical Details

#### UI Changes
- Added "Tolerance" slider (0-60, default 10) with numeric display to toolbar
- Slider updates live, showing current tolerance value

#### Algorithm Enhancement
- Modified `colorsMatch()` function to accept tolerance parameter
- Per-channel RGB threshold comparison (no sqrt for performance)
- Tolerance = 0 uses exact match (fast path)
- Tolerance > 0 checks if all RGB channels are within threshold
- Alpha channel must always match exactly

#### Implementation
- Added `fillTolerance` to app state (default: 10)
- Flood fill now passes tolerance to color matching
- Performance optimized: no expensive sqrt calculations per pixel

### How Verified
✅ Tolerance 0: Strict exact color matching works
✅ Tolerance 10-30: Fills similar colors naturally
✅ Tolerance 60: Fills broad color ranges
✅ Large canvas (800x600) fill remains responsive
✅ No console errors
✅ Slider updates work in real-time

### Known Limitations
- Per-channel threshold may behave differently than Euclidean distance
- Very high tolerance (>40) may fill too aggressively in gradient areas
- No visual feedback of tolerance range before filling

---

## 2026-01-08 - Initial MVP Release

### What Changed
- Created Web Paint application from scratch
- Implemented all core painting tools
- Set up complete UI/UX with toolbar and status bar
- Added comprehensive keyboard shortcuts

### Features Implemented

#### Drawing Tools
- **Pen Tool** (P): Freehand drawing with configurable brush size (1-50px), smooth strokes with round caps
- **Eraser Tool** (E): True transparent erasing using `destination-out` composite operation
- **Fill Tool** (F): Flood fill with iterative algorithm (non-recursive for performance)
- **Color Picker** (I): Eyedropper tool to sample pixel colors

#### Shape Tools (with preview)
- **Rectangle** (R): Draw rectangles with live preview
- **Ellipse** (C): Draw ellipses with live preview
- **Line** (L): Draw lines with live preview
- Preview system: shapes not committed until mouseup

#### Selection & Clipboard
- **Selection Tool** (S): Rectangular selection with marquee display
- **Copy** (Ctrl+C): Copy selected area to clipboard
- **Cut** (Ctrl+X): Copy and clear selected area
- **Paste** (Ctrl+V): Paste with draggable positioning, click to commit, Escape to cancel

#### History & File Operations
- **Undo/Redo** (Ctrl+Z / Ctrl+Y): Up to 50 steps using ImageData snapshots
- **Clear Canvas**: New canvas with confirmation dialog
- **Save PNG**: Export current canvas as PNG file

### Technical Details

#### Canvas Architecture
- 800x600 bitmap canvas (HTML5 Canvas 2D)
- State management with:
  - Main canvas context
  - Temporary canvas for previews
  - History stack with ImageData snapshots
  - Clipboard buffer for copy/paste
  - Selection state tracking

#### Performance Optimizations
- Flood fill uses iterative algorithm with stack (no recursion)
- History limited to 50 states to prevent memory issues
- Snapshots only on commit (mouseup), not during pointermove

#### UI/UX
- Clean toolbar with tool groups
- Real-time status bar showing tool and coordinates
- Color picker with visual swatch
- Brush size slider with numeric display
- All buttons have tooltips and keyboard shortcuts

### How Verified
✅ Pen draws smoothly without gaps
✅ Shape preview works (no permanent draw until mouseup)
✅ Fill works on regions without freezing
✅ Eyedropper samples correct color
✅ Eraser truly erases (transparent)
✅ Selection copy/cut/paste works with positioning
✅ Undo/Redo works reliably (tested 20+ steps)
✅ Save PNG exports correctly
✅ No console errors

### Known Limitations (Resolved in later updates)
- ~~Selection is rectangular only (no free-form lasso)~~ ✅ Added lasso tool (2026-01-09)
- ~~Fill tolerance is fixed at 0 (exact color match)~~ ✅ Added tolerance slider (2026-01-08)
- ~~No text tool~~ ✅ Added text tool (2026-01-09)
- ~~Canvas size is fixed at 800x600~~ ✅ Added resize functionality (2026-01-09)
- No layer support (still planned)
- No zoom/pan functionality (still planned)
- Paste always starts at position (50, 50) (minor UX issue)

### File Structure (Current)
```
/
├── CLAUDE.md          # Project specifications
├── TASKS.md           # Feature roadmap and priorities
├── WORKLOG.md         # This file - development history
├── index.html         # Main HTML structure (190 lines)
├── styles.css         # All styling (294 lines)
└── main.js            # Complete application logic (952 lines)
```

### Remaining Enhancements (from TASKS.md)
- ✅ Keyboard shortcuts help modal (completed 2026-01-09)
- ✅ Canvas resize functionality (completed 2026-01-09)
- ✅ Text tool (completed 2026-01-09)
- ✅ Free-form selection / lasso tool (completed 2026-01-09)
- Zoom and pan functionality
- Layer support
- Additional shape options (polygon, star, etc.)
- Touch device support improvements
