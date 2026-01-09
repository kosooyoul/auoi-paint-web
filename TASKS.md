# auoi-paint-web Tasks & Suggestions

## Current State
- ✅ Core painting tools (pen, eraser, shapes, fill, picker, selection)
- ✅ Undo/Redo (50 steps)
- ✅ Fill tolerance slider (0-60)
- ✅ Copy/Cut/Paste with positioning
- ✅ Save as PNG
- ✅ Keyboard shortcuts help modal
- ✅ Canvas resize functionality (Scale/Crop modes)

## Suggested Next Tasks (Priority Order)

### 0. [COMPLETED] ~~UI Refinement & Visual Polish~~
**Status:** ✅ Completed (2026-01-09)
- CSS variable system implemented (colors, shadows, transitions)
- Modern purple-blue gradient color palette
- Enhanced button states with hover/active/disabled effects
- Premium canvas styling with checkered background
- Smooth animations and transitions throughout
- Custom scrollbar styling
- Modal blur backdrop and slide-in animations

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

### 3. [MEDIUM] Text Tool
**Why:** Common paint feature, currently missing
**Effort:** Medium-High (4-6 hours)
**Value:** Medium
**Scope:**
- Click to place text cursor
- Input text (overlay input or prompt)
- Font family, size, color selection
- Commit text to canvas (rasterize)

### 4. [LOW] Free-form Selection (Lasso Tool)
**Why:** More flexible than rectangle selection
**Effort:** High (6-8 hours)
**Value:** Medium
**Scope:**
- Freehand lasso path drawing
- Close path automatically
- Copy/cut/paste selected region
- Complex pixel selection logic

### 5. [LOW] Zoom & Pan
**Why:** Work on details, large canvases
**Effort:** High (8+ hours)
**Value:** Low-Medium
**Scope:**
- Zoom in/out (mouse wheel, buttons)
- Pan when zoomed (drag or arrow keys)
- Maintain drawing coordinates
- Performance optimization needed

### 6. [FUTURE] Layer Support
**Why:** Professional feature
**Effort:** Very High (16+ hours)
**Value:** High for advanced users
**Scope:**
- Multiple canvas layers
- Layer visibility, opacity, order
- Layer panel UI
- Major architecture refactor

## Known Issues / Tech Debt
- None currently blocking

## Notes
- All tasks assume Vanilla JS only, no frameworks
- Performance target: smooth on 800x600 canvas
- Must maintain undo/redo compatibility
- Live Server verification required before merge to main
