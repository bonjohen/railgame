/**
 * PerspectiveScene
 *
 * This scene implements a pseudo-3D perspective view for the rail game.
 * It creates the illusion of 3D using scaling and positioning techniques.
 */

import Phaser from 'phaser';
import { AssetManager } from '../assets/asset-manager';
import { PerformanceMonitor } from '../utils/performance-monitor';
import { DeviceDetector } from '../utils/device-detector';

// Import managers
import { GameConfig } from '../game/config/GameConfig';
import { RoadManager } from '../game/road/RoadManager';
import { CharacterManager } from '../game/character/CharacterManager';
import { ProjectileManager } from '../game/projectiles/ProjectileManager';
import { UIManager } from '../game/ui/UIManager';
import { EnvironmentManager } from '../game/environment/EnvironmentManager';

export class PerspectiveScene extends Phaser.Scene {
  /**
   * Create a new PerspectiveScene
   */
  constructor() {
    super('PerspectiveScene');
  }

  /**
   * Initialize the scene
   */
  init() {
    // Create game configuration
    this.config = new GameConfig();
    
    // Get game dimensions
    this.gameWidth = this.cameras.main.width;
    this.gameHeight = this.cameras.main.height;
    
    // Create managers
    this.roadManager = new RoadManager(this, this.config);
    this.environmentManager = new EnvironmentManager(this, this.config);
    this.characterManager = new CharacterManager(this, this.config, this.roadManager);
    this.projectileManager = new ProjectileManager(this, this.config);
    this.uiManager = new UIManager(this, this.config);
    
    // Initialize performance monitor
    this.performanceMonitor = new PerformanceMonitor();
    
    // Detect device capabilities
    this.deviceDetector = new DeviceDetector();
    
    // Game state
    this.state = {
      isHighResolution: this.deviceDetector.isHighResolution(),
      isPaused: false,
      menuOpen: false,
      obstacleSpawnTimer: 0,
      lastFireTime: 0,
      dragStartX: 0,
      dragX: 0,
      currentLane: Math.floor(this.config.laneCount / 2) // Start in the middle lane
    };
    
    // Arrays to store game objects
    this.projectiles = [];
    this.obstacles = [];
    this.sideElements = [];
  }

  /**
   * Preload assets
   */
  preload() {
    // Assets are preloaded in the LoadingScene
  }

  /**
   * Create the scene
   */
  create() {
    // Create the perspective road
    this.roadManager.createPerspectiveRoad();

    // Create the sky and horizon
    this.environmentManager.createSkyAndHorizon();
    
    // Create static road borders
    this.roadManager.createStaticRoadBorders();
    
    // Create distance fog effect
    this.environmentManager.createDistanceFog();

    // Create weather effects
    this.environmentManager.createWeatherEffects();

    // Apply lighting effects
    this.environmentManager.applyLightingEffects();

    // Create the top bar UI
    this.uiManager.createTopBar();

    // Create the character
    this.characterManager.createCharacter();

    // Create obstacle group
    this.createObstacleGroup();

    // Create projectile group
    this.createProjectileGroup();

    // Create the menu
    this.uiManager.createMenu();

    // Create FPS counter
    this.uiManager.createFPSCounter();

    // Set up input handlers
    this.setupInputHandlers();
  }

  /**
   * Creates the obstacle group
   */
  createObstacleGroup() {
    // Create a physics group for obstacles
    this.obstacleGroup = this.physics.add.group();
  }

  /**
   * Creates the projectile group
   */
  createProjectileGroup() {
    // Create a physics group for projectiles
    this.projectileGroup = this.physics.add.group();
  }

  /**
   * Sets up input handlers for character movement
   */
  setupInputHandlers() {
    // Set up keyboard input
    this.cursors = this.input.keyboard.createCursorKeys();

    // Set up space bar for firing
    this.spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Set up ESC key for menu
    this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // Create control area for touch/click input
    this.uiManager.createControlArea();
    
    // Handle pointer down (click/touch start)
    this.uiManager.controlArea.on('pointerdown', (pointer) => {
      // Store the initial position for drag detection
      this.state.dragStartX = pointer.x;
      this.state.dragX = pointer.x;

      // Determine lane change based on touch position
      if (pointer.x < this.gameWidth / 3) {
        // Left third of screen - move left
        this.characterManager.changeLane(-1);
        console.log('Moving left');
      } else if (pointer.x > (this.gameWidth * 2/3)) {
        // Right third of screen - move right
        this.characterManager.changeLane(1);
        console.log('Moving right');
      }
    });
  }

  /**
   * Update the scene
   * 
   * @param {number} time - The current time
   * @param {number} delta - The time since the last update
   */
  update(time, delta) {
    // Skip update if game is paused
    if (this.state.isPaused) return;
    
    // Update performance monitor
    this.performanceMonitor.update(time);
    
    // Update FPS counter
    if (this.config.showFPS) {
      this.uiManager.updateFPS(this.performanceMonitor.getFPS());
    }
    
    // Handle keyboard input
    this.handleKeyboardInput();
    
    // Update road
    this.roadManager.update();
    
    // Update character
    this.characterManager.update();
    
    // Update projectiles
    this.projectileManager.update();
    
    // Update environment
    this.environmentManager.update();
  }
  
  /**
   * Handle keyboard input
   */
  handleKeyboardInput() {
    // Left/right arrow keys for lane changes
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
      this.characterManager.changeLane(-1);
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
      this.characterManager.changeLane(1);
    }
    
    // Space bar for firing
    if (Phaser.Input.Keyboard.JustDown(this.spaceBar)) {
      this.characterManager.fireProjectile();
    }
    
    // ESC key for menu
    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.uiManager.toggleMenu();
    }
  }
}
