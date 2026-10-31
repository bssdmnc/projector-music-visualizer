/**
 * BaseVisualizer - Abstract template for all visualizers
 */
class BaseVisualizer {
  constructor(canvas) {
    this.canvas = canvas;
    this.name = "Base Visualizer";
    this.palette = window.getPalette("cyberpunk");
    this.width = canvas.width;
    this.height = canvas.height;
  }

  init() {
    // Setup resources, shaders, or particles
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
  }

  setPalette(palette) {
    this.palette = palette;
  }

  render(audio, dt) {
    // Override in subclass
  }

  destroy() {
    // Clean up WebGL or listeners
  }
}

if (typeof window !== 'undefined') {
  window.BaseVisualizer = BaseVisualizer;
}
