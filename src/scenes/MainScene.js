/**
 * Main Game Scene for Rail Game
 * This is the primary gameplay scene where the player controls a character moving down a road
 *
 * @file MainScene.js
 * @author Rail Game Team
 * @version 1.0.0
 */

import Phaser from 'phaser';
import { AssetManager } from '../assets/asset-manager';

/**
 * MainScene class
 * Handles the primary gameplay, including character movement, obstacles, and UI
 *
 * @class MainScene
 * @extends Phaser.Scene
 */
export class MainScene extends Phaser.Scene {
  /**
   * Create a new MainScene instance
   * Initializes the scene with the key 'MainScene'
   */
  constructor() {
    super('MainScene');

    // Game configuration
    this.config = {
      roadSpeed: 2,           // Speed of the road scrolling
      characterSpeed: 5,      // Speed of character movement
      roadWidth: 0.8,         // Width of the road as a percentage of the game width
      depthElementsCount: 5,  // Number of depth elements to create
      depthElementSpeed: 3    // Speed of depth elements
    };

    // Game state
    this.state = {
      isMovingLeft: false,
      isMovingRight: false,
      isPaused: false
    };
  }

  /**
   * Create method - automatically called by Phaser after preload
   * Sets up the game scene, UI elements, and event handlers
   *
   * @method create
   */
  create() {
    // Get game dimensions
    this.gameWidth = this.cameras.main.width;
    this.gameHeight = this.cameras.main.height;

    // Create the road background as a tile sprite
    this.createRoadBackground();

    // Create the character sprite
    this.createCharacter();

    // Create depth elements for forward motion illusion
    this.createDepthElements();

    // Set up input handlers
    this.setupInputHandlers();

    // Add menu button (vertical ellipsis) in the upper-right corner
    this.createMenuButton();
  }

  /**
   * Creates the road background as a tile sprite
   */
  createRoadBackground() {
    // Create a tile sprite using the road texture
    this.road = this.add.tileSprite(
      this.gameWidth / 2,           // x position (center)
      this.gameHeight / 2,          // y position (center)
      this.gameWidth,               // width
      this.gameHeight * 1.2,        // height (slightly taller than the screen)
      AssetManager.keys.road        // texture key
    );

    // Set the origin to the center
    this.road.setOrigin(0.5);

    // Calculate road boundaries for character movement
    const roadWidthPixels = this.gameWidth * this.config.roadWidth;
    this.leftBoundary = (this.gameWidth - roadWidthPixels) / 2 + 30; // Add padding
    this.rightBoundary = this.gameWidth - this.leftBoundary - 30;    // Add padding
  }

  /**
   * Creates the character sprite
   */
  createCharacter() {
    // Create the character sprite
    this.character = this.add.sprite(
      this.gameWidth / 2,                 // x position (center)
      this.gameHeight * 0.8,              // y position (near bottom)
      AssetManager.keys.character         // texture key
    );

    // Set the origin to the center
    this.character.setOrigin(0.5);
  }

  /**
   * Creates visual elements that move from top to bottom to create depth perception
   */
  createDepthElements() {
    // Create a group for depth elements
    this.depthElements = [];

    // Create multiple depth elements
    for (let i = 0; i < this.config.depthElementsCount; i++) {
      // Create a circle graphic
      const graphics = this.add.graphics();
      graphics.fillStyle(0xFFFFFF, 0.7); // White with some transparency

      // Random size between 5 and 15
      const size = Phaser.Math.Between(5, 15);
      graphics.fillCircle(0, 0, size);

      // Generate a texture from the graphics
      const textureName = `depthElement${i}`;
      graphics.generateTexture(textureName, size * 2, size * 2);
      graphics.destroy();

      // Create a sprite with the generated texture
      const element = this.add.sprite(
        Phaser.Math.Between(this.leftBoundary, this.rightBoundary), // Random x position on the road
        Phaser.Math.Between(-100, this.gameHeight),                // Random y position
        textureName
      );

      // Add to the array with additional properties
      this.depthElements.push({
        sprite: element,
        speed: Phaser.Math.FloatBetween(1, 3) * this.config.depthElementSpeed,
        scale: Phaser.Math.FloatBetween(0.5, 1.5)
      });
    }
  }

  /**
   * Sets up input handlers for character movement
   */
  setupInputHandlers() {
    // Left half of the screen - move left
    const leftZone = this.add.zone(
      this.gameWidth / 4,          // x position (1/4 of the screen)
      this.gameHeight / 2,         // y position (center)
      this.gameWidth / 2,          // width (half the screen)
      this.gameHeight              // height (full screen)
    ).setOrigin(0.5).setInteractive();

    leftZone.on('pointerdown', () => {
      this.state.isMovingLeft = true;
    });

    leftZone.on('pointerup', () => {
      this.state.isMovingLeft = false;
    });

    leftZone.on('pointerout', () => {
      this.state.isMovingLeft = false;
    });

    // Right half of the screen - move right
    const rightZone = this.add.zone(
      this.gameWidth * 3/4,        // x position (3/4 of the screen)
      this.gameHeight / 2,         // y position (center)
      this.gameWidth / 2,          // width (half the screen)
      this.gameHeight              // height (full screen)
    ).setOrigin(0.5).setInteractive();

    rightZone.on('pointerdown', () => {
      this.state.isMovingRight = true;
    });

    rightZone.on('pointerup', () => {
      this.state.isMovingRight = false;
    });

    rightZone.on('pointerout', () => {
      this.state.isMovingRight = false;
    });
  }

  /**
   * Creates the menu button
   */
  createMenuButton() {
    // Add menu button in the upper-right corner
    const menuButton = this.add.image(
      this.gameWidth - 30,           // x position (near right edge)
      30,                            // y position (near top)
      AssetManager.keys.menuButton   // texture key
    );

    // Make the menu button interactive
    menuButton.setInteractive();

    // Add click/tap event handler for the menu button
    menuButton.on('pointerdown', () => {
      // Pause the game and show menu
      console.log('Menu button clicked');
      // TODO: Implement menu functionality in Section 3
    });
  }

  /**
   * Update method - automatically called by Phaser on each frame
   * Handles game logic that needs to run continuously
   */
  update() {
    // Skip updates if the game is paused
    if (this.state.isPaused) return;

    // Update road scrolling
    this.road.tilePositionY += this.config.roadSpeed;

    // Update character position based on input
    if (this.state.isMovingLeft && this.character.x > this.leftBoundary) {
      this.character.x -= this.config.characterSpeed;
    }

    if (this.state.isMovingRight && this.character.x < this.rightBoundary) {
      this.character.x += this.config.characterSpeed;
    }

    // Update depth elements
    for (const element of this.depthElements) {
      // Move the element down
      element.sprite.y += element.speed;

      // Increase the size as it moves down to create depth perception
      const progress = element.sprite.y / this.gameHeight;
      const newScale = element.scale * (1 + progress);
      element.sprite.setScale(newScale);

      // Reset the element when it goes off screen
      if (element.sprite.y > this.gameHeight + 50) {
        element.sprite.y = -50;
        element.sprite.x = Phaser.Math.Between(this.leftBoundary, this.rightBoundary);
        element.sprite.setScale(element.scale);
      }
    }
  }
}
