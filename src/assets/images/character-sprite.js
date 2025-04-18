/**
 * Character Sprite Generator
 * 
 * This file contains a function to generate a simple character sprite
 * programmatically using Phaser's graphics capabilities.
 */

/**
 * Creates a character sprite texture
 * 
 * @param {Phaser.Scene} scene - The scene to create the texture in
 * @param {number} width - The width of the texture
 * @param {number} height - The height of the texture
 * @param {string} textureName - The name to give the generated texture
 */
export function createCharacterTexture(scene, width = 50, height = 80, textureName = 'characterTexture') {
  // Create a graphics object to draw the character
  const graphics = scene.add.graphics();
  
  // Character body (blue rectangle with rounded corners)
  graphics.fillStyle(0x3498db, 1);
  graphics.fillRoundedRect(width * 0.2, height * 0.3, width * 0.6, height * 0.7, 10);
  
  // Character head (circle)
  graphics.fillStyle(0xf39c12, 1);
  graphics.fillCircle(width / 2, height * 0.2, width * 0.2);
  
  // Eyes (white circles with black pupils)
  graphics.fillStyle(0xFFFFFF, 1);
  graphics.fillCircle(width * 0.4, height * 0.18, width * 0.08);
  graphics.fillCircle(width * 0.6, height * 0.18, width * 0.08);
  
  graphics.fillStyle(0x000000, 1);
  graphics.fillCircle(width * 0.4, height * 0.18, width * 0.03);
  graphics.fillCircle(width * 0.6, height * 0.18, width * 0.03);
  
  // Generate a texture from the graphics object
  graphics.generateTexture(textureName, width, height);
  
  // Destroy the graphics object as it's no longer needed
  graphics.destroy();
  
  return textureName;
}
