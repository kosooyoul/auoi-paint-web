/**
 * history.js
 * Undo/redo system with multi-layer state management
 * Part of: Web Paint (Vanilla JS Bitmap Editor)
 */

(function() {
    'use strict';

    window.App = window.App || {};

    const canvas = App.Constants.canvas;
    const CONSTANTS = App.Constants.CONSTANTS;
    const state = App.State.state;

    /**
     * Save current state to history
     */
    function saveState() {
        // Remove any redo states
        state.history = state.history.slice(0, state.historyStep + 1);

        // Save snapshot of all layers
        const snapshot = {
            layers: state.layers.map(layer => ({
                id: layer.id,
                name: layer.name,
                visible: layer.visible,
                opacity: layer.opacity,
                blendMode: layer.blendMode || 'normal',
                imageData: layer.ctx.getImageData(0, 0, canvas.width, canvas.height)
            })),
            activeLayerIndex: state.activeLayerIndex
        };

        state.history.push(snapshot);
        state.historyStep++;

        // Limit history size (reduced to 10 for multi-layer memory efficiency)
        if (state.history.length > CONSTANTS.MAX_HISTORY_SIZE) {
            state.history.shift();
            state.historyStep--;
        }

        updateUndoRedoButtons();
    }

    /**
     * Undo last action
     */
    function undo() {
        if (state.historyStep > 0) {
            state.historyStep--;
            restoreHistorySnapshot(state.history[state.historyStep]);
            state.selection = null; // Clear selection on undo
            updateUndoRedoButtons();
        }
    }

    /**
     * Redo previously undone action
     */
    function redo() {
        if (state.historyStep < state.history.length - 1) {
            state.historyStep++;
            restoreHistorySnapshot(state.history[state.historyStep]);
            state.selection = null; // Clear selection on redo
            updateUndoRedoButtons();
        }
    }

    /**
     * Restore all layers from a history snapshot
     * @param {Object} snapshot - History snapshot object
     */
    function restoreHistorySnapshot(snapshot) {
        // Clear current layers
        state.layers = [];

        // Restore each layer from snapshot
        for (const layerData of snapshot.layers) {
            const layer = App.Layers.createLayerFromData(layerData);
            state.layers.push(layer);
        }

        state.activeLayerIndex = snapshot.activeLayerIndex;

        // Composite and display
        App.Layers.compositeAllLayers();

        // Update layer UI
        App.LayerUI.updateLayerUI();
    }

    /**
     * Update undo/redo button states
     */
    function updateUndoRedoButtons() {
        document.getElementById('btn-undo').disabled = state.historyStep <= 0;
        document.getElementById('btn-redo').disabled = state.historyStep >= state.history.length - 1;
    }

    // Export to global namespace
    window.App.History = {
        saveState,
        undo,
        redo,
        restoreHistorySnapshot,
        updateUndoRedoButtons
    };
})();
