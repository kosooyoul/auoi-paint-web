# Web Paint - Test Checklist

## Pre-Test Setup
- [ ] Start Live Server (VSCode/Cursor: Right-click index.html → Open with Live Server)
- [ ] Open browser console (F12) to check for errors
- [ ] Verify application loads without console errors

---

## 1. Core Drawing Tools

### Pen Tool (P)
- [ ] Select pen tool (click or press P)
- [ ] Draw smooth strokes without gaps
- [ ] Change brush size (1-50) - verify size changes apply
- [ ] Change color - verify color changes apply
- [ ] No console errors

### Eraser Tool (E)
- [ ] Select eraser tool (press E)
- [ ] Erase drawn content (should be transparent)
- [ ] Change eraser size - verify it works
- [ ] No console errors

### Fill Tool (F / Bucket)
- [ ] Draw some shapes with gaps
- [ ] Select fill tool (press F)
- [ ] Click inside a region - should fill instantly
- [ ] Try different tolerance levels (0, 10, 30, 60)
- [ ] Tolerance 0: strict color match
- [ ] Tolerance 30: fills similar colors
- [ ] Loading spinner should appear briefly
- [ ] No console errors or browser freeze

### Color Picker (I / Eyedropper)
- [ ] Draw some colored shapes
- [ ] Select picker tool (press I)
- [ ] Click on different colors
- [ ] Color should update in color picker and swatch
- [ ] No console errors

---

## 2. Shape Tools

### Rectangle (R)
- [ ] Select rectangle tool (press R)
- [ ] Drag to draw rectangle
- [ ] Preview shows while dragging (not committed yet)
- [ ] Release mouse - shape commits to canvas
- [ ] Change brush size and color - verify it works
- [ ] No console errors

### Ellipse (C)
- [ ] Select ellipse tool (press C)
- [ ] Drag to draw ellipse
- [ ] Preview shows correctly
- [ ] Release to commit
- [ ] No console errors

### Line (L)
- [ ] Select line tool (press L)
- [ ] Drag to draw line
- [ ] Preview shows correctly
- [ ] Release to commit
- [ ] Line has round caps
- [ ] No console errors

---

## 3. Selection Tools

### Rectangle Selection (S)
- [ ] Draw some content
- [ ] Select selection tool (press S)
- [ ] Drag to create rectangular selection
- [ ] Marquee (dashed outline) appears
- [ ] Press Ctrl+C to copy
- [ ] Press Ctrl+V to paste
- [ ] Pasted image appears at viewport center
- [ ] Drag pasted image to reposition
- [ ] Click to commit paste
- [ ] No console errors

### Lasso Selection (A)
- [ ] Draw some content
- [ ] Select lasso tool (press A)
- [ ] Draw free-form path around content
- [ ] Path auto-closes on release
- [ ] Marquee appears around lasso path
- [ ] Copy (Ctrl+C) - only inside pixels copied
- [ ] Cut (Ctrl+X) - only inside pixels removed
- [ ] Paste (Ctrl+V) works
- [ ] No console errors

### Cut Operation
- [ ] Create selection (rect or lasso)
- [ ] Press Ctrl+X (cut)
- [ ] Selected area should be cleared (transparent)
- [ ] Paste (Ctrl+V) - content should appear
- [ ] No console errors

---

## 4. Text Tool (T)

- [ ] Select text tool (press T)
- [ ] Click on canvas
- [ ] Text input overlay appears at click position
- [ ] Type some text
- [ ] Change font family - text style updates
- [ ] Change font size - text size updates
- [ ] Change color - text color updates
- [ ] Press Enter to commit - text rasterizes to canvas
- [ ] Press T again, click, type, press Escape to cancel
- [ ] Text should not appear on Escape
- [ ] No console errors

---

## 5. Multi-Layer System ⭐ NEW

### Layer Panel UI
- [ ] Layer panel visible in floating toolbox
- [ ] Shows "Layers (1/20)" label
- [ ] Initial "Background" layer visible with thumbnail
- [ ] Thumbnail shows white canvas
- [ ] 4 control buttons: + (add), − (delete), ⬇ (merge), ⊟ (flatten)

### Add Layer
- [ ] Click + button to add layer
- [ ] New "Layer 2" appears in list
- [ ] Layer count updates: "Layers (2/20)"
- [ ] New layer is active (highlighted with blue gradient)
- [ ] Thumbnail shows empty/transparent layer
- [ ] Add multiple layers (up to 20)
- [ ] At 20 layers, + button should be disabled or show alert

