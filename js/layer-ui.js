/**
 * layer-ui.js
 * Layer panel UI and management functions
 * Part of: Web Paint (Vanilla JS Bitmap Editor)
 */

(function() {
    'use strict';

    window.App = window.App || {};

    const canvas = App.Constants.canvas;
    const CONSTANTS = App.Constants.CONSTANTS;
    const state = App.State.state;

// ===========================
// Layer Management Functions
// ===========================

/**
 * Add a new layer
 */
function addLayer() {
    if (state.layers.length >= CONSTANTS.MAX_LAYERS) {
        alert(`Maximum ${CONSTANTS.MAX_LAYERS} layers reached.`);
        return;
    }

    const newLayer = App.Layers.createEmptyLayer(`Layer ${state.layers.length + 1}`);
    state.layers.push(newLayer);
    state.activeLayerIndex = state.layers.length - 1;

    App.Layers.compositeAllLayers();
    updateLayerUI();
    App.History.saveState(true); // Force full snapshot for layer structure change
}

/**
 * Delete layer at index
 */
function deleteLayer(index) {
    if (state.layers.length <= 1) {
        alert('Cannot delete the last layer.');
        return;
    }

    if (!confirm(`Delete "${state.layers[index].name}"?`)) {
        return;
    }

    state.layers.splice(index, 1);

    // Adjust active index if needed
    if (state.activeLayerIndex >= state.layers.length) {
        state.activeLayerIndex = state.layers.length - 1;
    } else if (state.activeLayerIndex > index) {
        state.activeLayerIndex--;
    }

    App.Layers.compositeAllLayers();
    updateLayerUI();
    App.History.saveState(true); // Force full snapshot for layer structure change
}

/**
 * Set the active layer
 */
function setActiveLayer(index) {
    if (index < 0 || index >= state.layers.length) return;
    state.activeLayerIndex = index;
    updateLayerUI();
}

/**
 * Move layer up in the stack (increase Z-index)
 */
function moveLayerUp(index) {
    if (index >= state.layers.length - 1) return;

    [state.layers[index], state.layers[index + 1]] =
    [state.layers[index + 1], state.layers[index]];

    // Update active index if needed
    if (state.activeLayerIndex === index) {
        state.activeLayerIndex = index + 1;
    } else if (state.activeLayerIndex === index + 1) {
        state.activeLayerIndex = index;
    }

    App.Layers.compositeAllLayers();
    updateLayerUI();
    App.History.saveState(true); // Force full snapshot for layer structure change
}

/**
 * Move layer down in the stack (decrease Z-index)
 */
function moveLayerDown(index) {
    if (index <= 0) return;

    [state.layers[index], state.layers[index - 1]] =
    [state.layers[index - 1], state.layers[index]];

    // Update active index if needed
    if (state.activeLayerIndex === index) {
        state.activeLayerIndex = index - 1;
    } else if (state.activeLayerIndex === index - 1) {
        state.activeLayerIndex = index;
    }

    App.Layers.compositeAllLayers();
    updateLayerUI();
    App.History.saveState(true); // Force full snapshot for layer structure change
}

/**
 * Merge layer down with the layer below it
 */
function mergeLayerDown(index) {
    if (index <= 0) {
        alert('Cannot merge the bottom layer.');
        return;
    }

    const upperLayer = state.layers[index];
    const lowerLayer = state.layers[index - 1];

    // Create temporary canvas for merging
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    // Draw lower layer
    tempCtx.globalAlpha = lowerLayer.opacity;
    tempCtx.drawImage(lowerLayer.canvas, 0, 0);

    // Draw upper layer on top
    tempCtx.globalAlpha = upperLayer.opacity;
    tempCtx.drawImage(upperLayer.canvas, 0, 0);

    // Replace lower layer with merged result
    tempCtx.globalAlpha = 1.0;
    lowerLayer.ctx.clearRect(0, 0, canvas.width, canvas.height);
    lowerLayer.ctx.drawImage(tempCanvas, 0, 0);
    lowerLayer.opacity = 1.0;
    lowerLayer.name = `${lowerLayer.name} + ${upperLayer.name}`;

    // Remove upper layer
    state.layers.splice(index, 1);

    // Adjust active index
    if (state.activeLayerIndex >= index) {
        state.activeLayerIndex--;
    }

    App.Layers.compositeAllLayers();
    updateLayerUI();
    App.History.saveState(true); // Force full snapshot for layer structure change
}

/**
 * Flatten all layers into one
 */
function flattenAllLayers() {
    if (!confirm('Flatten all layers into one? This cannot be undone.')) {
        return;
    }

    // Create new single layer with composited result
    const flatLayer = App.Layers.createEmptyLayer('Flattened');

    // Composite all layers onto the flat layer
    for (const layer of state.layers) {
        if (!layer.visible) continue;
        flatLayer.ctx.globalAlpha = layer.opacity;
        flatLayer.ctx.drawImage(layer.canvas, 0, 0);
    }

    flatLayer.ctx.globalAlpha = 1.0;

    // Replace all layers with single flat layer
    state.layers = [flatLayer];
    state.activeLayerIndex = 0;

    App.Layers.compositeAllLayers();
    updateLayerUI();
    App.History.saveState(true); // Force full snapshot for layer structure change
}

/**
 * Reorder layer by drag and drop
 */
function reorderLayerByDrag(fromIndex, toIndex) {
    // Remove the dragged layer
    const [draggedLayer] = state.layers.splice(fromIndex, 1);

    // Insert at new position
    state.layers.splice(toIndex, 0, draggedLayer);

    // Update active layer index
    if (state.activeLayerIndex === fromIndex) {
        state.activeLayerIndex = toIndex;
    } else if (fromIndex < state.activeLayerIndex && toIndex >= state.activeLayerIndex) {
        state.activeLayerIndex--;
    } else if (fromIndex > state.activeLayerIndex && toIndex <= state.activeLayerIndex) {
        state.activeLayerIndex++;
    }

    App.Layers.compositeAllLayers();
    updateLayerUI();
    App.History.saveState(true); // Force full snapshot for layer structure change
}

/**
 * Toggle layer visibility
 */
function toggleLayerVisibility(index) {
    state.layers[index].visible = !state.layers[index].visible;
    App.Layers.compositeAllLayers();
    updateLayerUI();
    // Note: Not saving state for visibility changes (UI state, not content)
}

/**
 * Set layer opacity
 */
function setLayerOpacity(index, opacity) {
    state.layers[index].opacity = opacity / 100; // Convert percentage to 0-1
    App.Layers.compositeAllLayers();
    updateLayerUI();
    // Note: Save state on slider release, not during drag (see event handler)
}

/**
 * Set layer blend mode
 */
function setLayerBlendMode(index, blendMode) {
    state.layers[index].blendMode = blendMode;
    App.Layers.compositeAllLayers();
    updateLayerUI();
    App.History.saveState(true); // Force full snapshot for layer structure change
}

/**
 * Rename a layer
 */
function renameLayer(index, newName) {
    if (!newName || newName.trim() === '') {
        return; // Don't allow empty names
    }
    state.layers[index].name = newName.trim();
    updateLayerUI();
    // Note: Name change is UI state, not saved to history
}

/**
 * Start editing a layer name
 */
function startLayerRename(nameDiv, index, currentName) {
    // Create input element
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'layer-name-input';
    input.value = currentName;
    input.maxLength = 30;

    // Replace nameDiv with input
    const parent = nameDiv.parentElement;
    parent.replaceChild(input, nameDiv);
    input.focus();
    input.select();

    // Commit on Enter
    const commitRename = () => {
        const newName = input.value.trim();
        if (newName && newName !== currentName) {
            renameLayer(index, newName);
        } else {
            updateLayerUI(); // Restore original UI
        }
    };

    // Cancel on Escape
    const cancelRename = () => {
        updateLayerUI(); // Restore original UI
    };

    input.onkeydown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            commitRename();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelRename();
        }
    };

    // Commit on blur
    input.onblur = commitRename;
}

