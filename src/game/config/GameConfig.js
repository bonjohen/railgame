/**
 * GameConfig.js
 * 
 * Contains the configuration settings for the game.
 */

export class GameConfig {
  constructor() {
    // Game configuration
    this.roadSpeed = 2;           // Speed of the road scrolling
    this.characterSpeed = 5;      // Speed of character movement
    this.roadWidth = 0.6;         // Width of the road as a percentage of the game width
    this.segmentCount = 30;       // Number of road segments to create (increased for smoother appearance)
    this.horizonLine = 0.3;       // Position of the horizon line (percentage from top)
    this.cameraHeight = 1000;     // Virtual camera height
    this.cameraDepth = 0.84;      // Camera depth (field of view)
    this.laneCount = 7;           // Number of lanes (increased for more positions)
    this.showFPS = true;          // Whether to show the FPS counter
    this.maxDepthElements = 20;   // Maximum number of depth elements to create
    this.cullingThreshold = 100;  // Distance in pixels beyond which objects are culled
    this.controlAreaHeight = 0.25; // Height of the control area as a percentage of the game height
    this.touchSensitivity = 1.0;  // Touch sensitivity adjustment factor
    this.uiScale = 1.0;           // UI scaling factor for high-resolution screens
    this.topBarHeight = 60;       // Height of the top bar in pixels
    this.health = 100;            // Initial health value
    this.maxHealth = 100;         // Maximum health value
    this.score = 0;               // Initial score value
    this.progress = 0;            // Initial progress value (0-100)
    this.projectileSpeed = 7.5;   // Speed of projectiles (3x character speed)
    this.fireRate = 500;          // Minimum time between shots in milliseconds
    this.sparkleSize = 15;        // Size of the sparkle projectile
    this.obstacleSpawnInterval = 2000; // Time between obstacle spawns in ms
    this.obstacleSpeed = 2;       // Speed of obstacles moving down the road

    // Weather and environment effects
    this.weather = 'clear';       // Current weather: 'clear', 'rain', 'fog'
    this.weatherIntensity = 0.5;  // Intensity of weather effects (0-1)
    this.timeOfDay = 'day';       // Time of day: 'day', 'dusk', 'night', 'dawn'
    this.fogDistance = 0.5;       // Distance at which fog starts to appear (0-1)
    this.fogDensity = 0.3;        // Density of the fog (0-1)
  }
}
