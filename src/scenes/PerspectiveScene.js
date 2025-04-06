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

export class PerspectiveScene extends Phaser.Scene {
  /**
   * Create a new PerspectiveScene
   */
  constructor() {
    super('PerspectiveScene');

    // Game configuration
    this.config = {
      roadSpeed: 1,           // Speed of the road scrolling
      characterSpeed: 2.5,    // Speed of character movement
      roadWidth: 0.6,         // Width of the road as a percentage of the game width
      segmentCount: 20,       // Number of road segments to create
      horizonLine: 0.3,       // Position of the horizon line (percentage from top)
      cameraHeight: 1000,     // Virtual camera height
      cameraDepth: 0.84,      // Camera depth (field of view)
      laneCount: 3,           // Number of lanes
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
      lastFireTime: 0,        // Time of last projectile fired
      isFiring: false,        // Whether the player is currently firing
      currentLane: 1,         // Current lane (0 = left, 1 = center, 2 = right)
      targetLane: 1,          // Target lane for smooth transitions
      laneTransitionProgress: 1.0 // Progress of lane transition (0-1)
    };

    // Game objects
    this.roadSegments = [];   // Array to store road segments
    this.sideElements = [];   // Array to store side elements (trees, etc.)
  }

  /**
   * Preload method - automatically called by Phaser before create
   * Loads assets needed for this scene
   */
  preload() {
    // Load assets using the AssetManager
    AssetManager.preloadAssets(this);
  }

  /**
   * Create method - automatically called by Phaser after preload
   * Sets up the game scene, UI elements, and event handlers
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

    // Create the perspective road
    this.createPerspectiveRoad();

    // Create the sky and horizon
    this.createSkyAndHorizon();

    // Create side elements
    this.createSideElements();

    // Create the character
    this.createCharacter();

    // Set up input handlers
    this.setupInputHandlers();

    // Add keyboard shortcut for toggling FPS display (F key)
    this.input.keyboard.on('keydown-F', () => {
      this.performanceMonitor.toggleFPSDisplay();
    });
  }

  /**
   * Creates the sky and horizon
   */
  createSkyAndHorizon() {
    // Create sky gradient
    const horizonY = this.gameHeight * this.config.horizonLine;
    
    // Sky background (gradient from light blue to darker blue)
    this.sky = this.add.graphics();
    this.sky.fillGradientStyle(0x87CEEB, 0x87CEEB, 0x4682B4, 0x4682B4, 1);
    this.sky.fillRect(0, 0, this.gameWidth, horizonY);
    
    // Horizon line
    this.horizonLine = this.add.graphics();
    this.horizonLine.lineStyle(2, 0xFFFFFF, 0.5);
    this.horizonLine.lineBetween(0, horizonY, this.gameWidth, horizonY);
    
    // Ground (below horizon, above road)
    this.ground = this.add.graphics();
    this.ground.fillStyle(0x8B4513, 1); // Brown color for ground
    this.ground.fillRect(0, horizonY, this.gameWidth, this.gameHeight - horizonY);
  }

  /**
   * Creates the perspective road
   */
  createPerspectiveRoad() {
    // Calculate the horizon line position
    const horizonY = this.gameHeight * this.config.horizonLine;
    
    // Create road segments that get narrower toward the horizon
    this.roadSegments = [];
    const segmentCount = this.config.segmentCount;
    
    for (let i = 0; i < segmentCount; i++) {
      // Calculate segment position and size
      const segmentHeight = (this.gameHeight - horizonY) / segmentCount;
      const y = horizonY + (i * segmentHeight);
      
      // Calculate width with perspective (narrower toward horizon)
      const perspective = i / segmentCount;
      const width = this.gameWidth * this.config.roadWidth * (1 - perspective * 0.7);
      
      // Create the segment
      const segment = this.add.rectangle(
        this.gameWidth / 2, // x position (center)
        y + segmentHeight / 2, // y position (center of segment)
        width,
        segmentHeight,
        i % 2 === 0 ? 0x333333 : 0x444444 // Alternating colors
      );
      
      // Add to array
      this.roadSegments.push(segment);
      
      // Add lane markings
      if (this.config.laneCount > 1) {
        this.addLaneMarkings(segment, i, perspective);
      }
    }
  }

  /**
   * Adds lane markings to a road segment
   * 
   * @param {Phaser.GameObjects.Rectangle} segment - The road segment
   * @param {number} segmentIndex - The index of the segment
   * @param {number} perspective - The perspective factor (0-1)
   */
  addLaneMarkings(segment, segmentIndex, perspective) {
    const laneCount = this.config.laneCount;
    
    // Only add markings to every other segment for dashed lines
    if (segmentIndex % 2 !== 0) return;
    
    // Calculate lane widths
    const laneWidth = segment.width / laneCount;
    
    // Add lane markings
    for (let lane = 1; lane < laneCount; lane++) {
      // Calculate x position for this lane marking
      const xOffset = (lane * laneWidth) - (segment.width / 2);
      
      // Create lane marking
      const marking = this.add.rectangle(
        segment.x + xOffset,
        segment.y,
        2, // width
        segment.height * 0.8, // height (slightly shorter than segment)
        0xFFFFFF // white color
      );
      
      // Store reference to the marking
      segment.laneMarkings = segment.laneMarkings || [];
      segment.laneMarkings.push(marking);
    }
  }

