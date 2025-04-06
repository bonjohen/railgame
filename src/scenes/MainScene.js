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
      roadSpeed: 1,           // Speed of the road scrolling (reduced by 50%)
      characterSpeed: 2.5,    // Speed of character movement (reduced by 50%)
      roadWidth: 0.8,         // Width of the road as a percentage of the game width
      depthElementsCount: 5,  // Number of depth elements to create
      depthElementSpeed: 1.5, // Speed of depth elements (reduced by 50%)
      buttonScale: 1.1,       // Scale factor for button hover effect
      buttonScaleSpeed: 200,  // Speed of button scale animation in ms
      showFPS: true,          // Whether to show the FPS counter
      maxDepthElements: 10,   // Maximum number of depth elements to create
      cullingThreshold: 100,  // Distance in pixels beyond which objects are culled
      controlAreaHeight: 0.25, // Height of the control area as a percentage of the game height
      touchSensitivity: 1.0,  // Touch sensitivity adjustment factor
      uiScale: 1.0,           // UI scaling factor for high-resolution screens
      topBarHeight: 60,       // Height of the top bar in pixels
      health: 100,            // Initial health value
      maxHealth: 100,         // Maximum health value
      score: 0,               // Initial score value
      progress: 0,            // Initial progress value (0-100)
      yellowLineSpeed: -1.5,  // Speed of the yellow line scrolling (negative for opposite direction, reduced by 50%)
      obstacleSpeed: 2,       // Speed of obstacles moving down the road (reduced by 50%)
      collisionDamage: 10,    // Amount of health lost on collision with an obstacle
      projectileSpeed: 7.5,   // Speed of projectiles (3x character speed)
      fireRate: 500,          // Minimum time between shots in milliseconds
      sparkleSize: 15         // Size of the sparkle projectile
    };

    // Game state
    this.state = {
      isMovingLeft: false,
      isMovingRight: false,
      isPaused: false,
      menuOpen: false,
      confirmDialogOpen: false,
      frameCount: 0,          // Counter for frames
      lastOptimizationTime: 0, // Timestamp of last optimization check
      isDragging: false,      // Whether the player is currently dragging
      dragX: 0,               // X position of the drag
      dragStartX: 0,          // Starting X position of the drag
      clickHoldX: 0,          // X position of click-hold gesture
      isHighResolution: false, // Whether the device has a high-resolution screen
      deviceModel: 'unknown', // The detected device model
      obstacleSpawnTimer: 0,  // Timer for spawning obstacles
      obstacleSpawnInterval: 2000, // Time between obstacle spawns in ms
      isInvulnerable: false,  // Whether the character is currently invulnerable after a collision
      invulnerabilityTimer: 0, // Timer for invulnerability period
      lastFireTime: 0,        // Time of last projectile fired
      isFiring: false         // Whether the player is currently firing
    };

    // Game objects
    this.obstacles = [];     // Array to store active obstacles
    this.projectiles = [];   // Array to store active projectiles

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

    // Check for high-resolution device
    if (this.game.deviceDetector) {
      this.state.isHighResolution = this.game.deviceDetector.isHighResolutionDevice();
      this.state.deviceModel = this.game.deviceDetector.detectDeviceModel();
      console.log(`Device detected: ${this.state.deviceModel}, High-res: ${this.state.isHighResolution}`);
    }

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

    // Create the top bar UI
    this.createTopBar();

    // Set up input handlers
    this.setupInputHandlers();

    // Add menu button (vertical ellipsis) in the top bar
    this.createMenuButton();

    // Initialize physics for collision detection
    this.initializePhysics();

    // Create obstacle group
    this.createObstacleGroup();

    // Create projectile group
    this.createProjectileGroup();

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
    // Calculate the available game area (excluding top bar)
    const gameAreaHeight = this.gameHeight - this.config.topBarHeight;
    const gameAreaY = this.config.topBarHeight + (gameAreaHeight / 2);

    // Create a tile sprite using the road texture
    this.road = this.add.tileSprite(
      this.gameWidth / 2,           // x position (center)
      gameAreaY,                    // y position (center of game area)
      this.gameWidth,               // width
      gameAreaHeight * 1.2,         // height (slightly taller than the game area)
      AssetManager.keys.road        // texture key
    );

    // Set the origin to the center
    this.road.setOrigin(0.5);

    // Create the yellow line as a separate tile sprite
    this.yellowLine = this.add.tileSprite(
      this.gameWidth / 2,           // x position (center)
      gameAreaY,                    // y position (center of game area)
      this.gameWidth,               // width
      gameAreaHeight * 1.2,         // height (same as road)
      AssetManager.keys.yellowLine  // texture key
    );

    // Set the origin to the center
    this.yellowLine.setOrigin(0.5);

    // Set the yellow line depth to be above the road but below other elements
    this.yellowLine.setDepth(1);
    this.road.setDepth(0);

    // Calculate road boundaries for character movement
    const roadWidthPixels = this.gameWidth * this.config.roadWidth;
    this.leftBoundary = (this.gameWidth - roadWidthPixels) / 2 + 30; // Add padding
    this.rightBoundary = this.gameWidth - this.leftBoundary - 30;    // Add padding

    // Store the game area dimensions for reference
    this.gameAreaHeight = gameAreaHeight;
    this.gameAreaY = gameAreaY;
  }

  /**
   * Creates the character sprite
   */
  createCharacter() {
    // Calculate the character's vertical position (accounting for top bar)
    const characterY = this.config.topBarHeight + (this.gameAreaHeight * 0.8);

    // Create the character sprite
    this.character = this.physics.add.sprite(
      this.gameWidth / 2,                 // x position (center)
      characterY,                         // y position (near bottom of game area)
      AssetManager.keys.character         // texture key
    );

    // Set the origin to the center
    this.character.setOrigin(0.5);

    // Apply scaling for high-resolution screens if needed
    if (this.state.isHighResolution) {
      this.character.setScale(this.config.uiScale);
    }

    // Set the character's depth to be above the road and yellow line
    this.character.setDepth(10);

    // Set up a smaller physics body for more accurate collisions
    this.character.body.setSize(this.character.width * 0.7, this.character.height * 0.7);
    this.character.body.setOffset(this.character.width * 0.15, this.character.height * 0.15);
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
   * Implements touch controls in the bottom quarter of the screen
   * Supports click-hold and drag gestures
   * Also supports keyboard arrow keys
   */
  setupInputHandlers() {
    // Calculate the control area dimensions (bottom quarter of the game area, not including top bar)
    const controlAreaHeight = this.gameAreaHeight * this.config.controlAreaHeight;
    const controlAreaY = this.gameHeight - (controlAreaHeight / 2);

    // Create a debug rectangle to visualize the control area (can be removed in production)
    this.controlAreaDebug = this.add.rectangle(
      this.gameWidth / 2,
      controlAreaY,
      this.gameWidth,
      controlAreaHeight,
      0x0000ff,
      0.1
    ).setOrigin(0.5);

    // Create the control area zone
    this.controlArea = this.add.zone(
      this.gameWidth / 2,          // x position (center)
      controlAreaY,                // y position (bottom quarter)
      this.gameWidth,              // width (full screen width)
      controlAreaHeight            // height (quarter of the game area height)
    ).setOrigin(0.5).setInteractive();

    // Set up keyboard input
    this.cursors = this.input.keyboard.createCursorKeys();

    // Set up space bar for firing
    this.spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Set up ESC key for menu
    this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // Handle pointer down (click/touch start)
    this.controlArea.on('pointerdown', (pointer) => {
      // Store the initial position for drag detection
      this.state.dragStartX = pointer.x;
      this.state.dragX = pointer.x;

      // Determine if we're clicking to the left or right of the character
      if (pointer.x < this.character.x) {
        this.state.isMovingLeft = true;
        this.state.isMovingRight = false;
        this.state.clickHoldX = pointer.x;
      } else if (pointer.x > this.character.x) {
        this.state.isMovingRight = true;
        this.state.isMovingLeft = false;
        this.state.clickHoldX = pointer.x;
      }

      // Fire a projectile on tap
      this.fireProjectile();
    });

    // Handle pointer move (drag)
    this.controlArea.on('pointermove', (pointer) => {
      if (pointer.isDown) {
        // Calculate the drag distance
        const dragDistance = pointer.x - this.state.dragStartX;

        // If the drag distance is significant, consider it a drag operation
        if (Math.abs(dragDistance) > 10) {
          this.state.isDragging = true;
          this.state.dragX = pointer.x;

          // Prioritize drag over click-hold
          // Update movement direction based on drag direction
          if (dragDistance < 0) {
            this.state.isMovingLeft = true;
            this.state.isMovingRight = false;
          } else {
            this.state.isMovingRight = true;
            this.state.isMovingLeft = false;
          }
        }
      }
    });

    // Handle pointer up (click/touch end)
    this.controlArea.on('pointerup', () => {
      // Reset all movement states
      this.state.isMovingLeft = false;
      this.state.isMovingRight = false;
      this.state.isDragging = false;
    });

    // Handle pointer out (leaving the control area)
    this.controlArea.on('pointerout', () => {
      // Reset all movement states
      this.state.isMovingLeft = false;
      this.state.isMovingRight = false;
      this.state.isDragging = false;
    });

    // Add input for the rest of the screen (to be ignored)
    const nonControlArea = this.add.zone(
      this.gameWidth / 2,          // x position (center)
      this.gameHeight / 2 - controlAreaHeight / 2, // y position (top 3/4)
      this.gameWidth,              // width (full screen width)
      this.gameHeight - controlAreaHeight // height (3/4 of the screen height)
    ).setOrigin(0.5).setInteractive();

    // Ignore inputs in the non-control area
    nonControlArea.on('pointerdown', (pointer) => {
      // Only allow interaction if it's with the menu button or other UI elements
      // This effectively ignores movement controls outside the control area
    });
  }

  /**
   * Creates the top bar UI with health, score, and progress indicators
   */
  createTopBar() {
    // Create top bar container
    this.topBar = this.add.container(0, 0);

    // Apply UI scaling for high-resolution screens
    const uiScale = this.state.isHighResolution ? this.config.uiScale : 1.0;

    // Create top bar background
    const topBarBg = this.add.rectangle(
      this.gameWidth / 2,
      this.config.topBarHeight / 2,
      this.gameWidth,
      this.config.topBarHeight,
      0x222222,
      0.8
    );

    // Add a bottom border to the top bar
    const topBarBorder = this.add.rectangle(
      this.gameWidth / 2,
      this.config.topBarHeight,
      this.gameWidth,
      2,
      0xffffff,
      0.5
    );

    // Create health indicator
    this.healthText = this.add.text(
      20,
      this.config.topBarHeight / 2,
      `Health: ${this.config.health}`,
      {
        font: `${Math.round(18 * uiScale)}px Arial`,
        fill: '#ffffff'
      }
    ).setOrigin(0, 0.5);

    // Create health bar background
    this.healthBarBg = this.add.rectangle(
      120 * uiScale,
      this.config.topBarHeight / 2,
      100 * uiScale,
      16 * uiScale,
      0x666666
    ).setOrigin(0, 0.5);

    // Create health bar fill
    this.healthBarFill = this.add.rectangle(
      120 * uiScale,
      this.config.topBarHeight / 2,
      100 * uiScale,
      16 * uiScale,
      0xff0000
    ).setOrigin(0, 0.5);

    // Update health bar to match initial health
    this.updateHealthBar(this.config.health);

    // Create score indicator
    this.scoreText = this.add.text(
      this.gameWidth / 2,
      this.config.topBarHeight / 2,
      `Score: ${this.config.score}`,
      {
        font: `${Math.round(20 * uiScale)}px Arial`,
        fill: '#ffffff'
      }
    ).setOrigin(0.5);

    // Create progress indicator
    this.progressText = this.add.text(
      this.gameWidth - 20 - 100 * uiScale,
      this.config.topBarHeight / 2 - 15 * uiScale,
      `Progress:`,
      {
        font: `${Math.round(14 * uiScale)}px Arial`,
        fill: '#ffffff'
      }
    ).setOrigin(1, 0.5);

    // Create progress bar background
    this.progressBarBg = this.add.rectangle(
      this.gameWidth - 20,
      this.config.topBarHeight / 2 + 5 * uiScale,
      100 * uiScale,
      10 * uiScale,
      0x666666
    ).setOrigin(1, 0.5);

    // Create progress bar fill
    this.progressBarFill = this.add.rectangle(
      this.gameWidth - 20,
      this.config.topBarHeight / 2 + 5 * uiScale,
      0,
      10 * uiScale,
      0x00ff00
    ).setOrigin(1, 0.5);

    // Update progress bar to match initial progress
    this.updateProgressBar(this.config.progress);

    // Add all elements to the top bar container
    this.topBar.add([
      topBarBg,
      topBarBorder,
      this.healthText,
      this.healthBarBg,
      this.healthBarFill,
      this.scoreText,
      this.progressText,
      this.progressBarBg,
      this.progressBarFill
    ]);

    // Set the top bar to stay fixed to the camera
    this.topBar.setScrollFactor(0);
  }

  /**
   * Updates the health bar to reflect the current health value
   *
   * @param {number} health - The current health value
   */
  updateHealthBar(health) {
    // Ensure health is within valid range
    const clampedHealth = Phaser.Math.Clamp(health, 0, this.config.maxHealth);

    // Calculate the width of the health bar fill
    const fillWidth = (clampedHealth / this.config.maxHealth) * 100 *
                     (this.state.isHighResolution ? this.config.uiScale : 1.0);

    // Update the health bar fill width
    this.healthBarFill.width = fillWidth;

    // Update the health text
    this.healthText.setText(`Health: ${Math.round(clampedHealth)}`);

    // Change color based on health level
    if (clampedHealth < 25) {
      this.healthBarFill.fillColor = 0xff0000; // Red for low health
    } else if (clampedHealth < 50) {
      this.healthBarFill.fillColor = 0xff7700; // Orange for medium health
    } else {
      this.healthBarFill.fillColor = 0x00ff00; // Green for good health
    }
  }

  /**
   * Updates the score display
   *
   * @param {number} score - The current score value
   */
  updateScore(score) {
    // Update the score text
    this.scoreText.setText(`Score: ${score}`);

    // Animate the score text for visual feedback
    this.tweens.add({
      targets: this.scoreText,
      scale: 1.2,
      duration: 100,
      yoyo: true,
      ease: 'Power2'
    });
  }

  /**
   * Updates the progress bar to reflect the current progress value
   *
   * @param {number} progress - The current progress value (0-100)
   */
  updateProgressBar(progress) {
    // Ensure progress is within valid range
    const clampedProgress = Phaser.Math.Clamp(progress, 0, 100);

    // Calculate the width of the progress bar fill
    const fillWidth = (clampedProgress / 100) * 100 *
                     (this.state.isHighResolution ? this.config.uiScale : 1.0);

    // Update the progress bar fill width
    this.progressBarFill.width = fillWidth;
  }

  /**
   * Creates the menu button (vertical ellipsis)
   */
  createMenuButton() {
    // Apply UI scaling for high-resolution screens
    const uiScale = this.state.isHighResolution ? this.config.uiScale : 1.0;

    // Add menu button in the top bar (vertical ellipsis)
    this.menuButton = this.add.image(
      this.gameWidth - 30,           // x position (near right edge)
      this.config.topBarHeight / 2,  // y position (centered in top bar)
      AssetManager.keys.menuButton   // texture key
    );

    // Scale the button for high-resolution screens
    this.menuButton.setScale(uiScale);

    // Make the menu button interactive
    this.menuButton.setInteractive({ useHandCursor: true });

    // Set the depth to ensure it's above other elements
    this.menuButton.setDepth(100);

    // Add hover effects for visual feedback
    this.menuButton.on('pointerover', () => {
      this.tweens.add({
        targets: this.menuButton,
        scale: uiScale * this.config.buttonScale,
        duration: this.config.buttonScaleSpeed,
        ease: 'Power2'
      });
    });

    this.menuButton.on('pointerout', () => {
      this.tweens.add({
        targets: this.menuButton,
        scale: uiScale,
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

    // Add the menu button to the top bar
    this.topBar.add(this.menuButton);
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
   * Initialize physics for collision detection
   */
  initializePhysics() {
    // Enable physics on the character
    this.physics.world.enable(this.character);
  }

  /**
   * Create obstacle group for collision detection
   */
  createObstacleGroup() {
    // Create a physics group for obstacles
    this.obstacleGroup = this.physics.add.group();

    // Set up collision between character and obstacles
    this.physics.add.overlap(
      this.character,
      this.obstacleGroup,
      this.handleCollision,
      null,
      this
    );
  }

  /**
   * Create projectile group for collision detection
   */
  createProjectileGroup() {
    // Create a physics group for projectiles
    this.projectileGroup = this.physics.add.group();

    // Set up collision between projectiles and obstacles
    this.physics.add.overlap(
      this.projectileGroup,
      this.obstacleGroup,
      this.handleProjectileCollision,
      null,
      this
    );
  }

  /**
   * Create a sparkle projectile
   */
  fireProjectile() {
    // Check if enough time has passed since the last shot
    const currentTime = this.time.now;
    if (currentTime - this.state.lastFireTime < this.config.fireRate) {
      return; // Fire rate limit not met
    }

    // Update last fire time
    this.state.lastFireTime = currentTime;

    // Create the projectile at the character's position
    const projectile = this.physics.add.sprite(
      this.character.x,
      this.character.y - this.character.height / 2, // Spawn above the character
      'characterTexture' // Reuse character texture for now
    );

    // Scale down the projectile
    const projectileSize = this.config.sparkleSize;
    projectile.setScale(projectileSize / projectile.width);

    // Set the projectile's tint to make it visually distinct (sparkle effect)
    projectile.setTint(0xffff00); // Yellow tint

    // Set the projectile's depth to be above the road but below the character
    projectile.setDepth(8);

    // Add the projectile to the physics group
    this.projectileGroup.add(projectile);

    // Store the projectile in our array for easy access
    this.projectiles.push(projectile);

    // Add a particle emitter for sparkle effect
    const particles = this.add.particles(projectile.x, projectile.y, 'characterTexture', {
      speed: 50,
      scale: { start: 0.2, end: 0 },
      blendMode: 'ADD',
      lifespan: 300,
      quantity: 1,
      frequency: 50
    });

    // Attach the particle emitter to the projectile
    projectile.particles = particles;

    // Add a glow effect
    const glow = this.add.sprite(projectile.x, projectile.y, 'characterTexture');
    glow.setScale(projectileSize * 1.5 / glow.width);
    glow.setTint(0xffff99);
    glow.setAlpha(0.5);
    glow.setBlendMode(Phaser.BlendModes.ADD);
    glow.setDepth(7);
    projectile.glow = glow;

    // Play a sound effect (if we had one)
    // this.sound.play('fire');

    // Return the created projectile
    return projectile;
  }

  /**
   * Handle collision between projectile and obstacle
   *
   * @param {Phaser.GameObjects.Sprite} projectile - The projectile sprite
   * @param {Phaser.GameObjects.Sprite} obstacle - The obstacle sprite
   */
  handleProjectileCollision(projectile, obstacle) {
    // Create an explosion animation
    this.createExplosionAnimation(obstacle.x, obstacle.y);

    // Remove the projectile
    this.removeProjectile(projectile);

    // Remove the obstacle
    this.removeObstacle(obstacle);

    // Increase score
    this.config.score += 20;
    this.updateScore(this.config.score);

    // Update progress
    this.config.progress = Math.min(100, this.config.progress + 2);
    this.updateProgressBar(this.config.progress);
  }

  /**
   * Create an explosion animation at the specified position
   *
   * @param {number} x - The x position of the explosion
   * @param {number} y - The y position of the explosion
   */
  createExplosionAnimation(x, y) {
    // Create a particle emitter for the explosion effect
    const particles = this.add.particles(x, y, 'characterTexture', {
      speed: 200,
      scale: { start: 0.8, end: 0 },
      blendMode: 'ADD',
      lifespan: 800,
      quantity: 20,
      tint: [0xff0000, 0xff7700, 0xffff00]
    });

    // Stop the emitter after a short time
    this.time.delayedCall(800, () => {
      particles.destroy();
    });
  }

  /**
   * Remove a projectile from the game
   *
   * @param {Phaser.GameObjects.Sprite} projectile - The projectile to remove
   */
  removeProjectile(projectile) {
    // Remove from our array
    const index = this.projectiles.indexOf(projectile);
    if (index > -1) {
      this.projectiles.splice(index, 1);
    }

    // Destroy the particle emitter if it exists
    if (projectile.particles) {
      projectile.particles.destroy();
    }

    // Destroy the glow effect if it exists
    if (projectile.glow) {
      projectile.glow.destroy();
    }

    // Destroy the projectile sprite
    projectile.destroy();
  }

  /**
   * Create a new obstacle
   */
  createObstacle() {
    // Randomly position the obstacle on the road
    const x = Phaser.Math.Between(this.leftBoundary + 30, this.rightBoundary - 30);
    const y = this.config.topBarHeight - 50; // Start above the visible area

    // Create the obstacle sprite
    const obstacle = this.physics.add.sprite(x, y, 'characterTexture');

    // Set the obstacle's tint to make it visually distinct
    obstacle.setTint(0xff0000); // Red tint

    // Scale the obstacle
    obstacle.setScale(0.8);

    // Set the obstacle's depth to be above the road but below the character
    obstacle.setDepth(5);

    // Add the obstacle to the physics group
    this.obstacleGroup.add(obstacle);

    // Store the obstacle in our array for easy access
    this.obstacles.push(obstacle);

    // Return the created obstacle
    return obstacle;
  }

  /**
   * Handle collision between character and obstacle
   *
   * @param {Phaser.GameObjects.Sprite} character - The character sprite
   * @param {Phaser.GameObjects.Sprite} obstacle - The obstacle sprite
   */
  handleCollision(character, obstacle) {
    // Skip if the character is invulnerable
    if (this.state.isInvulnerable) return;

    // Make the character invulnerable for a short time
    this.state.isInvulnerable = true;
    this.state.invulnerabilityTimer = 0;

    // Flash the character to indicate invulnerability
    this.tweens.add({
      targets: character,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      repeat: 5
    });

    // Reduce health
    const newHealth = this.config.health - this.config.collisionDamage;
    this.config.health = Math.max(0, newHealth);

    // Update the health bar
    this.updateHealthBar(this.config.health);

    // Create a collision animation
    this.createCollisionAnimation(obstacle.x, obstacle.y);

    // Remove the obstacle
    this.removeObstacle(obstacle);

    // Check if the character is dead
    if (this.config.health <= 0) {
      // Game over logic would go here
      console.log('Game Over!');
    }
  }

  /**
   * Create a collision animation at the specified position
   *
   * @param {number} x - The x position of the collision
   * @param {number} y - The y position of the collision
   */
  createCollisionAnimation(x, y) {
    // Create a particle emitter for the collision effect
    const particles = this.add.particles(x, y, 'characterTexture', {
      speed: 100,
      scale: { start: 0.5, end: 0 },
      blendMode: 'ADD',
      lifespan: 500,
      quantity: 10
    });

    // Stop the emitter after a short time
    this.time.delayedCall(500, () => {
      particles.destroy();
    });
  }

  /**
   * Remove an obstacle from the game
   *
   * @param {Phaser.GameObjects.Sprite} obstacle - The obstacle to remove
   */
  removeObstacle(obstacle) {
    // Remove from our array
    const index = this.obstacles.indexOf(obstacle);
    if (index > -1) {
      this.obstacles.splice(index, 1);
    }

    // Destroy the obstacle sprite
    obstacle.destroy();
  }

  /**
   * Update method - automatically called by Phaser on each frame
   * Handles game logic that needs to run continuously
   */
  update(time, delta) {
    // Skip updates if the game is paused
    if (this.state.isPaused) return;

    // Update performance monitor
    this.performanceMonitor.update();

    // Update road scrolling
    this.road.tilePositionY += this.config.roadSpeed;

    // Update yellow line scrolling at a different speed (negative for opposite direction)
    this.yellowLine.tilePositionY += this.config.yellowLineSpeed;

    // Update obstacle spawn timer
    this.state.obstacleSpawnTimer += delta;
    if (this.state.obstacleSpawnTimer >= this.state.obstacleSpawnInterval) {
      this.state.obstacleSpawnTimer = 0;
      this.createObstacle();
    }

    // Update obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.obstacles[i];

      // Move the obstacle down
      obstacle.y += this.config.obstacleSpeed;

      // Remove obstacles that go off screen
      if (obstacle.y > this.gameHeight + 50) {
        this.removeObstacle(obstacle);

        // Increase score when successfully avoiding an obstacle
        this.config.score += 10;
        this.updateScore(this.config.score);

        // Update progress
        this.config.progress = Math.min(100, this.config.progress + 1);
        this.updateProgressBar(this.config.progress);
      }
    }

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];

      // Move the projectile up
      projectile.y -= this.config.projectileSpeed;

      // Update the particle emitter position
      if (projectile.particles) {
        projectile.particles.setPosition(projectile.x, projectile.y);
      }

      // Update the glow effect position
      if (projectile.glow) {
        projectile.glow.setPosition(projectile.x, projectile.y);
      }

      // Remove projectiles that go off screen
      if (projectile.y < -50) {
        this.removeProjectile(projectile);
      }
    }

    // Update invulnerability timer
    if (this.state.isInvulnerable) {
      this.state.invulnerabilityTimer += delta;
      if (this.state.invulnerabilityTimer >= 1500) { // 1.5 seconds of invulnerability
        this.state.isInvulnerable = false;
        this.character.alpha = 1; // Ensure character is fully visible
      }
    }

    // Handle keyboard input for movement
    if (this.cursors.left.isDown) {
      this.state.isMovingLeft = true;
      this.state.isMovingRight = false;
    } else if (this.cursors.right.isDown) {
      this.state.isMovingRight = true;
      this.state.isMovingLeft = false;
    } else if (!this.state.isDragging) {
      // Only reset movement if not using touch/drag controls
      if (!this.controlArea.input || !this.controlArea.input.isDown) {
        this.state.isMovingLeft = false;
        this.state.isMovingRight = false;
      }
    }

    // Handle space bar for firing
    if (Phaser.Input.Keyboard.JustDown(this.spaceBar)) {
      this.fireProjectile();
    }

    // Handle ESC key for menu
    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      if (!this.state.menuOpen && !this.state.confirmDialogOpen) {
        this.openMenu();
      } else if (this.state.menuOpen && !this.state.confirmDialogOpen) {
        this.closeMenu();
      } else if (this.state.confirmDialogOpen) {
        this.closeExitConfirmation();
      }
    }

    // Update character position based on input
    // Prioritize drag gestures over click-hold
    if (this.state.isDragging) {
      // Move based on drag position relative to character
      if (this.state.isMovingLeft && this.character.x > this.leftBoundary) {
        this.character.x -= this.config.characterSpeed;
      } else if (this.state.isMovingRight && this.character.x < this.rightBoundary) {
        this.character.x += this.config.characterSpeed;
      }
    } else {
      // Handle click-hold movement
      if (this.state.isMovingLeft && this.character.x > this.leftBoundary) {
        this.character.x -= this.config.characterSpeed;
      }

      if (this.state.isMovingRight && this.character.x < this.rightBoundary) {
        this.character.x += this.config.characterSpeed;
      }
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
