/**
 * ProjectileManager.js
 * 
 * Manages the creation and updating of projectiles.
 */

export class ProjectileManager {
  /**
   * Create a new ProjectileManager
   * 
   * @param {Phaser.Scene} scene - The scene this manager belongs to
   * @param {GameConfig} config - The game configuration
   */
  constructor(scene, config) {
    this.scene = scene;
    this.config = config;
    this.gameWidth = scene.cameras.main.width;
    this.gameHeight = scene.cameras.main.height;
    
    // Projectiles array
    this.projectiles = [];
  }
  
  /**
   * Create a new projectile
   * 
   * @param {number} x - The x position to create the projectile
   * @param {number} y - The y position to create the projectile
   */
  createProjectile(x, y) {
    // Create a sparkle projectile
    const projectile = this.scene.add.circle(
      x,
      y,
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
    this.projectiles.push(projectile);
    
    return projectile;
  }
  
  /**
   * Remove a projectile
   * 
   * @param {Phaser.GameObjects.GameObject} projectile - The projectile to remove
   */
  removeProjectile(projectile) {
    // Remove from the array
    const index = this.projectiles.indexOf(projectile);
    if (index !== -1) {
      this.projectiles.splice(index, 1);
    }
    
    // Destroy the glow effect
    if (projectile.glow) {
      projectile.glow.destroy();
    }
    
    // Destroy the projectile
    projectile.destroy();
  }
  
  /**
   * Update all projectiles
   */
  update() {
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
  }
}
