/**
 * app-constants.js
 * Global constants and canvas references for Web Paint
 * Part of: Web Paint (Vanilla JS Bitmap Editor)
 */

(function() {
    'use strict';

    // Initialize global App namespace
    window.App = window.App || {};

    // Canvas references
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

    // Export to global namespace
    window.App.Constants = {
        canvas,
        ctx,
        CONSTANTS
    };
})();
