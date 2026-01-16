/**
 * zoom-pan.js
 * Zoom and pan functionality with coordinate transformation
 * Part of: Web Paint (Vanilla JS Bitmap Editor)
 */

(function() {
    'use strict';

    window.App = window.App || {};

    const canvas = App.Constants.canvas;
    const state = App.State.state;
    const CONSTANTS = App.Constants.CONSTANTS;

    /**
     * Transform screen coordinates to canvas coordinates
     * Accounts for zoom and pan transformations
     */
    function screenToCanvas(screenX, screenY) {
        const rect = canvas.getBoundingClientRect();

        // Get position relative to canvas element
        const relX = screenX - rect.left;
        const relY = screenY - rect.top;

        // Account for CSS transform: scale and translate
        // Canvas is transformed as: translate(panX, panY) scale(zoomLevel)
        // To reverse: (point - translate) / scale
        const canvasX = (relX - state.panX) / state.zoomLevel;
        const canvasY = (relY - state.panY) / state.zoomLevel;

        return { x: canvasX, y: canvasY };
    }

    /**
     * Apply current zoom and pan as CSS transform
     */
    function applyCanvasTransform() {
        canvas.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.zoomLevel})`;
        canvas.style.transformOrigin = '0 0';
    }

    /**
     * Get zoom percentage string for display
     */
    function getZoomPercentage() {
        return Math.round(state.zoomLevel * 100) + '%';
    }

    /**
     * Set zoom level and update UI
     */
    function setZoom(newZoom, centerX = null, centerY = null) {
        // Clamp zoom level
        newZoom = Math.max(CONSTANTS.ZOOM_MIN, Math.min(CONSTANTS.ZOOM_MAX, newZoom));

        if (newZoom === state.zoomLevel) return;

        // If center point provided, adjust pan to zoom toward that point
        if (centerX !== null && centerY !== null) {
            // Calculate canvas point under cursor before zoom
            const canvasPoint = screenToCanvas(centerX, centerY);

            // Apply new zoom
            state.zoomLevel = newZoom;

            // Adjust pan so that the canvas point stays under the cursor
            const rect = canvas.getBoundingClientRect();
            const relX = centerX - rect.left;
            const relY = centerY - rect.top;

            state.panX = relX - (canvasPoint.x * state.zoomLevel);
            state.panY = relY - (canvasPoint.y * state.zoomLevel);
        } else {
            state.zoomLevel = newZoom;
        }

        applyCanvasTransform();
        updateZoomDisplay();
    }

    /**
     * Update zoom level display in status bar and slider
     */
    function updateZoomDisplay() {
        const zoomDisplay = document.getElementById('status-zoom');
        if (zoomDisplay) {
            zoomDisplay.textContent = `Zoom: ${getZoomPercentage()}`;
        }

        // Update zoom slider
        const zoomSlider = document.getElementById('zoom-slider');
        const zoomValue = document.getElementById('zoom-value');
        if (zoomSlider) {
            const percent = Math.round(state.zoomLevel * 100);
            zoomSlider.value = percent;
            if (zoomValue) {
                zoomValue.textContent = percent + '%';
            }
        }
    }

    /**
     * Update canvas cursor based on current mode
     */
    function updateCanvasCursor() {
        if (state.spaceKeyPressed && !state.textMode) {
            canvas.style.cursor = 'grab';
        } else {
            canvas.style.cursor = state.originalCursor || 'crosshair';
        }
    }

    // Export to global namespace
    window.App.ZoomPan = {
        screenToCanvas,
        applyCanvasTransform,
        getZoomPercentage,
        setZoom,
        updateZoomDisplay,
        updateCanvasCursor
    };
})();
