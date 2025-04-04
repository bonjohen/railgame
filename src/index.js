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

/**
 * Game configuration object
 * Contains all settings for the Phaser game instance
 *
 * @constant {Object} config
 */
const config = {
  // Renderer type: AUTO will use WebGL if available, otherwise Canvas
  type: Phaser.AUTO,
  // DOM element ID where the game canvas will be inserted
  parent: 'game-container',
  // Game canvas width in pixels
  width: 800,
  // Game canvas height in pixels
  height: 600,
  // Scaling configuration for responsive design
  scale: {
    // FIT mode will scale the canvas to fit the parent container while maintaining aspect ratio
    mode: Phaser.Scale.FIT,
    // CENTER_BOTH will center the canvas both horizontally and vertically
    autoCenter: Phaser.Scale.CENTER_BOTH
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
});
