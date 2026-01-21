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
     * Get dynamic history size based on layer count
     * More layers = less history to conserve memory
     * @returns {number} Maximum history size
     */
    function getMaxHistorySize() {
        const layerCount = state.layers.length;
        const base = CONSTANTS.BASE_MAX_HISTORY_SIZE;
        const min = CONSTANTS.MIN_MAX_HISTORY_SIZE;

        // Linear interpolation: 1 layer = base size, MAX_LAYERS = min size
        const ratio = layerCount / CONSTANTS.MAX_LAYERS;
        const historySize = Math.floor(base - (base - min) * ratio);

        return Math.max(min, historySize);
    }

    /**
     * Save current state to history
     * Uses incremental snapshots: only saves changed layers to reduce memory usage
     * @param {boolean} forceFullSnapshot - Force saving all layers (e.g., on layer structure changes)
     */
    function saveState(forceFullSnapshot = false) {
        // Remove any redo states
        state.history = state.history.slice(0, state.historyStep + 1);

        // Determine if this should be a full snapshot
        const isFullSnapshot = forceFullSnapshot ||
                               state.history.length === 0 ||
                               (state.history.length % 5 === 0); // Full snapshot every 5 steps

        let snapshot;

        if (isFullSnapshot) {
            // Full snapshot: save all layers
            snapshot = {
                type: 'full',
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
        } else {
            // Incremental snapshot: save only the active layer
            const activeLayer = state.layers[state.activeLayerIndex];
            snapshot = {
                type: 'incremental',
                changedLayerIndex: state.activeLayerIndex,
                changedLayer: {
                    id: activeLayer.id,
                    name: activeLayer.name,
                    visible: activeLayer.visible,
                    opacity: activeLayer.opacity,
                    blendMode: activeLayer.blendMode || 'normal',
                    imageData: activeLayer.ctx.getImageData(0, 0, canvas.width, canvas.height)
                },
                activeLayerIndex: state.activeLayerIndex,
                // Reference to reconstruct full state
                baseSnapshotIndex: state.historyStep
            };
        }

        state.history.push(snapshot);
        state.historyStep++;

        // Limit history size dynamically based on layer count
        const maxHistorySize = getMaxHistorySize();
        if (state.history.length > maxHistorySize) {
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
     * Handles both full and incremental snapshots
     * @param {Object} snapshot - History snapshot object
     */
    function restoreHistorySnapshot(snapshot) {
        if (snapshot.type === 'full') {
            // Full snapshot: restore all layers directly
            state.layers = [];

            for (const layerData of snapshot.layers) {
                const layer = App.Layers.createLayerFromData(layerData);
                state.layers.push(layer);
            }
        } else {
            // Incremental snapshot: find base full snapshot and apply changes
            const targetIndex = state.historyStep;

            // Find the most recent full snapshot before current position
            let baseIndex = targetIndex;
            while (baseIndex >= 0 && state.history[baseIndex].type !== 'full') {
                baseIndex--;
            }

            if (baseIndex < 0) {
                console.error('No base full snapshot found');
                return;
            }

            // Start with base full snapshot
            const baseSnapshot = state.history[baseIndex];
            state.layers = [];
            for (const layerData of baseSnapshot.layers) {
                const layer = App.Layers.createLayerFromData(layerData);
                state.layers.push(layer);
            }

            // Apply all incremental changes from base to target
            for (let i = baseIndex + 1; i <= targetIndex; i++) {
                const incrementalSnapshot = state.history[i];
                if (incrementalSnapshot.type === 'incremental') {
                    // Update the changed layer
                    const idx = incrementalSnapshot.changedLayerIndex;
                    if (idx >= 0 && idx < state.layers.length) {
                        const layer = App.Layers.createLayerFromData(incrementalSnapshot.changedLayer);
                        state.layers[idx] = layer;
                    }
                } else if (incrementalSnapshot.type === 'full') {
                    // If we hit another full snapshot, use that instead
                    state.layers = [];
                    for (const layerData of incrementalSnapshot.layers) {
                        const layer = App.Layers.createLayerFromData(layerData);
                        state.layers.push(layer);
                    }
                }
            }
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
        updateUndoRedoButtons,
        getMaxHistorySize
    };
})();
