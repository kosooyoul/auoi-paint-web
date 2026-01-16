/**
 * ui-handlers.js
 * Event handlers, keyboard shortcuts, zoom UI, text tool, help modal, floating toolbox
 * Part of: Web Paint (Vanilla JS Bitmap Editor)
 */

(function() {
    'use strict';

    window.App = window.App || {};

    const canvas = App.Constants.canvas;
    const ctx = App.Constants.ctx;
    const CONSTANTS = App.Constants.CONSTANTS;
    const state = App.State.state;

function setupEventListeners() {
    // Canvas events
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointerout', handlePointerOut);
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    // Tool buttons
    document.getElementById('tool-pen').addEventListener('click', () => setTool('pen'));
    document.getElementById('tool-eraser').addEventListener('click', () => setTool('eraser'));
    document.getElementById('tool-fill').addEventListener('click', () => setTool('fill'));
    document.getElementById('tool-picker').addEventListener('click', () => setTool('picker'));
    document.getElementById('tool-select').addEventListener('click', () => setTool('select'));
    document.getElementById('tool-lasso').addEventListener('click', () => setTool('lasso'));
    document.getElementById('tool-text').addEventListener('click', () => setTool('text'));

    // Shape buttons
    document.getElementById('shape-rect').addEventListener('click', () => setTool('rect'));
    document.getElementById('shape-ellipse').addEventListener('click', () => setTool('ellipse'));
    document.getElementById('shape-line').addEventListener('click', () => setTool('line'));

    // Color picker
    document.getElementById('color-picker').addEventListener('input', (e) => {
        state.color = e.target.value;
        updateColorDisplay();
    });

    // Brush size
    document.getElementById('brush-size').addEventListener('input', (e) => {
        state.brushSize = parseInt(e.target.value);
        document.getElementById('brush-size-value').textContent = state.brushSize;
    });

    // Fill tolerance
    document.getElementById('fill-tolerance').addEventListener('input', (e) => {
        state.fillTolerance = parseInt(e.target.value);
        document.getElementById('fill-tolerance-value').textContent = state.fillTolerance;
    });

    // Font controls
    document.getElementById('font-family').addEventListener('change', (e) => {
        state.fontFamily = e.target.value;
    });

    document.getElementById('font-size').addEventListener('input', (e) => {
        state.fontSize = parseInt(e.target.value);
    });

    // Action buttons
    document.getElementById('btn-undo').addEventListener('click', App.History.undo);
    document.getElementById('btn-redo').addEventListener('click', App.History.redo);
    document.getElementById('btn-clear').addEventListener('click', App.FileIO.clearCanvas);
    document.getElementById('btn-open').addEventListener('click', App.FileIO.openImageFile);
    document.getElementById('btn-save').addEventListener('click', App.FileIO.saveImage);
    document.getElementById('btn-help').addEventListener('click', toggleHelpModal);
    document.getElementById('btn-resize').addEventListener('click', App.FileIO.resizeCanvas);

    // File input
    document.getElementById('file-input').addEventListener('change', App.FileIO.handleFileSelect);

    // Drag and drop for file upload
    const canvasContainer = document.querySelector('.canvas-container');
    canvasContainer.addEventListener('dragenter', App.FileIO.handleDragEnter);
    canvasContainer.addEventListener('dragover', App.FileIO.handleDragOver);
    canvasContainer.addEventListener('dragleave', App.FileIO.handleDragLeave);
    canvasContainer.addEventListener('drop', App.FileIO.handleDrop);

    // Layer buttons
    document.getElementById('btn-layer-add').addEventListener('click', App.LayerUI.addLayer);
    document.getElementById('btn-layer-delete').addEventListener('click', () => {
        App.LayerUI.deleteLayer(state.activeLayerIndex);
    });
    document.getElementById('btn-layer-merge').addEventListener('click', () => {
        App.LayerUI.mergeLayerDown(state.activeLayerIndex);
    });
    document.getElementById('btn-layer-flatten').addEventListener('click', App.LayerUI.flattenAllLayers);

    // Help modal
    document.getElementById('close-help').addEventListener('click', closeHelpModal);
    document.getElementById('help-modal').addEventListener('click', (e) => {
        if (e.target.id === 'help-modal') {
            closeHelpModal();
        }
    });

    // Text input
    const textInput = document.getElementById('text-input');
    textInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            commitText();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelText();
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);
    document.addEventListener('keyup', (e) => {
        if (e.key === ' ') {
            state.spaceKeyPressed = false;
            state.isPanning = false;
            App.ZoomPan.updateCanvasCursor();
        }
    });

    // Setup zoom controls
    setupZoomControls();
}

// Tool Management
function setTool(tool) {
    state.tool = tool;

    // Update UI
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));

    const toolMap = {
        'pen': 'tool-pen',
        'eraser': 'tool-eraser',
        'fill': 'tool-fill',
        'picker': 'tool-picker',
        'select': 'tool-select',
        'lasso': 'tool-lasso',
        'text': 'tool-text',
        'rect': 'shape-rect',
        'ellipse': 'shape-ellipse',
        'line': 'shape-line'
    };

    const btnId = toolMap[tool];
    if (btnId) {
        document.getElementById(btnId).classList.add('active');
    }

    document.getElementById('status-tool').textContent = `Tool: ${tool.charAt(0).toUpperCase() + tool.slice(1)}`;

    // Clear selection if switching away from selection tools
    if (tool !== 'select' && tool !== 'lasso' && state.selection) {
        state.selection = null;
    }
}

