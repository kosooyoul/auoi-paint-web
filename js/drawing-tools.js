/**
 * drawing-tools.js
 * Drawing tools: pen, eraser, shapes, fill, color picker
 * Part of: Web Paint (Vanilla JS Bitmap Editor)
 */

(function() {
    'use strict';

    window.App = window.App || {};

    const canvas = App.Constants.canvas;
    const state = App.State.state;

    // ===============================
    // Symmetry Helper
    // ===============================

    function getSymmetryPoints(x, y) {
        const points = [];
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        switch (state.symmetryMode) {
            case 'horizontal':
                // Mirror horizontally across vertical center line
                points.push({ x: canvas.width - x, y: y });
                break;

            case 'vertical':
                // Mirror vertically across horizontal center line
                points.push({ x: x, y: canvas.height - y });
                break;

            case 'radial':
                // Radial symmetry around canvas center
                const pointCount = state.symmetryPointCount;
                const angleStep = (2 * Math.PI) / pointCount;

                // Calculate distance and angle from center
                const dx = x - centerX;
                const dy = y - centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx);

                // Generate symmetry points (skip first as it's the original)
                for (let i = 1; i < pointCount; i++) {
                    const newAngle = angle + angleStep * i;
                    const newX = centerX + distance * Math.cos(newAngle);
                    const newY = centerY + distance * Math.sin(newAngle);
                    points.push({ x: newX, y: newY });
                }
                break;

            case 'none':
            default:
                // No symmetry
                break;
        }

        return points;
    }

    // ===============================
    // Pen Tool
    // ===============================

    function drawPenStart(x, y) {
        const layer = App.Layers.getActiveLayer();
        layer.ctx.lineCap = 'round';
        layer.ctx.lineJoin = 'round';
        layer.ctx.strokeStyle = state.color;
        layer.ctx.lineWidth = state.brushSize;
        layer.ctx.beginPath();
        layer.ctx.moveTo(x, y);

        // Apply symmetry for start position
        if (state.symmetryMode !== 'none') {
            const symmetryPoints = getSymmetryPoints(x, y);
            symmetryPoints.forEach(point => {
                layer.ctx.moveTo(point.x, point.y);
            });
        }
    }

    function drawPen(x, y) {
        const layer = App.Layers.getActiveLayer();
        layer.ctx.lineTo(x, y);
        layer.ctx.stroke();

        // Apply symmetry
        if (state.symmetryMode !== 'none') {
            const symmetryPoints = getSymmetryPoints(x, y);
            symmetryPoints.forEach(point => {
                layer.ctx.lineTo(point.x, point.y);
                layer.ctx.stroke();
            });
        }

        App.Layers.compositeAllLayers(); // Update display
        App.LayerUI.updateActiveLayerThumbnailThrottled(); // Real-time thumbnail update
        state.lastX = x;
        state.lastY = y;
    }

    // ===============================
    // Eraser Tool
    // ===============================

    function drawEraserStart(x, y) {
        const layer = App.Layers.getActiveLayer();
        layer.ctx.globalCompositeOperation = 'destination-out';
        layer.ctx.lineCap = 'round';
        layer.ctx.lineJoin = 'round';
        layer.ctx.lineWidth = state.brushSize;
        layer.ctx.beginPath();
        layer.ctx.moveTo(x, y);

        // Apply symmetry for start position
        if (state.symmetryMode !== 'none') {
            const symmetryPoints = getSymmetryPoints(x, y);
            symmetryPoints.forEach(point => {
                layer.ctx.moveTo(point.x, point.y);
            });
        }
    }

    function drawEraser(x, y) {
        const layer = App.Layers.getActiveLayer();
        layer.ctx.lineTo(x, y);
        layer.ctx.stroke();

        // Apply symmetry
        if (state.symmetryMode !== 'none') {
            const symmetryPoints = getSymmetryPoints(x, y);
            symmetryPoints.forEach(point => {
                layer.ctx.lineTo(point.x, point.y);
                layer.ctx.stroke();
            });
        }

        App.Layers.compositeAllLayers(); // Update display
        App.LayerUI.updateActiveLayerThumbnailThrottled(); // Real-time thumbnail update
        state.lastX = x;
        state.lastY = y;
    }

    // ===============================
    // Shape Tools
    // ===============================

    function previewRect(x, y) {
        const layer = App.Layers.getActiveLayer();
        // Restore active layer to clean state
        layer.ctx.putImageData(state.tempCanvas, 0, 0);
        layer.ctx.globalCompositeOperation = 'source-over';
        layer.ctx.strokeStyle = state.color;
        layer.ctx.lineWidth = state.brushSize;
        layer.ctx.strokeRect(state.startX, state.startY, x - state.startX, y - state.startY);
        App.Layers.compositeAllLayers(); // Update display
        App.LayerUI.updateActiveLayerThumbnailThrottled(); // Real-time thumbnail update
    }

    function previewEllipse(x, y) {
        const layer = App.Layers.getActiveLayer();
        // Restore active layer to clean state
        layer.ctx.putImageData(state.tempCanvas, 0, 0);
        layer.ctx.globalCompositeOperation = 'source-over';
        layer.ctx.strokeStyle = state.color;
        layer.ctx.lineWidth = state.brushSize;

        const radiusX = Math.abs(x - state.startX) / 2;
        const radiusY = Math.abs(y - state.startY) / 2;
        const centerX = state.startX + (x - state.startX) / 2;
        const centerY = state.startY + (y - state.startY) / 2;

        layer.ctx.beginPath();
        layer.ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
        layer.ctx.stroke();
        App.Layers.compositeAllLayers(); // Update display
        App.LayerUI.updateActiveLayerThumbnailThrottled(); // Real-time thumbnail update
    }

    function previewLine(x, y) {
        const layer = App.Layers.getActiveLayer();
        // Restore active layer to clean state
        layer.ctx.putImageData(state.tempCanvas, 0, 0);
        layer.ctx.globalCompositeOperation = 'source-over';
        layer.ctx.strokeStyle = state.color;
        layer.ctx.lineWidth = state.brushSize;
        layer.ctx.lineCap = 'round';

        layer.ctx.beginPath();
        layer.ctx.moveTo(state.startX, state.startY);
        layer.ctx.lineTo(x, y);
        layer.ctx.stroke();
        App.Layers.compositeAllLayers(); // Update display
        App.LayerUI.updateActiveLayerThumbnailThrottled(); // Real-time thumbnail update
    }

    // ===============================
    // Color Picker
    // ===============================

    function pickColor(x, y) {
        const ctx = App.Constants.ctx;
        const imageData = ctx.getImageData(x, y, 1, 1);
        const [r, g, b] = imageData.data;
        const hex = '#' + [r, g, b].map(val => val.toString(16).padStart(2, '0')).join('');
        state.color = hex;
        document.getElementById('color-picker').value = hex;
        App.UI.updateColorDisplay();
    }

    // ===============================
    // Flood Fill (Bucket Tool)
    // ===============================

    function floodFill(startX, startY) {
        const layer = App.Layers.getActiveLayer();
        const imageData = layer.ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        const targetColor = getPixelColor(pixels, startX, startY);
        const fillColor = hexToRgb(state.color);
        const tolerance = state.fillTolerance;

        if (colorsMatch(targetColor, fillColor, tolerance)) return;

        const width = canvas.width;
        const height = canvas.height;
        const stack = [[startX, startY]];

        // Use typed array for faster visited tracking
        const visited = new Uint8Array(width * height);

        while (stack.length > 0) {
            const [x, y] = stack.pop();

            // Early bounds check
            if (x < 0 || x >= width || y < 0 || y >= height) continue;

            const index = y * width + x;
            if (visited[index]) continue;

            const currentColor = getPixelColor(pixels, x, y);
            if (!colorsMatch(currentColor, targetColor, tolerance)) continue;

            // Scanline fill: fill horizontally in both directions
            let left = x;
            let right = x;

            // Scan left
            while (left > 0) {
                const leftIndex = y * width + (left - 1);
                if (visited[leftIndex]) break;
                const leftColor = getPixelColor(pixels, left - 1, y);
                if (!colorsMatch(leftColor, targetColor, tolerance)) break;
                left--;
            }

            // Scan right
            while (right < width - 1) {
                const rightIndex = y * width + (right + 1);
                if (visited[rightIndex]) break;
                const rightColor = getPixelColor(pixels, right + 1, y);
                if (!colorsMatch(rightColor, targetColor, tolerance)) break;
                right++;
            }

            // Fill the horizontal line and mark as visited
            for (let i = left; i <= right; i++) {
                const scanIndex = y * width + i;
                visited[scanIndex] = 1;
                setPixelColor(pixels, i, y, fillColor);
            }

            // Add adjacent lines to stack (with bounds checking)
            for (let i = left; i <= right; i++) {
                // Check line above
                if (y > 0) {
                    const aboveIndex = (y - 1) * width + i;
                    if (!visited[aboveIndex]) {
                        const aboveColor = getPixelColor(pixels, i, y - 1);
                        if (colorsMatch(aboveColor, targetColor, tolerance)) {
                            stack.push([i, y - 1]);
                        }
                    }
                }
                // Check line below
                if (y < height - 1) {
                    const belowIndex = (y + 1) * width + i;
                    if (!visited[belowIndex]) {
                        const belowColor = getPixelColor(pixels, i, y + 1);
                        if (colorsMatch(belowColor, targetColor, tolerance)) {
                            stack.push([i, y + 1]);
                        }
                    }
                }
            }
        }

        layer.ctx.putImageData(imageData, 0, 0);
        App.Layers.compositeAllLayers(); // Update display
    }

    // Helper functions for flood fill
    function getPixelColor(pixels, x, y) {
        const index = (y * canvas.width + x) * 4;
        return [pixels[index], pixels[index + 1], pixels[index + 2], pixels[index + 3]];
    }

    function setPixelColor(pixels, x, y, color) {
        const index = (y * canvas.width + x) * 4;
        pixels[index] = color[0];
        pixels[index + 1] = color[1];
        pixels[index + 2] = color[2];
        pixels[index + 3] = 255;
    }

    function hexToRgb(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return [r, g, b, 255];
    }

    function colorsMatch(c1, c2, tolerance = 0) {
        // Alpha must match exactly
        if (c1[3] !== c2[3]) return false;

        // If tolerance is 0, use exact match for performance
        if (tolerance === 0) {
            return c1[0] === c2[0] && c1[1] === c2[1] && c1[2] === c2[2];
        }

        // Per-channel threshold comparison (no sqrt for performance)
        const rDiff = Math.abs(c1[0] - c2[0]);
        const gDiff = Math.abs(c1[1] - c2[1]);
        const bDiff = Math.abs(c1[2] - c2[2]);

        return rDiff <= tolerance && gDiff <= tolerance && bDiff <= tolerance;
    }

    // ===============================
    // Gradient Tool
    // ===============================

    function previewGradient(x, y) {
        const layer = App.Layers.getActiveLayer();
        // Restore active layer to clean state
        layer.ctx.putImageData(state.tempCanvas, 0, 0);
        layer.ctx.globalCompositeOperation = 'source-over';

        // Create gradient based on type
        let gradient;
        if (state.gradientType === 'linear') {
            // Linear gradient from start to end point
            gradient = layer.ctx.createLinearGradient(state.startX, state.startY, x, y);
        } else {
            // Radial gradient from start point outward
            const dx = x - state.startX;
            const dy = y - state.startY;
            const radius = Math.sqrt(dx * dx + dy * dy);
            gradient = layer.ctx.createRadialGradient(
                state.startX, state.startY, 0,
                state.startX, state.startY, radius
            );
        }

        // Add color stops (primary to secondary)
        gradient.addColorStop(0, state.color);
        gradient.addColorStop(1, state.secondaryColor);

        // Fill canvas with gradient
        layer.ctx.fillStyle = gradient;
        layer.ctx.fillRect(0, 0, canvas.width, canvas.height);

        App.Layers.compositeAllLayers(); // Update display
        App.LayerUI.updateActiveLayerThumbnailThrottled(); // Real-time thumbnail update
    }

    // Export to global namespace
    window.App.DrawingTools = {
        drawPenStart,
        drawPen,
        drawEraserStart,
        drawEraser,
        previewRect,
        previewEllipse,
        previewLine,
        pickColor,
        floodFill,
        previewGradient,
        // Helper functions (exported for potential reuse)
        getPixelColor,
        setPixelColor,
        hexToRgb,
        colorsMatch,
        getSymmetryPoints
    };
})();
