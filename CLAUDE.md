# Project: Web Paint (Vanilla JS Bitmap Editor)

## 1) Goal
- Build a **web-based bitmap drawing tool** (like Windows Paint) using **Vanilla JavaScript + HTML + CSS**.
- The drawing surface is a **Canvas 2D bitmap** (no SVG editor).
- Provide core tools: **pen, shapes, color picker, fill (bucket), eraser, selection (rect) + copy/cut/paste**.
- Run with **Live Server** (VSCode/Cursor). No build step required.

## 2) Product Spec (Must-have)

### Canvas model (bitmap-first)
- Use `<canvas>` as the primary drawing surface.
- Maintain an internal state:
  - `canvas` (display)
  - `ctx` (2D context)
  - `imageData` or offscreen buffer for operations (fill, selection, paste)
- Avoid "vector objects" as the source of truth. Shapes are rasterized onto the bitmap.

### Tools
1) **Pen**
- Freehand drawing with configurable size (default 4px).
- Smooth stroke with lineCap/lineJoin = round.
- Uses primary color.

2) **Shapes**
- At minimum: rectangle, ellipse, line.
- While dragging, show a **preview** (do not permanently draw until mouseup).
- Implement preview via:
  - temporary overlay canvas OR
  - snapshot of base bitmap and redraw preview per pointermove.

3) **Color picker (eyedropper)**
- Click on canvas to sample pixel color under cursor.
- Set as primary color (and optionally secondary later).

4) **Fill (bucket)**
- Flood-fill contiguous area based on tolerance (default tolerance 0 for MVP).
- Must be performant on typical canvas sizes.
- Use imageData-based flood fill algorithm.

5) **Eraser**
- Same as pen but draws with background color (or uses `globalCompositeOperation = 'destination-out'`).
- For MVP: `destination-out` is preferred (true erase).

6) **Selection (rect)**
- Drag to create a rectangular selection.
- Selection actions:
  - **Copy**: store selected pixels to an internal clipboard buffer.
  - **Cut**: copy then clear that region (transparent/white depending on background strategy).
  - **Paste**: place clipboard buffer onto canvas, draggable before commit.
- Selection should have a visible marquee/outline.
- Pasting should support moving the pasted bitmap before committing to base.

### UI/Controls (MVP)
- Toolbar with tool buttons:
  - Pen, Eraser, Fill, Picker, Shape: Rect/Ellipse/Line, Select
- Color palette:
  - Primary color swatch (required)
  - Simple color input (`<input type="color">`) (required)
- Stroke size slider for pen/eraser (required)
- Basic actions:
  - New (clear)
  - Undo/Redo (high priority)
  - Save as PNG (high priority)

## 3) Non-functional Requirements

### Performance
- Target canvas size default: 800x600 (responsive scaling ok but editing should happen in bitmap resolution).
- Pointermove handlers must be efficient (throttle if needed).
- Flood fill must avoid recursion; use queue/stack iterative.

### Accessibility / UX
- Keyboard shortcuts (nice-to-have, not mandatory for first MVP):
  - Ctrl/Cmd+Z Undo, Ctrl/Cmd+Y Redo
  - Ctrl/Cmd+C/X/V for copy/cut/paste (when selection exists)
- Buttons should be clickable and clear; no clutter.
- Console must remain clean (no errors).

## 4) Tech Constraints (Fixed decisions)
- **Vanilla JS only** (no React/Vue).
- **Canvas 2D** for bitmap editing.
- No build tools required; must run via Live Server.
- External libraries are not allowed unless explicitly approved.

## 5) Repo Structure (recommended)
- /index.html
- /styles.css
- /main.js
- /src/
  - tools/ (pen.js, eraser.js, fill.js, select.js, shapes.js, picker.js)  [optional]
  - core/ (state.js, history.js, canvas-utils.js)                         [optional]
- /assets/ (optional)
- /docs/ (optional: algorithms, decisions)

Keep MVP simple: it is okay to start with just index.html/styles.css/main.js.
Refactor into /src only when it becomes messy.

## 6) Branching & Git Workflow
- Branches: `dev` and `main` only.
- All work happens on `dev`.
- After Live Server manual verification, merge `dev` -> `main`.

### Commit rules
- Keep commits small and scoped:
  - `feat: add pen tool`
  - `feat: add selection copy/paste`
  - `fix: improve flood fill performance`
  - `style: adjust toolbar UI`

## 7) Verification Loop (Mandatory before merging to main)
On `dev`, confirm:
1) Pen draws smoothly without gaps
2) Shape preview works (no permanent draw until mouseup)
3) Fill works on simple regions and doesn’t freeze browser
4) Eyedropper samples correct color
5) Eraser truly erases (transparent if supported)
6) Selection copy/cut/paste works and paste can be positioned before commit
7) Undo/Redo works reliably (at least 20 steps)
8) Save PNG exports current bitmap correctly
9) No console errors

## 8) Undo/Redo Strategy (Guideline)
- Use a `History` stack storing:
  - either full `ImageData` snapshots (simple but memory-heavy)
  - or `canvas.toDataURL()` snapshots (slower)
For MVP, `ImageData` snapshots at key commits (mouseup / fill / paste commit) is acceptable.
Do NOT snapshot on every pointermove.

## 9) Definition of Done (DoD)
A task is done only if:
- Implemented on `dev`
- Verified via manual checks listed above
- No console errors
- Code is readable with minimal duplication
- Update a short note in /docs or a simple WORKLOG.md (optional but recommended):
  - what changed
  - how verified
  - known limitations

