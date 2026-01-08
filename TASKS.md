# auoi-paint-web Tasks & Suggestions

## Current State
- ✅ Core painting tools (pen, eraser, shapes, fill, picker, selection)
- ✅ Undo/Redo (50 steps)
- ✅ Fill tolerance slider (0-60)
- ✅ Copy/Cut/Paste with positioning
- ✅ Save as PNG

## Suggested Next Tasks (Priority Order)

### 1. [HIGH] Keyboard Shortcuts Help UI
**Why:** Users don't know available shortcuts (P, E, F, Ctrl+Z, etc.)
**Effort:** Small (1-2 hours)
**Value:** High - better UX
**Scope:**
- Add "Help" or "?" button to toolbar
- Show modal/overlay with keyboard shortcuts list
- Toggle with "?" or "H" key

### 2. [MEDIUM] Canvas Resize Functionality
**Why:** Fixed 800x600 limits use cases
**Effort:** Medium (3-4 hours)
**Value:** Medium - flexibility
**Scope:**
- Add width/height input fields
- "Resize Canvas" button
- Option to scale content or crop
- Preserve undo history if possible

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