### Delete Layer
- [ ] With multiple layers, select any layer
- [ ] Click − button
- [ ] Confirmation dialog appears
- [ ] Confirm - layer should be removed
- [ ] Layer count decrements
- [ ] If only 1 layer remains, − button disabled
- [ ] No console errors

### Layer Visibility Toggle
- [ ] Click eye icon (👁) on any layer
- [ ] Layer should disappear from canvas
- [ ] Eye icon should gray out
- [ ] Click again - layer reappears
- [ ] No console errors

### Layer Opacity
- [ ] Drag opacity slider on any layer
- [ ] Layer should become transparent as you drag
- [ ] Percentage updates in real-time (e.g., "50%")
- [ ] Release slider - undo/redo state saved
- [ ] Set to 0% - layer invisible
- [ ] Set to 100% - layer fully opaque
- [ ] No console errors

### Layer Reordering
- [ ] Create 3+ layers with different content on each
- [ ] Click ↑ button on middle layer
- [ ] Layer should move up in stack (visual order changes)
- [ ] Top layer: ↑ button disabled
- [ ] Click ↓ button
- [ ] Layer moves down
- [ ] Bottom layer: ↓ button disabled
- [ ] No console errors

### Merge Down
- [ ] Create 2+ layers with content on each
- [ ] Select top layer
- [ ] Click ⬇ (merge down) button
- [ ] Confirmation dialog appears
- [ ] Confirm - top layer merges into layer below
- [ ] Layer count decrements
- [ ] Merged content visible with correct opacity blending
- [ ] Bottom layer: merge button disabled
- [ ] No console errors

### Flatten All Layers
- [ ] Create 3+ layers with content
- [ ] Click ⊟ (flatten) button
- [ ] Confirmation dialog appears
- [ ] Confirm - all layers merge into single layer
- [ ] Layer count shows "Layers (1/20)"
- [ ] All content visible correctly
- [ ] No console errors

### Active Layer Switching
- [ ] Create 3+ layers
- [ ] Click on different layer items
- [ ] Active layer highlights with blue gradient + left border
- [ ] Draw with pen tool - should draw on active layer only
- [ ] Switch layers - verify drawing stays on previous layer
- [ ] No console errors

### Drawing on Layers
- [ ] Create 2 layers
- [ ] Draw red circle on Layer 1
- [ ] Switch to Layer 2
- [ ] Draw blue square on Layer 2
- [ ] Both should be visible (composited correctly)
- [ ] Hide Layer 2 - only red circle visible
- [ ] Show Layer 2 - both visible again
- [ ] Delete Layer 2 - only red circle remains
- [ ] Undo - Layer 2 restored
- [ ] No console errors

### Layer Thumbnails
- [ ] Draw content on a layer
- [ ] Thumbnail should update after drawing (on mouseup)
- [ ] Thumbnails show scaled preview of layer content
- [ ] Transparent areas show checkered pattern
- [ ] No console errors

---

## 6. Undo/Redo System

### Basic Undo/Redo
- [ ] Draw several strokes with pen
- [ ] Press Ctrl+Z (undo) - last stroke disappears
- [ ] Undo multiple times - strokes disappear in reverse order
- [ ] Press Ctrl+Y (redo) - strokes reappear
- [ ] Redo multiple times
- [ ] No console errors

