// Canvas State
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

// Application Constants
const CONSTANTS = {
    // History (reduced for multi-layer memory efficiency)
    MAX_HISTORY_SIZE: 10,

    // Layers
    MAX_LAYERS: 20,

    // Zoom & Pan
    ZOOM_MIN: 0.1,              // 10%
    ZOOM_MAX: 5.0,              // 500%
    ZOOM_SPEED: 0.001,          // Mouse wheel zoom sensitivity
    ZOOM_STEP: 1.2,             // Zoom in/out step multiplier (20%)

    // Selection & Lasso
    MARQUEE_DASH_SIZE: 5,       // Dash size for selection marquee
    LASSO_POINT_MIN_DISTANCE: 3, // Minimum pixel distance between lasso points

    // Paste
    DEFAULT_PASTE_OFFSET: 50,   // Default paste position offset

    // UI
    FIT_CONTAINER_PADDING: 64   // Padding for fit-to-screen (32px each side)
};

const state = {
    tool: 'pen',
    color: '#000000',
    brushSize: 4,
    fillTolerance: 10,
    fontFamily: 'Arial',
    fontSize: 24,
    isDrawing: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    history: [],
    historyStep: -1,
    clipboard: null,
    selection: null,
    tempCanvas: null,
    pasteMode: false,
    pasteImage: null,
    pasteX: 0,
    pasteY: 0,
    textMode: false,
    textX: 0,
    textY: 0,
    lassoPath: [],

    // Layer system
    layers: [],               // Array of layer objects
    activeLayerIndex: 0,      // Index of currently active layer
    layerIdCounter: 0,        // For generating unique layer IDs
    compositeCanvas: null,    // Off-screen canvas for compositing layers
    compositeCtx: null,       // Context for composite canvas
    draggedLayerIndex: null,  // Index of layer being dragged (for reordering)

    // Zoom & Pan state
    zoomLevel: 1.0,           // ZOOM_MIN to ZOOM_MAX
    panX: 0,                  // Pan offset in screen pixels
    panY: 0,                  // Pan offset in screen pixels
    isPanning: false,         // Space key + drag active
    panStartX: 0,             // Pan gesture start point
    panStartY: 0,
    spaceKeyPressed: false,   // Track spacebar state
    originalCursor: 'crosshair'
};

// ===========================
// Loading Indicator Utilities
// ===========================

/**
 * Show loading overlay with optional custom message
 */
function showLoading(message = 'Processing...') {
    const overlay = document.getElementById('loading-overlay');
    const text = overlay.querySelector('.loading-text');
    if (text) text.textContent = message;
    overlay.classList.add('active');
}

/**
 * Hide loading overlay
 */
function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.remove('active');
}

/**
 * Execute an async operation with loading indicator
 */
async function withLoading(operation, message = 'Processing...') {
    showLoading(message);
    try {
        // Use setTimeout to allow UI to update before heavy operation
        await new Promise(resolve => setTimeout(resolve, 10));
        const result = await operation();
        return result;
    } finally {
        hideLoading();
    }
}

// ===========================
// Zoom & Pan Utilities
// ===========================

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

// ===========================
// Layer System Functions
// ===========================

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
        opacity: 1.0
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

    // Draw each visible layer with opacity (bottom to top)
    for (let i = 0; i < state.layers.length; i++) {
        const layer = state.layers[i];
        if (!layer.visible) continue;

        state.compositeCtx.globalAlpha = layer.opacity;
        state.compositeCtx.drawImage(layer.canvas, 0, 0);
    }

    // Reset alpha
    state.compositeCtx.globalAlpha = 1.0;

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

// Initialize
function init() {
    // Initialize layer system (creates background layer with white fill)
    initializeLayerSystem();

    // Composite layers to display canvas
    compositeAllLayers();

    // Save initial state
    saveState();

    // Setup event listeners
    setupEventListeners();

    // Update UI
    updateColorDisplay();
    updateUndoRedoButtons();
    updateLayerUI();

    // Setup floating toolbox
    setupFloatingToolbox();

    // Restore toolbox position from localStorage
    restoreToolboxPosition();
}

