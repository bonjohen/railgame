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
      obstacleSpeed: 2,       // Speed of obstacles moving down the road

      // Weather and environment effects
      weather: 'clear',       // Current weather: 'clear', 'rain', 'fog'
      weatherIntensity: 0.5,  // Intensity of weather effects (0-1)
      timeOfDay: 'day',       // Time of day: 'day', 'dusk', 'night', 'dawn'
      fogDistance: 0.7,       // Distance at which fog reaches maximum density (0-1)
      fogColor: 0xCCCCCC,     // Color of the fog
      rainCount: 100,         // Number of raindrops to create
      rainSpeed: 10,          // Speed of rainfall
      enableLighting: true    // Whether to enable lighting effects
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

    // Create static road borders
    this.createStaticRoadBorders();

    // Initialize empty arrays for side elements, obstacles, and projectiles
    this.sideElements = [];
    this.obstacles = [];
    this.projectiles = [];
    this.reflections = [];

    // Create distance fog effect
    this.createDistanceFog();

    // Create weather effects
    this.createWeatherEffects();

    // Apply lighting effects
    this.applyLightingEffects();

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

    // Determine sky colors based on time of day
    let skyTopColor, skyBottomColor, groundColor;

    switch (this.config.timeOfDay) {
      case 'dawn':
        skyTopColor = 0x1E3B8A; // Dark blue
        skyBottomColor = 0xE67E22; // Orange
        groundColor = 0x5D4037; // Dark brown
        break;
      case 'day':
        skyTopColor = 0x87CEEB; // Light blue
        skyBottomColor = 0x4682B4; // Darker blue
        groundColor = 0x8B4513; // Brown
        break;
      case 'dusk':
        skyTopColor = 0x2C3E50; // Dark blue
        skyBottomColor = 0xE74C3C; // Red-orange
        groundColor = 0x5D4037; // Dark brown
        break;
      case 'night':
        skyTopColor = 0x0D0D2D; // Very dark blue
        skyBottomColor = 0x1A1A40; // Dark blue-purple
        groundColor = 0x2C2C2C; // Very dark gray
        break;
      default:
        skyTopColor = 0x87CEEB; // Light blue
        skyBottomColor = 0x4682B4; // Darker blue
        groundColor = 0x8B4513; // Brown
    }

    // Sky background with gradient
    this.sky = this.add.graphics();
    this.sky.fillGradientStyle(skyTopColor, skyTopColor, skyBottomColor, skyBottomColor, 1);
    this.sky.fillRect(0, 0, this.gameWidth, horizonY);

    // Add stars if it's night
    if (this.config.timeOfDay === 'night') {
      this.createStars();
    }

    // Horizon line
    this.horizonLine = this.add.graphics();
    this.horizonLine.lineStyle(2, 0xFFFFFF, 0.5);
    this.horizonLine.lineBetween(0, horizonY, this.gameWidth, horizonY);

    // Ground (below horizon, above road)
    this.ground = this.add.graphics();
    this.ground.fillStyle(groundColor, 1);
    this.ground.fillRect(0, horizonY, this.gameWidth, this.gameHeight - horizonY);
  }

  /**
   * Creates stars in the night sky
   */
  createStars() {
    const horizonY = this.gameHeight * this.config.horizonLine;
    const starCount = 100;
    this.stars = [];

    for (let i = 0; i < starCount; i++) {
      const x = Math.random() * this.gameWidth;
      const y = Math.random() * horizonY * 0.9; // Keep stars away from horizon
      const size = 1 + Math.random() * 2;
      const brightness = 0.5 + Math.random() * 0.5;

      const star = this.add.circle(x, y, size, 0xFFFFFF, brightness);
      star.setDepth(1);

      // Add twinkling effect to some stars
      if (Math.random() < 0.3) {
        this.tweens.add({
          targets: star,
          alpha: 0.3,
          duration: 1000 + Math.random() * 2000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }

      this.stars.push(star);
    }
  }

  /**
   * Creates a distance fog effect for depth enhancement
   */
  createDistanceFog() {
    // Calculate the horizon line position
    const horizonY = this.gameHeight * this.config.horizonLine;

    // Create a container for the distance fog
    this.distanceFogContainer = this.add.container(0, 0);
    this.distanceFogContainer.setDepth(20); // Above road but below most elements

    // Create the distance fog gradient
    this.distanceFog = this.add.graphics();

    // Determine fog color based on time of day
    let fogColor;
    switch (this.config.timeOfDay) {
      case 'dawn':
        fogColor = 0xE67E22; // Orange tint
        break;
      case 'day':
        fogColor = 0xFFFFFF; // White
        break;
      case 'dusk':
        fogColor = 0xE74C3C; // Red-orange tint
        break;
      case 'night':
        fogColor = 0x1A1A40; // Dark blue tint
        break;
      default:
        fogColor = 0xFFFFFF; // White
    }

    // Create a gradient from transparent at the bottom to opaque at the horizon
    this.distanceFog.fillGradientStyle(
      fogColor, fogColor, fogColor, fogColor,
      0.3, // Top alpha (at horizon)
      0.3, // Top alpha
      0, // Bottom alpha (transparent at bottom)
      0  // Bottom alpha
    );

    // Fill the area from horizon to bottom of screen
    this.distanceFog.fillRect(0, horizonY, this.gameWidth, this.gameHeight - horizonY);

    // Add to container
    this.distanceFogContainer.add(this.distanceFog);
  }

  /**
   * Creates weather effects (rain, fog)
   */
  createWeatherEffects() {
    // Create container for weather effects
    this.weatherEffects = this.add.container(0, 0);
    this.weatherEffects.setDepth(50); // Above most elements but below UI

    // Initialize weather-specific elements as null
    this.raindrops = null;
    this.fogLayer = null;

    // Apply the current weather
    this.setWeather(this.config.weather, this.config.weatherIntensity);
  }

  /**
   * Sets the current weather effect
   *
   * @param {string} weatherType - The type of weather ('clear', 'rain', 'fog')
   * @param {number} intensity - The intensity of the effect (0-1)
   */
  setWeather(weatherType, intensity) {
    // Store the current weather settings
    this.config.weather = weatherType;
    this.config.weatherIntensity = Phaser.Math.Clamp(intensity, 0, 1);

    // Clear existing weather effects
    this.clearWeatherEffects();

    // Create the new weather effect
    switch (weatherType) {
      case 'rain':
        this.createRain();
        break;
      case 'fog':
        this.createFog();
        break;
      case 'clear':
      default:
        // No effects for clear weather
        break;
    }
  }

  /**
   * Clears all active weather effects
   */
  clearWeatherEffects() {
    // Clear raindrops
    if (this.raindrops) {
      this.raindrops.forEach(drop => drop.destroy());
      this.raindrops = null;
    }

    // Clear fog
    if (this.fogLayer) {
      this.fogLayer.destroy();
      this.fogLayer = null;
    }
  }

  /**
   * Creates rain effect
   */
  createRain() {
    // Calculate raindrop count based on intensity
    const dropCount = Math.floor(this.config.rainCount * this.config.weatherIntensity);
    this.raindrops = [];

    // Create raindrops
    for (let i = 0; i < dropCount; i++) {
      // Random position
      const x = Math.random() * this.gameWidth;
      const y = Math.random() * this.gameHeight;

      // Create raindrop (line)
      const length = 10 + Math.random() * 15; // Random length
      const angle = Math.PI / 4; // 45 degrees
      const drop = this.add.line(
        x, y,
        0, 0,
        Math.cos(angle) * length, Math.sin(angle) * length,
        0xAAAAAA, // Light gray
        0.7 * this.config.weatherIntensity // Alpha based on intensity
      );
      drop.setLineWidth(1);

      // Store velocity for animation
      drop.velocityX = this.config.rainSpeed * 0.5;
      drop.velocityY = this.config.rainSpeed;

      // Add to container and array
      this.weatherEffects.add(drop);
      this.raindrops.push(drop);
    }
  }

  /**
   * Creates fog effect
   */
  createFog() {
    // Create a full-screen rectangle for the fog
    this.fogLayer = this.add.rectangle(
      this.gameWidth / 2,
      this.gameHeight / 2,
      this.gameWidth,
      this.gameHeight,
      this.config.fogColor,
      this.config.weatherIntensity * 0.7 // Alpha based on intensity
    );

    // Add to container
    this.weatherEffects.add(this.fogLayer);

    // Create distance fog effect (gradient mask)
    const fogMask = this.add.graphics();
    fogMask.fillGradientStyle(
      this.config.fogColor, this.config.fogColor,
      this.config.fogColor, this.config.fogColor,
      0, // Top alpha
      0, // Top alpha
      this.config.weatherIntensity, // Bottom alpha
      this.config.weatherIntensity // Bottom alpha
    );
    fogMask.fillRect(0, 0, this.gameWidth, this.gameHeight);

    // Create a mask for the fog to create distance effect
    const horizonY = this.gameHeight * this.config.horizonLine;
    const fogDistanceY = horizonY + (this.gameHeight - horizonY) * this.config.fogDistance;

    const distanceMask = this.add.graphics();
    distanceMask.fillGradientStyle(
      0xFFFFFF, 0xFFFFFF, 0xFFFFFF, 0xFFFFFF,
      0, // Top alpha (transparent at horizon)
      0, // Top alpha
      1, // Bottom alpha (opaque at bottom)
      1  // Bottom alpha
    );
    distanceMask.fillRect(0, horizonY, this.gameWidth, this.gameHeight - horizonY);

    // Apply the mask to the fog layer
    this.fogLayer.setMask(new Phaser.Display.Masks.GeometryMask(this, distanceMask));
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

    // Create a container for reflections
    this.reflectionContainer = this.add.container(0, 0);
    this.reflectionContainer.setDepth(3); // Above road but below most elements
    this.reflections = [];

    // Determine reflection properties based on time of day and weather
    let reflectionIntensity = 0.2; // Base reflection intensity

    // Adjust reflection intensity based on time of day
    if (this.config.timeOfDay === 'night') {
      reflectionIntensity = 0.4; // Stronger reflections at night
    } else if (this.config.timeOfDay === 'dusk' || this.config.timeOfDay === 'dawn') {
      reflectionIntensity = 0.3; // Medium reflections at dusk/dawn
    }

    // Adjust reflection intensity based on weather
    if (this.config.weather === 'rain') {
      reflectionIntensity *= 1.5; // Stronger reflections when wet
    } else if (this.config.weather === 'fog') {
      reflectionIntensity *= 0.7; // Weaker reflections in fog
    }

    // Create segments from horizon to bottom (narrower at horizon, wider at bottom)
    for (let i = 0; i < segmentCount; i++) {
      // Calculate segment position and size
      const segmentHeight = (this.gameHeight - horizonY) / segmentCount;
      const y = horizonY + (i * segmentHeight);

      // Calculate width with perspective (narrower toward horizon)
      const perspective = i / segmentCount;
      const width = this.gameWidth * this.config.roadWidth * (perspective * 0.7 + 0.3);

      // Create the segment
      const segment = this.add.rectangle(
        this.gameWidth / 2, // x position (center)
        y + segmentHeight / 2, // y position (center of segment)
        width,
        segmentHeight,
        i % 2 === 0 ? 0x333333 : 0x444444 // Alternating colors
      );

      // Add glossy reflection effect to the road
      if (i > 0) { // Skip the first segment at the horizon
        // Create a reflection highlight on the road
        // The reflection is more visible on the lower part of the road (closer to viewer)
        const reflectionAlpha = reflectionIntensity * (i / segmentCount); // Stronger reflections closer to viewer

        // Create a gradient reflection that's stronger in the center of the road
        const reflection = this.add.graphics();

        // Determine reflection color based on time of day
        let reflectionColor;
        switch (this.config.timeOfDay) {
          case 'dawn':
            reflectionColor = 0xE67E22; // Orange reflection at dawn
            break;
          case 'day':
            reflectionColor = 0x87CEEB; // Sky blue reflection during day
            break;
          case 'dusk':
            reflectionColor = 0xE74C3C; // Red-orange reflection at dusk
            break;
          case 'night':
            reflectionColor = 0xFFFFFF; // White/moonlight reflection at night
            break;
          default:
            reflectionColor = 0xFFFFFF; // Default white reflection
        }

        // Create a radial gradient for the reflection
        const gradientWidth = width * 0.8;
        reflection.fillStyle(reflectionColor, reflectionAlpha);
        reflection.fillRect(
          this.gameWidth / 2 - gradientWidth / 2,
          y,
          gradientWidth,
          segmentHeight * 0.8
        );

        // Add the reflection to the container
        this.reflectionContainer.add(reflection);
        this.reflections.push(reflection);

        // Add puddle reflections if it's raining
        if (this.config.weather === 'rain' && Math.random() < 0.3) {
          this.createRoadPuddle(y + segmentHeight / 2, width, segmentHeight, perspective);
        }
      }

      // Add to array
      this.roadSegments.push(segment);

      // Add lane markings
      if (this.config.laneCount > 1) {
        this.addLaneMarkings(segment, i, perspective);
      }
    }
  }

  /**
   * Creates a puddle reflection on the road
   *
   * @param {number} y - The y position of the puddle
   * @param {number} roadWidth - The width of the road at this position
   * @param {number} segmentHeight - The height of the road segment
   * @param {number} perspective - The perspective factor (0-1)
   */
  createRoadPuddle(y, roadWidth, segmentHeight, perspective) {
    // Randomly position the puddle on the road
    const puddleWidth = roadWidth * (0.1 + Math.random() * 0.2); // 10-30% of road width
    const puddleHeight = segmentHeight * (0.5 + Math.random() * 0.5); // 50-100% of segment height

    // Random position within the road width
    const offsetX = (Math.random() - 0.5) * (roadWidth - puddleWidth);
    const x = this.gameWidth / 2 + offsetX;

    // Create the puddle shape (ellipse)
    const puddle = this.add.ellipse(
      x,
      y,
      puddleWidth,
      puddleHeight,
      0x87CEEB, // Sky blue color
      0.3 + Math.random() * 0.2 // Random opacity between 0.3-0.5
    );

    // Add a highlight to the puddle
    const highlight = this.add.ellipse(
      x,
      y - puddleHeight * 0.2,
      puddleWidth * 0.7,
      puddleHeight * 0.3,
      0xFFFFFF,
      0.2
    );

    // Set depth to be just above the road
    puddle.setDepth(3.5);
    highlight.setDepth(3.6);

    // Store reference to the highlight
    puddle.highlight = highlight;

    // Add to the reflection container
    this.reflectionContainer.add(puddle);
    this.reflectionContainer.add(highlight);
    this.reflections.push(puddle);
  }

  /**
   * Creates a reflection of an object on the road
   *
   * @param {Phaser.GameObjects.GameObject} object - The object to reflect
   * @param {number} reflectionAlpha - The opacity of the reflection
   */
  createObjectReflection(object, reflectionAlpha = 0.3) {
    // Only create reflections for objects that are on or near the road
    const horizonY = this.gameHeight * this.config.horizonLine;
    const roadWidth = this.gameWidth * this.config.roadWidth;
    const roadLeft = this.gameWidth / 2 - roadWidth / 2;
    const roadRight = this.gameWidth / 2 + roadWidth / 2;

    // Skip if the object is above the horizon or outside the road width
    if (object.y < horizonY || object.x < roadLeft || object.x > roadRight) {
      return;
    }

    // Calculate the distance from horizon (0-1)
    const distanceFromHorizon = (object.y - horizonY) / (this.gameHeight - horizonY);

    // Skip if the object is too close to the horizon
    if (distanceFromHorizon < 0.1) {
      return;
    }

    // Calculate reflection position (mirrored vertically below the object)
    const reflectionY = object.y + object.height * object.scale * 0.5;

    // Create the reflection based on object type
    let reflection;

    if (object.type === 'Sprite') {
      // For sprites, create a flipped copy
      reflection = this.add.sprite(object.x, reflectionY, object.texture.key);
      reflection.setScale(object.scaleX, -object.scaleY * 0.5); // Flip vertically and make shorter
      reflection.setAlpha(reflectionAlpha * distanceFromHorizon); // Fade with distance
      reflection.setTint(object.tintTopLeft || 0xFFFFFF); // Match the object's tint
    } else if (object.type === 'Rectangle') {
      // For rectangles, create a similar rectangle
      reflection = this.add.rectangle(
        object.x,
        reflectionY,
        object.width,
        object.height * 0.5, // Make the reflection shorter
        object.fillColor,
        reflectionAlpha * distanceFromHorizon
      );
    } else if (object.type === 'Ellipse') {
      // For ellipses, create a similar ellipse
      reflection = this.add.ellipse(
        object.x,
        reflectionY,
        object.width,
        object.height * 0.5, // Make the reflection shorter
        object.fillColor,
        reflectionAlpha * distanceFromHorizon
      );
    }

    if (reflection) {
      // Set depth to be just above the road but below the object
      reflection.setDepth(object.depth - 0.1);

      // Add to the reflection container
      this.reflectionContainer.add(reflection);
      this.reflections.push(reflection);

      // Store reference to the original object
      reflection.sourceObject = object;

      // Store reference to the reflection in the original object
      object.reflection = reflection;
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
   * Creates static road borders on the left and right edges
   */
  createStaticRoadBorders() {
    // Calculate the horizon line position
    const horizonY = this.gameHeight * this.config.horizonLine;

    // Calculate the road width at the bottom of the screen
    const bottomRoadWidth = this.gameWidth * this.config.roadWidth;

    // Calculate the road width at the horizon (narrower due to perspective)
    const horizonRoadWidth = bottomRoadWidth * 0.1; // Much narrower at horizon

    // Calculate the left and right edge positions at the bottom
    const bottomLeftX = this.gameWidth / 2 - bottomRoadWidth / 2;
    const bottomRightX = this.gameWidth / 2 + bottomRoadWidth / 2;

    // Calculate the left and right edge positions at the horizon
    const horizonLeftX = this.gameWidth / 2 - horizonRoadWidth / 2;
    const horizonRightX = this.gameWidth / 2 + horizonRoadWidth / 2;

    // Create the left border (polygon shape to account for perspective)
    const leftBorder = this.add.polygon(
      0, 0, // These will be ignored as we're using absolute points
      [
        { x: horizonLeftX, y: horizonY },
        { x: bottomLeftX, y: this.gameHeight },
        { x: bottomLeftX + 4, y: this.gameHeight },
        { x: horizonLeftX + 1, y: horizonY }
      ],
      0xFF0000 // Red color
    );
    leftBorder.setDepth(6); // Above road

    // Create the right border (polygon shape to account for perspective)
    const rightBorder = this.add.polygon(
      0, 0, // These will be ignored as we're using absolute points
      [
        { x: horizonRightX, y: horizonY },
        { x: bottomRightX, y: this.gameHeight },
        { x: bottomRightX - 4, y: this.gameHeight },
        { x: horizonRightX - 1, y: horizonY }
      ],
      0xFF0000 // Red color
    );
    rightBorder.setDepth(6); // Above road
  }

  /**
   * Creates side elements (trees, buildings, terrain features, etc.)
   */
  createSideElements() {
    // Calculate the horizon line position
    const horizonY = this.gameHeight * this.config.horizonLine;

    // Create elements on both sides of the road
    this.sideElements = [];

    // Number of elements to create on each side
    const elementCount = 20;

    // Element types
    const elementTypes = [
      { type: 'tree', probability: 0.4 },
      { type: 'pine', probability: 0.2 },
      { type: 'building', probability: 0.2 },
      { type: 'rock', probability: 0.1 },
      { type: 'bush', probability: 0.1 }
    ];

    // Create elements with varying distances
    for (let i = 0; i < elementCount; i++) {
      // Calculate distance (0 = closest, 1 = horizon)
      // Use non-linear distribution to have more elements near the horizon
      const distance = Math.pow(i / elementCount, 0.8);

      // Calculate position with perspective
      const y = horizonY + ((1 - distance) * (this.gameHeight - horizonY));

      // Calculate base width and height (elements get smaller toward horizon)
      const baseWidth = 30 * (1 - distance * 0.8);
      const baseHeight = 60 * (1 - distance * 0.8);

      // Calculate road width at this distance
      const roadWidth = this.gameWidth * this.config.roadWidth * (1 - distance * 0.7);

      // Calculate base x position (distance from road edge)
      const baseOffset = 20 * (1 - distance);

      // Create elements on both sides with random variations
      [-1, 1].forEach(side => {
        // Randomly determine if we should place an element at this position
        if (Math.random() < 0.7) { // 70% chance to place an element
          // Randomly select element type based on probabilities
          const rand = Math.random();
          let cumulativeProbability = 0;
          let selectedType = elementTypes[0].type;

          for (const element of elementTypes) {
            cumulativeProbability += element.probability;
            if (rand < cumulativeProbability) {
              selectedType = element.type;
              break;
            }
          }

          // Add random variation to position
          const xVariation = (Math.random() - 0.5) * 50 * (1 - distance);
          const yVariation = (Math.random() - 0.5) * 20 * (1 - distance);

          // Calculate final position
          let x, width, height, color;

          if (side === -1) { // Left side
            x = (this.gameWidth - roadWidth) / 2 - baseWidth / 2 - baseOffset + xVariation;
          } else { // Right side
            x = (this.gameWidth + roadWidth) / 2 + baseWidth / 2 + baseOffset + xVariation;
          }

          // Create the element based on its type
          switch (selectedType) {
            case 'tree':
              width = baseWidth * (0.8 + Math.random() * 0.4); // Random size variation
              height = baseHeight * (0.9 + Math.random() * 0.3);
              color = 0x228B22; // Forest green
              this.createTree(x, y + yVariation, width, height, distance);
              break;

            case 'pine':
              width = baseWidth * (0.7 + Math.random() * 0.3);
              height = baseHeight * (1.2 + Math.random() * 0.4);
              this.createPineTree(x, y + yVariation, width, height, distance);
              break;

            case 'building':
              width = baseWidth * (2 + Math.random() * 1);
              height = baseHeight * (1.5 + Math.random() * 1);
              this.createBuilding(x, y + yVariation, width, height, distance);
              break;

            case 'rock':
              width = baseWidth * (0.6 + Math.random() * 0.4);
              height = baseHeight * (0.4 + Math.random() * 0.3);
              this.createRock(x, y + yVariation, width, height, distance);
              break;

            case 'bush':
              width = baseWidth * (0.7 + Math.random() * 0.3);
              height = baseHeight * (0.5 + Math.random() * 0.2);
              this.createBush(x, y + yVariation, width, height, distance);
              break;
          }
        }
      });
    }
  }

  /**
   * Creates a tree element
   *
   * @param {number} x - The x position
   * @param {number} y - The y position
   * @param {number} width - The width
   * @param {number} height - The height
   * @param {number} distance - The distance from viewer (0-1)
   */
  createTree(x, y, width, height, distance) {
    // Create trunk
    const trunkWidth = width * 0.2;
    const trunkHeight = height * 0.4;
    const trunk = this.add.rectangle(
      x,
      y + height/2 - trunkHeight/2,
      trunkWidth,
      trunkHeight,
      0x8B4513 // Brown
    );
    trunk.setDepth(5 - distance * 3); // Further objects have lower depth

    // Create foliage (circle)
    const foliageRadius = width * 0.6;
    const foliage = this.add.circle(
      x,
      y - height * 0.2,
      foliageRadius,
      0x228B22 // Forest green
    );
    foliage.setDepth(5 - distance * 3);

    // Create shadow
    const shadowWidth = width * 1.2;
    const shadowHeight = height * 0.1;

    // Adjust shadow position based on time of day
    let shadowX = x;
    let shadowAlpha = 0.3;

    if (this.config.timeOfDay === 'dawn') {
      shadowX = x + width * 0.5; // Morning sun from the east
    } else if (this.config.timeOfDay === 'dusk') {
      shadowX = x - width * 0.5; // Evening sun from the west
    } else if (this.config.timeOfDay === 'night') {
      shadowAlpha = 0.1; // Fainter shadow at night
    }

    const shadow = this.add.ellipse(
      shadowX,
      y + height/2,
      shadowWidth,
      shadowHeight,
      0x000000,
      shadowAlpha
    );
    shadow.setDepth(4 - distance * 3); // Below the tree

    // Add elements to the array
    this.sideElements.push(trunk);
    this.sideElements.push(foliage);
    this.sideElements.push(shadow);
  }

  /**
   * Creates a pine tree element
   *
   * @param {number} x - The x position
   * @param {number} y - The y position
   * @param {number} width - The width
   * @param {number} height - The height
   * @param {number} distance - The distance from viewer (0-1)
   */
  createPineTree(x, y, width, height, distance) {
    // Create trunk
    const trunkWidth = width * 0.15;
    const trunkHeight = height * 0.3;
    const trunk = this.add.rectangle(
      x,
      y + height/2 - trunkHeight/2,
      trunkWidth,
      trunkHeight,
      0x8B4513 // Brown
    );
    trunk.setDepth(5 - distance * 3);

    // Create pine tree shape (triangle)
    const triangle = this.add.triangle(
      x, y - height * 0.15,
      -width/2, height * 0.4,
      0, -height * 0.6,
      width/2, height * 0.4,
      0x006400 // Dark green
    );
    triangle.setDepth(5 - distance * 3);

    // Add elements to the array
    this.sideElements.push(trunk);
    this.sideElements.push(triangle);
  }

  /**
   * Creates a building element
   *
   * @param {number} x - The x position
   * @param {number} y - The y position
   * @param {number} width - The width
   * @param {number} height - The height
   * @param {number} distance - The distance from viewer (0-1)
   */
  createBuilding(x, y, width, height, distance) {
    // Random building color
    const colors = [0x808080, 0xA9A9A9, 0x696969, 0x778899];
    const color = colors[Math.floor(Math.random() * colors.length)];

    // Create building body
    const building = this.add.rectangle(
      x,
      y,
      width,
      height,
      color
    );
    building.setDepth(5 - distance * 3);

    // Add windows if the building is close enough to see details
    if (distance < 0.7) {
      const windowRows = Math.floor(3 + Math.random() * 3);
      const windowCols = Math.floor(2 + Math.random() * 3);
      const windowWidth = width * 0.15;
      const windowHeight = height * 0.1;
      const windowColor = 0xFFFF99; // Light yellow

      for (let row = 0; row < windowRows; row++) {
        for (let col = 0; col < windowCols; col++) {
          // Only add some windows (random pattern)
          if (Math.random() < 0.7) {
            const windowX = x - width/2 + width * 0.2 + col * (width * 0.6 / (windowCols - 1));
            const windowY = y - height/2 + height * 0.2 + row * (height * 0.6 / (windowRows - 1));

            const window = this.add.rectangle(
              windowX,
              windowY,
              windowWidth,
              windowHeight,
              windowColor
            );
            window.setDepth(6 - distance * 3);
            this.sideElements.push(window);
          }
        }
      }
    }

    // Add a roof
    const roof = this.add.rectangle(
      x,
      y - height/2 - 5,
      width * 1.1,
      10,
      0x8B0000 // Dark red
    );
    roof.setDepth(5 - distance * 3);

    // Create shadow
    const shadowWidth = width * 1.5;
    const shadowHeight = height * 0.1;

    // Adjust shadow position based on time of day
    let shadowX = x;
    let shadowLength = 1.0;
    let shadowAlpha = 0.4;

    if (this.config.timeOfDay === 'dawn') {
      shadowX = x + width * 0.7; // Morning sun from the east
      shadowLength = 1.5;
    } else if (this.config.timeOfDay === 'dusk') {
      shadowX = x - width * 0.7; // Evening sun from the west
      shadowLength = 1.5;
    } else if (this.config.timeOfDay === 'day') {
      shadowLength = 0.8; // Shorter shadow during day
    } else if (this.config.timeOfDay === 'night') {
      shadowAlpha = 0.15; // Fainter shadow at night
      shadowLength = 0.5;
    }

    const shadow = this.add.ellipse(
      shadowX,
      y + height/2,
      shadowWidth * shadowLength,
      shadowHeight,
      0x000000,
      shadowAlpha
    );
    shadow.setDepth(4 - distance * 3); // Below the building

    // Add elements to the array
    this.sideElements.push(building);
    this.sideElements.push(roof);
    this.sideElements.push(shadow);
  }

  /**
   * Creates a rock element
   *
   * @param {number} x - The x position
   * @param {number} y - The y position
   * @param {number} width - The width
   * @param {number} height - The height
   * @param {number} distance - The distance from viewer (0-1)
   */
  createRock(x, y, width, height, distance) {
    // Random rock color
    const colors = [0x808080, 0xA9A9A9, 0x696969, 0x778899];
    const color = colors[Math.floor(Math.random() * colors.length)];

    // Create rock (polygon with irregular shape)
    const points = [];
    const sides = 6 + Math.floor(Math.random() * 3);
    const angleStep = Math.PI * 2 / sides;

    for (let i = 0; i < sides; i++) {
      const angle = i * angleStep;
      const radius = (0.7 + Math.random() * 0.3) * width / 2;
      points.push({
        x: x + Math.cos(angle) * radius,
        y: y + Math.sin(angle) * radius * (height / width)
      });
    }

    // Create the rock polygon
    const rock = this.add.polygon(
      0, 0, // These will be ignored as we're using absolute points
      points,
      color
    );
    rock.setDepth(5 - distance * 3);

    // Add to the array
    this.sideElements.push(rock);
  }

  /**
   * Creates a bush element
   *
   * @param {number} x - The x position
   * @param {number} y - The y position
   * @param {number} width - The width
   * @param {number} height - The height
   * @param {number} distance - The distance from viewer (0-1)
   */
  createBush(x, y, width, height, distance) {
    // Random bush color (various greens)
    const colors = [0x228B22, 0x006400, 0x32CD32, 0x556B2F];
    const color = colors[Math.floor(Math.random() * colors.length)];

    // Create multiple circles to form a bush
    const circleCount = 3 + Math.floor(Math.random() * 3);
    const circles = [];

    for (let i = 0; i < circleCount; i++) {
      const offsetX = (Math.random() - 0.5) * width * 0.5;
      const offsetY = (Math.random() - 0.5) * height * 0.5;
      const radius = (width * 0.3) * (0.7 + Math.random() * 0.6);

      const circle = this.add.circle(
        x + offsetX,
        y + offsetY,
        radius,
        color
      );
      circle.setDepth(5 - distance * 3);
      circles.push(circle);
    }

    // Add all circles to the array
    this.sideElements.push(...circles);
  }

  /**
   * Creates the character sprite
   */
  createCharacter() {
    // Calculate the character's vertical position (lower third of the screen)
    const characterY = this.gameHeight * 0.75;

    // Create the character sprite using the back-view texture
    this.character = this.physics.add.sprite(
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

    // Make character interactive for click/tap firing
    this.character.setInteractive({ useHandCursor: true });
    this.character.on('pointerdown', () => {
      this.fireProjectile();
    });
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

    // Create a control area for touch/click input
    this.controlArea = this.add.zone(
      this.gameWidth / 2,
      controlAreaY,
      this.gameWidth,
      controlAreaHeight
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
        console.log('Moving left');
      } else if (pointer.x > (this.gameWidth * 2/3)) {
        // Right third of screen - move right
        this.changeLane(1);
        console.log('Moving right');
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
        // Find the segment closest to the horizon
        let horizonSegment = this.roadSegments[0];
        let minY = Infinity;

        for (let j = 0; j < this.roadSegments.length; j++) {
          if (this.roadSegments[j].y < minY) {
            minY = this.roadSegments[j].y;
            horizonSegment = this.roadSegments[j];
          }
        }

        // Calculate new y position near the horizon
        segment.y = minY - segment.height;

        // Calculate new width based on perspective
        const horizonY = this.gameHeight * this.config.horizonLine;
        const distanceFromHorizon = (segment.y - horizonY) / (this.gameHeight - horizonY);
        const newWidth = this.gameWidth * this.config.roadWidth * (1 - distanceFromHorizon * 0.7);
        segment.width = newWidth;

        // Move this segment to the end of the array
        this.roadSegments.splice(i, 1);
        this.roadSegments.push(segment);
        i--; // Adjust index since we modified the array
      }
    }

    // Reflections updates disabled
    // if (this.reflections && this.reflections.length > 0) {
    //   // ... reflections update code ...
    // }

    // Side elements updates disabled
    // for (let i = 0; i < this.sideElements.length; i++) {
    //   const element = this.sideElements[i];
    //   // ... side element update code ...
    // }

    // Obstacle spawning disabled
    // this.state.obstacleSpawnTimer += delta;
    // if (this.state.obstacleSpawnTimer >= this.config.obstacleSpawnInterval) {
    //   this.state.obstacleSpawnTimer = 0;
    //   this.createObstacle();
    // }

    // Obstacle updates disabled
    // for (let i = this.obstacles.length - 1; i >= 0; i--) {
    //   const obstacle = this.obstacles[i];
    //   // ... obstacle update code ...
    // }

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];

      // Calculate current distance from horizon (0-1 scale)
      let distanceToHorizon = (projectile.y - this.gameHeight * this.config.horizonLine) /
                             (this.gameHeight - this.gameHeight * this.config.horizonLine);

      // Calculate how much to move based on current position
      // Projectiles move faster when further from horizon, slower as they approach
      const speedFactor = Math.max(0.5, distanceToHorizon * 2); // Range: 0.5x to 2.0x speed
      const moveDistance = this.config.projectileSpeed * speedFactor;

      // Calculate new position along perspective line
      const currentDistanceFromHorizon = projectile.y - this.gameHeight * this.config.horizonLine;
      const newDistanceFromHorizon = Math.max(0, currentDistanceFromHorizon - moveDistance);
      projectile.y = this.gameHeight * this.config.horizonLine + newDistanceFromHorizon;

      // Recalculate distance to horizon after movement
      distanceToHorizon = (projectile.y - this.gameHeight * this.config.horizonLine) /
                         (this.gameHeight - this.gameHeight * this.config.horizonLine);

      // Update X position to move toward the vanishing point as it approaches the horizon
      if (projectile.initialX !== undefined && projectile.targetX !== undefined) {
        // Linear interpolation between initial position and vanishing point
        // As distanceToHorizon approaches 0, projectile.x approaches targetX (vanishing point)
        projectile.x = Phaser.Math.Linear(projectile.initialX, projectile.targetX, 1 - distanceToHorizon);
      }
      projectile.setScale(Math.max(0.1, distanceToHorizon * 0.5));

      // Update the glow effect position
      if (projectile.glow) {
        projectile.glow.setPosition(projectile.x, projectile.y);
        projectile.glow.setScale(projectile.scale * 1.5);
      }

      // Remove projectiles that reach the horizon
      if (projectile.y <= this.gameHeight * this.config.horizonLine) {
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

    // Update weather effects
    this.updateWeatherEffects(delta);
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

    // Pause the game
    this.state.isPaused = true;

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
            this.state.isPaused = false;
            break;
          case 'Restart':
            this.closeMenu();
            // Reset game state
            this.config.health = 100;
            this.config.score = 0;
            this.config.progress = 0;

            // Update UI
            this.updateHealthBar(this.config.health);
            this.updateScore(this.config.score);
            this.updateProgressBar(this.config.progress);

            // Clear existing obstacles and projectiles
            this.obstacles.forEach(obstacle => obstacle.destroy());
            this.obstacles = [];
            this.projectiles.forEach(projectile => {
              if (projectile.particles) projectile.particles.destroy();
              if (projectile.glow) projectile.glow.destroy();
              projectile.destroy();
            });
            this.projectiles = [];

            // Reset character position
            this.state.currentLane = 3; // Middle lane
            this.state.targetLane = 3;
            this.state.laneTransitionProgress = 1.0;
            this.character.x = this.getLanePosition(this.state.currentLane);
            if (this.characterShadow) {
              this.characterShadow.x = this.character.x;
            }

            // Unpause the game
            this.state.isPaused = false;
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
          // Show a thank you message and fade out
          this.showExitMessage();
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
   * Shows an exit message and fades out the game
   */
  showExitMessage() {
    // Close any open dialogs
    if (this.state.confirmDialogOpen) {
      this.closeExitConfirmation();
    }
    if (this.state.menuOpen) {
      this.closeMenu();
    }

    // Pause the game
    this.state.isPaused = true;

    // Create a full-screen overlay
    const overlay = this.add.rectangle(
      this.gameWidth / 2,
      this.gameHeight / 2,
      this.gameWidth,
      this.gameHeight,
      0x000000,
      0
    );
    overlay.setDepth(1000);

    // Create a thank you message
    const thankYouText = this.add.text(
      this.gameWidth / 2,
      this.gameHeight / 2,
      'Thank you for playing!',
      {
        font: '32px Arial',
        fill: '#ffffff'
      }
    );
    thankYouText.setOrigin(0.5);
    thankYouText.setDepth(1001);
    thankYouText.setAlpha(0);

    // Fade in the overlay and text
    this.tweens.add({
      targets: overlay,
      alpha: 0.9,
      duration: 1000,
      ease: 'Power2'
    });

    this.tweens.add({
      targets: thankYouText,
      alpha: 1,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        // Wait a moment and then restart the scene
        this.time.delayedCall(2000, () => {
          // Restart the current scene (PerspectiveScene)
          this.scene.restart();
        });
      }
    });
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

    // Calculate the horizon line position
    const horizonY = this.gameHeight * this.config.horizonLine;

    // All lanes should converge to a single vanishing point at the horizon
    // The vanishing point is at the center of the road at the horizon line
    const centerX = this.gameWidth / 2;

    // At the horizon, all objects should be at or very near the center point
    // regardless of which lane they're in
    const x = centerX; // Start exactly at the center (vanishing point)
    const y = horizonY; // Start exactly at horizon

    // Store the target lane for this obstacle (where it will end up at the bottom)
    const targetLane = lane;

    // Create the obstacle sprite
    const obstacle = this.physics.add.sprite(x, y, 'characterTexture');

    // Set the obstacle's tint to make it visually distinct
    obstacle.setTint(0xff0000); // Red tint

    // Scale the obstacle based on distance (very small at horizon)
    obstacle.setScale(0.05); // Much smaller at horizon for better perspective effect

    // Set the obstacle's depth to be above the road but below the character
    obstacle.setDepth(5);

    // Create a shadow for the obstacle
    const shadowScale = 0.05; // Match initial obstacle scale
    const shadow = this.add.ellipse(
      x,
      y + 2, // Slightly below the obstacle
      obstacle.width * 0.8, // Shadow slightly smaller than obstacle width
      obstacle.height * 0.2, // Flattened ellipse for shadow
      0x000000, // Black color
      0.3 // Semi-transparent
    );
    shadow.setScale(shadowScale);
    shadow.setDepth(4); // Below the obstacle

    // Store reference to the shadow
    obstacle.shadow = shadow;

    // Add the obstacle to the physics group
    this.obstacleGroup.add(obstacle);

    // Store the obstacle in our array for easy access
    this.obstacles.push(obstacle);

    // Store the target lane for this obstacle
    obstacle.lane = targetLane;

    // Store the original lane for reference (in case we need it later)
    obstacle.originalLane = targetLane;

    // Set up a method to update the hitbox based on distance
    obstacle.updateHitboxByDistance = (distance) => {
      // Calculate hitbox size based on distance (smaller when far away)
      const hitboxScale = 0.05 + distance * 0.95; // 0.05 at horizon, 1.0 at bottom
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
    obstacle.updateHitboxByDistance(0); // Start with very small hitbox at horizon

    // Create a reflection of the obstacle on the road
    // We'll skip creating the reflection at the horizon and add it when it moves down
    obstacle.hasReflection = false; // Flag to track if reflection has been created

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

    // Destroy the shadow if it exists
    if (obstacle.shadow) {
      obstacle.shadow.destroy();
    }

    // Destroy the reflection if it exists
    if (obstacle.reflection) {
      // Remove from reflections array
      const reflectionIndex = this.reflections.indexOf(obstacle.reflection);
      if (reflectionIndex > -1) {
        this.reflections.splice(reflectionIndex, 1);
      }

      obstacle.reflection.destroy();
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

    // Store the initial lane position for perspective movement
    projectile.initialX = this.character.x;
    projectile.targetX = this.gameWidth / 2; // Center (vanishing point)

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

    // Add a shadow effect
    const shadow = this.add.ellipse(
      projectile.x,
      projectile.y + projectileSize * 0.5,
      projectileSize * 0.8,
      projectileSize * 0.2,
      0x000000,
      0.3
    );
    shadow.setDepth(6);
    projectile.shadow = shadow;

    // Adjust shadow based on time of day
    if (this.config.timeOfDay === 'night') {
      shadow.setAlpha(0.1); // Fainter shadow at night
    } else if (this.config.timeOfDay === 'dusk') {
      shadow.x += 5; // Offset shadow for dusk lighting
    } else if (this.config.timeOfDay === 'dawn') {
      shadow.x -= 5; // Offset shadow for dawn lighting
    }

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

    // Destroy the shadow if it exists
    if (projectile.shadow) {
      projectile.shadow.destroy();
    }

    // Destroy the projectile sprite
    projectile.destroy();
  }

  /**
   * Updates weather effects animation
   *
   * @param {number} delta - Time elapsed since last update in ms
   */
  updateWeatherEffects(delta) {
    // Update rain animation
    if (this.raindrops && this.raindrops.length > 0) {
      this.raindrops.forEach(drop => {
        // Move the raindrop
        drop.x += drop.velocityX * (delta / 16);
        drop.y += drop.velocityY * (delta / 16);

        // Reset position if off-screen
        if (drop.y > this.gameHeight) {
          drop.x = Math.random() * this.gameWidth;
          drop.y = -20;
        }
        if (drop.x > this.gameWidth) {
          drop.x = -20;
          drop.y = Math.random() * this.gameHeight;
        }
      });
    }

    // Update fog animation (subtle movement)
    if (this.fogLayer) {
      // Slowly move the fog for a dynamic effect
      this.fogLayer.x += Math.sin(this.time.now / 5000) * 0.2;
    }

    // Randomly change weather every 30 seconds (for demo purposes)
    if (Phaser.Math.Between(1, 1800) === 1) { // Approximately every 30 seconds at 60fps
      const weathers = ['clear', 'rain', 'fog'];
      const currentIndex = weathers.indexOf(this.config.weather);
      const nextIndex = (currentIndex + 1) % weathers.length;
      this.setWeather(weathers[nextIndex], 0.7);
    }

    // Randomly change time of day every 60 seconds (for demo purposes)
    if (Phaser.Math.Between(1, 3600) === 1) { // Approximately every 60 seconds at 60fps
      const times = ['day', 'dusk', 'night', 'dawn'];
      const currentIndex = times.indexOf(this.config.timeOfDay);
      const nextIndex = (currentIndex + 1) % times.length;
      this.setTimeOfDay(times[nextIndex]);
    }
  }

  /**
   * Sets the time of day
   *
   * @param {string} timeOfDay - The time of day ('day', 'dusk', 'night', 'dawn')
   */
  setTimeOfDay(timeOfDay) {
    // Store the current time of day
    this.config.timeOfDay = timeOfDay;

    // Recreate the sky and horizon with the new time of day
    if (this.sky) this.sky.destroy();
    if (this.horizonLine) this.horizonLine.destroy();
    if (this.ground) this.ground.destroy();
    if (this.stars) this.stars.forEach(star => star.destroy());

    // Create the new sky and horizon
    this.createSkyAndHorizon();

    // Update distance fog
    if (this.distanceFog) {
      this.distanceFog.destroy();
      this.createDistanceFog();
    }

    // Apply lighting effects based on time of day
    this.applyLightingEffects();
  }

  /**
   * Applies lighting effects based on time of day
   */
  applyLightingEffects() {
    if (!this.config.enableLighting) return;

    // Remove any existing lighting effects
    if (this.lightingContainer) {
      this.lightingContainer.destroy();
    }

    // Create a new container for lighting effects
    this.lightingContainer = this.add.container(0, 0);
    this.lightingContainer.setDepth(90); // Above most elements but below UI

    // Apply different lighting effects based on time of day
    switch (this.config.timeOfDay) {
      case 'dawn':
        // Soft orange overlay
        this.createLightingOverlay(0xE67E22, 0.1);
        break;
      case 'day':
        // No special lighting effects for day
        break;
      case 'dusk':
        // Red-orange overlay
        this.createLightingOverlay(0xE74C3C, 0.15);
        break;
      case 'night':
        // Dark blue overlay with vignette
        this.createLightingOverlay(0x0D0D2D, 0.3);
        this.createVignette(0.4);
        break;
    }
  }

  /**
   * Creates a colored overlay for lighting effects
   *
   * @param {number} color - The color of the overlay
   * @param {number} alpha - The alpha (opacity) of the overlay
   */
  createLightingOverlay(color, alpha) {
    const overlay = this.add.rectangle(
      this.gameWidth / 2,
      this.gameHeight / 2,
      this.gameWidth,
      this.gameHeight,
      color,
      alpha
    );

    this.lightingContainer.add(overlay);
  }

  /**
   * Creates a vignette effect (darkened edges)
   *
   * @param {number} intensity - The intensity of the vignette effect (0-1)
   */
  createVignette(intensity) {
    // Create a radial gradient for the vignette
    const graphics = this.add.graphics();

    // Create a radial gradient from transparent in the center to dark at the edges
    const centerX = this.gameWidth / 2;
    const centerY = this.gameHeight / 2;
    const radius = Math.max(this.gameWidth, this.gameHeight) * 0.7;

    // Draw the vignette using a filled circle with a gradient
    graphics.fillStyle(0x000000, intensity);
    graphics.fillCircle(centerX, centerY, radius);

    // Create a mask to invert the vignette (dark edges, transparent center)
    const mask = this.add.graphics();
    mask.fillStyle(0xFFFFFF, 1);
    mask.fillRect(0, 0, this.gameWidth, this.gameHeight);

    // Apply the mask to create the vignette effect
    graphics.setMask(new Phaser.Display.Masks.GeometryMask(this, mask));

    this.lightingContainer.add(graphics);
  }
}
