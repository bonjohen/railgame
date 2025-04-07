/**
 * UIManager.js
 * 
 * Manages the creation and updating of UI elements.
 */

import { AssetManager } from '../../assets/asset-manager';

export class UIManager {
  /**
   * Create a new UIManager
   * 
   * @param {Phaser.Scene} scene - The scene this manager belongs to
   * @param {GameConfig} config - The game configuration
   */
  constructor(scene, config) {
    this.scene = scene;
    this.config = config;
    this.gameWidth = scene.cameras.main.width;
    this.gameHeight = scene.cameras.main.height;
    
    // UI elements
    this.topBar = null;
    this.healthBar = null;
    this.scoreText = null;
    this.progressBar = null;
    this.menuButton = null;
    this.menuContainer = null;
    this.controlArea = null;
    this.fpsText = null;
  }
  
  /**
   * Creates the top bar UI with health, score, and progress indicators
   */
  createTopBar() {
    // Create top bar container
    this.topBar = this.scene.add.container(0, 0);

    // Apply UI scaling for high-resolution screens
    const uiScale = this.scene.state.isHighResolution ? this.config.uiScale : 1.0;

    // Create top bar background
    const topBarBg = this.scene.add.rectangle(
      this.gameWidth / 2,
      this.config.topBarHeight / 2,
      this.gameWidth,
      this.config.topBarHeight,
      0x222222,
      0.8
    );

    // Add a bottom border to the top bar
    const topBarBorder = this.scene.add.rectangle(
      this.gameWidth / 2,
      this.config.topBarHeight,
      this.gameWidth,
      2,
      0xffffff,
      0.5
    );

    // Add elements to the top bar container
    this.topBar.add(topBarBg);
    this.topBar.add(topBarBorder);

    // Create health bar
    this.createHealthBar();

    // Create score display
    this.createScoreDisplay();

    // Create progress bar
    this.createProgressBar();

    // Create menu button
    this.createMenuButton();

    // Set the depth of the top bar to be above everything
    this.topBar.setDepth(100);
  }
  
  /**
   * Creates the health bar in the top bar
   */
  createHealthBar() {
    // Health bar container
    const healthBarContainer = this.scene.add.container(20, this.config.topBarHeight / 2);
    
    // Health bar background
    const healthBarBg = this.scene.add.rectangle(
      0,
      0,
      150,
      20,
      0x000000,
      0.5
    );
    healthBarBg.setOrigin(0, 0.5);
    
    // Health bar fill
    const healthBarFill = this.scene.add.rectangle(
      2,
      0,
      146 * (this.config.health / this.config.maxHealth),
      16,
      0x00FF00,
      1
    );
    healthBarFill.setOrigin(0, 0.5);
    
    // Health icon
    const healthIcon = this.scene.add.text(
      -25,
      0,
      '❤️',
      {
        font: '16px Arial',
        fill: '#ffffff'
      }
    );
    healthIcon.setOrigin(0.5);
    
    // Add elements to the health bar container
    healthBarContainer.add(healthBarBg);
    healthBarContainer.add(healthBarFill);
    healthBarContainer.add(healthIcon);
    
    // Store reference to the health bar fill for updating
    this.healthBar = healthBarFill;
    
    // Add to the top bar
    this.topBar.add(healthBarContainer);
  }
  
  /**
   * Creates the score display in the top bar
   */
  createScoreDisplay() {
    // Score text
    this.scoreText = this.scene.add.text(
      this.gameWidth / 2,
      this.config.topBarHeight / 2,
      'Score: ' + this.config.score,
      {
        font: '20px Arial',
        fill: '#ffffff'
      }
    );
    this.scoreText.setOrigin(0.5);
    
    // Add to the top bar
    this.topBar.add(this.scoreText);
  }
  
