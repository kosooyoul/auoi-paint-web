/**
 * layer-core.js
 * Core layer system: creation, compositing, and management
 * Part of: Web Paint (Vanilla JS Bitmap Editor)
 */

(function() {
    'use strict';

    window.App = window.App || {};

    const canvas = App.Constants.canvas;
    const ctx = App.Constants.ctx;
    const state = App.State.state;

    /**
     * Create a new empty layer with transparent background
     * @param {string} name - Layer name
     * @returns {Object} Layer object
     */
    function createEmptyLayer(name) {
        const layerCanvas = document.createElement('canvas');
        layerCanvas.width = canvas.width;
        layerCanvas.height = canvas.height;
        const layerCtx = layerCanvas.getContext('2d', { willReadFrequently: true });

        return {
            id: `layer-${Date.now()}-${state.layerIdCounter++}`,
            name: name,
            canvas: layerCanvas,
            ctx: layerCtx,
            visible: true,
            opacity: 1.0,
            blendMode: 'normal'
        };
    }

    /**
     * Initialize the layer system with one background layer
     */
    function initializeLayerSystem() {
        // Create composite canvas (off-screen)
        state.compositeCanvas = document.createElement('canvas');
        state.compositeCanvas.width = canvas.width;
        state.compositeCanvas.height = canvas.height;
        state.compositeCtx = state.compositeCanvas.getContext('2d', { willReadFrequently: true });

        // Create initial background layer with white fill
        const backgroundLayer = createEmptyLayer('Background');
        backgroundLayer.ctx.fillStyle = 'white';
        backgroundLayer.ctx.fillRect(0, 0, canvas.width, canvas.height);

        state.layers.push(backgroundLayer);
        state.activeLayerIndex = 0;
    }

    /**
     * Composite all visible layers onto the display canvas
     */
    function compositeAllLayers() {
        // Clear composite canvas
        state.compositeCtx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw each visible layer with opacity and blend mode (bottom to top)
        for (let i = 0; i < state.layers.length; i++) {
            const layer = state.layers[i];
            if (!layer.visible) continue;

            // Set blend mode
            const blendMode = layer.blendMode || 'normal';
            state.compositeCtx.globalCompositeOperation = blendMode === 'normal' ? 'source-over' : blendMode;

            // Set opacity
            state.compositeCtx.globalAlpha = layer.opacity;
            state.compositeCtx.drawImage(layer.canvas, 0, 0);
        }

        // Reset to defaults
        state.compositeCtx.globalAlpha = 1.0;
        state.compositeCtx.globalCompositeOperation = 'source-over';

        // Copy composite to display canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(state.compositeCanvas, 0, 0);
    }

    /**
     * Get the currently active layer
     * @returns {Object} Active layer object
     */
    function getActiveLayer() {
        return state.layers[state.activeLayerIndex];
    }

    /**
     * Create a layer from saved data (used in history restoration)
     * @param {Object} data - Layer data with imageData
     * @returns {Object} Reconstructed layer object
     */
    function createLayerFromData(data) {
        const layerCanvas = document.createElement('canvas');
        layerCanvas.width = canvas.width;
        layerCanvas.height = canvas.height;
        const layerCtx = layerCanvas.getContext('2d', { willReadFrequently: true });

        // Restore layer bitmap
        layerCtx.putImageData(data.imageData, 0, 0);

        return {
            id: data.id,
            name: data.name,
            canvas: layerCanvas,
            ctx: layerCtx,
            visible: data.visible,
            opacity: data.opacity,
            blendMode: data.blendMode || 'normal'
        };
    }

    // Export to global namespace
    window.App.Layers = {
        createEmptyLayer,
        initializeLayerSystem,
        compositeAllLayers,
        getActiveLayer,
        createLayerFromData
    };
})();
