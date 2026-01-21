/**
 * Test setup helper
 * Sets up DOM environment for testing
 */

// Create canvas element
document.body.innerHTML = `
  <canvas id="canvas" width="800" height="600"></canvas>
  <input type="text" id="text-input" class="text-input-overlay" />
  <div id="loading-overlay" class="loading-overlay"></div>
  <div id="layer-list"></div>
  <button id="btn-undo"></button>
  <button id="btn-redo"></button>
`;

// Helper to reset DOM state
global.resetDOM = function() {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
};

// Helper to create mock layer
global.createMockLayer = function(name = 'Test Layer') {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');

  return {
    id: `layer-${Date.now()}`,
    name: name,
    canvas: canvas,
    ctx: ctx,
    visible: true,
    opacity: 1.0,
    blendMode: 'normal'
  };
};
