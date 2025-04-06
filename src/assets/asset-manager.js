/**
 * Asset Manager
 *
 * This file provides a centralized system for managing game assets.
 * It handles the loading and organization of assets, making them
 * easily accessible throughout the game.
 */

import { createRoadTexture, createYellowLineTexture } from './images/road-background';
import { createCharacterTexture, createBackViewCharacterTexture } from './images/character-sprite';
import { createMenuButtonTexture } from './images/menu-button';

/**
 * Asset Manager class
 * Handles loading and organizing game assets
 */
export class AssetManager {
  /**
   * Create assets using the programmatic generators
   *
   * @param {Phaser.Scene} scene - The scene to create the assets in
   */
  static createAssets(scene) {
    // Create the road texture
    createRoadTexture(scene, 800, 1200, 'roadTexture');

    // Create the yellow line texture
    createYellowLineTexture(scene, 800, 1200, 'yellowLineTexture');

    // Create the character textures
    createCharacterTexture(scene, 50, 80, 'characterTexture');
    createBackViewCharacterTexture(scene, 50, 80, 'backViewCharacterTexture');

    // Create the menu button texture
    createMenuButtonTexture(scene, 40, 'menuButtonTexture');
  }

  /**
   * Preload any external assets (not used in this minimal implementation)
   *
   * @param {Phaser.Scene} scene - The scene to load the assets in
   */
  static preloadAssets(scene) {
    // In a more complex implementation, this would load external assets
    // Example: scene.load.image('background', 'assets/images/background.png');
  }

  /**
   * Get asset keys for easy reference
   */
  static get keys() {
    return {
      road: 'roadTexture',
      yellowLine: 'yellowLineTexture',
      character: 'characterTexture',
      backViewCharacter: 'backViewCharacterTexture',
      menuButton: 'menuButtonTexture'
    };
  }
}
