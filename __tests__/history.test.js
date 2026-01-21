/**
 * Unit tests for history.js
 * Tests undo/redo system and incremental history
 */

require('./setup');

// Mock the global App namespace
global.window = global;

// Load constants first
eval(require('fs').readFileSync('./js/app-constants.js', 'utf8'));

// Load app state
eval(require('fs').readFileSync('./js/app-state.js', 'utf8'));

// Load layer core (dependency of history)
eval(require('fs').readFileSync('./js/layer-core.js', 'utf8'));

// Mock LayerUI (to avoid UI dependencies in tests)
global.App.LayerUI = {
  updateLayerUI: jest.fn()
};

// Load history module
eval(require('fs').readFileSync('./js/history.js', 'utf8'));

describe('History System', () => {
  beforeEach(() => {
    // Reset state before each test
    resetDOM();

    // Manually reset state (avoid calling init() which depends on UI)
    const state = App.State.state;
    state.history = [];
    state.historyStep = -1;
    state.layers = [];
    state.activeLayerIndex = 0;
    state.layerIdCounter = 0;

    // Initialize layer system
    App.Layers.initializeLayerSystem();
  });

  describe('getMaxHistorySize', () => {
    test('should return BASE_MAX_HISTORY_SIZE for 1 layer', () => {
      // State should have 1 layer after init
      expect(App.State.state.layers.length).toBe(1);

      const maxSize = App.History.getMaxHistorySize();
      const base = App.Constants.CONSTANTS.BASE_MAX_HISTORY_SIZE;

      // Should be very close to base (allow for rounding)
      expect(maxSize).toBeGreaterThanOrEqual(base - 1);
      expect(maxSize).toBeLessThanOrEqual(base);
    });

    test('should return MIN_MAX_HISTORY_SIZE for MAX_LAYERS', () => {
      // Add layers to reach max
      const maxLayers = App.Constants.CONSTANTS.MAX_LAYERS;
      const currentLayers = App.State.state.layers.length;

      for (let i = currentLayers; i < maxLayers; i++) {
        const layer = createMockLayer(`Layer ${i}`);
        App.State.state.layers.push(layer);
      }

      const maxSize = App.History.getMaxHistorySize();
      expect(maxSize).toBe(App.Constants.CONSTANTS.MIN_MAX_HISTORY_SIZE);
    });

    test('should interpolate history size for intermediate layer counts', () => {
      // Add 25 layers (half of MAX_LAYERS = 50)
      const targetLayers = 25;
      const currentLayers = App.State.state.layers.length;

      for (let i = currentLayers; i < targetLayers; i++) {
        const layer = createMockLayer(`Layer ${i}`);
        App.State.state.layers.push(layer);
      }

      const maxSize = App.History.getMaxHistorySize();
      const base = App.Constants.CONSTANTS.BASE_MAX_HISTORY_SIZE;
      const min = App.Constants.CONSTANTS.MIN_MAX_HISTORY_SIZE;

      // Should be between min and base
      expect(maxSize).toBeGreaterThanOrEqual(min);
      expect(maxSize).toBeLessThanOrEqual(base);

      // Should be approximately in the middle
      const expected = Math.floor((base + min) / 2);
      expect(Math.abs(maxSize - expected)).toBeLessThanOrEqual(1);
    });
  });

  describe('saveState', () => {
    test('should save initial full snapshot', () => {
      App.History.saveState();

      expect(App.State.state.history.length).toBe(1);
      expect(App.State.state.historyStep).toBe(0);
      expect(App.State.state.history[0].type).toBe('full');
    });

    test('should save incremental snapshot on subsequent saves', () => {
      // Save initial state
      App.History.saveState();

      // Save second state (should be incremental)
      App.History.saveState();

      expect(App.State.state.history.length).toBe(2);
      expect(App.State.state.history[1].type).toBe('incremental');
      expect(App.State.state.history[1]).toHaveProperty('changedLayerIndex');
      expect(App.State.state.history[1]).toHaveProperty('changedLayer');
    });

    test('should save full snapshot when forced', () => {
      // Save initial state
      App.History.saveState();

      // Force full snapshot
      App.History.saveState(true);

      expect(App.State.state.history.length).toBe(2);
      expect(App.State.state.history[1].type).toBe('full');
      expect(App.State.state.history[1]).toHaveProperty('layers');
    });

    test('should save full snapshot every 5 steps', () => {
      // Save initial state (full)
      App.History.saveState();

      // Save 4 more states (should be incremental)
      for (let i = 0; i < 4; i++) {
        App.History.saveState();
      }

      // 5th save should be full
      App.History.saveState();

      expect(App.State.state.history.length).toBe(6);
      expect(App.State.state.history[0].type).toBe('full');
      expect(App.State.state.history[5].type).toBe('full');

      // Snapshots 1-4 should be incremental
      for (let i = 1; i <= 4; i++) {
        expect(App.State.state.history[i].type).toBe('incremental');
      }
    });

    test('should respect dynamic history size limit', () => {
      const maxSize = App.History.getMaxHistorySize();

      // Save more states than max
      for (let i = 0; i < maxSize + 5; i++) {
        App.History.saveState();
      }

      expect(App.State.state.history.length).toBe(maxSize);
    });
  });

  describe('undo and redo', () => {
    test('should not undo when at initial state', () => {
      App.History.saveState();

      const initialStep = App.State.state.historyStep;
      App.History.undo();

      expect(App.State.state.historyStep).toBe(initialStep);
    });

    test('should undo to previous state', () => {
      // Save initial state
      App.History.saveState();

      // Modify and save
      const layer = App.Layers.getActiveLayer();
      layer.ctx.fillStyle = 'red';
      layer.ctx.fillRect(0, 0, 100, 100);
      App.History.saveState();

      expect(App.State.state.historyStep).toBe(1);

      // Undo
      App.History.undo();
      expect(App.State.state.historyStep).toBe(0);
    });

    test('should redo after undo', () => {
      // Save states
      App.History.saveState();
      App.History.saveState();

      // Undo
      App.History.undo();
      expect(App.State.state.historyStep).toBe(0);

      // Redo
      App.History.redo();
      expect(App.State.state.historyStep).toBe(1);
    });

    test('should clear redo history on new save', () => {
      // Save states
      App.History.saveState();
      App.History.saveState();
      App.History.saveState();

      // Undo twice
      App.History.undo();
      App.History.undo();
      expect(App.State.state.historyStep).toBe(0);
      expect(App.State.state.history.length).toBe(3);

      // Save new state (should clear redo)
      App.History.saveState();
      expect(App.State.state.history.length).toBe(2);
    });
  });

  describe('updateUndoRedoButtons', () => {
    test('should disable undo button at initial state', () => {
      App.History.saveState();
      App.History.updateUndoRedoButtons();

      const undoBtn = document.getElementById('btn-undo');
      expect(undoBtn.disabled).toBe(true);
    });

    test('should enable undo button after save', () => {
      App.History.saveState();
      App.History.saveState();
      App.History.updateUndoRedoButtons();

      const undoBtn = document.getElementById('btn-undo');
      expect(undoBtn.disabled).toBe(false);
    });

    test('should disable redo button when no redo available', () => {
      App.History.saveState();
      App.History.updateUndoRedoButtons();

      const redoBtn = document.getElementById('btn-redo');
      expect(redoBtn.disabled).toBe(true);
    });

    test('should enable redo button after undo', () => {
      App.History.saveState();
      App.History.saveState();
      App.History.undo();
      App.History.updateUndoRedoButtons();

      const redoBtn = document.getElementById('btn-redo');
      expect(redoBtn.disabled).toBe(false);
    });
  });
});
