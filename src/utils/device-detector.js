/**
 * Device Detector Utility
 * 
 * This utility provides tools for detecting device capabilities and making
 * adjustments for different platforms and screen sizes.
 */

export class DeviceDetector {
  /**
   * Create a new DeviceDetector instance
   * 
   * @param {Phaser.Game} game - The Phaser game instance
   */
  constructor(game) {
    this.game = game;
    this.device = game.device;
    this.scale = game.scale;
  }
  
  /**
   * Check if the game is running on a mobile device
   * 
   * @returns {boolean} True if running on a mobile device
   */
  isMobile() {
    return this.device.os.android || 
           this.device.os.iOS || 
           this.device.os.windowsPhone;
  }
  
  /**
   * Check if the game is running on Android
   * 
   * @returns {boolean} True if running on Android
   */
  isAndroid() {
    return this.device.os.android;
  }
  
  /**
   * Check if the game is running on iOS
   * 
   * @returns {boolean} True if running on iOS
   */
  isIOS() {
    return this.device.os.iOS;
  }
  
  /**
   * Get the device pixel ratio (for high-DPI screens)
   * 
   * @returns {number} The device pixel ratio
   */
  getPixelRatio() {
    return window.devicePixelRatio || 1;
  }
  
  /**
   * Get the current screen orientation
   * 
   * @returns {string} 'portrait' or 'landscape'
   */
  getOrientation() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    return width >= height ? 'landscape' : 'portrait';
  }
  
  /**
   * Get information about the current device
   * 
   * @returns {Object} Device information
   */
  getDeviceInfo() {
    return {
      os: this.device.os,
      browser: this.device.browser,
      pixelRatio: this.getPixelRatio(),
      orientation: this.getOrientation(),
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      gameWidth: this.game.config.width,
      gameHeight: this.game.config.height,
      isMobile: this.isMobile(),
      isAndroid: this.isAndroid(),
      isIOS: this.isIOS(),
      webGL: this.device.features.webGL
    };
  }
  
  /**
   * Log device information to the console
   */
  logDeviceInfo() {
    console.log('Device Information:', this.getDeviceInfo());
  }
}