/**
 * Update only the active layer's thumbnail (for real-time updates)
 */
function updateActiveLayerThumbnail() {
    const activeLayer = App.Layers.getActiveLayer();
    if (!activeLayer) return;

    // Find the active layer item in the DOM
    const layerItems = document.querySelectorAll('.layer-item');
    const activeLayerItem = Array.from(layerItems).find(item =>
        parseInt(item.dataset.layerIndex) === state.activeLayerIndex
    );

    if (!activeLayerItem) return;

    // Find the thumbnail canvas
    const thumbCanvas = activeLayerItem.querySelector('.layer-thumbnail canvas');
    if (!thumbCanvas) return;

    // Update thumbnail
    const thumbCtx = thumbCanvas.getContext('2d');
    thumbCtx.clearRect(0, 0, 60, 45);
    thumbCtx.drawImage(activeLayer.canvas, 0, 0, activeLayer.canvas.width, activeLayer.canvas.height, 0, 0, 60, 45);
}

// Throttled version using requestAnimationFrame
let thumbnailUpdateScheduled = false;
function updateActiveLayerThumbnailThrottled() {
    if (!thumbnailUpdateScheduled) {
        thumbnailUpdateScheduled = true;
        requestAnimationFrame(() => {
            updateActiveLayerThumbnail();
            thumbnailUpdateScheduled = false;
        });
    }
}

