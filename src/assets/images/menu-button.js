/**
 * Menu Button Generator
 * 
 * This file contains a function to generate a menu button (vertical ellipsis)
 * programmatically using Phaser's graphics capabilities.
 */

/**
 * Creates a menu button texture (vertical ellipsis)
 * 
 * @param {Phaser.Scene} scene - The scene to create the texture in
 * @param {number} size - The size of the texture (square)
 * @param {string} textureName - The name to give the generated texture
 */
export function createMenuButtonTexture(scene, size = 40, textureName = 'menuButtonTexture') {
  // Create a graphics object to draw the menu button
  const graphics = scene.add.graphics();
  
  // Background (transparent)
  graphics.fillStyle(0x000000, 0);
  graphics.fillRect(0, 0, size, size);
  
  // Dots (white circles)
  graphics.fillStyle(0xFFFFFF, 1);
  const dotRadius = size * 0.1;
  const spacing = size * 0.25;
  
  // Top dot
  graphics.fillCircle(size / 2, size / 2 - spacing, dotRadius);
  
  // Middle dot
  graphics.fillCircle(size / 2, size / 2, dotRadius);
  
  // Bottom dot
  graphics.fillCircle(size / 2, size / 2 + spacing, dotRadius);
  
  // Generate a texture from the graphics object
  graphics.generateTexture(textureName, size, size);
  
  // Destroy the graphics object as it's no longer needed
  graphics.destroy();
  
  return textureName;
}
