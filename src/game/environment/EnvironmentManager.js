/**
 * EnvironmentManager.js
 * 
 * Manages the creation and updating of environment effects.
 */

export class EnvironmentManager {
  /**
   * Create a new EnvironmentManager
   * 
   * @param {Phaser.Scene} scene - The scene this manager belongs to
   * @param {GameConfig} config - The game configuration
   */
  constructor(scene, config) {
    this.scene = scene;
    this.config = config;
    this.gameWidth = scene.cameras.main.width;
    this.gameHeight = scene.cameras.main.height;
    
    // Environment elements
    this.skyBackground = null;
    this.horizonLine = null;
    this.distanceFog = null;
    this.weatherEffects = null;
    this.lightingEffects = null;
  }
  
  /**
   * Creates the sky and horizon
   */
  createSkyAndHorizon() {
    // Calculate the horizon line position
    const horizonY = this.gameHeight * this.config.horizonLine;
    
    // Create the sky background
    this.skyBackground = this.scene.add.rectangle(
      this.gameWidth / 2,
      horizonY / 2,
      this.gameWidth,
      horizonY,
      0x87CEEB // Sky blue color
    );
    this.skyBackground.setDepth(1);
    
    // Create the horizon line
    this.horizonLine = this.scene.add.rectangle(
      this.gameWidth / 2,
      horizonY,
      this.gameWidth,
      2,
      0xFFFFFF,
      0.5
    );
    this.horizonLine.setDepth(2);
    
    // Adjust sky color based on time of day
    this.updateSkyColor();
  }
  
  /**
   * Creates the distance fog effect
   */
  createDistanceFog() {
    // Calculate the horizon line position
    const horizonY = this.gameHeight * this.config.horizonLine;
    
    // Create a gradient for the fog
    this.distanceFog = this.scene.add.graphics();
    this.updateFogEffect();
    
    // Set depth to be above the road but below most elements
    this.distanceFog.setDepth(5);
  }
  
  /**
   * Creates weather effects (rain, fog, etc.)
   */
  createWeatherEffects() {
    // Create a container for weather effects
    this.weatherEffects = this.scene.add.container(0, 0);
    this.weatherEffects.setDepth(50);
    
    // Create weather effects based on the current weather
    this.updateWeatherEffects();
  }
  
  /**
   * Applies lighting effects based on time of day
   */
  applyLightingEffects() {
    // Create a container for lighting effects
    this.lightingEffects = this.scene.add.container(0, 0);
    this.lightingEffects.setDepth(90);
    
    // Apply lighting effects based on time of day
    this.updateLightingEffects();
  }
  
  /**
   * Updates the sky color based on time of day
   */
  updateSkyColor() {
    if (!this.skyBackground) return;
    
    // Set sky color based on time of day
    switch (this.config.timeOfDay) {
      case 'dawn':
        this.skyBackground.fillColor = 0xE67E22; // Orange sky at dawn
        break;
      case 'day':
        this.skyBackground.fillColor = 0x87CEEB; // Sky blue during day
        break;
      case 'dusk':
        this.skyBackground.fillColor = 0xE74C3C; // Red-orange sky at dusk
        break;
      case 'night':
        this.skyBackground.fillColor = 0x2C3E50; // Dark blue at night
        break;
      default:
        this.skyBackground.fillColor = 0x87CEEB; // Default sky blue
    }
  }
  