  /**
   * Creates the progress bar in the top bar
   */
  createProgressBar() {
    // Progress bar container
    const progressBarContainer = this.scene.add.container(
      this.gameWidth - 20,
      this.config.topBarHeight / 2
    );
    
    // Progress bar background
    const progressBarBg = this.scene.add.rectangle(
      0,
      0,
      150,
      20,
      0x000000,
      0.5
    );
    progressBarBg.setOrigin(1, 0.5);
    
    // Progress bar fill
    const progressBarFill = this.scene.add.rectangle(
      -2,
      0,
      146 * (this.config.progress / 100),
      16,
      0x3498DB, // Blue color
      1
    );
    progressBarFill.setOrigin(1, 0.5);
    
    // Progress icon
    const progressIcon = this.scene.add.text(
      -160,
      0,
      '🏁',
      {
        font: '16px Arial',
        fill: '#ffffff'
      }
    );
    progressIcon.setOrigin(0.5);
    
    // Add elements to the progress bar container
    progressBarContainer.add(progressBarBg);
    progressBarContainer.add(progressBarFill);
    progressBarContainer.add(progressIcon);
    
    // Store reference to the progress bar fill for updating
    this.progressBar = progressBarFill;
    
    // Add to the top bar
    this.topBar.add(progressBarContainer);
  }
  
  /**
   * Creates the menu button in the top bar
   */
  createMenuButton() {
    // Menu button
    this.menuButton = this.scene.add.sprite(
      this.gameWidth - 30,
      this.config.topBarHeight / 2,
      AssetManager.keys.menuButton
    );
    this.menuButton.setScale(0.6);
    
    // Make the button interactive
    this.menuButton.setInteractive({ useHandCursor: true });
    
    // Add click handler
    this.menuButton.on('pointerdown', () => {
      this.toggleMenu();
    });
    
    // Add to the top bar
    this.topBar.add(this.menuButton);
  }
  
  /**
   * Creates the game menu
   */
  createMenu() {
    // Create menu container
    this.menuContainer = this.scene.add.container(0, 0);
    this.menuContainer.setDepth(200);
    
    // Create semi-transparent background
    const menuBg = this.scene.add.rectangle(
      this.gameWidth / 2,
      this.gameHeight / 2,
      this.gameWidth,
      this.gameHeight,
      0x000000,
      0.7
    );
    
    // Create menu panel
    const menuPanel = this.scene.add.rectangle(
      this.gameWidth / 2,
      this.gameHeight / 2,
      300,
      400,
      0x333333,
      0.9
    );
    
    // Create menu title
    const menuTitle = this.scene.add.text(
      this.gameWidth / 2,
      this.gameHeight / 2 - 150,
      'MENU',
      {
        font: '32px Arial',
        fill: '#ffffff'
      }
    );
    menuTitle.setOrigin(0.5);
    
    // Create resume button
    const resumeButton = this.scene.add.rectangle(
      this.gameWidth / 2,
      this.gameHeight / 2 - 80,
      250,
      50,
      0x3498DB,
      1
    );
    
    const resumeText = this.scene.add.text(
      this.gameWidth / 2,
      this.gameHeight / 2 - 80,
      'Resume Game',
      {
        font: '20px Arial',
        fill: '#ffffff'
      }
    );
    resumeText.setOrigin(0.5);
    
    // Make the resume button interactive
    resumeButton.setInteractive({ useHandCursor: true });
    
    // Add click handler
    resumeButton.on('pointerdown', () => {
      this.toggleMenu();
    });
    
    // Create restart button
    const restartButton = this.scene.add.rectangle(
      this.gameWidth / 2,
      this.gameHeight / 2,
      250,
      50,
      0x3498DB,
      1
    );
    
    const restartText = this.scene.add.text(
      this.gameWidth / 2,
      this.gameHeight / 2,
      'Restart Game',
      {
        font: '20px Arial',
        fill: '#ffffff'
      }
    );
    restartText.setOrigin(0.5);
    
    // Make the restart button interactive
    restartButton.setInteractive({ useHandCursor: true });
    
    // Add click handler
    restartButton.on('pointerdown', () => {
      this.scene.scene.restart();
    });
    
    // Create exit button
    const exitButton = this.scene.add.rectangle(
      this.gameWidth / 2,
      this.gameHeight / 2 + 80,
      250,
      50,
      0x3498DB,
      1
    );
    
    const exitText = this.scene.add.text(
      this.gameWidth / 2,
      this.gameHeight / 2 + 80,
      'Exit to Main Menu',
      {
        font: '20px Arial',
        fill: '#ffffff'
      }
    );
    exitText.setOrigin(0.5);
    
    // Make the exit button interactive
    exitButton.setInteractive({ useHandCursor: true });
    
    // Add click handler
    exitButton.on('pointerdown', () => {
      this.scene.scene.start('PerspectiveScene');
    });
    
    // Add elements to the menu container
    this.menuContainer.add(menuBg);
    this.menuContainer.add(menuPanel);
    this.menuContainer.add(menuTitle);
    this.menuContainer.add(resumeButton);
    this.menuContainer.add(resumeText);
    this.menuContainer.add(restartButton);
    this.menuContainer.add(restartText);
    this.menuContainer.add(exitButton);
    this.menuContainer.add(exitText);
    
    // Hide the menu initially
    this.menuContainer.setVisible(false);
  }
  
