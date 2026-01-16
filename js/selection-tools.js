/**
 * selection-tools.js
 * Selection tools: rectangle, lasso, copy/cut/paste
 * Part of: Web Paint (Vanilla JS Bitmap Editor)
 */

(function() {
    'use strict';

    window.App = window.App || {};

    const canvas = App.Constants.canvas;
    const ctx = App.Constants.ctx;
    const CONSTANTS = App.Constants.CONSTANTS;
    const state = App.State.state;

    // ===============================
    // Rectangle Selection
    // ===============================

    function previewSelection(x, y) {
        // For selection preview, draw directly on display canvas (not on layers)
        ctx.putImageData(state.tempCanvas, 0, 0);
        ctx.globalCompositeOperation = 'source-over';

        // Draw selection marquee
        const width = x - state.startX;
        const height = y - state.startY;

        ctx.setLineDash([CONSTANTS.MARQUEE_DASH_SIZE, CONSTANTS.MARQUEE_DASH_SIZE]);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(state.startX, state.startY, width, height);
        ctx.setLineDash([]);
    }

    // ===============================
    // Lasso Tool
    // ===============================

    function drawLassoPath(x, y) {
        // Add point to path (throttle to avoid too many points)
        const lastPoint = state.lassoPath[state.lassoPath.length - 1];
        const distance = Math.sqrt((x - lastPoint.x) ** 2 + (y - lastPoint.y) ** 2);

        if (distance > CONSTANTS.LASSO_POINT_MIN_DISTANCE) {
            state.lassoPath.push({x, y});
        }

        // Redraw display canvas and path (lasso preview is on display, not layer)
        ctx.putImageData(state.tempCanvas, 0, 0);
        ctx.globalCompositeOperation = 'source-over';

        // Draw lasso path
        if (state.lassoPath.length > 1) {
            ctx.beginPath();
            ctx.moveTo(state.lassoPath[0].x, state.lassoPath[0].y);
            for (let i = 1; i < state.lassoPath.length; i++) {
                ctx.lineTo(state.lassoPath[i].x, state.lassoPath[i].y);
            }
            ctx.setLineDash([CONSTANTS.MARQUEE_DASH_SIZE, CONSTANTS.MARQUEE_DASH_SIZE]);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    function finalizeLassoSelection() {
        if (state.lassoPath.length < 3) {
            // Not enough points for a selection
            state.lassoPath = [];
            state.tempCanvas = null;
            return;
        }

        // Close the path (restore display canvas)
        ctx.putImageData(state.tempCanvas, 0, 0);

        // Calculate bounding box
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        for (const point of state.lassoPath) {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
        }

        minX = Math.floor(minX);
        minY = Math.floor(minY);
        maxX = Math.ceil(maxX);
        maxY = Math.ceil(maxY);

        // Store selection with lasso path (absolute coordinates for display)
        state.selection = {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
            lassoPath: state.lassoPath.map(p => ({x: p.x - minX, y: p.y - minY})),
            lassoPathAbsolute: [...state.lassoPath] // Keep absolute path for drawing marquee
        };

        // Draw marquee
        drawSelectionMarquee();

        state.lassoPath = [];
        state.tempCanvas = null;
    }

    // ===============================
    // Selection Marquee
    // ===============================

    function drawSelectionMarquee() {
        if (!state.selection) return;

        ctx.globalCompositeOperation = 'source-over';

        // Adjust line width and dash pattern based on zoom for consistent visual thickness
        const visualLineWidth = Math.max(1, 1 / state.zoomLevel);
        const dashSize = CONSTANTS.MARQUEE_DASH_SIZE / state.zoomLevel;

        if (state.selection.lassoPathAbsolute) {
            // Draw lasso marquee
            const path = state.selection.lassoPathAbsolute;
            ctx.beginPath();
            ctx.moveTo(path[0].x, path[0].y);
            for (let i = 1; i < path.length; i++) {
                ctx.lineTo(path[i].x, path[i].y);
            }
            ctx.closePath();
            ctx.setLineDash([dashSize, dashSize]);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = visualLineWidth;
            ctx.stroke();
            ctx.setLineDash([]);
        } else {
            // Draw rectangle marquee
            const { x, y, width, height } = state.selection;
            ctx.setLineDash([dashSize, dashSize]);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = visualLineWidth;
            ctx.strokeRect(x, y, width, height);
            ctx.setLineDash([]);
        }
    }

    // ===============================
    // Point in Polygon (Ray Casting)
    // ===============================

    function pointInPolygon(x, y, polygon) {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x, yi = polygon[i].y;
            const xj = polygon[j].x, yj = polygon[j].y;

            const intersect = ((yi > y) !== (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    // ===============================
    // Copy / Cut / Paste
    // ===============================

    function copySelection() {
        if (!state.selection) return;

        const { x, y, width, height, lassoPath } = state.selection;
        const layer = App.Layers.getActiveLayer();

        if (lassoPath) {
            // Lasso selection: copy only pixels inside the polygon from active layer
            const imageData = layer.ctx.getImageData(x, y, width, height);
            const data = imageData.data;

            // Create a mask for the lasso selection
            for (let py = 0; py < height; py++) {
                for (let px = 0; px < width; px++) {
                    const inside = pointInPolygon(px, py, lassoPath);
                    if (!inside) {
                        // Make pixels outside the lasso transparent
                        const index = (py * width + px) * 4;
                        data[index + 3] = 0; // Set alpha to 0
                    }
                }
            }

            state.clipboard = imageData;
        } else {
            // Rectangle selection: copy entire area from active layer
            state.clipboard = layer.ctx.getImageData(x, y, width, height);
        }
    }

    function cutSelection() {
        if (!state.selection) return;

        copySelection();

        const { x, y, width, height, lassoPath } = state.selection;
        const layer = App.Layers.getActiveLayer();

        if (lassoPath) {
            // Lasso selection: erase only pixels inside the polygon from active layer
            const imageData = layer.ctx.getImageData(x, y, width, height);
            const data = imageData.data;

            for (let py = 0; py < height; py++) {
                for (let px = 0; px < width; px++) {
                    const inside = pointInPolygon(px, py, lassoPath);
                    if (inside) {
                        // Make pixels inside the lasso transparent
                        const index = (py * width + px) * 4;
                        data[index + 3] = 0; // Set alpha to 0
                    }
                }
            }

            layer.ctx.putImageData(imageData, x, y);
        } else {
            // Rectangle selection: erase entire area from active layer
            layer.ctx.globalCompositeOperation = 'destination-out';
            layer.ctx.fillRect(x, y, width, height);
            layer.ctx.globalCompositeOperation = 'source-over';
        }

        state.selection = null;
        App.Layers.compositeAllLayers(); // Update display
        App.History.saveState();
    }

    function pasteFromClipboard() {
        if (!state.clipboard) return;

        state.pasteMode = true;
        state.pasteImage = state.clipboard;

        // Calculate viewport center in canvas coordinates
        const container = document.querySelector('.canvas-container');
        const containerRect = container.getBoundingClientRect();

        // Get center of viewport in screen coordinates
        const centerScreenX = containerRect.left + containerRect.width / 2;
        const centerScreenY = containerRect.top + containerRect.height / 2;

        // Convert to canvas coordinates
        const centerCanvas = App.ZoomPan.screenToCanvas(centerScreenX, centerScreenY);

        // Offset by half the paste image size to center the pasted content
        state.pasteX = Math.max(0, Math.min(
            centerCanvas.x - state.pasteImage.width / 2,
            canvas.width - state.pasteImage.width
        ));
        state.pasteY = Math.max(0, Math.min(
            centerCanvas.y - state.pasteImage.height / 2,
            canvas.height - state.pasteImage.height
        ));

        // Save current canvas for redrawing
        state.tempCanvas = ctx.getImageData(0, 0, canvas.width, canvas.height);

        redrawWithPaste();
    }

    function redrawWithPaste() {
        if (!state.pasteMode || !state.pasteImage) return;

        ctx.putImageData(state.tempCanvas, 0, 0);
        ctx.putImageData(state.pasteImage, state.pasteX, state.pasteY);

        // Draw outline - adjust dash and width for zoom
        const visualLineWidth = Math.max(1, 1 / state.zoomLevel);
        const dashSize = CONSTANTS.MARQUEE_DASH_SIZE / state.zoomLevel;
        ctx.setLineDash([dashSize, dashSize]);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = visualLineWidth;
        ctx.strokeRect(state.pasteX, state.pasteY, state.pasteImage.width, state.pasteImage.height);
        ctx.setLineDash([]);
    }

    function commitPaste() {
        if (!state.pasteMode) return;

        // Paste onto active layer
        const layer = App.Layers.getActiveLayer();
        layer.ctx.putImageData(state.pasteImage, state.pasteX, state.pasteY);

        state.pasteMode = false;
        state.pasteImage = null;
        state.tempCanvas = null;

        App.Layers.compositeAllLayers(); // Update display
        App.History.saveState();
    }

    // Export to global namespace
    window.App.SelectionTools = {
        previewSelection,
        drawLassoPath,
        finalizeLassoSelection,
        drawSelectionMarquee,
        pointInPolygon,
        copySelection,
        cutSelection,
        pasteFromClipboard,
        redrawWithPaste,
        commitPaste
    };
})();
