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
      roadSpeed: 2,           // Speed of the road scrolling
      characterSpeed: 5,      // Speed of character movement
      roadWidth: 0.6,         // Width of the road as a percentage of the game width
      segmentCount: 30,       // Number of road segments to create (increased for smoother appearance)
      horizonLine: 0.3,       // Position of the horizon line (percentage from top)
      cameraHeight: 1000,     // Virtual camera height
      cameraDepth: 0.84,      // Camera depth (field of view)
      laneCount: 7,           // Number of lanes (increased for more positions)
      showFPS: true,          // Whether to show the FPS counter
      maxDepthElements: 20,   // Maximum number of depth elements to create
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
      sparkleSize: 15,        // Size of the sparkle projectile
      obstacleSpawnInterval: 2000, // Time between obstacle spawns in ms
      obstacleSpeed: 2        // Speed of obstacles moving down the road
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
      currentLane: 3,         // Current lane (middle lane of 7)
      targetLane: 3,          // Target lane for smooth transitions
      laneTransitionProgress: 1.0, // Progress of lane transition (0-1)
      obstacleSpawnTimer: 0,  // Timer for spawning obstacles
      isInvulnerable: false,  // Whether the character is currently invulnerable after a collision
      invulnerabilityTimer: 0 // Timer for invulnerability period
    };

    // Game objects
    this.roadSegments = [];   // Array to store road segments
    this.sideElements = [];   // Array to store side elements (trees, etc.)
    this.obstacles = [];      // Array to store active obstacles
    this.projectiles = [];    // Array to store active projectiles


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

    // Create the top bar UI
    this.createTopBar();

    // Create the character
    this.createCharacter();

    // Create obstacle group
    this.createObstacleGroup();

    // Create projectile group
    this.createProjectileGroup();

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
    // Calculate the character's vertical position (lower third of the screen)
    const characterY = this.gameHeight * 0.75;

    // Create the character sprite using the back-view texture
    this.character = this.add.sprite(
      this.gameWidth / 2,                 // x position (center)
      characterY,                         // y position (in the lower third)
      AssetManager.keys.backViewCharacter // texture key for back-view
    );

    // Set the origin to the center
    this.character.setOrigin(0.5);

    // Apply scaling for the perspective view
    const characterScale = 1.2; // Slightly larger for better visibility
    this.character.setScale(characterScale);

    // Apply additional scaling for high-resolution screens if needed
    if (this.state.isHighResolution) {
      this.character.setScale(characterScale * this.config.uiScale);
    }

    // Set the character's depth to be above the road
    this.character.setDepth(10);

    // Add shadow beneath the character
    this.characterShadow = this.add.ellipse(
      this.character.x,
      this.character.y + this.character.height * 0.4,
      this.character.width * 0.8,
      this.character.height * 0.2,
      0x000000,
      0.3
    );
    this.characterShadow.setDepth(9);
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

      // Add banking animation (tilt the character in the direction of movement)
      this.tweens.add({
        targets: this.character,
        angle: direction * 15, // Tilt 15 degrees in the direction of movement
        duration: 200,
        yoyo: true, // Return to original angle
        ease: 'Sine.easeInOut'
      });

      // Add visual feedback for lane change
      this.createLaneChangeEffect(direction);
    }
  }

  /**
   * Create visual effect for lane change
   *
   * @param {number} direction - Direction of movement (-1 = left, 1 = right)
   */
  createLaneChangeEffect(direction) {
    // Create motion blur effect
    const blurCount = 3; // Number of blur images
    const blurAlpha = 0.3; // Alpha of the blur images

    for (let i = 1; i <= blurCount; i++) {
      // Create a ghost image of the character
      const ghost = this.add.image(
        this.character.x - (direction * i * 10),
        this.character.y,
        this.character.texture.key
      );

      // Set properties
      ghost.setOrigin(0.5);
      ghost.setScale(this.character.scaleX * 0.9);
      ghost.setAlpha(blurAlpha / i); // Fade out with distance
      ghost.setTint(0x3498db); // Blue tint
      ghost.setDepth(this.character.depth - 1);

      // Fade out and destroy
      this.tweens.add({
        targets: ghost,
        alpha: 0,
        duration: 200,
        onComplete: () => {
          ghost.destroy();
        }
      });
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
   * Detect near misses between character and obstacles
   * A near miss is when an obstacle passes close to the character without colliding
   */
  detectNearMiss() {
    // Only check for near misses if the character is not invulnerable
    if (this.state.isInvulnerable) return;

    // Get the character's current lane
    const characterLane = this.state.currentLane;

    // Check each obstacle
    for (const obstacle of this.obstacles) {
      // Skip obstacles that are too far away (near horizon)
      const distanceFromHorizon = (obstacle.y - this.gameHeight * this.config.horizonLine) /
                                 (this.gameHeight - this.gameHeight * this.config.horizonLine);
      if (distanceFromHorizon < 0.7) continue; // Only check obstacles that are close

      // Check if the obstacle is in an adjacent lane
      const laneDifference = Math.abs(characterLane - obstacle.lane);

      // If the obstacle is in an adjacent lane and is close to the character vertically
      if (laneDifference === 1 &&
          Math.abs(obstacle.y - this.character.y) < this.character.height * 0.7) {
        // This is a near miss!
        this.createNearMissEffect(obstacle);

        // Increase score slightly for a near miss
        this.config.score += 5;
        this.updateScore(this.config.score);

        // Mark the obstacle as having triggered a near miss
        obstacle.nearMissTriggered = true;
      }
    }
  }

  /**
   * Create a visual effect for a near miss
   *
   * @param {Phaser.GameObjects.Sprite} obstacle - The obstacle that was nearly missed
   */
  createNearMissEffect(obstacle) {
    // Create a flash effect
    const flash = this.add.rectangle(
      this.character.x,
      this.character.y,
      this.gameWidth,
      this.gameHeight,
      0xFFFFFF,
      0.2
    );
    flash.setDepth(100);

    // Fade out and destroy
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        flash.destroy();
      }
    });

    // Add a text indicator
    const nearMissText = this.add.text(
      this.character.x,
      this.character.y - 50,
      'NEAR MISS!',
      {
        font: '24px Arial',
        fill: '#FFFF00'
      }
    );
    nearMissText.setOrigin(0.5);
    nearMissText.setDepth(101);

    // Animate and destroy the text
    this.tweens.add({
      targets: nearMissText,
      y: nearMissText.y - 30,
      alpha: 0,
      duration: 800,
      onComplete: () => {
        nearMissText.destroy();
      }
    });

    // Add camera shake for feedback
    this.cameras.main.shake(100, 0.005);

    // Add speed lines for visual effect
    this.createSpeedLines(5); // Create more speed lines than usual
  }

  /**
   * Update method - automatically called by Phaser on each frame
   * Handles game logic that needs to run continuously
   */
  update(time, delta) {
    // Skip updates if the game is paused
    if (this.state.isPaused || this.state.menuOpen || this.state.confirmDialogOpen) return;

    // Update performance monitor
    this.performanceMonitor.update();

    // Update road segments to create scrolling effect
    for (let i = 0; i < this.roadSegments.length; i++) {
      const segment = this.roadSegments[i];
      segment.y += this.config.roadSpeed;

      // If the segment has lane markings, update them too
      if (segment.laneMarkings) {
        segment.laneMarkings.forEach(marking => {
          marking.y += this.config.roadSpeed;
        });
      }

      // If the segment goes off screen, move it back to the top
      if (segment.y > this.gameHeight + segment.height) {
        // Calculate new y position at the top
        const topSegment = this.roadSegments[0];
        segment.y = topSegment.y - segment.height;

        // Move this segment to the beginning of the array
        this.roadSegments.splice(i, 1);
        this.roadSegments.unshift(segment);
        i--; // Adjust index since we modified the array
      }
    }

    // Update side elements
    for (let i = 0; i < this.sideElements.length; i++) {
      const element = this.sideElements[i];
      element.y += this.config.roadSpeed * 0.8; // Slightly slower for parallax effect

      // If the element goes off screen, move it back to the top
      if (element.y > this.gameHeight + element.height) {
        element.y = this.gameHeight * this.config.horizonLine;
        element.setScale(0.2); // Small at horizon
      } else {
        // Scale up as it gets closer
        const distanceFromHorizon = (element.y - this.gameHeight * this.config.horizonLine) /
                                   (this.gameHeight - this.gameHeight * this.config.horizonLine);
        element.setScale(0.2 + distanceFromHorizon * 0.8);
      }
    }

    // Update obstacle spawn timer
    this.state.obstacleSpawnTimer += delta;
    if (this.state.obstacleSpawnTimer >= this.config.obstacleSpawnInterval) {
      this.state.obstacleSpawnTimer = 0;
      this.createObstacle();
    }

    // Update obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.obstacles[i];

      // Calculate distance from horizon (0 at horizon, 1 at bottom of screen)
      const distanceFromHorizon = (obstacle.y - this.gameHeight * this.config.horizonLine) /
                                 (this.gameHeight - this.gameHeight * this.config.horizonLine);

      // Adjust movement speed based on distance (faster when closer to viewer)
      const speedFactor = 0.5 + distanceFromHorizon * 1.5; // Range: 0.5x to 2.0x speed
      obstacle.y += this.config.obstacleSpeed * speedFactor;

      // Scale based on distance from horizon
      obstacle.setScale(0.2 + distanceFromHorizon * 0.8);

      // Update hitbox based on distance
      if (obstacle.updateHitboxByDistance) {
        obstacle.updateHitboxByDistance(distanceFromHorizon);
      }

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

      // Move the projectile up toward the horizon
      projectile.y -= this.config.projectileSpeed;

      // Scale down as it moves toward the horizon
      const distanceToHorizon = (projectile.y - this.gameHeight * this.config.horizonLine) /
                               (this.gameHeight - this.gameHeight * this.config.horizonLine);
      projectile.setScale(Math.max(0.1, distanceToHorizon * 0.5));

      // Update the particle emitter position
      if (projectile.particles) {
        projectile.particles.setPosition(projectile.x, projectile.y);
      }

      // Update the glow effect position
      if (projectile.glow) {
        projectile.glow.setPosition(projectile.x, projectile.y);
        projectile.glow.setScale(projectile.scale * 1.5);
      }

      // Remove projectiles that reach the horizon
      if (projectile.y < this.gameHeight * this.config.horizonLine) {
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

    // Handle keyboard input for lane changes
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
      this.changeLane(-1);
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
      this.changeLane(1);
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

    // Handle space bar for firing
    if (Phaser.Input.Keyboard.JustDown(this.spaceBar)) {
      this.fireProjectile();
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

      // Update character shadow position
      if (this.characterShadow) {
        this.characterShadow.x = this.character.x;
      }
    }

    // Add subtle floating animation to the character when not changing lanes
    if (this.state.laneTransitionProgress >= 1 && !this.character.floatingTween) {
      this.character.floatingTween = this.tweens.add({
        targets: this.character,
        y: this.character.y - 3,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          this.character.floatingTween = null;
        }
      });
    }

    // Add camera shake effect when hitting rough terrain (randomly)
    if (Phaser.Math.Between(1, 1000) === 1) {
      this.cameras.main.shake(200, 0.002);
    }

    // Create occasional speed lines for visual feedback
    if (Phaser.Math.Between(1, 60) === 1) {
      this.createSpeedLines();
    }

    // Check for near misses
    this.detectNearMiss();
  }

  /**
   * Create speed lines for visual feedback of movement
   *
   * @param {number} [count] - Optional number of lines to create (if not provided, a random number is used)
   */
  createSpeedLines(count) {
    const lineCount = count || Phaser.Math.Between(2, 5);

    for (let i = 0; i < lineCount; i++) {
      // Random position on the sides of the road
      const side = Phaser.Math.Between(0, 1) === 0 ? -1 : 1; // Left or right side
      const x = this.gameWidth / 2 + side * Phaser.Math.Between(
        this.gameWidth * 0.3,
        this.gameWidth * 0.45
      );

      const y = Phaser.Math.Between(
        this.gameHeight * 0.3, // Start from horizon
        this.gameHeight * 0.7  // End before character
      );

      // Create the speed line
      const length = Phaser.Math.Between(50, 150);
      const line = this.add.line(
        x, y,
        0, 0,
        0, length,
        0xFFFFFF, 0.7
      );
      line.setLineWidth(2);
      line.setDepth(5);

      // Animate the line
      this.tweens.add({
        targets: line,
        y: this.gameHeight + 100, // Move down off screen
        scaleX: 2,
        scaleY: 2,
        alpha: 0,
        duration: 500,
        onComplete: () => {
          line.destroy();
        }
      });
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
    this.topBar.setDepth(100);

    // Create menu button
    this.createMenuButton();
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
    this.menuButton = this.add.circle(
      this.gameWidth - 30,           // x position (near right edge)
      this.config.topBarHeight / 2,  // y position (centered in top bar)
      15 * uiScale,                  // radius
      0x333333                       // color
    );

    // Add the dots for the ellipsis
    const dotRadius = 2 * uiScale;
    const dotSpacing = 5 * uiScale;

    for (let i = 0; i < 3; i++) {
      const dot = this.add.circle(
        this.gameWidth - 30,
        this.config.topBarHeight / 2 + (i - 1) * dotSpacing,
        dotRadius,
        0xffffff
      );
      this.menuButton.dot = dot;
    }

    // Make the menu button interactive
    this.menuButton.setInteractive({ useHandCursor: true });

    // Set the depth to ensure it's above other elements
    this.menuButton.setDepth(101);

    // Add hover effects for visual feedback
    this.menuButton.on('pointerover', () => {
      this.menuButton.setFillStyle(0x444444);
    });

    this.menuButton.on('pointerout', () => {
      this.menuButton.setFillStyle(0x333333);
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
   * Opens the game menu
   */
  openMenu() {
    // Set menu state
    this.state.menuOpen = true;

    // Create menu background
    this.menuBackground = this.add.rectangle(
      this.gameWidth / 2,
      this.gameHeight / 2,
      this.gameWidth * 0.8,
      this.gameHeight * 0.7,
      0x222222,
      0.9
    );
    this.menuBackground.setDepth(200);

    // Create menu title
    this.menuTitle = this.add.text(
      this.gameWidth / 2,
      this.gameHeight * 0.2,
      'MENU',
      {
        font: '32px Arial',
        fill: '#ffffff'
      }
    );
    this.menuTitle.setOrigin(0.5);
    this.menuTitle.setDepth(201);

    // Create menu options
    const menuOptions = ['Resume', 'Restart', 'Exit'];
    this.menuButtons = [];

    menuOptions.forEach((option, index) => {
      const button = this.add.rectangle(
        this.gameWidth / 2,
        this.gameHeight * 0.35 + index * 70,
        this.gameWidth * 0.6,
        50,
        0x333333
      );
      button.setInteractive({ useHandCursor: true });
      button.setDepth(201);

      const text = this.add.text(
        this.gameWidth / 2,
        this.gameHeight * 0.35 + index * 70,
        option,
        {
          font: '24px Arial',
          fill: '#ffffff'
        }
      );
      text.setOrigin(0.5);
      text.setDepth(202);

      // Add hover effects
      button.on('pointerover', () => {
        button.setFillStyle(0x444444);
      });

      button.on('pointerout', () => {
        button.setFillStyle(0x333333);
      });

      // Add click handler
      button.on('pointerdown', () => {
        switch (option) {
          case 'Resume':
            this.closeMenu();
            break;
          case 'Restart':
            this.closeMenu();
            this.scene.restart();
            break;
          case 'Exit':
            this.showExitConfirmation();
            break;
        }
      });

      this.menuButtons.push({ button, text });
    });
  }

  /**
   * Closes the game menu
   */
  closeMenu() {
    // Set menu state
    this.state.menuOpen = false;

    // Destroy menu elements
    this.menuBackground.destroy();
    this.menuTitle.destroy();

    this.menuButtons.forEach(({ button, text }) => {
      button.destroy();
      text.destroy();
    });

    this.menuButtons = [];
  }

  /**
   * Shows the exit confirmation dialog
   */
  showExitConfirmation() {
    // Set confirmation dialog state
    this.state.confirmDialogOpen = true;

    // Create confirmation background
    this.confirmBackground = this.add.rectangle(
      this.gameWidth / 2,
      this.gameHeight / 2,
      this.gameWidth * 0.6,
      this.gameHeight * 0.3,
      0x111111,
      0.95
    );
    this.confirmBackground.setDepth(300);

    // Create confirmation text
    this.confirmText = this.add.text(
      this.gameWidth / 2,
      this.gameHeight * 0.4,
      'Are you sure you want to exit?',
      {
        font: '24px Arial',
        fill: '#ffffff'
      }
    );
    this.confirmText.setOrigin(0.5);
    this.confirmText.setDepth(301);

    // Create confirmation buttons
    this.confirmButtons = [];
    const options = ['Yes', 'No'];

    options.forEach((option, index) => {
      const buttonWidth = this.gameWidth * 0.2;
      const spacing = buttonWidth + 20;
      const startX = this.gameWidth / 2 - spacing / 2 + index * spacing;

      const button = this.add.rectangle(
        startX,
        this.gameHeight * 0.5,
        buttonWidth,
        50,
        option === 'Yes' ? 0xaa0000 : 0x006600
      );
      button.setInteractive({ useHandCursor: true });
      button.setDepth(301);

      const text = this.add.text(
        startX,
        this.gameHeight * 0.5,
        option,
        {
          font: '20px Arial',
          fill: '#ffffff'
        }
      );
      text.setOrigin(0.5);
      text.setDepth(302);

      // Add hover effects
      button.on('pointerover', () => {
        button.setFillStyle(option === 'Yes' ? 0xdd0000 : 0x008800);
      });

      button.on('pointerout', () => {
        button.setFillStyle(option === 'Yes' ? 0xaa0000 : 0x006600);
      });

      // Add click handler
      button.on('pointerdown', () => {
        if (option === 'Yes') {
          // Return to main menu or title screen
          this.scene.start('MainScene');
        } else {
          this.closeExitConfirmation();
        }
      });

      this.confirmButtons.push({ button, text });
    });
  }

  /**
   * Closes the exit confirmation dialog
   */
  closeExitConfirmation() {
    // Set confirmation dialog state
    this.state.confirmDialogOpen = false;

    // Destroy confirmation elements
    this.confirmBackground.destroy();
    this.confirmText.destroy();

    this.confirmButtons.forEach(({ button, text }) => {
      button.destroy();
      text.destroy();
    });

    this.confirmButtons = [];
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
   * Create a new obstacle
   */
  createObstacle() {
    // Randomly select a lane for the obstacle
    const lane = Phaser.Math.Between(0, this.config.laneCount - 1);

    // Calculate the obstacle's position
    const x = this.getLanePosition(lane);
    const y = this.gameHeight * this.config.horizonLine; // Start at horizon

    // Create the obstacle sprite
    const obstacle = this.physics.add.sprite(x, y, 'characterTexture');

    // Set the obstacle's tint to make it visually distinct
    obstacle.setTint(0xff0000); // Red tint

    // Scale the obstacle based on distance (small at horizon)
    obstacle.setScale(0.2);

    // Set the obstacle's depth to be above the road but below the character
    obstacle.setDepth(5);

    // Add the obstacle to the physics group
    this.obstacleGroup.add(obstacle);

    // Store the obstacle in our array for easy access
    this.obstacles.push(obstacle);

    // Store the lane for this obstacle
    obstacle.lane = lane;

    // Set up a method to update the hitbox based on distance
    obstacle.updateHitboxByDistance = (distance) => {
      // Calculate hitbox size based on distance (smaller when far away)
      const hitboxScale = 0.2 + distance * 0.8; // 0.2 at horizon, 1.0 at bottom
      const width = obstacle.width * 0.7 * hitboxScale;
      const height = obstacle.height * 0.7 * hitboxScale;

      // Update the physics body size
      obstacle.body.setSize(width, height);
      obstacle.body.setOffset(
        (obstacle.width - width) / 2,
        (obstacle.height - height) / 2
      );
    };

    // Initialize hitbox (will be updated in the update loop)
    obstacle.updateHitboxByDistance(0); // Start with small hitbox at horizon

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
    const newHealth = this.config.health - 10;
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
}