  /**
   * Creates the control area for touch/click input
   */
  createControlArea() {
    // Calculate the control area dimensions (bottom quarter of the screen)
    const controlAreaHeight = this.gameHeight * this.config.controlAreaHeight;
    const controlAreaY = this.gameHeight - (controlAreaHeight / 2);
    
    // Create a debug rectangle to visualize the control area
    this.controlAreaDebug = this.scene.add.rectangle(
      this.gameWidth / 2,
      controlAreaY,
      this.gameWidth,
      controlAreaHeight,
      0x0000ff,
      0.1
    ).setOrigin(0.5);
    this.controlAreaDebug.setDepth(5);
    
    // Create a control area for touch/click input
    this.controlArea = this.scene.add.zone(
      this.gameWidth / 2,
      controlAreaY,
      this.gameWidth,
      controlAreaHeight
    ).setOrigin(0.5).setInteractive();
  }
  
  /**
   * Creates the FPS counter
   */
  createFPSCounter() {
    if (this.config.showFPS) {
      this.fpsText = this.scene.add.text(
        10,
        10,
        'FPS: 0',
        {
          font: '16px Arial',
          fill: '#ffffff'
        }
      );
      this.fpsText.setDepth(200);
    }
  }
  
  /**
   * Toggle the menu visibility
   */
  toggleMenu() {
    if (this.menuContainer) {
      const isVisible = this.menuContainer.visible;
      this.menuContainer.setVisible(!isVisible);
      this.scene.state.menuOpen = !isVisible;
      this.scene.state.isPaused = !isVisible;
    }
  }
  
  /**
   * Update the health bar
   * 
   * @param {number} health - The current health value
   */
  updateHealth(health) {
    if (this.healthBar) {
      this.healthBar.width = 146 * (health / this.config.maxHealth);
      
      // Change color based on health level
      if (health > this.config.maxHealth * 0.6) {
        this.healthBar.fillColor = 0x00FF00; // Green
      } else if (health > this.config.maxHealth * 0.3) {
        this.healthBar.fillColor = 0xFFFF00; // Yellow
      } else {
        this.healthBar.fillColor = 0xFF0000; // Red
      }
    }
  }
  
  /**
   * Update the score display
   * 
   * @param {number} score - The current score value
   */
  updateScore(score) {
    if (this.scoreText) {
      this.scoreText.setText('Score: ' + score);
    }
  }
  
  /**
   * Update the progress bar
   * 
   * @param {number} progress - The current progress value (0-100)
   */
  updateProgress(progress) {
    if (this.progressBar) {
      this.progressBar.width = 146 * (progress / 100);
    }
  }
  
  /**
   * Update the FPS counter
   * 
   * @param {number} fps - The current FPS value
   */
  updateFPS(fps) {
    if (this.fpsText) {
      this.fpsText.setText('FPS: ' + Math.round(fps));
    }
  }
}
