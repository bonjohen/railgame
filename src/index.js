/**
 * Main entry point for the Rail Game application
 * This file initializes the Phaser game instance and configures the game settings
 *
 * @file index.js
 * @author Rail Game Team
 * @version 1.0.0
 */

// Import the Phaser library and game scenes
import Phaser from 'phaser';
import { LoadingScene } from './scenes/LoadingScene';
import { MainScene } from './scenes/MainScene';
import { DeviceDetector } from './utils/device-detector';

/**
 * Game configuration object
 * Contains all settings for the Phaser game instance
 *
 * @constant {Object} config
 */
// Determine if we're on a mobile device
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Set up game dimensions based on device
const gameWidth = isMobile ? window.innerWidth : 800;
const gameHeight = isMobile ? window.innerHeight : 600;

// Get device pixel ratio for high-DPI screens
const pixelRatio = window.devicePixelRatio || 1;

// Create game configuration
const config = {
  // Renderer type: AUTO will use WebGL if available, otherwise Canvas
  type: Phaser.AUTO,
  // DOM element ID where the game canvas will be inserted
  parent: 'game-container',
  // Game canvas width in pixels - responsive based on device
  width: gameWidth,
  // Game canvas height in pixels - responsive based on device
  height: gameHeight,
  // Scaling configuration for responsive design
  scale: {
    // FIT mode will scale the canvas to fit the parent container while maintaining aspect ratio
    mode: Phaser.Scale.FIT,
    // CENTER_BOTH will center the canvas both horizontally and vertically
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // Make the game responsive to orientation changes
    autoRound: true,
    // Set minimum and maximum dimensions
    min: {
      width: 320,
      height: 480
    },
    max: {
      width: 3088,  // Support for Samsung S23 Ultra max resolution
      height: 3088  // Support for Samsung S23 Ultra max resolution
    },
    // Zoom factor for high-DPI screens
    zoom: 1 / Math.min(pixelRatio, 2)  // Limit zoom to avoid extreme scaling
  },
  // Physics engine configuration
  physics: {
    // Using Arcade Physics (simplest physics system in Phaser)
    default: 'arcade',
    arcade: {
      // No gravity by default (top-down game)
      gravity: { y: 0 },
      // Set to true during development to see physics bodies
      debug: false
    }
  },
  // Disable banner in console
  banner: false,
  // Optimize for mobile if detected
  backgroundColor: '#000000',
  // Disable anti-aliasing on mobile for better performance
  render: {
    pixelArt: true,
    antialias: !isMobile,
    roundPixels: true
  },
  // Array of scenes to include in the game (order matters - first scene will start first)
  scene: [LoadingScene, MainScene]
};

/**
 * Initialize the game when the page is fully loaded
 * This ensures all DOM elements are available before creating the game instance
 */
window.addEventListener('load', () => {
  // Create a new Phaser Game instance with our configuration
  const game = new Phaser.Game(config);

  // Create device detector and log device information
  const deviceDetector = new DeviceDetector(game);
  deviceDetector.logDeviceInfo();

  // Add the device detector to the game for global access
  game.deviceDetector = deviceDetector;

  // Handle orientation changes on mobile
  if (isMobile) {
    window.addEventListener('orientationchange', () => {
      // Give the browser time to adjust
      setTimeout(() => {
        game.scale.refresh();
      }, 200);
    });

    // Apply device-specific optimizations
    applyDeviceSpecificOptimizations(game);
  }

  // Add the game to the window for debugging
  window.game = game;
});

/**
 * Apply device-specific optimizations based on detected device
 *
 * @param {Phaser.Game} game - The Phaser game instance
 */
function applyDeviceSpecificOptimizations(game) {
  // Wait for device detector to be initialized
  setTimeout(() => {
    const deviceDetector = game.deviceDetector;
    if (!deviceDetector) return;

    const deviceInfo = deviceDetector.getDeviceInfo();
    console.log('Applying optimizations for:', deviceInfo.deviceModel);

    // Samsung S23 Ultra specific optimizations
    if (deviceDetector.isSamsungS23Ultra()) {
      // Adjust game resolution if needed
      if (game.scale.isFullscreen) {
        game.scale.setGameSize(
          deviceDetector.deviceConfigs.samsungS23Ultra.width,
          deviceDetector.deviceConfigs.samsungS23Ultra.height
        );
      }

      // Apply touch sensitivity adjustments in the main scene
      const mainScene = game.scene.getScene('MainScene');
      if (mainScene && mainScene.config) {
        // Adjust touch sensitivity
        mainScene.config.touchSensitivity = deviceDetector.getTouchSensitivityAdjustment();
      }
    }

    // High-resolution device optimizations
    if (deviceDetector.isHighResolutionDevice()) {
      // Adjust rendering quality for high-res screens
      game.renderer.setTextureCrisp(true);

      // Adjust UI scaling if needed
      const mainScene = game.scene.getScene('MainScene');
      if (mainScene && mainScene.config) {
        mainScene.config.uiScale = Math.min(deviceInfo.pixelRatio / 2, 1.5);
      }
    }
  }, 500); // Wait for scenes to initialize
}
