/**
 * file-io.js
 * File operations: open, save, drag-drop, resize, loading indicators
 * Part of: Web Paint (Vanilla JS Bitmap Editor)
 */

(function() {
    'use strict';

    window.App = window.App || {};

    const canvas = App.Constants.canvas;
    const state = App.State.state;

    // ===============================
    // Loading Indicator Utilities
    // ===============================

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

    // ===============================
    // Canvas Operations
    // ===============================

    /**
     * Clear all layers and start fresh
     */
    function clearCanvas() {
        if (confirm('Clear canvas and start fresh?')) {
            // Clear all layers and create a single white background layer
            state.layers = [];
            const backgroundLayer = App.Layers.createEmptyLayer('Background');
            backgroundLayer.ctx.fillStyle = 'white';
            backgroundLayer.ctx.fillRect(0, 0, canvas.width, canvas.height);
            state.layers.push(backgroundLayer);
            state.activeLayerIndex = 0;
            state.selection = null; // Clear selection
            App.Layers.compositeAllLayers();
            App.History.saveState();
        }
    }

    /**
     * Save current canvas as PNG file
     */
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

    // ===============================
    // File Loading
    // ===============================

    /**
     * Open file dialog to load image
     */
    async function openImageFile() {
        const fileInput = document.getElementById('file-input');
        fileInput.click();
    }

    /**
     * Load image from File object (used by both file input and drag-and-drop)
     */
    async function loadImageFromFile(file, clearInput = null) {
        // Validate file type
        if (!file.type.match('image.*')) {
            alert('Please select a valid image file (PNG, JPG, or WebP).');
            return;
        }

        const reader = new FileReader();

        reader.onload = async (event) => {
            await withLoading(async () => {
                return new Promise((resolve, reject) => {
                    const img = new Image();

                    img.onload = () => {
                        const activeLayer = App.Layers.getActiveLayer();
                        if (!activeLayer) {
                            alert('No active layer found.');
                            reject();
                            return;
                        }

                        // Check if image is larger than canvas
                        const imgWidth = img.width;
                        const imgHeight = img.height;
                        const canvasWidth = canvas.width;
                        const canvasHeight = canvas.height;

                        let drawWidth = imgWidth;
                        let drawHeight = imgHeight;
                        let drawX = 0;
                        let drawY = 0;

                        // If image is larger than canvas, ask user what to do
                        if (imgWidth > canvasWidth || imgHeight > canvasHeight) {
                            const scaleToFit = confirm(
                                `Image (${imgWidth}×${imgHeight}) is larger than canvas (${canvasWidth}×${canvasHeight}).\n\n` +
                                `Click OK to scale to fit, or Cancel to place at original size (will be cropped).`
                            );

                            if (scaleToFit) {
                                // Calculate scale to fit while maintaining aspect ratio
                                const scaleX = canvasWidth / imgWidth;
                                const scaleY = canvasHeight / imgHeight;
                                const scale = Math.min(scaleX, scaleY);

                                drawWidth = imgWidth * scale;
                                drawHeight = imgHeight * scale;

                                // Center the image
                                drawX = (canvasWidth - drawWidth) / 2;
                                drawY = (canvasHeight - drawHeight) / 2;
                            }
                            // else: keep original size, will be cropped by canvas bounds
                        } else {
                            // Center smaller images
                            drawX = (canvasWidth - imgWidth) / 2;
                            drawY = (canvasHeight - imgHeight) / 2;
                        }

                        // Draw image to active layer
                        activeLayer.ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

                        // Update composite and UI
                        App.Layers.compositeAllLayers();
                        App.LayerUI.updateActiveLayerThumbnail();
                        App.History.saveState();

                        // Clear the file input if provided
                        if (clearInput) {
                            clearInput.value = '';
                        }

                        resolve();
                    };

                    img.onerror = () => {
                        alert('Failed to load image. Please try a different file.');
                        reject();
                    };

                    img.src = event.target.result;
                });
            }, 'Loading image...');
        };

        reader.onerror = () => {
            alert('Failed to read file. Please try again.');
        };

        reader.readAsDataURL(file);
    }

    /**
     * Handle file input change event
     */
    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;
        loadImageFromFile(file, e.target);
    }

    // ===============================
    // Drag and Drop Handlers
    // ===============================

    function handleDragEnter(e) {
        e.preventDefault();
        e.stopPropagation();
        const container = document.querySelector('.canvas-container');
        container.classList.add('drag-over');
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        // Only remove highlight if leaving the container itself, not child elements
        if (e.target.classList.contains('canvas-container')) {
            const container = document.querySelector('.canvas-container');
            container.classList.remove('drag-over');
        }
    }

    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();

        const container = document.querySelector('.canvas-container');
        container.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length === 0) return;

        // Only process the first file
        const file = files[0];
        loadImageFromFile(file);
    }

    // ===============================
    // Canvas Resize
    // ===============================

    /**
     * Resize canvas with scale or crop mode
     */
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
            App.UI.resetZoom();

            // Composite all layers to display
            App.Layers.compositeAllLayers();

            // Save state for undo
            App.History.saveState();
        }, 'Resizing canvas...');
    }

    // Export to global namespace
    window.App.FileIO = {
        showLoading,
        hideLoading,
        withLoading,
        clearCanvas,
        saveImage,
        openImageFile,
        loadImageFromFile,
        handleFileSelect,
        handleDragEnter,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        resizeCanvas
    };
})();
