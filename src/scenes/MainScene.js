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
import { PerformanceMonitor } from '../utils/performance-monitor';
import { ObjectPool } from '../utils/object-pool';

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
      depthElementSpeed: 3,   // Speed of depth elements
      buttonScale: 1.1,       // Scale factor for button hover effect
      buttonScaleSpeed: 200,  // Speed of button scale animation in ms
      showFPS: true,          // Whether to show the FPS counter
      maxDepthElements: 10,   // Maximum number of depth elements to create
      cullingThreshold: 100   // Distance in pixels beyond which objects are culled
    };

    // Game state
    this.state = {
      isMovingLeft: false,
      isMovingRight: false,
      isPaused: false,
      menuOpen: false,
      confirmDialogOpen: false,
      frameCount: 0,          // Counter for frames
      lastOptimizationTime: 0 // Timestamp of last optimization check
    };

    // Performance monitoring
    this.performanceMonitor = null;

    // Object pooling
    this.depthElementPool = null;
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

    // Initialize performance monitor
    this.performanceMonitor = new PerformanceMonitor(this, {
      showFPS: this.config.showFPS,
      updateInterval: 1000
    });

    // Create the road background as a tile sprite
    this.createRoadBackground();

    // Create the character sprite
    this.createCharacter();

    // Initialize object pool for depth elements
    this.initializeObjectPool();

    // Create depth elements for forward motion illusion
    this.createDepthElements();

    // Set up input handlers
    this.setupInputHandlers();

    // Add menu button (vertical ellipsis) in the upper-right corner
    this.createMenuButton();

    // Add keyboard shortcut for toggling FPS display (F key)
    this.input.keyboard.on('keydown-F', () => {
      this.performanceMonitor.toggleFPSDisplay();
    });

    // Add keyboard shortcut for optimizing performance (O key)
    this.input.keyboard.on('keydown-O', () => {
      this.optimizePerformance();
    });

    // Set up periodic performance optimization
    this.time.addEvent({
      delay: 10000, // Check every 10 seconds
      callback: this.optimizePerformance,
      callbackScope: this,
      loop: true
    });
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
   * Initialize the object pool for depth elements
   */
  initializeObjectPool() {
    // Create a texture for depth elements if it doesn't exist
    if (!this.textures.exists('depthElement')) {
      const graphics = this.add.graphics();
      graphics.fillStyle(0xFFFFFF, 0.7); // White with some transparency
      graphics.fillCircle(0, 0, 10); // Size 10 circle
      graphics.generateTexture('depthElement', 20, 20);
      graphics.destroy();
    }

    // Create factory function for depth elements
    const factory = () => {
      const sprite = this.add.sprite(0, 0, 'depthElement');
      sprite.visible = false; // Start invisible
      return {
        sprite: sprite,
        speed: 0,
        scale: 1,
        active: false
      };
    };

    // Create reset function for depth elements
    const reset = (element) => {
      element.sprite.visible = false;
      element.sprite.x = 0;
      element.sprite.y = 0;
      element.sprite.setScale(1);
      element.speed = 0;
      element.scale = 1;
      element.active = false;
    };

    // Initialize the object pool
    this.depthElementPool = new ObjectPool(factory, reset, this.config.maxDepthElements);
  }

  /**
   * Creates depth elements for forward motion illusion
   */
  createDepthElements() {
    // Create a group for depth elements
    this.depthElements = [];

    // Create multiple depth elements
    for (let i = 0; i < this.config.depthElementsCount; i++) {
      // Get an element from the pool
      const element = this.depthElementPool.get();

      // Configure the element
      element.sprite.x = Phaser.Math.Between(this.leftBoundary, this.rightBoundary);
      element.sprite.y = Phaser.Math.Between(-100, this.gameHeight);
      element.speed = Phaser.Math.FloatBetween(1, 3) * this.config.depthElementSpeed;
      element.scale = Phaser.Math.FloatBetween(0.5, 1.5);
      element.sprite.setScale(element.scale);
      element.sprite.visible = true;
      element.active = true;

      // Add to the active elements array
      this.depthElements.push(element);
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
    this.menuButton = this.add.image(
      this.gameWidth - 30,           // x position (near right edge)
      30,                            // y position (near top)
      AssetManager.keys.menuButton   // texture key
    );

    // Make the menu button interactive
    this.menuButton.setInteractive({ useHandCursor: true });

    // Add hover effects for visual feedback
    this.menuButton.on('pointerover', () => {
      this.tweens.add({
        targets: this.menuButton,
        scale: this.config.buttonScale,
        duration: this.config.buttonScaleSpeed,
        ease: 'Power2'
      });
    });

    this.menuButton.on('pointerout', () => {
      this.tweens.add({
        targets: this.menuButton,
        scale: 1,
        duration: this.config.buttonScaleSpeed,
        ease: 'Power2'
      });
    });

    // Add click/tap event handler for the menu button
    this.menuButton.on('pointerdown', () => {
      // Toggle menu visibility
      if (!this.state.menuOpen && !this.state.confirmDialogOpen) {
        this.openMenu();
      }
    });
  }

  /**
   * Creates and displays the game menu
   */
  openMenu() {
    // Pause the game
    this.state.isPaused = true;
    this.state.menuOpen = true;

    // Create semi-transparent background
    this.menuOverlay = this.add.rectangle(
      this.gameWidth / 2,
      this.gameHeight / 2,
      this.gameWidth,
      this.gameHeight,
      0x000000,
      0.7
    );

    // Create menu container
    this.menuContainer = this.add.container(this.gameWidth / 2, this.gameHeight / 2);

    // Create menu panel
    const menuPanel = this.add.rectangle(0, 0, 300, 200, 0x333333, 0.9);
    menuPanel.setStrokeStyle(2, 0xffffff);

    // Create menu title
    const menuTitle = this.add.text(0, -70, 'Menu', {
      font: '32px Arial',
      fill: '#ffffff'
    }).setOrigin(0.5);

    // Create Resume button
    const resumeButton = this.add.text(0, -20, 'Resume', {
      font: '24px Arial',
      fill: '#ffffff'
    }).setOrigin(0.5);

    resumeButton.setInteractive({ useHandCursor: true });

    // Add hover effects
    resumeButton.on('pointerover', () => {
      resumeButton.setScale(this.config.buttonScale);
    });

    resumeButton.on('pointerout', () => {
      resumeButton.setScale(1);
    });

    resumeButton.on('pointerdown', () => {
      this.closeMenu();
    });

    // Create Exit button
    const exitButton = this.add.text(0, 30, 'Exit', {
      font: '24px Arial',
      fill: '#ffffff'
    }).setOrigin(0.5);

    exitButton.setInteractive({ useHandCursor: true });

    // Add hover effects
    exitButton.on('pointerover', () => {
      exitButton.setScale(this.config.buttonScale);
    });

    exitButton.on('pointerout', () => {
      exitButton.setScale(1);
    });

    exitButton.on('pointerdown', () => {
      this.openExitConfirmation();
    });

    // Add elements to the menu container
    this.menuContainer.add([menuPanel, menuTitle, resumeButton, exitButton]);
  }

  /**
   * Closes the game menu
   */
  closeMenu() {
    // Resume the game
    this.state.isPaused = false;
    this.state.menuOpen = false;

    // Destroy menu elements
    if (this.menuOverlay) this.menuOverlay.destroy();
    if (this.menuContainer) this.menuContainer.destroy();
  }

  /**
   * Opens the exit confirmation dialog
   */
  openExitConfirmation() {
    // Set state
    this.state.confirmDialogOpen = true;

    // Hide the menu
    this.menuContainer.visible = false;

    // Create confirmation dialog container
    this.exitConfirmationContainer = this.add.container(this.gameWidth / 2, this.gameHeight / 2);

    // Create dialog panel
    const dialogPanel = this.add.rectangle(0, 0, 400, 200, 0x333333, 0.9);
    dialogPanel.setStrokeStyle(2, 0xffffff);

    // Create confirmation message
    const confirmMessage = this.add.text(0, -50, 'Are you sure you want to leave the game?', {
      font: '20px Arial',
      fill: '#ffffff',
      align: 'center',
      wordWrap: { width: 350 }
    }).setOrigin(0.5);

    // Create Yes button
    const yesButton = this.add.text(-70, 30, 'Yes', {
      font: '24px Arial',
      fill: '#ffffff'
    }).setOrigin(0.5);

    yesButton.setInteractive({ useHandCursor: true });

    // Add hover effects
    yesButton.on('pointerover', () => {
      yesButton.setScale(this.config.buttonScale);
    });

    yesButton.on('pointerout', () => {
      yesButton.setScale(1);
    });

    yesButton.on('pointerdown', () => {
      // Exit the game (reload the page for simplicity)
      window.location.reload();
    });

    // Create Cancel button
    const cancelButton = this.add.text(70, 30, 'Cancel', {
      font: '24px Arial',
      fill: '#ffffff'
    }).setOrigin(0.5);

    cancelButton.setInteractive({ useHandCursor: true });

    // Add hover effects
    cancelButton.on('pointerover', () => {
      cancelButton.setScale(this.config.buttonScale);
    });

    cancelButton.on('pointerout', () => {
      cancelButton.setScale(1);
    });

    cancelButton.on('pointerdown', () => {
      this.closeExitConfirmation();
    });

    // Add elements to the confirmation container
    this.exitConfirmationContainer.add([dialogPanel, confirmMessage, yesButton, cancelButton]);
  }

  /**
   * Closes the exit confirmation dialog
   */
  closeExitConfirmation() {
    // Update state
    this.state.confirmDialogOpen = false;

    // Show the menu again
    this.menuContainer.visible = true;

    // Destroy confirmation dialog
    if (this.exitConfirmationContainer) this.exitConfirmationContainer.destroy();
  }

  /**
   * Optimize game performance based on current FPS
   */
  optimizePerformance() {
    const fps = this.performanceMonitor.getFPS();
    console.log(`Optimizing performance. Current FPS: ${fps}`);

    // If FPS is too low, reduce visual elements
    if (fps < 30) {
      // Reduce number of depth elements
      if (this.depthElements.length > 2) {
        const element = this.depthElements.pop();
        this.depthElementPool.release(element);
        console.log(`Reduced depth elements to ${this.depthElements.length}`);
      }
    }
    // If FPS is good and we have capacity, add more visual elements
    else if (fps > 55 && this.depthElements.length < this.config.maxDepthElements) {
      // Add a new depth element
      const element = this.depthElementPool.get();

      // Configure the element
      element.sprite.x = Phaser.Math.Between(this.leftBoundary, this.rightBoundary);
      element.sprite.y = -50;
      element.speed = Phaser.Math.FloatBetween(1, 3) * this.config.depthElementSpeed;
      element.scale = Phaser.Math.FloatBetween(0.5, 1.5);
      element.sprite.setScale(element.scale);
      element.sprite.visible = true;
      element.active = true;

      // Add to the active elements array
      this.depthElements.push(element);
      console.log(`Increased depth elements to ${this.depthElements.length}`);
    }
  }

  /**
   * Update method - automatically called by Phaser on each frame
   * Handles game logic that needs to run continuously
   */
  update() {
    // Skip updates if the game is paused
    if (this.state.isPaused) return;

    // Update performance monitor
    this.performanceMonitor.update();

    // Update road scrolling
    this.road.tilePositionY += this.config.roadSpeed;

    // Update character position based on input
    if (this.state.isMovingLeft && this.character.x > this.leftBoundary) {
      this.character.x -= this.config.characterSpeed;
    }

    if (this.state.isMovingRight && this.character.x < this.rightBoundary) {
      this.character.x += this.config.characterSpeed;
    }

    // Update depth elements with culling optimization
    for (let i = 0; i < this.depthElements.length; i++) {
      const element = this.depthElements[i];

      // Skip inactive elements
      if (!element.active) continue;

      // Move the element down
      element.sprite.y += element.speed;

      // Increase the size as it moves down to create depth perception
      const progress = element.sprite.y / this.gameHeight;
      const newScale = element.scale * (1 + progress);
      element.sprite.setScale(newScale);

      // Reset the element when it goes off screen
      if (element.sprite.y > this.gameHeight + this.config.cullingThreshold) {
        element.sprite.y = -this.config.cullingThreshold;
        element.sprite.x = Phaser.Math.Between(this.leftBoundary, this.rightBoundary);
        element.sprite.setScale(element.scale);
      }
    }
  }
}
