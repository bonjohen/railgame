/**
 * CharacterManager.js
 * 
 * Manages the creation and updating of the character.
 */

import { AssetManager } from '../../assets/asset-manager';

export class CharacterManager {
  /**
   * Create a new CharacterManager
   * 
   * @param {Phaser.Scene} scene - The scene this manager belongs to
   * @param {GameConfig} config - The game configuration
   * @param {RoadManager} roadManager - The road manager
   */
  constructor(scene, config, roadManager) {
    this.scene = scene;
    this.config = config;
    this.roadManager = roadManager;
    this.gameWidth = scene.cameras.main.width;
    this.gameHeight = scene.cameras.main.height;
    
    // Character properties
    this.character = null;
    this.characterShadow = null;
    this.currentLane = Math.floor(config.laneCount / 2); // Start in the middle lane
    this.isMoving = false;
    this.targetX = 0;
    this.lastFireTime = 0;
  }
  
  /**
   * Creates the character sprite
   */
  createCharacter() {
    // Calculate the character's vertical position (lower third of the screen)
    const characterY = this.gameHeight * 0.75;

    // Create the character sprite using the back-view texture
    this.character = this.scene.physics.add.sprite(
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
    if (this.scene.state.isHighResolution) {
      this.character.setScale(characterScale * this.config.uiScale);
    }

    // Set the character's depth to be above the road
    this.character.setDepth(10);

    // Add shadow beneath the character
    this.characterShadow = this.scene.add.ellipse(
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
   * Change the character's lane
   * 
   * @param {number} direction - The direction to move (-1 for left, 1 for right)
   */
  changeLane(direction) {
    // Calculate the new lane
    const newLane = Phaser.Math.Clamp(
      this.currentLane + direction,
      0,
      this.config.laneCount - 1
    );
    
    // If we're already in the target lane, do nothing
    if (newLane === this.currentLane) return;
    
    // Update the current lane
    this.currentLane = newLane;
    
    // Calculate the target x position
    this.targetX = this.roadManager.getLanePosition(this.currentLane);
    
    // Set the moving flag
    this.isMoving = true;
  }
  
  /**
   * Fire a projectile from the character
   */
  fireProjectile() {
    // Check if enough time has passed since the last shot
    const currentTime = this.scene.time.now;
    if (currentTime - this.lastFireTime < this.config.fireRate) return;
    
    // Update the last fire time
    this.lastFireTime = currentTime;
    
    // Create a sparkle projectile
    const projectile = this.scene.add.circle(
      this.character.x,
      this.character.y - this.character.height * 0.3,
      this.config.sparkleSize,
      0xFFFF00, // Yellow color
      1
    );
    
    // Add a glow effect
    const glow = this.scene.add.circle(
      projectile.x,
      projectile.y,
      this.config.sparkleSize * 1.5,
      0xFFFF00, // Yellow color
      0.3
    );
    
    // Store reference to the glow
    projectile.glow = glow;
    
    // Set depth to be above the road but below the character
    projectile.setDepth(9);
    glow.setDepth(8);
    
    // Store the initial and target positions for proper perspective movement
    projectile.initialX = projectile.x;
    projectile.targetX = this.gameWidth / 2; // Center of the road at horizon
    
    // Add to the projectiles array
    this.scene.projectiles.push(projectile);
    
    // Play sound effect
    // this.scene.sound.play('fire');
  }
  
  /**
   * Update the character
   */
  update() {
    // Update character position if moving
    if (this.isMoving) {
      // Calculate the distance to move
      const dx = this.targetX - this.character.x;
      const distance = Math.abs(dx);
      
      // If we're close enough to the target, stop moving
      if (distance < 1) {
        this.character.x = this.targetX;
        this.isMoving = false;
      } else {
        // Move toward the target
        const direction = Math.sign(dx);
        this.character.x += direction * this.config.characterSpeed;
      }
      
      // Update shadow position
      this.characterShadow.x = this.character.x;
    }
  }
}