  /**
   * Updates the fog effect based on weather and time of day
   */
  updateFogEffect() {
    if (!this.distanceFog) return;
    
    // Clear any previous fog
    this.distanceFog.clear();
    
    // Calculate the horizon line position
    const horizonY = this.gameHeight * this.config.horizonLine;
    
    // Determine fog color and intensity based on weather and time of day
    let fogColor, fogAlpha;
    
    switch (this.config.weather) {
      case 'fog':
        fogColor = 0xCCCCCC; // Light gray for fog
        fogAlpha = 0.7 * this.config.weatherIntensity;
        break;
      case 'rain':
        fogColor = 0x666666; // Dark gray for rain
        fogAlpha = 0.5 * this.config.weatherIntensity;
        break;
      default:
        fogColor = 0xFFFFFF; // White for clear weather
        fogAlpha = 0.3;
    }
    
    // Adjust fog based on time of day
    if (this.config.timeOfDay === 'night') {
      fogColor = 0x333333; // Darker fog at night
      fogAlpha *= 0.7;
    } else if (this.config.timeOfDay === 'dawn' || this.config.timeOfDay === 'dusk') {
      fogColor = 0x996633; // Orange-tinted fog at dawn/dusk
      fogAlpha *= 0.8;
    }
    
    // Create a gradient for the fog
    this.distanceFog.fillStyle(fogColor, fogAlpha);
    this.distanceFog.fillRect(0, horizonY, this.gameWidth, this.gameHeight * 0.2);
    
    // Add a second, more transparent layer for a smoother effect
    this.distanceFog.fillStyle(fogColor, fogAlpha * 0.5);
    this.distanceFog.fillRect(0, horizonY + this.gameHeight * 0.2, this.gameWidth, this.gameHeight * 0.1);
  }
  
  /**
   * Updates weather effects based on the current weather
   */
  updateWeatherEffects() {
    if (!this.weatherEffects) return;
    
    // Clear any previous weather effects
    this.weatherEffects.removeAll(true);
    
    // Create weather effects based on the current weather
    switch (this.config.weather) {
      case 'rain':
        this.createRainEffect();
        break;
      case 'fog':
        // Fog is handled by the fog effect
        break;
      default:
        // No weather effects for clear weather
        break;
    }
  }
  
  /**
   * Creates a rain effect
   */
  createRainEffect() {
    // Calculate the horizon line position
    const horizonY = this.gameHeight * this.config.horizonLine;
    
    // Create rain particles
    const rainCount = Math.floor(50 * this.config.weatherIntensity);
    
    for (let i = 0; i < rainCount; i++) {
      // Random position
      const x = Math.random() * this.gameWidth;
      const y = horizonY + Math.random() * (this.gameHeight - horizonY);
      
      // Create rain drop
      const rainDrop = this.scene.add.line(
        0, 0,
        x, y,
        x - 5, y + 15,
        0xCCCCFF, // Light blue color
        0.7
      );
      
      // Add to weather effects
      this.weatherEffects.add(rainDrop);
      
      // Animate the rain drop
      this.scene.tweens.add({
        targets: rainDrop,
        y: '+=' + (this.gameHeight - y),
        x: '-=10',
        duration: 1000 + Math.random() * 1000,
        repeat: -1,
        onRepeat: () => {
          rainDrop.y = y;
          rainDrop.x = 0;
        }
      });
    }
  }
  
  /**
   * Updates lighting effects based on time of day
   */
  updateLightingEffects() {
    if (!this.lightingEffects) return;
    
    // Clear any previous lighting effects
    this.lightingEffects.removeAll(true);
    
    // Apply lighting effects based on time of day
    switch (this.config.timeOfDay) {
      case 'night':
        this.createNightLighting();
        break;
      case 'dawn':
      case 'dusk':
        this.createDawnDuskLighting();
        break;
      default:
        // No special lighting for day
        break;
    }
  }
  
  /**
   * Creates night lighting effects
   */
  createNightLighting() {
    // Add a dark overlay to simulate night
    const nightOverlay = this.scene.add.rectangle(
      this.gameWidth / 2,
      this.gameHeight / 2,
      this.gameWidth,
      this.gameHeight,
      0x000033, // Dark blue
      0.4
    );
    
    // Add to lighting effects
    this.lightingEffects.add(nightOverlay);
  }
  
  /**
   * Creates dawn/dusk lighting effects
   */
  createDawnDuskLighting() {
    // Add a colored overlay to simulate dawn/dusk
    const color = this.config.timeOfDay === 'dawn' ? 0xE67E22 : 0xE74C3C;
    
    const overlay = this.scene.add.rectangle(
      this.gameWidth / 2,
      this.gameHeight / 2,
      this.gameWidth,
      this.gameHeight,
      color,
      0.2
    );
    
    // Add to lighting effects
    this.lightingEffects.add(overlay);
  }
  
  /**
   * Update environment effects
   */
  update() {
    // Update weather effects
    if (this.config.weather === 'rain') {
      // Rain is animated using tweens, no need to update
    }
  }
}