// Update Color Display
function updateColorDisplay() {
    document.getElementById('color-display').style.backgroundColor = state.color;
}

// Canvas Event Handlers


/**
 * Handle wheel event for zooming
 */
function handleWheel(e) {
    // Only zoom with Ctrl/Cmd + wheel
    if (!e.ctrlKey && !e.metaKey) return;

    e.preventDefault();

    // Determine zoom direction and amount
    const delta = -e.deltaY;
    const zoomChange = delta * CONSTANTS.ZOOM_SPEED;
    const newZoom = state.zoomLevel * (1 + zoomChange);

    // Zoom toward cursor position
    App.ZoomPan.setZoom(newZoom, e.clientX, e.clientY);
}

function handlePointerDown(e) {
    // Check if panning mode (Space key held)
    if (state.spaceKeyPressed && !state.pasteMode && !state.textMode) {
        state.isPanning = true;
        state.panStartX = e.clientX - state.panX;
        state.panStartY = e.clientY - state.panY;
        canvas.style.cursor = 'grabbing';
        return;
    }

    // Transform coordinates
    const coords = App.ZoomPan.screenToCanvas(e.clientX, e.clientY);
    const x = coords.x;
    const y = coords.y;

    // Handle paste mode
    if (state.pasteMode) {
        App.SelectionTools.commitPaste();
        return;
    }

    // Handle text tool
    if (state.tool === 'text') {
        showTextInput(x, y, e.clientX, e.clientY);
        return;
    }

    state.isDrawing = true;
    state.startX = x;
    state.startY = y;
    state.lastX = x;
    state.lastY = y;

    if (state.tool === 'pen') {
        App.DrawingTools.drawPenStart(x, y);
    } else if (state.tool === 'eraser') {
        App.DrawingTools.drawEraserStart(x, y);
    } else if (state.tool === 'fill') {
        // Use loading indicator for flood fill
        App.FileIO.withLoading(async () => {
            App.DrawingTools.floodFill(Math.floor(x), Math.floor(y));
            App.History.saveState();
            // Redraw selection marquee after fill
            if (state.selection) App.SelectionTools.drawSelectionMarquee();
        }, 'Filling area...');
    } else if (state.tool === 'picker') {
        App.DrawingTools.pickColor(Math.floor(x), Math.floor(y));
    } else if (state.tool === 'select') {
        // Save canvas state for preview
        state.tempCanvas = ctx.getImageData(0, 0, canvas.width, canvas.height);
        state.selection = null;
    } else if (state.tool === 'lasso') {
        // Start lasso path
        state.lassoPath = [{x, y}];
        state.tempCanvas = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } else if (['rect', 'ellipse', 'line'].includes(state.tool)) {
        // Save active layer state for preview
        const layer = App.Layers.getActiveLayer();
        state.tempCanvas = layer.ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
}

function handlePointerMove(e) {
    // Handle panning
    if (state.isPanning) {
        state.panX = e.clientX - state.panStartX;
        state.panY = e.clientY - state.panStartY;
        App.ZoomPan.applyCanvasTransform();
        return;
    }

    // Transform coordinates
    const coords = App.ZoomPan.screenToCanvas(e.clientX, e.clientY);
    const x = coords.x;
    const y = coords.y;

    // Update status bar
    document.getElementById('status-coords').textContent = `X: ${Math.floor(x)}, Y: ${Math.floor(y)}`;

    // Handle paste mode dragging
    if (state.pasteMode) {
        state.pasteX = x;
        state.pasteY = y;
        App.SelectionTools.redrawWithPaste();
        return;
    }

    if (!state.isDrawing) {
        // Redraw selection marquee if it exists and we're not drawing
        if (state.selection && !state.pasteMode && state.tool !== 'select' && state.tool !== 'lasso') {
            App.SelectionTools.drawSelectionMarquee();
        }
        return;
    }

    if (state.tool === 'pen') {
        App.DrawingTools.drawPen(x, y);
        // Redraw selection marquee after drawing
        if (state.selection) App.SelectionTools.drawSelectionMarquee();
    } else if (state.tool === 'eraser') {
        App.DrawingTools.drawEraser(x, y);
        // Redraw selection marquee after erasing
        if (state.selection) App.SelectionTools.drawSelectionMarquee();
    } else if (state.tool === 'select') {
        App.SelectionTools.previewSelection(x, y);
    } else if (state.tool === 'lasso') {
        App.SelectionTools.drawLassoPath(x, y);
    } else if (state.tool === 'rect') {
        App.DrawingTools.previewRect(x, y);
    } else if (state.tool === 'ellipse') {
        App.DrawingTools.previewEllipse(x, y);
    } else if (state.tool === 'line') {
        App.DrawingTools.previewLine(x, y);
    }
}

function handlePointerUp(e) {
    // End panning
    if (state.isPanning) {
        state.isPanning = false;
        App.ZoomPan.updateCanvasCursor();
        return;
    }

    if (!state.isDrawing) return;

    // Transform coordinates
    const coords = App.ZoomPan.screenToCanvas(e.clientX, e.clientY);
    const x = coords.x;
    const y = coords.y;

    state.isDrawing = false;

    if (state.tool === 'pen' || state.tool === 'eraser') {
        App.History.saveState();
    } else if (state.tool === 'select') {
        // Finalize selection
        const width = x - state.startX;
        const height = y - state.startY;
        if (Math.abs(width) > 1 && Math.abs(height) > 1) {
            state.selection = {
                x: Math.min(state.startX, x),
                y: Math.min(state.startY, y),
                width: Math.abs(width),
                height: Math.abs(height)
            };
        }
        state.tempCanvas = null;
    } else if (state.tool === 'lasso') {
        // Finalize lasso selection
        App.SelectionTools.finalizeLassoSelection();
    } else if (['rect', 'ellipse', 'line'].includes(state.tool)) {
        // Finalize shape
        App.History.saveState();
        state.tempCanvas = null;
        // Redraw selection marquee after shape
        if (state.selection) App.SelectionTools.drawSelectionMarquee();
    }
}

function handlePointerOut(e) {
    if (state.isDrawing) {
        handlePointerUp(e);
    }
}


// Keyboard Shortcuts
function handleKeyboard(e) {
    // Track spacebar for pan mode
    if (e.key === ' ' && !state.textMode) {
        if (!state.spaceKeyPressed) {
            state.spaceKeyPressed = true;
            state.originalCursor = canvas.style.cursor;
            if (!state.isPanning) {
                canvas.style.cursor = 'grab';
            }
        }
    }

    // Tab to toggle toolbox visibility
    if (e.key === 'Tab' && !state.textMode) {
        e.preventDefault();
        toggleToolboxVisibility();
        return;
    }

    if (e.ctrlKey || e.metaKey) {
        // Zoom shortcuts
        if (e.key === '0') {
            e.preventDefault();
            resetZoom();
            return;
        } else if (e.key === '+' || e.key === '=') {
            e.preventDefault();
            zoomIn();
            return;
        } else if (e.key === '-' || e.key === '_') {
            e.preventDefault();
            zoomOut();
            return;
        }

        // Undo/redo
        if (e.key === 'z') {
            e.preventDefault();
            App.History.undo();
        } else if (e.key === 'y') {
            e.preventDefault();
            App.History.redo();
        } else if (e.key === 'c') {
            e.preventDefault();
            App.SelectionTools.copySelection();
        } else if (e.key === 'x') {
            e.preventDefault();
            App.SelectionTools.cutSelection();
        } else if (e.key === 'v') {
            e.preventDefault();
            App.SelectionTools.pasteFromClipboard();
        } else if (e.key === 'o') {
            e.preventDefault();
            App.FileIO.openImageFile();
        }
    }

    // Escape to cancel paste mode
    if (e.key === 'Escape' && state.pasteMode) {
        state.pasteMode = false;
        state.pasteImage = null;
        if (state.tempCanvas) {
            ctx.putImageData(state.tempCanvas, 0, 0);
            state.tempCanvas = null;
        }
    }

    // Help shortcut
    if ((e.key === '?' || e.key.toLowerCase() === 'h') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        toggleHelpModal();
        return;
    }

    // Tool shortcuts
    const toolShortcuts = {
        'p': 'pen',
        'e': 'eraser',
        'f': 'fill',
        'i': 'picker',
        's': 'select',
        'a': 'lasso',
        't': 'text',
        'r': 'rect',
        'c': 'ellipse',
        'l': 'line'
    };

    if (toolShortcuts[e.key.toLowerCase()] && !e.ctrlKey && !e.metaKey) {
        setTool(toolShortcuts[e.key.toLowerCase()]);
    }
}

// ===========================
// Zoom Controls
// ===========================

function zoomIn() {
    const newZoom = state.zoomLevel * CONSTANTS.ZOOM_STEP;
    App.ZoomPan.setZoom(newZoom);
}

function zoomOut() {
    const newZoom = state.zoomLevel / CONSTANTS.ZOOM_STEP;
    App.ZoomPan.setZoom(newZoom);
}

function resetZoom() {
    state.zoomLevel = 1.0;
    state.panX = 0;
    state.panY = 0;
    App.ZoomPan.applyCanvasTransform();
    App.ZoomPan.updateZoomDisplay();
}

function fitToScreen() {
    const container = document.querySelector('.canvas-container');
    const containerRect = container.getBoundingClientRect();

    // Account for padding (32px on each side)
    const availableWidth = containerRect.width - CONSTANTS.FIT_CONTAINER_PADDING;
    const availableHeight = containerRect.height - CONSTANTS.FIT_CONTAINER_PADDING;

    // Calculate zoom to fit
    const zoomX = availableWidth / canvas.width;
    const zoomY = availableHeight / canvas.height;
    const fitZoom = Math.min(zoomX, zoomY, 1.0); // Don't zoom in beyond 100%

    // Center the canvas
    state.zoomLevel = fitZoom;
    state.panX = (containerRect.width - canvas.width * fitZoom) / 2;
    state.panY = (containerRect.height - canvas.height * fitZoom) / 2;

    App.ZoomPan.applyCanvasTransform();
    App.ZoomPan.updateZoomDisplay();
}

function setupZoomControls() {
    // Zoom buttons
    const btnZoomIn = document.getElementById('btn-zoom-in');
    const btnZoomOut = document.getElementById('btn-zoom-out');
    const btnZoomReset = document.getElementById('btn-zoom-reset');
    const btnZoomFit = document.getElementById('btn-zoom-fit');

    if (btnZoomIn) btnZoomIn.addEventListener('click', zoomIn);
    if (btnZoomOut) btnZoomOut.addEventListener('click', zoomOut);
    if (btnZoomReset) btnZoomReset.addEventListener('click', resetZoom);
    if (btnZoomFit) btnZoomFit.addEventListener('click', fitToScreen);

    // Zoom slider
    const zoomSlider = document.getElementById('zoom-slider');
    if (zoomSlider) {
        zoomSlider.addEventListener('input', (e) => {
            const percent = parseInt(e.target.value);
            App.ZoomPan.setZoom(percent / 100);
            const zoomValue = document.getElementById('zoom-value');
            if (zoomValue) zoomValue.textContent = percent + '%';
        });
    }
}

// Help Modal Functions
function toggleHelpModal() {
    const modal = document.getElementById('help-modal');
    modal.classList.toggle('active');
}

function closeHelpModal() {
    const modal = document.getElementById('help-modal');
    modal.classList.remove('active');
}

// Text Tool Functions
function showTextInput(canvasX, canvasY, screenX, screenY) {
    const textInput = document.getElementById('text-input');

    // Store text position (canvas coordinates)
    state.textX = canvasX;
    state.textY = canvasY;
    state.textMode = true;

    // Position the input overlay at screen coordinates
    // Account for zoom: font should appear at zoomed size
    const rect = canvas.getBoundingClientRect();
    const left = rect.left + (canvasX * state.zoomLevel) + state.panX;
    const top = rect.top + (canvasY * state.zoomLevel) + state.panY;

    textInput.style.left = `${left}px`;
    textInput.style.top = `${top}px`;
    textInput.style.fontFamily = state.fontFamily;
    textInput.style.fontSize = `${state.fontSize * state.zoomLevel}px`; // Scale font
    textInput.style.color = state.color;
    textInput.value = '';
    textInput.classList.add('active');
    textInput.focus();
}

function commitText() {
    const textInput = document.getElementById('text-input');
    const text = textInput.value.trim();

    if (text) {
        // Draw text to canvas
        ctx.font = `${state.fontSize}px ${state.fontFamily}`;
        ctx.fillStyle = state.color;
        ctx.textBaseline = 'top';
        ctx.fillText(text, state.textX, state.textY);

        // Save state for undo
        App.History.saveState();

        // Redraw selection marquee after text
        if (state.selection) App.SelectionTools.drawSelectionMarquee();
    }

    // Hide input
    textInput.classList.remove('active');
    textInput.value = '';
    state.textMode = false;
}

function cancelText() {
    const textInput = document.getElementById('text-input');
    textInput.classList.remove('active');
    textInput.value = '';
    state.textMode = false;
}

// Reset composite operation on pointer up (for eraser tool)
canvas.addEventListener('pointerup', () => {
    const layer = App.Layers.getActiveLayer();
    if (layer) {
        layer.ctx.globalCompositeOperation = 'source-over';
    }
});

// ===========================
// Floating Toolbox Functions
// ===========================

let toolboxDragState = {
    isDragging: false,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0
};

function setupFloatingToolbox() {
    const toolbox = document.getElementById('floating-toolbox');
    const dragHandle = document.getElementById('toolbox-drag-handle');
    const toggleBtn = document.getElementById('toolbox-toggle');

    // Drag functionality
    dragHandle.addEventListener('pointerdown', (e) => {
        // Don't drag if clicking the toggle button
        if (e.target === toggleBtn || e.target.parentElement === toggleBtn) {
            return;
        }

        toolboxDragState.isDragging = true;
        const rect = toolbox.getBoundingClientRect();
        toolboxDragState.offsetX = e.clientX - rect.left;
        toolboxDragState.offsetY = e.clientY - rect.top;
        dragHandle.style.cursor = 'grabbing';
    });

    document.addEventListener('pointermove', (e) => {
        if (!toolboxDragState.isDragging) return;

        const newX = e.clientX - toolboxDragState.offsetX;
        const newY = e.clientY - toolboxDragState.offsetY;

        // Constrain to viewport
        const maxX = window.innerWidth - toolbox.offsetWidth;
        const maxY = window.innerHeight - toolbox.offsetHeight;

        const constrainedX = Math.max(0, Math.min(newX, maxX));
        const constrainedY = Math.max(0, Math.min(newY, maxY));

        toolbox.style.left = constrainedX + 'px';
        toolbox.style.top = constrainedY + 'px';
        toolbox.style.right = 'auto';  // Override initial right positioning
    });

    document.addEventListener('pointerup', () => {
        if (toolboxDragState.isDragging) {
            toolboxDragState.isDragging = false;
            dragHandle.style.cursor = 'move';

            // Save position to localStorage
            saveToolboxPosition();
        }
    });

    // Toggle minimize/expand
    toggleBtn.addEventListener('click', () => {
        toolbox.classList.toggle('minimized');
        toggleBtn.textContent = toolbox.classList.contains('minimized') ? '+' : '−';
    });
}

function toggleToolboxVisibility() {
    const toolbox = document.getElementById('floating-toolbox');
    toolbox.classList.toggle('hidden');
}

function saveToolboxPosition() {
    const toolbox = document.getElementById('floating-toolbox');
    const rect = toolbox.getBoundingClientRect();

    const position = {
        left: rect.left,
        top: rect.top
    };

    localStorage.setItem('toolboxPosition', JSON.stringify(position));
}

function restoreToolboxPosition() {
    const saved = localStorage.getItem('toolboxPosition');
    if (!saved) return;

    try {
        const position = JSON.parse(saved);
        const toolbox = document.getElementById('floating-toolbox');

        // Validate position is within viewport
        const maxX = window.innerWidth - toolbox.offsetWidth;
        const maxY = window.innerHeight - toolbox.offsetHeight;

        const validX = Math.max(0, Math.min(position.left, maxX));
        const validY = Math.max(0, Math.min(position.top, maxY));

        toolbox.style.left = validX + 'px';
        toolbox.style.top = validY + 'px';
        toolbox.style.right = 'auto';  // Override initial right positioning
    } catch (e) {
        console.error('Failed to restore toolbox position:', e);
    }
}

    // Export to global namespace
    window.App.UI = {
        setupEventListeners,
        setTool,
        updateColorDisplay,
        handleWheel,
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        handlePointerOut,
        handleKeyboard,
        zoomIn,
        zoomOut,
        resetZoom,
        fitToScreen,
        setupZoomControls,
        showTextInput,
        commitText,
        cancelText,
        toggleHelpModal,
        closeHelpModal,
        setupFloatingToolbox,
        toggleToolboxVisibility,
        saveToolboxPosition,
        restoreToolboxPosition
    };
})();

// Start application
App.State.init();