### Undo/Redo with Layers
- [ ] Add new layer
- [ ] Undo - layer removed
- [ ] Redo - layer restored
- [ ] Draw on Layer 1, switch to Layer 2, draw
- [ ] Undo - Layer 2 drawing disappears
- [ ] Undo - Layer 1 drawing disappears
- [ ] Redo twice - both reappear
- [ ] Change layer opacity to 50%
- [ ] Undo - opacity NOT restored (visibility/opacity don't create history by design)
- [ ] Merge layers
- [ ] Undo - layers un-merge
- [ ] No console errors

### History Limit
- [ ] Perform 15+ operations (drawing, filling, etc.)
- [ ] History limited to 10 snapshots (older ones discarded)
- [ ] Undo up to 10 times
- [ ] Cannot undo beyond 10 steps
- [ ] No memory issues or browser slowdown

---

## 7. Zoom & Pan

### Zoom with Mouse Wheel
- [ ] Hold Ctrl, scroll mouse wheel
- [ ] Canvas zooms in/out toward cursor position
- [ ] Zoom level updates in status bar (e.g., "Zoom: 150%")
- [ ] Zoom slider updates in real-time
- [ ] Zoom range: 10% - 500%
- [ ] No console errors

### Zoom with Buttons
- [ ] Click + button - canvas zooms in (20% steps)
- [ ] Click − button - canvas zooms out
- [ ] Slider updates correctly
- [ ] Click "100%" button - resets to 100% and centers canvas
- [ ] Click "Fit" button - canvas scales to fit viewport
- [ ] No console errors

### Pan
- [ ] Press and hold Space key
- [ ] Cursor changes to grab (hand icon)
- [ ] Drag canvas - canvas pans smoothly
- [ ] Release Space - cursor returns to crosshair
- [ ] Panning works at any zoom level
- [ ] No console errors

### Drawing at Zoom
- [ ] Zoom to 200%
- [ ] Draw with pen - strokes appear at correct position
- [ ] Draw shapes - preview and final shape correct
- [ ] Fill tool - fills correct region
- [ ] Color picker - samples correct pixel
- [ ] Text tool - text input appears at correct position
- [ ] Selection - marquee at correct position
- [ ] Zoom to 50% - all tools still work correctly
- [ ] No console errors

---

## 8. Canvas Resize

- [ ] Current canvas: 800x600
- [ ] Enter new size: 1024x768
- [ ] Select "Scale" mode
- [ ] Click Resize button
- [ ] Confirmation dialog appears
- [ ] Confirm - canvas resizes, content scaled
- [ ] All layers resized correctly
- [ ] Try "Crop" mode with 400x300
- [ ] Content cropped (edges cut off)
- [ ] Try enlarging with crop mode
- [ ] White space added, content not scaled
- [ ] No console errors

---

## 9. Save & Load

### Save PNG
- [ ] Draw some content on multiple layers
- [ ] Click save button (💾)
- [ ] Loading spinner appears briefly
- [ ] PNG file downloads
- [ ] Open downloaded file - should show flattened composite of all visible layers
- [ ] No console errors

---

## 10. Keyboard Shortcuts

### Tool Shortcuts
- [ ] Press P - pen tool activates
- [ ] Press E - eraser activates
- [ ] Press F - fill tool activates
- [ ] Press I - color picker activates
- [ ] Press S - selection tool activates
- [ ] Press A - lasso tool activates
- [ ] Press T - text tool activates
- [ ] Press R - rectangle shape activates
- [ ] Press C - ellipse shape activates
- [ ] Press L - line shape activates

### Edit Shortcuts
- [ ] Ctrl+Z - undo
- [ ] Ctrl+Y - redo
- [ ] Ctrl+C - copy selection
- [ ] Ctrl+X - cut selection
- [ ] Ctrl+V - paste
- [ ] Escape - cancel paste or text input

### View Shortcuts
- [ ] Ctrl+Wheel - zoom
- [ ] Ctrl++ - zoom in
- [ ] Ctrl+− - zoom out
- [ ] Ctrl+0 - reset zoom
- [ ] Space+Drag - pan

### UI Shortcuts
- [ ] Press Tab - toolbox hides
- [ ] Press Tab again - toolbox shows
- [ ] Press ? or H - help modal opens
- [ ] Press ? or H again - help modal closes
- [ ] Escape - closes help modal

---

## 11. UI/UX

### Floating Toolbox
- [ ] Toolbox visible on right side initially
- [ ] Click and drag toolbox header - toolbox moves
- [ ] Can drag to any screen position
- [ ] Cannot drag off-screen (constrained to viewport)
- [ ] Refresh page - toolbox position persists (localStorage)
- [ ] Click − button on toolbox header - toolbox minimizes (header only)
- [ ] Click + button - toolbox expands
- [ ] Press Tab - toolbox hides completely
- [ ] Press Tab - toolbox shows again
- [ ] No console errors

### Status Bar
- [ ] Status bar visible at bottom center
- [ ] Shows current tool (e.g., "Tool: Pen")
- [ ] Shows cursor coordinates (e.g., "X: 123, Y: 456") while moving mouse
- [ ] Shows zoom level (e.g., "Zoom: 100%")
- [ ] Updates in real-time

### Loading Indicator
- [ ] Fill large area - loading spinner appears with "Filling area..."
- [ ] Resize canvas - loading spinner appears with "Resizing canvas..."
- [ ] Save PNG - loading spinner appears with "Saving image..."
- [ ] Spinner disappears after operation completes
- [ ] No console errors

### Help Modal
- [ ] Click help button (❓) or press ?
- [ ] Modal appears with keyboard shortcuts
- [ ] Organized sections: Tools, Shapes, Edit, Text, View, Help
- [ ] Click × button - modal closes
- [ ] Click outside modal - modal closes
- [ ] Press ? or H - modal toggles
- [ ] No console errors

---

## 12. Browser Console Check

Throughout all tests:
- [ ] No error messages in console (F12 → Console tab)
- [ ] No warning messages (or only expected warnings)
- [ ] No uncaught exceptions
- [ ] No memory leaks (check Performance tab if issues)

---

## 13. Performance

### Memory Usage
- [ ] Open browser Task Manager (Shift+Esc in Chrome)
- [ ] Check memory usage with 1 layer: baseline ~50MB
- [ ] Add 20 layers with content
- [ ] Check memory usage: should be ~200-300MB (acceptable)
- [ ] Perform 10+ undo/redo operations
- [ ] Memory should not grow excessively
- [ ] No browser slowdown or lag

### Drawing Performance
- [ ] Draw continuous pen strokes at 800x600
- [ ] Should be smooth without lag
- [ ] Zoom to 200% and draw - still smooth
- [ ] Fill large areas - completes in <500ms
- [ ] 20 layers visible - drawing still responsive
- [ ] No frame drops during interaction

---

## 14. Edge Cases

### Empty Canvas Operations
- [ ] Clear canvas (all layers empty)
- [ ] Try to copy selection - nothing happens (expected)
- [ ] Try to paste without clipboard - nothing happens (expected)
- [ ] Try to pick color from empty area - gets white (expected)

### Single Layer Edge Cases
- [ ] Start with 1 layer
- [ ] Try to delete - button disabled or shows warning
- [ ] Try to merge down - button disabled
- [ ] Flatten all - shows confirmation, results in 1 layer

### Maximum Layers
- [ ] Add 20 layers (maximum)
- [ ] Try to add 21st layer - button disabled or alert shown
- [ ] Delete a layer - can add again

### Large Brush Sizes
- [ ] Set brush size to 50 (max)
- [ ] Draw pen strokes - should be smooth
- [ ] Draw shapes - should render correctly
- [ ] Eraser size 50 - should erase large area

### Zoom Extremes
- [ ] Zoom to 10% (minimum) - canvas very small
- [ ] All tools still functional
- [ ] Zoom to 500% (maximum) - canvas very large
- [ ] Pixels visible, but tools work
- [ ] Selection marquee scales correctly

---

## 15. Cross-Tool Interactions

### Selection Persistence
- [ ] Create selection with rect tool
- [ ] Switch to pen tool
- [ ] Draw something
- [ ] Selection marquee still visible
- [ ] Switch to lasso tool
- [ ] Draw new lasso selection
- [ ] Old selection replaced
- [ ] Undo - previous selection restored

### Paste and Drawing
- [ ] Copy some content
- [ ] Paste (Ctrl+V)
- [ ] While in paste mode, try to draw - should not draw
- [ ] Click to commit paste
- [ ] Now drawing works again

### Text and Other Tools
- [ ] Select text tool, click on canvas
- [ ] Text input appears
- [ ] Try to switch tools - text input remains
- [ ] Press Escape - text cancelled
- [ ] Switch tool - text mode exits

---

## Summary Checklist

- [ ] All 15 test sections completed
- [ ] No critical bugs found
- [ ] No console errors
- [ ] Performance acceptable on target machine
- [ ] UI/UX smooth and responsive
- [ ] Multi-layer system fully functional
- [ ] Ready for merge to main branch

---

## Notes

### Known Limitations (Expected Behavior)
1. History limited to 10 snapshots (reduced from 50 for memory efficiency)
2. Layer thumbnails update on commit only (not real-time during drag)
3. Visibility/opacity changes don't create history entries (by design)
4. No layer renaming UI (uses default "Layer N" names)
5. No drag-drop layer reordering (uses up/down buttons)
6. No blend modes (normal blend only)

### If You Find Bugs
1. Note the exact steps to reproduce
2. Check browser console for error messages
3. Note which browser/version you're using
4. Document any unexpected behavior
5. Report in WORKLOG.md or create GitHub issue

---

**Test Date:** _____________
**Tester:** _____________
**Browser:** _____________
**Result:** [ ] Pass  [ ] Fail  [ ] Pass with minor issues