// Setup Event Listeners
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
    document.getElementById('btn-undo').addEventListener('click', undo);
    document.getElementById('btn-redo').addEventListener('click', redo);
    document.getElementById('btn-clear').addEventListener('click', clearCanvas);
    document.getElementById('btn-save').addEventListener('click', saveImage);
    document.getElementById('btn-help').addEventListener('click', toggleHelpModal);
    document.getElementById('btn-resize').addEventListener('click', resizeCanvas);

    // Layer buttons
    document.getElementById('btn-layer-add').addEventListener('click', addLayer);
    document.getElementById('btn-layer-delete').addEventListener('click', () => {
        deleteLayer(state.activeLayerIndex);
    });
    document.getElementById('btn-layer-merge').addEventListener('click', () => {
        mergeLayerDown(state.activeLayerIndex);
    });
    document.getElementById('btn-layer-flatten').addEventListener('click', flattenAllLayers);

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
            updateCanvasCursor();
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
    setZoom(newZoom, e.clientX, e.clientY);
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
    const coords = screenToCanvas(e.clientX, e.clientY);
    const x = coords.x;
    const y = coords.y;

    // Handle paste mode
    if (state.pasteMode) {
        commitPaste();
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
        drawPenStart(x, y);
    } else if (state.tool === 'eraser') {
        drawEraserStart(x, y);
    } else if (state.tool === 'fill') {
        // Use loading indicator for flood fill
        withLoading(async () => {
            floodFill(Math.floor(x), Math.floor(y));
            saveState();
            // Redraw selection marquee after fill
            if (state.selection) drawSelectionMarquee();
        }, 'Filling area...');
    } else if (state.tool === 'picker') {
        pickColor(Math.floor(x), Math.floor(y));
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
        const layer = getActiveLayer();
        state.tempCanvas = layer.ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
}

function handlePointerMove(e) {
    // Handle panning
    if (state.isPanning) {
        state.panX = e.clientX - state.panStartX;
        state.panY = e.clientY - state.panStartY;
        applyCanvasTransform();
        return;
    }

    // Transform coordinates
    const coords = screenToCanvas(e.clientX, e.clientY);
    const x = coords.x;
    const y = coords.y;

    // Update status bar
    document.getElementById('status-coords').textContent = `X: ${Math.floor(x)}, Y: ${Math.floor(y)}`;

    // Handle paste mode dragging
    if (state.pasteMode) {
        state.pasteX = x;
        state.pasteY = y;
        redrawWithPaste();
        return;
    }

    if (!state.isDrawing) {
        // Redraw selection marquee if it exists and we're not drawing
        if (state.selection && !state.pasteMode && state.tool !== 'select' && state.tool !== 'lasso') {
            drawSelectionMarquee();
        }
        return;
    }

    if (state.tool === 'pen') {
        drawPen(x, y);
        // Redraw selection marquee after drawing
        if (state.selection) drawSelectionMarquee();
    } else if (state.tool === 'eraser') {
        drawEraser(x, y);
        // Redraw selection marquee after erasing
        if (state.selection) drawSelectionMarquee();
    } else if (state.tool === 'select') {
        previewSelection(x, y);
    } else if (state.tool === 'lasso') {
        drawLassoPath(x, y);
    } else if (state.tool === 'rect') {
        previewRect(x, y);
    } else if (state.tool === 'ellipse') {
        previewEllipse(x, y);
    } else if (state.tool === 'line') {
        previewLine(x, y);
    }
}

function handlePointerUp(e) {
    // End panning
    if (state.isPanning) {
        state.isPanning = false;
        updateCanvasCursor();
        return;
    }

    if (!state.isDrawing) return;

    // Transform coordinates
    const coords = screenToCanvas(e.clientX, e.clientY);
    const x = coords.x;
    const y = coords.y;

    state.isDrawing = false;

    if (state.tool === 'pen' || state.tool === 'eraser') {
        saveState();
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
        finalizeLassoSelection();
    } else if (['rect', 'ellipse', 'line'].includes(state.tool)) {
        // Finalize shape
        saveState();
        state.tempCanvas = null;
        // Redraw selection marquee after shape
        if (state.selection) drawSelectionMarquee();
    }
}

function handlePointerOut(e) {
    if (state.isDrawing) {
        handlePointerUp(e);
    }
}

// Drawing Functions - Pen
function drawPenStart(x, y) {
    const layer = getActiveLayer();
    layer.ctx.lineCap = 'round';
    layer.ctx.lineJoin = 'round';
    layer.ctx.strokeStyle = state.color;
    layer.ctx.lineWidth = state.brushSize;
    layer.ctx.beginPath();
    layer.ctx.moveTo(x, y);
}

function drawPen(x, y) {
    const layer = getActiveLayer();
    layer.ctx.lineTo(x, y);
    layer.ctx.stroke();
    compositeAllLayers(); // Update display
    updateActiveLayerThumbnailThrottled(); // Real-time thumbnail update
    state.lastX = x;
    state.lastY = y;
}

// Drawing Functions - Eraser
function drawEraserStart(x, y) {
    const layer = getActiveLayer();
    layer.ctx.globalCompositeOperation = 'destination-out';
    layer.ctx.lineCap = 'round';
    layer.ctx.lineJoin = 'round';
    layer.ctx.lineWidth = state.brushSize;
    layer.ctx.beginPath();
    layer.ctx.moveTo(x, y);
}

