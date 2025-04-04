/**
 * Loading Scene for Rail Game
 * Handles asset preloading and displays a loading screen with progress bar
 *
 * @file LoadingScene.js
 * @author Rail Game Team
 * @version 1.0.0
 */

import Phaser from 'phaser';

/**
 * LoadingScene class
 * Responsible for preloading all game assets and showing loading progress
 *
 * @class LoadingScene
 * @extends Phaser.Scene
 */
export class LoadingScene extends Phaser.Scene {
  /**
   * Create a new LoadingScene instance
   * Initializes the scene with the key 'LoadingScene'
   */
  constructor() {
    super('LoadingScene');
  }

  /**
   * Preload method - automatically called by Phaser
   * Loads all game assets and displays loading progress
   *
   * @method preload
   */
  preload() {
    // Get the dimensions of the game canvas for positioning UI elements
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Create and position the loading text
    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      font: '20px Arial',
      fill: '#ffffff'
    });
    // Center the text anchor point for proper positioning
    loadingText.setOrigin(0.5, 0.5);

    // Create the progress bar graphics objects
    // progressBar shows the actual loading progress
    const progressBar = this.add.graphics();
    // progressBox is the background container for the progress bar
    const progressBox = this.add.graphics();
    // Style the progress box with a semi-transparent dark background
    progressBox.fillStyle(0x222222, 0.8);
    // Draw the progress box rectangle
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    // Register event handler for the 'progress' event
    // This updates the progress bar as assets are loaded
    this.load.on('progress', (value) => {
      // Clear any previous progress bar drawing
      progressBar.clear();
      // Style the progress bar with white fill
      progressBar.fillStyle(0xffffff, 1);
      // Draw the progress bar rectangle with width based on loading progress
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });

    // Register event handler for the 'complete' event
    // This cleans up the loading UI when all assets are loaded
    this.load.on('complete', () => {
      // Remove the progress bar graphics
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      // Start the main game scene
      this.scene.start('MainScene');
    });

    // Load game assets here
    // TODO: Add actual asset loading code when assets are available
    // Example: this.load.image('road', 'assets/images/road-background.png');
    // Example: this.load.spritesheet('character', 'assets/images/character-sprite.png', { frameWidth: 32, frameHeight: 48 });

    // Add a small delay to show the loading screen even if assets load quickly
    // This ensures players can see the loading screen even with fast connections
    this.load.on('complete', () => {
      setTimeout(() => {
        this.scene.start('MainScene');
      }, 500); // 500ms delay
    });
  }
}
