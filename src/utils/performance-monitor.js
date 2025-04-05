/**
 * Performance Monitor Utility
 * 
 * This utility provides tools for monitoring and optimizing game performance.
 * It tracks frame rate, memory usage, and provides methods for performance optimization.
 */

export class PerformanceMonitor {
  /**
   * Create a new PerformanceMonitor instance
   * 
   * @param {Phaser.Scene} scene - The scene to monitor
   * @param {Object} options - Configuration options
   * @param {boolean} options.showFPS - Whether to show the FPS counter (default: false)
   * @param {number} options.updateInterval - How often to update the display in ms (default: 500)
   */
  constructor(scene, options = {}) {
    this.scene = scene;
    this.options = Object.assign({
      showFPS: false,
      updateInterval: 500
    }, options);
    
    this.frameCount = 0;
    this.fps = 0;
    this.lastTime = 0;
    this.fpsText = null;
    
    // Initialize the monitor
    this.init();
  }
  
  /**
   * Initialize the performance monitor
   */
  init() {
    // Create FPS text display if enabled
    if (this.options.showFPS) {
      this.fpsText = this.scene.add.text(10, 10, 'FPS: 0', {
        font: '16px Arial',
        fill: '#00ff00'
      });
      this.fpsText.setDepth(999); // Ensure it's on top of other elements
      this.fpsText.setScrollFactor(0); // Fix to camera
    }
    
    // Set up update interval
    this.lastTime = performance.now();
    this.scene.time.addEvent({
      delay: this.options.updateInterval,
      callback: this.updateMetrics,
      callbackScope: this,
      loop: true
    });
  }
  
  /**
   * Update performance metrics
   */
  updateMetrics() {
    const currentTime = performance.now();
    const elapsed = currentTime - this.lastTime;
    
    // Calculate FPS
    this.fps = Math.round((this.frameCount / elapsed) * 1000);
    
    // Update display if enabled
    if (this.options.showFPS && this.fpsText) {
      this.fpsText.setText(`FPS: ${this.fps}`);
    }
    
    // Reset counters
    this.frameCount = 0;
    this.lastTime = currentTime;
  }
  
  /**
   * Call this method in the scene's update function to count frames
   */
  update() {
    this.frameCount++;
  }
  
  /**
   * Get the current FPS
   * 
   * @returns {number} The current frames per second
   */
  getFPS() {
    return this.fps;
  }
  
  /**
   * Toggle the visibility of the FPS display
   */
  toggleFPSDisplay() {
    if (this.fpsText) {
      this.fpsText.visible = !this.fpsText.visible;
    }
  }
  
  /**
   * Clean up resources when no longer needed
   */
  destroy() {
    if (this.fpsText) {
      this.fpsText.destroy();
    }
  }
}