  /**
   * Creates side elements (trees, poles, etc.)
   */
  createSideElements() {
    // Calculate the horizon line position
    const horizonY = this.gameHeight * this.config.horizonLine;
    
    // Create trees on both sides of the road
    this.sideElements = [];
    
    // Left side trees
    for (let i = 0; i < 10; i++) {
      // Calculate distance (0 = closest, 1 = horizon)
      const distance = i / 10;
      
      // Calculate position with perspective
      const y = horizonY + ((1 - distance) * (this.gameHeight - horizonY));
      const width = 30 * (1 - distance * 0.8); // Trees get smaller toward horizon
      const height = 60 * (1 - distance * 0.8);
      
      // Calculate x position (left side of road)
      const roadWidth = this.gameWidth * this.config.roadWidth * (1 - distance * 0.7);
      const x = (this.gameWidth - roadWidth) / 2 - width / 2 - 20 * (1 - distance);
      
      // Create tree (simple rectangle for now)
      const tree = this.add.rectangle(
        x,
        y,
        width,
        height,
        0x228B22 // Forest green
      );
      
      this.sideElements.push(tree);
      
      // Right side tree (mirrored)
      const rightTree = this.add.rectangle(
        this.gameWidth - x,
        y,
        width,
        height,
        0x228B22 // Forest green
      );
      
      this.sideElements.push(rightTree);
    }
  }

  /**
   * Creates the character sprite
   */
  createCharacter() {
    // Calculate the character's vertical position
    const characterY = this.gameHeight * 0.8;
    
    // Create the character sprite
    this.character = this.add.sprite(
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
    
    // Set the character's depth to be above the road
    this.character.setDepth(10);
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
    
    // Calculate the control area dimensions (bottom quarter of the screen)
    const controlAreaHeight = this.gameHeight * this.config.controlAreaHeight;
    const controlAreaY = this.gameHeight - (controlAreaHeight / 2);
    
    // Create a debug rectangle to visualize the control area
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
      controlAreaHeight            // height (quarter of the screen height)
    ).setOrigin(0.5).setInteractive();
    
    // Handle pointer down (click/touch start)
    this.controlArea.on('pointerdown', (pointer) => {
      // Store the initial position for drag detection
      this.state.dragStartX = pointer.x;
      this.state.dragX = pointer.x;
      
      // Determine lane change based on touch position
      if (pointer.x < this.gameWidth / 3) {
        // Left third of screen - move left
        this.changeLane(-1);
      } else if (pointer.x > (this.gameWidth * 2/3)) {
        // Right third of screen - move right
        this.changeLane(1);
      }
    });
  }

  /**
   * Change the character's lane
   * 
   * @param {number} direction - Direction to move (-1 = left, 1 = right)
   */
  changeLane(direction) {
    // Calculate the target lane
    const newLane = Phaser.Math.Clamp(
      this.state.currentLane + direction,
      0,
      this.config.laneCount - 1
    );
    
    // Only change if it's a different lane
    if (newLane !== this.state.currentLane) {
      this.state.targetLane = newLane;
      this.state.laneTransitionProgress = 0;
    }
  }

  /**
   * Get the x position for a specific lane
   * 
   * @param {number} lane - The lane number (0 = left, laneCount-1 = right)
   * @returns {number} The x position for the lane
   */
  getLanePosition(lane) {
    // Calculate the road width at the character's position
    const roadWidth = this.gameWidth * this.config.roadWidth;
    
    // Calculate lane width
    const laneWidth = roadWidth / this.config.laneCount;
    
    // Calculate the left edge of the road
    const roadLeftEdge = (this.gameWidth - roadWidth) / 2;
    
    // Calculate the center of the lane
    return roadLeftEdge + (lane * laneWidth) + (laneWidth / 2);
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

    // Handle keyboard input for lane changes
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
      this.changeLane(-1);
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
      this.changeLane(1);
    }
    
    // Handle ESC key for menu
    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      console.log("ESC key pressed - menu functionality to be implemented");
    }
    
    // Update lane transition
    if (this.state.laneTransitionProgress < 1) {
      // Increment progress
      this.state.laneTransitionProgress += 0.05;
      
      // Clamp to 1
      if (this.state.laneTransitionProgress >= 1) {
        this.state.laneTransitionProgress = 1;
        this.state.currentLane = this.state.targetLane;
      }
      
      // Calculate current position using easing
      const startPos = this.getLanePosition(this.state.currentLane);
      const endPos = this.getLanePosition(this.state.targetLane);
      const progress = Phaser.Math.Easing.Cubic.Out(this.state.laneTransitionProgress);
      
      // Update character position
      this.character.x = Phaser.Math.Linear(startPos, endPos, progress);
    }
  }

  /**
   * Project a 3D coordinate to a 2D screen position
   * 
   * @param {number} x - The x coordinate in 3D space
   * @param {number} z - The z coordinate in 3D space (depth)
   * @returns {Object} The projected coordinates and scale
   */
  projectToScreen(x, z) {
    // Prevent division by zero
    z = Math.max(z, 0.1);
    
    // Scale based on distance (z)
    const scale = this.config.cameraDepth / z;
    
    // Project x position with perspective
    const projectedX = (this.gameWidth / 2) + (scale * x * this.gameWidth / 2);
    
    // Project y position with perspective
    const projectedY = (this.gameHeight / 2) - (scale * this.config.cameraHeight * this.gameWidth / 2);
    
    return {
      x: projectedX,
      y: projectedY,
      scale: scale
    };
  }
}
