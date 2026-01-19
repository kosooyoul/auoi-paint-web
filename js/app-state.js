/**
 * app-state.js
 * Application state management and initialization
 * Part of: Web Paint (Vanilla JS Bitmap Editor)
 */

(function() {
    'use strict';

    window.App = window.App || {};

    // Application State
    const state = {
        tool: 'pen',
        color: '#000000',
        secondaryColor: '#ffffff',
        colorHistory: [],
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

    // Initialize application
    function init() {
        // Initialize layer system (creates background layer with white fill)
        App.Layers.initializeLayerSystem();

        // Composite layers to display canvas
        App.Layers.compositeAllLayers();

        // Save initial state
        App.History.saveState();

        // Setup event listeners
        App.UI.setupEventListeners();

        // Update UI
        App.UI.updateColorDisplay();
        App.History.updateUndoRedoButtons();
        App.LayerUI.updateLayerUI();

        // Setup floating toolbox
        App.UI.setupFloatingToolbox();

        // Restore toolbox position from localStorage
        App.UI.restoreToolboxPosition();

        // Load theme from localStorage
        App.UI.loadTheme();
    }

    // Export to global namespace
    window.App.State = {
        state,
        init
    };
})();
