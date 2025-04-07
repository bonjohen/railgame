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
    this.lensFlares = [];
    this.lightBloomEffects = [];
    this.speedEffects = null;
    this.impactEffects = null;
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
   * Creates a lens flare effect
   *
   * @param {number} x - The x position of the light source
   * @param {number} y - The y position of the light source
   * @param {number} intensity - The intensity of the lens flare (0-1)
   * @param {number} color - The color of the lens flare
   */
  createLensFlare(x = null, y = null, intensity = 0.7, color = 0xFFFFFF) {
    // Default to sun position if no coordinates provided
    if (x === null || y === null) {
      // Position based on time of day
      const horizonY = this.gameHeight * this.config.horizonLine;

      switch (this.config.timeOfDay) {
        case 'dawn':
          x = this.gameWidth * 0.2; // Sun rising from left
          y = horizonY * 1.2;
          color = 0xFFA500; // Orange
          break;
        case 'day':
          x = this.gameWidth * 0.7; // Sun high in the sky
          y = horizonY * 0.5;
          color = 0xFFFFFF; // White
          break;
        case 'dusk':
          x = this.gameWidth * 0.8; // Sun setting to right
          y = horizonY * 1.2;
          color = 0xFF4500; // Orange-red
          break;
        case 'night':
          x = this.gameWidth * 0.8; // Moon position
          y = horizonY * 0.7;
          color = 0xCCCCFF; // Pale blue
          intensity *= 0.5; // Reduced intensity at night
          break;
        default:
          x = this.gameWidth * 0.7;
          y = horizonY * 0.5;
      }
    }

    // Create the main light source (sun/moon)
    const lightSource = this.scene.add.circle(
      x, y,
      30 * intensity,
      color,
      1
    );
    lightSource.setDepth(95);

    // Add glow around the light source
    const glow = this.scene.add.circle(
      x, y,
      60 * intensity,
      color,
      0.3
    );
    glow.setDepth(94);

    // Create lens flare artifacts
    const flareCount = 5;
    const flareArtifacts = [];

    // Calculate the line from light source to screen center
    const centerX = this.gameWidth / 2;
    const centerY = this.gameHeight / 2;

    // Direction vector from center to light source
    const dirX = x - centerX;
    const dirY = y - centerY;
    const length = Math.sqrt(dirX * dirX + dirY * dirY);

    // Create flare artifacts along the line from light source through screen center
    for (let i = 0; i < flareCount; i++) {
      // Position flares along the line, mirrored through center point
      const distance = -0.5 - (i * 0.3); // Negative to mirror through center
      const flareX = centerX + dirX * distance;
      const flareY = centerY + dirY * distance;

      // Size and opacity vary based on position
      const size = 20 * intensity * (1 - (i * 0.15));
      const alpha = 0.7 * intensity * (1 - (i * 0.1));

      // Different shapes and colors for variety
      let flare;
      if (i % 3 === 0) {
        // Hexagon
        flare = this.scene.add.circle(flareX, flareY, size, color, alpha);
      } else if (i % 3 === 1) {
        // Circle
        flare = this.scene.add.circle(flareX, flareY, size * 0.7, 0xFFFFFF, alpha * 0.8);
      } else {
        // Ring
        flare = this.scene.add.circle(flareX, flareY, size * 1.2, color, alpha * 0.5);
      }

      flare.setDepth(93);
      flareArtifacts.push(flare);
    }

    // Store all lens flare elements
    const lensFlare = {
      lightSource,
      glow,
      artifacts: flareArtifacts,
      update: (newX, newY) => {
        // Update positions if the light source moves
        if (newX !== undefined && newY !== undefined) {
          lightSource.setPosition(newX, newY);
          glow.setPosition(newX, newY);

          // Recalculate direction vector
          const dirX = newX - centerX;
          const dirY = newY - centerY;

          // Update artifacts
          for (let i = 0; i < flareArtifacts.length; i++) {
            const distance = -0.5 - (i * 0.3);
            const flareX = centerX + dirX * distance;
            const flareY = centerY + dirY * distance;
            flareArtifacts[i].setPosition(flareX, flareY);
          }
        }
      }
    };

    this.lensFlares.push(lensFlare);
    return lensFlare;
  }

  /**
   * Creates a light bloom effect around bright objects
   *
   * @param {Phaser.GameObjects.GameObject} target - The object to add bloom to
   * @param {number} intensity - The intensity of the bloom (0-1)
   * @param {number} color - The color of the bloom
   */
  createLightBloom(target, intensity = 0.7, color = 0xFFFFFF) {
    if (!target) return null;

    // Create a container for the bloom effect
    const bloomContainer = this.scene.add.container(target.x, target.y);
    bloomContainer.setDepth(target.depth - 1); // Just behind the target

    // Create multiple layers of glow with decreasing opacity
    const layers = 3;
    const glowLayers = [];

    for (let i = 0; i < layers; i++) {
      // Calculate size and opacity for this layer
      const scale = 1 + (i * 0.5);
      const alpha = intensity * (1 - (i * 0.3));

      // Create a circle for the glow
      const glow = this.scene.add.circle(
        0, 0, // Center of container
        target.width * scale * 0.5, // Radius
        color,
        alpha
      );

      bloomContainer.add(glow);
      glowLayers.push(glow);
    }

    // Create the bloom effect object
    const bloomEffect = {
      container: bloomContainer,
      layers: glowLayers,
      target: target,
      update: () => {
        // Update position to follow target
        bloomContainer.setPosition(target.x, target.y);

        // Update scale if target changes size
        for (let i = 0; i < glowLayers.length; i++) {
          const scale = 1 + (i * 0.5);
          glowLayers[i].setRadius(target.width * scale * 0.5);
        }
      }
    };

    this.lightBloomEffects.push(bloomEffect);
    return bloomEffect;
  }

  /**
   * Creates a speed effect (motion blur, etc.)
   *
   * @param {number} intensity - The intensity of the effect (0-1)
   */
  createSpeedEffect(intensity = 0.7) {
    // Clear any existing speed effects
    if (this.speedEffects) {
      this.speedEffects.lines.forEach(line => line.destroy());
    }

    // Create a container for the speed lines
    const container = this.scene.add.container(0, 0);
    container.setDepth(80); // Above most elements but below UI

    // Create speed lines
    const lineCount = Math.floor(20 * intensity);
    const lines = [];

    // Calculate the horizon line position
    const horizonY = this.gameHeight * this.config.horizonLine;

    for (let i = 0; i < lineCount; i++) {
      // Random position below horizon
      const y = horizonY + Math.random() * (this.gameHeight - horizonY);

      // Lines start from edges and move toward center
      const fromLeft = Math.random() < 0.5;
      const startX = fromLeft ? 0 : this.gameWidth;
      const endX = fromLeft ? this.gameWidth * 0.4 : this.gameWidth * 0.6;

      // Create the line
      const line = this.scene.add.line(
        0, 0,
        startX, y,
        endX, y,
        0xFFFFFF, // White color
        0.3 * intensity // Opacity
      );

      // Set line thickness based on position (thicker at bottom)
      const distanceFromHorizon = (y - horizonY) / (this.gameHeight - horizonY);
      line.setLineWidth(1 + distanceFromHorizon * 2);

      // Add to container
      container.add(line);
      lines.push(line);

      // Animate the line
      this.scene.tweens.add({
        targets: line,
        x: fromLeft ? this.gameWidth : -this.gameWidth,
        duration: 300 + Math.random() * 700,
        repeat: -1,
        onRepeat: () => {
          // Reset position and randomize y
          line.x = 0;
          const newY = horizonY + Math.random() * (this.gameHeight - horizonY);
          line.setTo(startX, newY, endX, newY);

          // Update line thickness
          const distanceFromHorizon = (newY - horizonY) / (this.gameHeight - horizonY);
          line.setLineWidth(1 + distanceFromHorizon * 2);
        }
      });
    }

    // Store the speed effect
    this.speedEffects = {
      container,
      lines,
      setIntensity: (newIntensity) => {
        // Update line opacity based on intensity
        lines.forEach(line => {
          line.setAlpha(0.3 * newIntensity);
        });
      }
    };

    return this.speedEffects;
  }

  /**
   * Creates an impact effect at the specified position
   *
   * @param {number} x - The x position of the impact
   * @param {number} y - The y position of the impact
   * @param {number} intensity - The intensity of the effect (0-1)
   * @param {number} color - The color of the impact
   */
  createImpactEffect(x, y, intensity = 1.0, color = 0xFFFFFF) {
    // Create a container for the impact effect
    const container = this.scene.add.container(x, y);
    container.setDepth(100); // Above most elements

    // Create a flash effect
    const flash = this.scene.add.circle(
      0, 0,
      50 * intensity,
      color,
      0.8
    );
    container.add(flash);

    // Create shock wave effect
    const shockWave = this.scene.add.circle(
      0, 0,
      10 * intensity,
      color,
      0.5
    );
    container.add(shockWave);

    // Animate the flash
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 2,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        flash.destroy();
      }
    });

    // Animate the shock wave
    this.scene.tweens.add({
      targets: shockWave,
      alpha: 0,
      scale: 5,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        shockWave.destroy();
        container.destroy();
      }
    });

    // Create screen shake effect
    if (intensity > 0.5) {
      const camera = this.scene.cameras.main;
      const shakeIntensity = 0.01 * intensity;
      const shakeDuration = 100 + (intensity * 200);

      camera.shake(shakeDuration, shakeIntensity);
    }

    // Store the impact effect
    this.impactEffects = container;

    return container;
  }

  /**
   * Update environment effects
   */
  update() {
    // Update weather effects
    if (this.config.weather === 'rain') {
      // Rain is animated using tweens, no need to update
    }

    // Update lens flares
    this.lensFlares.forEach(flare => {
      if (flare.update) flare.update();
    });

    // Update light bloom effects
    this.lightBloomEffects.forEach(bloom => {
      if (bloom.update) bloom.update();
    });
  }
}
