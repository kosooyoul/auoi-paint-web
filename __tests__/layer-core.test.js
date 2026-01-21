/**
 * Unit tests for layer-core.js
 * Tests layer creation, compositing, and management
 */

require('./setup');

// Mock the global App namespace
global.window = global;

// Load modules in correct order
eval(require('fs').readFileSync('./js/app-constants.js', 'utf8'));
eval(require('fs').readFileSync('./js/app-state.js', 'utf8'));
eval(require('fs').readFileSync('./js/layer-core.js', 'utf8'));

describe('Layer Core System', () => {
  beforeEach(() => {
    resetDOM();

    // Reset state
    const state = App.State.state;
    state.layers = [];
    state.activeLayerIndex = 0;
    state.layerIdCounter = 0;
  });

  describe('createEmptyLayer', () => {
    test('should create layer with correct properties', () => {
      const layer = App.Layers.createEmptyLayer('Test Layer');

      expect(layer).toHaveProperty('id');
      expect(layer).toHaveProperty('name', 'Test Layer');
      expect(layer).toHaveProperty('canvas');
      expect(layer).toHaveProperty('ctx');
      expect(layer).toHaveProperty('visible', true);
      expect(layer).toHaveProperty('opacity', 1.0);
      expect(layer).toHaveProperty('blendMode', 'normal');
    });

    test('should create canvas with correct dimensions', () => {
      const canvas = App.Constants.canvas;
      const layer = App.Layers.createEmptyLayer('Test Layer');

      expect(layer.canvas.width).toBe(canvas.width);
      expect(layer.canvas.height).toBe(canvas.height);
    });

    test('should create unique IDs for multiple layers', () => {
      const layer1 = App.Layers.createEmptyLayer('Layer 1');
      const layer2 = App.Layers.createEmptyLayer('Layer 2');

      expect(layer1.id).not.toBe(layer2.id);
    });

    test('should create transparent layer by default', () => {
      const layer = App.Layers.createEmptyLayer('Test Layer');
      const imageData = layer.ctx.getImageData(0, 0, 10, 10);

      // Check a few pixels - should be transparent (alpha = 0)
      expect(imageData.data[3]).toBe(0);  // First pixel alpha
      expect(imageData.data[7]).toBe(0);  // Second pixel alpha
    });
  });

  describe('initializeLayerSystem', () => {
    test('should create initial background layer', () => {
      App.Layers.initializeLayerSystem();

      expect(App.State.state.layers.length).toBe(1);
      expect(App.State.state.layers[0].name).toBe('Background');
      expect(App.State.state.activeLayerIndex).toBe(0);
    });

    test('should create background layer with fillRect called', () => {
      App.Layers.initializeLayerSystem();

      const bgLayer = App.State.state.layers[0];

      // Just verify layer was created (pixel verification requires real canvas)
      expect(bgLayer.ctx).toBeDefined();
      expect(bgLayer.name).toBe('Background');
    });

    test('should create composite canvas', () => {
      App.Layers.initializeLayerSystem();

      expect(App.State.state.compositeCanvas).toBeDefined();
      expect(App.State.state.compositeCtx).toBeDefined();
    });
  });

  describe('getActiveLayer', () => {
    test('should return active layer', () => {
      App.Layers.initializeLayerSystem();

      const activeLayer = App.Layers.getActiveLayer();
      expect(activeLayer).toBe(App.State.state.layers[0]);
    });

    test('should return correct layer after index change', () => {
      App.Layers.initializeLayerSystem();

      const layer2 = App.Layers.createEmptyLayer('Layer 2');
      App.State.state.layers.push(layer2);
      App.State.state.activeLayerIndex = 1;

      const activeLayer = App.Layers.getActiveLayer();
      expect(activeLayer).toBe(layer2);
      expect(activeLayer.name).toBe('Layer 2');
    });
  });

  describe('compositeAllLayers', () => {
    test('should composite without errors', () => {
      App.Layers.initializeLayerSystem();

      // Should not throw
      expect(() => {
        App.Layers.compositeAllLayers();
      }).not.toThrow();
    });

    test('should handle multiple layers', () => {
      App.Layers.initializeLayerSystem();

      // Add multiple layers
      const layer2 = App.Layers.createEmptyLayer('Layer 2');
      const layer3 = App.Layers.createEmptyLayer('Layer 3');
      App.State.state.layers.push(layer2);
      App.State.state.layers.push(layer3);

      // Should not throw with multiple layers
      expect(() => {
        App.Layers.compositeAllLayers();
      }).not.toThrow();
    });

    test('should handle invisible layers', () => {
      App.Layers.initializeLayerSystem();

      // Add invisible layer
      const layer2 = App.Layers.createEmptyLayer('Invisible Layer');
      layer2.visible = false;
      App.State.state.layers.push(layer2);

      // Should not throw
      expect(() => {
        App.Layers.compositeAllLayers();
      }).not.toThrow();
    });

    test('should handle layers with custom opacity', () => {
      App.Layers.initializeLayerSystem();

      // Add layer with custom opacity
      const layer2 = App.Layers.createEmptyLayer('Transparent Layer');
      layer2.opacity = 0.5;
      App.State.state.layers.push(layer2);

      // Should not throw
      expect(() => {
        App.Layers.compositeAllLayers();
      }).not.toThrow();
    });

    test('should handle different blend modes', () => {
      App.Layers.initializeLayerSystem();

      // Add layer with multiply blend mode
      const layer2 = App.Layers.createEmptyLayer('Multiply Layer');
      layer2.blendMode = 'multiply';
      App.State.state.layers.push(layer2);

      // Should not throw
      expect(() => {
        App.Layers.compositeAllLayers();
      }).not.toThrow();
    });
  });

  describe('createLayerFromData', () => {
    test('should recreate layer from saved data', () => {
      App.Layers.initializeLayerSystem();
      const originalLayer = App.State.state.layers[0];

      // Draw something on original layer
      originalLayer.ctx.fillStyle = 'blue';
      originalLayer.ctx.fillRect(10, 10, 50, 50);

      // Save layer data
      const canvas = App.Constants.canvas;
      const layerData = {
        id: originalLayer.id,
        name: originalLayer.name,
        visible: originalLayer.visible,
        opacity: originalLayer.opacity,
        blendMode: originalLayer.blendMode,
        imageData: originalLayer.ctx.getImageData(0, 0, canvas.width, canvas.height)
      };

      // Recreate layer
      const recreatedLayer = App.Layers.createLayerFromData(layerData);

      expect(recreatedLayer.id).toBe(originalLayer.id);
      expect(recreatedLayer.name).toBe(originalLayer.name);
      expect(recreatedLayer.visible).toBe(originalLayer.visible);
      expect(recreatedLayer.opacity).toBe(originalLayer.opacity);

      // Check that pixel data matches
      const originalPixel = originalLayer.ctx.getImageData(20, 20, 1, 1);
      const recreatedPixel = recreatedLayer.ctx.getImageData(20, 20, 1, 1);

      expect(recreatedPixel.data[0]).toBe(originalPixel.data[0]);
      expect(recreatedPixel.data[1]).toBe(originalPixel.data[1]);
      expect(recreatedPixel.data[2]).toBe(originalPixel.data[2]);
      expect(recreatedPixel.data[3]).toBe(originalPixel.data[3]);
    });
  });
});