function drawEraser(x, y) {
    const layer = getActiveLayer();
    layer.ctx.lineTo(x, y);
    layer.ctx.stroke();
    compositeAllLayers(); // Update display
    updateActiveLayerThumbnailThrottled(); // Real-time thumbnail update
    state.lastX = x;
    state.lastY = y;
}

// Shape Preview Functions
function previewRect(x, y) {
    const layer = getActiveLayer();
    // Restore active layer to clean state
    layer.ctx.putImageData(state.tempCanvas, 0, 0);
    layer.ctx.globalCompositeOperation = 'source-over';
    layer.ctx.strokeStyle = state.color;
    layer.ctx.lineWidth = state.brushSize;
    layer.ctx.strokeRect(state.startX, state.startY, x - state.startX, y - state.startY);
    compositeAllLayers(); // Update display
    updateActiveLayerThumbnailThrottled(); // Real-time thumbnail update
}

function previewEllipse(x, y) {
    const layer = getActiveLayer();
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
    compositeAllLayers(); // Update display
    updateActiveLayerThumbnailThrottled(); // Real-time thumbnail update
}

function previewLine(x, y) {
    const layer = getActiveLayer();
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
    compositeAllLayers(); // Update display
    updateActiveLayerThumbnailThrottled(); // Real-time thumbnail update
}

// Selection Tool
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

// Lasso Tool
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

// Draw selection marquee (for both rect and lasso)
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

// Point in polygon test (ray casting algorithm)
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

function copySelection() {
    if (!state.selection) return;

    const { x, y, width, height, lassoPath } = state.selection;
    const layer = getActiveLayer();

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
    const layer = getActiveLayer();

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
    compositeAllLayers(); // Update display
    saveState();
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
    const centerCanvas = screenToCanvas(centerScreenX, centerScreenY);

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
    const layer = getActiveLayer();
    layer.ctx.putImageData(state.pasteImage, state.pasteX, state.pasteY);

    state.pasteMode = false;
    state.pasteImage = null;
    state.tempCanvas = null;

    compositeAllLayers(); // Update display
    saveState();
}

// Color Picker
function pickColor(x, y) {
    const imageData = ctx.getImageData(x, y, 1, 1);
    const [r, g, b] = imageData.data;
    const hex = '#' + [r, g, b].map(val => val.toString(16).padStart(2, '0')).join('');
    state.color = hex;
    document.getElementById('color-picker').value = hex;
    updateColorDisplay();
}

// Flood Fill (Bucket Tool) - Optimized scanline algorithm
function floodFill(startX, startY) {
    const layer = getActiveLayer();
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
    compositeAllLayers(); // Update display
}

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

// History Management
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

function undo() {
    if (state.historyStep > 0) {
        state.historyStep--;
        restoreHistorySnapshot(state.history[state.historyStep]);
        state.selection = null; // Clear selection on undo
        updateUndoRedoButtons();
    }
}

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
        const layer = createLayerFromData(layerData);
        state.layers.push(layer);
    }

    state.activeLayerIndex = snapshot.activeLayerIndex;

    // Composite and display
    compositeAllLayers();
}

