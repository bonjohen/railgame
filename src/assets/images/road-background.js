/**
 * Road Background Generator
 *
 * This file contains a function to generate a road background
 * programmatically using Phaser's graphics capabilities.
 */

/**
 * Creates a road background texture
 *
 * @param {Phaser.Scene} scene - The scene to create the texture in
 * @param {number} width - The width of the texture
 * @param {number} height - The height of the texture
 * @param {string} textureName - The name to give the generated texture
 */
export function createRoadTexture(scene, width, height, textureName = 'roadTexture') {
  // Create a graphics object to draw the road
  const graphics = scene.add.graphics();

  // Road background (dark gray)
  graphics.fillStyle(0x333333, 1);
  graphics.fillRect(0, 0, width, height);

  // Road edges (white lines)
  graphics.fillStyle(0xFFFFFF, 1);
  graphics.fillRect(width * 0.1, 0, width * 0.03, height); // Left edge
  graphics.fillRect(width * 0.87, 0, width * 0.03, height); // Right edge

  // Generate a texture from the graphics object
  graphics.generateTexture(textureName, width, height);

  // Destroy the graphics object as it's no longer needed
  graphics.destroy();

  return textureName;
}

/**
 * Creates a yellow line texture for the center of the road
 *
 * @param {Phaser.Scene} scene - The scene to create the texture in
 * @param {number} width - The width of the texture
 * @param {number} height - The height of the texture
 * @param {string} textureName - The name to give the generated texture
 */
export function createYellowLineTexture(scene, width, height, textureName = 'yellowLineTexture') {
  // Create a graphics object to draw the yellow line
  const graphics = scene.add.graphics();

  // Transparent background
  graphics.fillStyle(0x000000, 0);
  graphics.fillRect(0, 0, width, height);

  // Center line (dashed yellow)
  graphics.fillStyle(0xFFFF00, 1);
  const dashLength = height / 8; // Larger dashes for better visibility
  const gapLength = dashLength;

  for (let y = 0; y < height; y += dashLength + gapLength) {
    graphics.fillRect(width / 2 - width * 0.01, y, width * 0.02, dashLength);
  }

  // Generate a texture from the graphics object
  graphics.generateTexture(textureName, width, height);

  // Destroy the graphics object as it's no longer needed
  graphics.destroy();

  return textureName;
}
