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

    // Device-specific configurations
    this.deviceConfigs = {
      // Samsung S23 Ultra configuration
      samsungS23Ultra: {
        width: 1440,
        height: 3088,
        aspectRatio: 19.3/9,
        pixelRatio: 3.75,
        touchSensitivity: 1.2 // Adjustment factor for touch input
      }
    };
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
      webGL: this.device.features.webGL,
      deviceModel: this.detectDeviceModel(),
      isHighResolution: this.isHighResolutionDevice()
    };
  }

  /**
   * Log device information to the console
   */
  logDeviceInfo() {
    console.log('Device Information:', this.getDeviceInfo());
  }

  /**
   * Detect the specific device model
   *
   * @returns {string} The detected device model or 'unknown'
   */
  detectDeviceModel() {
    const userAgent = navigator.userAgent;

    // Detect Samsung S23 Ultra
    if (userAgent.includes('SM-S918') ||
        (this.isAndroid() &&
         window.innerWidth === this.deviceConfigs.samsungS23Ultra.width &&
         window.innerHeight === this.deviceConfigs.samsungS23Ultra.height)) {
      return 'Samsung S23 Ultra';
    }

    // Add more device detection as needed

    return 'unknown';
  }

  /**
   * Check if the current device is a Samsung S23 Ultra
   *
   * @returns {boolean} True if the device is a Samsung S23 Ultra
   */
  isSamsungS23Ultra() {
    return this.detectDeviceModel() === 'Samsung S23 Ultra';
  }

  /**
   * Check if the device has a high-resolution screen
   *
   * @returns {boolean} True if the device has a high-resolution screen
   */
  isHighResolutionDevice() {
    return this.getPixelRatio() >= 2.5 ||
           window.innerWidth >= 1440 ||
           window.innerHeight >= 2560;
  }

  /**
   * Get the appropriate touch sensitivity adjustment for the current device
   *
   * @returns {number} Touch sensitivity adjustment factor
   */
  getTouchSensitivityAdjustment() {
    if (this.isSamsungS23Ultra()) {
      return this.deviceConfigs.samsungS23Ultra.touchSensitivity;
    }

    // Default adjustment for high-resolution devices
    if (this.isHighResolutionDevice()) {
      return 1.1;
    }

    return 1.0; // No adjustment for standard devices
  }
}
