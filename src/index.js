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
      width: 1920,
      height: 1080
    }
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
  }

  // Add the game to the window for debugging
  window.game = game;
});