/**
 * Create a layer object from saved data
 * @param {Object} data - Layer data from snapshot
 * @returns {Object} Layer object
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
        opacity: data.opacity
    };
}

function updateUndoRedoButtons() {
    document.getElementById('btn-undo').disabled = state.historyStep <= 0;
    document.getElementById('btn-redo').disabled = state.historyStep >= state.history.length - 1;
}

// Clear Canvas
function clearCanvas() {
    if (confirm('Clear canvas and start fresh?')) {
        // Clear all layers and create a single white background layer
        state.layers = [];
        const backgroundLayer = createEmptyLayer('Background');
        backgroundLayer.ctx.fillStyle = 'white';
        backgroundLayer.ctx.fillRect(0, 0, canvas.width, canvas.height);
        state.layers.push(backgroundLayer);
        state.activeLayerIndex = 0;
        state.selection = null; // Clear selection
        compositeAllLayers();
        saveState();
    }
}

// Save Image
async function saveImage() {
    await withLoading(async () => {
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `paint-${Date.now()}.png`;
                a.click();
                URL.revokeObjectURL(url);
                resolve();
            });
        });
    }, 'Saving image...');
}

// Resize Canvas
async function resizeCanvas() {
    const newWidth = parseInt(document.getElementById('canvas-width').value);
    const newHeight = parseInt(document.getElementById('canvas-height').value);
    const resizeMode = document.querySelector('input[name="resize-mode"]:checked').value;

    // Validate dimensions
    if (!newWidth || !newHeight || newWidth < 100 || newHeight < 100 ||
        newWidth > 2000 || newHeight > 2000) {
        alert('Please enter valid dimensions (100-2000).');
        return;
    }

    // Confirm resize
    if (!confirm(`Resize canvas to ${newWidth}x${newHeight} (${resizeMode} mode)?`)) {
        return;
    }

    await withLoading(async () => {
        const oldWidth = canvas.width;
        const oldHeight = canvas.height;

        // Resize each layer
        for (const layer of state.layers) {
            if (resizeMode === 'scale') {
                // Scale mode: save old content and scale to new size
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = oldWidth;
                tempCanvas.height = oldHeight;
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.drawImage(layer.canvas, 0, 0);

                // Resize layer canvas
                layer.canvas.width = newWidth;
                layer.canvas.height = newHeight;

                // Draw scaled content
                layer.ctx.drawImage(tempCanvas, 0, 0, oldWidth, oldHeight, 0, 0, newWidth, newHeight);
            } else {
                // Crop mode: save old content at original size
                const imageData = layer.ctx.getImageData(0, 0, oldWidth, oldHeight);

                // Resize layer canvas
                layer.canvas.width = newWidth;
                layer.canvas.height = newHeight;

                // Put original content (will be cropped if new size is smaller)
                layer.ctx.putImageData(imageData, 0, 0);
            }
        }

        // Resize display canvas
        canvas.width = newWidth;
        canvas.height = newHeight;

        // Resize composite canvas
        state.compositeCanvas.width = newWidth;
        state.compositeCanvas.height = newHeight;

        // Update dimension inputs
        document.getElementById('canvas-width').value = newWidth;
        document.getElementById('canvas-height').value = newHeight;

        // Clear selection after resize
        state.selection = null;

        // Reset zoom/pan after resize for clarity
        resetZoom();

        // Composite all layers to display
        compositeAllLayers();

        // Save state for undo
        saveState();
    }, 'Resizing canvas...');
}

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

    const newLayer = createEmptyLayer(`Layer ${state.layers.length + 1}`);
    state.layers.push(newLayer);
    state.activeLayerIndex = state.layers.length - 1;

    compositeAllLayers();
    updateLayerUI();
    saveState();
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

    compositeAllLayers();
    updateLayerUI();
    saveState();
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

    compositeAllLayers();
    updateLayerUI();
    saveState();
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

    compositeAllLayers();
    updateLayerUI();
    saveState();
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

    compositeAllLayers();
    updateLayerUI();
    saveState();
}

/**
 * Flatten all layers into one
 */
function flattenAllLayers() {
    if (!confirm('Flatten all layers into one? This cannot be undone.')) {
        return;
    }

    // Create new single layer with composited result
    const flatLayer = createEmptyLayer('Flattened');

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

    compositeAllLayers();
    updateLayerUI();
    saveState();
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

    compositeAllLayers();
    updateLayerUI();
    saveState();
}

/**
 * Toggle layer visibility
 */
function toggleLayerVisibility(index) {
    state.layers[index].visible = !state.layers[index].visible;
    compositeAllLayers();
    updateLayerUI();
    // Note: Not saving state for visibility changes (UI state, not content)
}

/**
 * Set layer opacity
 */
function setLayerOpacity(index, opacity) {
    state.layers[index].opacity = opacity / 100; // Convert percentage to 0-1
    compositeAllLayers();
    updateLayerUI();
    // Note: Save state on slider release, not during drag (see event handler)
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
    const activeLayer = getActiveLayer();
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
        saveState(); // Save state on slider release
    };

    const opacityValue = document.createElement('span');
    opacityValue.className = 'layer-opacity-value';
    opacityValue.textContent = `${Math.round(layer.opacity * 100)}%`;

    controlsRow.appendChild(visibilityBtn);
    controlsRow.appendChild(opacitySlider);
    controlsRow.appendChild(opacityValue);

    infoDiv.appendChild(nameDiv);
    infoDiv.appendChild(controlsRow);

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
            undo();
        } else if (e.key === 'y') {
            e.preventDefault();
            redo();
        } else if (e.key === 'c') {
            e.preventDefault();
            copySelection();
        } else if (e.key === 'x') {
            e.preventDefault();
            cutSelection();
        } else if (e.key === 'v') {
            e.preventDefault();
            pasteFromClipboard();
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
    setZoom(newZoom);
}

function zoomOut() {
    const newZoom = state.zoomLevel / CONSTANTS.ZOOM_STEP;
    setZoom(newZoom);
}

function resetZoom() {
    state.zoomLevel = 1.0;
    state.panX = 0;
    state.panY = 0;
    applyCanvasTransform();
    updateZoomDisplay();
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

    applyCanvasTransform();
    updateZoomDisplay();
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
            setZoom(percent / 100);
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
        saveState();

        // Redraw selection marquee after text
        if (state.selection) drawSelectionMarquee();
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
    const layer = getActiveLayer();
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

// Start application
init();