/**
 * Update the layer list UI
 */
function updateLayerUI() {
    const layerList = document.getElementById('layer-list');
    if (!layerList) return;

    layerList.innerHTML = '';

    // Render layers in reverse order (top layer first in UI)
    for (let i = state.layers.length - 1; i >= 0; i--) {
        const layer = state.layers[i];
        const layerItem = createLayerItemElement(layer, i);
        layerList.appendChild(layerItem);
    }

    // Update layer count
    const layerCountLabel = document.getElementById('layer-count-label');
    if (layerCountLabel) {
        layerCountLabel.textContent = `Layers (${state.layers.length}/${CONSTANTS.MAX_LAYERS})`;
    }

    // Update button states
    const deleteBtn = document.getElementById('btn-layer-delete');
    const mergeBtn = document.getElementById('btn-layer-merge');
    if (deleteBtn) deleteBtn.disabled = state.layers.length <= 1;
    if (mergeBtn) mergeBtn.disabled = state.activeLayerIndex === 0;
}

/**
 * Create a layer item DOM element
 */
function createLayerItemElement(layer, index) {
    const div = document.createElement('div');
    div.className = `layer-item ${index === state.activeLayerIndex ? 'active' : ''}`;
    div.dataset.layerIndex = index;
    div.draggable = true;

    // Thumbnail
    const thumbDiv = document.createElement('div');
    thumbDiv.className = 'layer-thumbnail';
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = 60;
    thumbCanvas.height = 45;
    const thumbCtx = thumbCanvas.getContext('2d');
    // Draw scaled layer thumbnail
    thumbCtx.drawImage(layer.canvas, 0, 0, layer.canvas.width, layer.canvas.height, 0, 0, 60, 45);
    thumbDiv.appendChild(thumbCanvas);

    // Info section
    const infoDiv = document.createElement('div');
    infoDiv.className = 'layer-info';

    const nameDiv = document.createElement('div');
    nameDiv.className = 'layer-name';
    nameDiv.textContent = layer.name;
    nameDiv.title = 'Double-click to rename';

    // Double-click to rename
    nameDiv.ondblclick = (e) => {
        e.stopPropagation();
        startLayerRename(nameDiv, index, layer.name);
    };

    const controlsRow = document.createElement('div');
    controlsRow.className = 'layer-controls-row';

    const visibilityBtn = document.createElement('button');
    visibilityBtn.className = `layer-visibility-btn ${layer.visible ? 'visible' : ''}`;
    visibilityBtn.textContent = '👁';
    visibilityBtn.title = 'Toggle Visibility';
    visibilityBtn.onclick = (e) => {
        e.stopPropagation();
        toggleLayerVisibility(index);
    };

    const opacitySlider = document.createElement('input');
    opacitySlider.type = 'range';
    opacitySlider.className = 'layer-opacity-slider';
    opacitySlider.min = '0';
    opacitySlider.max = '100';
    opacitySlider.value = Math.round(layer.opacity * 100);
    opacitySlider.oninput = (e) => {
        e.stopPropagation();
        setLayerOpacity(index, e.target.value);
        opacityValue.textContent = `${e.target.value}%`;
    };
    opacitySlider.onchange = () => {
        App.History.saveState(true); // Save state on slider release (full snapshot for layer property change)
    };

    const opacityValue = document.createElement('span');
    opacityValue.className = 'layer-opacity-value';
    opacityValue.textContent = `${Math.round(layer.opacity * 100)}%`;

    controlsRow.appendChild(visibilityBtn);
    controlsRow.appendChild(opacitySlider);
    controlsRow.appendChild(opacityValue);

    // Blend mode row
    const blendModeRow = document.createElement('div');
    blendModeRow.className = 'layer-blend-mode-row';

    const blendModeLabel = document.createElement('label');
    blendModeLabel.textContent = 'Blend:';
    blendModeLabel.className = 'layer-blend-mode-label';

    const blendModeSelect = document.createElement('select');
    blendModeSelect.className = 'layer-blend-mode-select';

    // Add blend mode options
    const blendModes = [
        { value: 'normal', label: 'Normal' },
        { value: 'multiply', label: 'Multiply' },
        { value: 'screen', label: 'Screen' },
        { value: 'overlay', label: 'Overlay' },
        { value: 'darken', label: 'Darken' },
        { value: 'lighten', label: 'Lighten' },
        { value: 'color-dodge', label: 'Color Dodge' },
        { value: 'color-burn', label: 'Color Burn' },
        { value: 'hard-light', label: 'Hard Light' },
        { value: 'soft-light', label: 'Soft Light' },
        { value: 'difference', label: 'Difference' },
        { value: 'exclusion', label: 'Exclusion' }
    ];

    blendModes.forEach(mode => {
        const option = document.createElement('option');
        option.value = mode.value;
        option.textContent = mode.label;
        if (mode.value === (layer.blendMode || 'normal')) {
            option.selected = true;
        }
        blendModeSelect.appendChild(option);
    });

    blendModeSelect.onchange = (e) => {
        e.stopPropagation();
        setLayerBlendMode(index, e.target.value);
    };

    blendModeRow.appendChild(blendModeLabel);
    blendModeRow.appendChild(blendModeSelect);

    infoDiv.appendChild(nameDiv);
    infoDiv.appendChild(controlsRow);
    infoDiv.appendChild(blendModeRow);

    // Reorder buttons
    const reorderDiv = document.createElement('div');
    reorderDiv.className = 'layer-reorder';

    const moveUpBtn = document.createElement('button');
    moveUpBtn.className = 'layer-move-up';
    moveUpBtn.textContent = '↑';
    moveUpBtn.title = 'Move Up';
    moveUpBtn.disabled = index === state.layers.length - 1;
    moveUpBtn.onclick = (e) => {
        e.stopPropagation();
        moveLayerUp(index);
    };

    const moveDownBtn = document.createElement('button');
    moveDownBtn.className = 'layer-move-down';
    moveDownBtn.textContent = '↓';
    moveDownBtn.title = 'Move Down';
    moveDownBtn.disabled = index === 0;
    moveDownBtn.onclick = (e) => {
        e.stopPropagation();
        moveLayerDown(index);
    };

    reorderDiv.appendChild(moveUpBtn);
    reorderDiv.appendChild(moveDownBtn);

    // Assemble
    div.appendChild(thumbDiv);
    div.appendChild(infoDiv);
    div.appendChild(reorderDiv);

    // Drag and drop for reordering
    div.ondragstart = (e) => {
        state.draggedLayerIndex = index;
        div.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    };

    div.ondragover = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        if (state.draggedLayerIndex !== null && state.draggedLayerIndex !== index) {
            div.classList.add('drag-over');
        }
    };

    div.ondragleave = (e) => {
        div.classList.remove('drag-over');
    };

    div.ondrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        div.classList.remove('drag-over');

        if (state.draggedLayerIndex !== null && state.draggedLayerIndex !== index) {
            reorderLayerByDrag(state.draggedLayerIndex, index);
        }
    };

    div.ondragend = (e) => {
        div.classList.remove('dragging');
        document.querySelectorAll('.layer-item').forEach(item => {
            item.classList.remove('drag-over');
        });
        state.draggedLayerIndex = null;
    };

    // Click to set active
    div.onclick = () => {
        setActiveLayer(index);
    };

    return div;
}

    // Export to global namespace
    window.App.LayerUI = {
        addLayer,
        deleteLayer,
        setActiveLayer,
        moveLayerUp,
        moveLayerDown,
        mergeLayerDown,
        flattenAllLayers,
        reorderLayerByDrag,
        toggleLayerVisibility,
        setLayerOpacity,
        setLayerBlendMode,
        renameLayer,
        startLayerRename,
        updateActiveLayerThumbnail,
        updateActiveLayerThumbnailThrottled,
        updateLayerUI,
        createLayerItemElement
    };
})();
