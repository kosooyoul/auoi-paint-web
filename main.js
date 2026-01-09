// Canvas State
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

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
    lassoPath: []
};

// Initialize
function init() {
    // Fill canvas with white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Save initial state
    saveState();

    // Setup event listeners
    setupEventListeners();

    // Update UI
    updateColorDisplay();
    updateUndoRedoButtons();
}

// Setup Event Listeners
function setupEventListeners() {
    // Canvas events
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointerout', handlePointerOut);

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
function handlePointerDown(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Handle paste mode
    if (state.pasteMode) {
        commitPaste();
        return;
    }

    // Handle text tool
    if (state.tool === 'text') {
        showTextInput(x, y, rect);
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
        floodFill(Math.floor(x), Math.floor(y));
        saveState();
        // Redraw selection marquee after fill
        if (state.selection) drawSelectionMarquee();
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
        // Save canvas state for preview
        state.tempCanvas = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
}

function handlePointerMove(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

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
    if (!state.isDrawing) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

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
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = state.color;
    ctx.lineWidth = state.brushSize;
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function drawPen(x, y) {
    ctx.lineTo(x, y);
    ctx.stroke();
    state.lastX = x;
    state.lastY = y;
}

// Drawing Functions - Eraser
function drawEraserStart(x, y) {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = state.brushSize;
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function drawEraser(x, y) {
    ctx.lineTo(x, y);
    ctx.stroke();
    state.lastX = x;
    state.lastY = y;
}

// Shape Preview Functions
function previewRect(x, y) {
    ctx.putImageData(state.tempCanvas, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = state.color;
    ctx.lineWidth = state.brushSize;
    ctx.strokeRect(state.startX, state.startY, x - state.startX, y - state.startY);
}

function previewEllipse(x, y) {
    ctx.putImageData(state.tempCanvas, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = state.color;
    ctx.lineWidth = state.brushSize;

    const radiusX = Math.abs(x - state.startX) / 2;
    const radiusY = Math.abs(y - state.startY) / 2;
    const centerX = state.startX + (x - state.startX) / 2;
    const centerY = state.startY + (y - state.startY) / 2;

    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
    ctx.stroke();
}

function previewLine(x, y) {
    ctx.putImageData(state.tempCanvas, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = state.color;
    ctx.lineWidth = state.brushSize;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(state.startX, state.startY);
    ctx.lineTo(x, y);
    ctx.stroke();
}

// Selection Tool
function previewSelection(x, y) {
    ctx.putImageData(state.tempCanvas, 0, 0);
    ctx.globalCompositeOperation = 'source-over';

    // Draw selection marquee
    const width = x - state.startX;
    const height = y - state.startY;

    ctx.setLineDash([5, 5]);
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

    if (distance > 3) {
        state.lassoPath.push({x, y});
    }

    // Redraw canvas and path
    ctx.putImageData(state.tempCanvas, 0, 0);
    ctx.globalCompositeOperation = 'source-over';

    // Draw lasso path
    if (state.lassoPath.length > 1) {
        ctx.beginPath();
        ctx.moveTo(state.lassoPath[0].x, state.lassoPath[0].y);
        for (let i = 1; i < state.lassoPath.length; i++) {
            ctx.lineTo(state.lassoPath[i].x, state.lassoPath[i].y);
        }
        ctx.setLineDash([5, 5]);
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

    // Close the path
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

    if (state.selection.lassoPathAbsolute) {
        // Draw lasso marquee
        const path = state.selection.lassoPathAbsolute;
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].x, path[i].y);
        }
        ctx.closePath();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
    } else {
        // Draw rectangle marquee
        const { x, y, width, height } = state.selection;
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
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

    if (lassoPath) {
        // Lasso selection: copy only pixels inside the polygon
        const imageData = ctx.getImageData(x, y, width, height);
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
        // Rectangle selection: copy entire area
        state.clipboard = ctx.getImageData(x, y, width, height);
    }
}

function cutSelection() {
    if (!state.selection) return;

    copySelection();

    const { x, y, width, height, lassoPath } = state.selection;

    if (lassoPath) {
        // Lasso selection: erase only pixels inside the polygon
        const imageData = ctx.getImageData(x, y, width, height);
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

        ctx.putImageData(imageData, x, y);
    } else {
        // Rectangle selection: erase entire area
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillRect(x, y, width, height);
        ctx.globalCompositeOperation = 'source-over';
    }

    state.selection = null;
    saveState();
}

function pasteFromClipboard() {
    if (!state.clipboard) return;

    state.pasteMode = true;
    state.pasteImage = state.clipboard;
    state.pasteX = 50;
    state.pasteY = 50;

    // Save current canvas for redrawing
    state.tempCanvas = ctx.getImageData(0, 0, canvas.width, canvas.height);

    redrawWithPaste();
}

function redrawWithPaste() {
    if (!state.pasteMode || !state.pasteImage) return;

    ctx.putImageData(state.tempCanvas, 0, 0);
    ctx.putImageData(state.pasteImage, state.pasteX, state.pasteY);

    // Draw outline
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(state.pasteX, state.pasteY, state.pasteImage.width, state.pasteImage.height);
    ctx.setLineDash([]);
}

function commitPaste() {
    if (!state.pasteMode) return;

    state.pasteMode = false;
    state.pasteImage = null;
    state.tempCanvas = null;
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

// Flood Fill (Bucket Tool)
function floodFill(startX, startY) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const targetColor = getPixelColor(pixels, startX, startY);
    const fillColor = hexToRgb(state.color);
    const tolerance = state.fillTolerance;

    if (colorsMatch(targetColor, fillColor, tolerance)) return;

    const stack = [[startX, startY]];
    const visited = new Set();

    while (stack.length > 0) {
        const [x, y] = stack.pop();
        const key = `${x},${y}`;

        if (visited.has(key)) continue;
        if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue;

        const currentColor = getPixelColor(pixels, x, y);
        if (!colorsMatch(currentColor, targetColor, tolerance)) continue;

        visited.add(key);
        setPixelColor(pixels, x, y, fillColor);

        stack.push([x + 1, y]);
        stack.push([x - 1, y]);
        stack.push([x, y + 1]);
        stack.push([x, y - 1]);
    }

    ctx.putImageData(imageData, 0, 0);
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

    // Save current state
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    state.history.push(imageData);
    state.historyStep++;

    // Limit history size
    if (state.history.length > 50) {
        state.history.shift();
        state.historyStep--;
    }

    updateUndoRedoButtons();
}

function undo() {
    if (state.historyStep > 0) {
        state.historyStep--;
        ctx.putImageData(state.history[state.historyStep], 0, 0);
        state.selection = null; // Clear selection on undo
        updateUndoRedoButtons();
    }
}

function redo() {
    if (state.historyStep < state.history.length - 1) {
        state.historyStep++;
        ctx.putImageData(state.history[state.historyStep], 0, 0);
        state.selection = null; // Clear selection on redo
        updateUndoRedoButtons();
    }
}

function updateUndoRedoButtons() {
    document.getElementById('btn-undo').disabled = state.historyStep <= 0;
    document.getElementById('btn-redo').disabled = state.historyStep >= state.history.length - 1;
}

// Clear Canvas
function clearCanvas() {
    if (confirm('Clear canvas? This cannot be undone.')) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        state.selection = null; // Clear selection
        saveState();
    }
}

// Save Image
function saveImage() {
    canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `paint-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
    });
}

// Resize Canvas
function resizeCanvas() {
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

    // Save current canvas content
    const oldWidth = canvas.width;
    const oldHeight = canvas.height;

    if (resizeMode === 'scale') {
        // Scale mode: resize content proportionally
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = oldWidth;
        tempCanvas.height = oldHeight;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(canvas, 0, 0);

        // Resize canvas
        canvas.width = newWidth;
        canvas.height = newHeight;

        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, newWidth, newHeight);

        // Draw scaled content
        ctx.drawImage(tempCanvas, 0, 0, oldWidth, oldHeight, 0, 0, newWidth, newHeight);
    } else {
        // Crop mode: keep content at original size, crop or expand
        const imageData = ctx.getImageData(0, 0, oldWidth, oldHeight);

        // Resize canvas
        canvas.width = newWidth;
        canvas.height = newHeight;

        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, newWidth, newHeight);

        // Put original content (will be cropped if new size is smaller)
        ctx.putImageData(imageData, 0, 0);
    }

    // Update dimension inputs
    document.getElementById('canvas-width').value = newWidth;
    document.getElementById('canvas-height').value = newHeight;

    // Clear selection after resize
    state.selection = null;

    // Save state for undo
    saveState();
}

// Keyboard Shortcuts
function handleKeyboard(e) {
    if (e.ctrlKey || e.metaKey) {
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
function showTextInput(canvasX, canvasY, canvasRect) {
    const textInput = document.getElementById('text-input');

    // Store text position (canvas coordinates)
    state.textX = canvasX;
    state.textY = canvasY;
    state.textMode = true;

    // Position the input overlay (absolute coordinates)
    const left = canvasRect.left + canvasX;
    const top = canvasRect.top + canvasY;

    textInput.style.left = `${left}px`;
    textInput.style.top = `${top}px`;
    textInput.style.fontFamily = state.fontFamily;
    textInput.style.fontSize = `${state.fontSize}px`;
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

// Reset composite operation on pointer up
canvas.addEventListener('pointerup', () => {
    ctx.globalCompositeOperation = 'source-over';
});

// Start application
init();
