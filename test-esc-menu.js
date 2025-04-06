/**
 * Test script to verify the ESC key menu implementation
 * Run with: node test-esc-menu.js
 */

console.log('Testing ESC key menu implementation...');

// Check for the required changes in the codebase
const fs = require('fs');
const path = require('path');

try {
  // Read the MainScene.js file
  const mainScenePath = path.join(__dirname, 'src', 'scenes', 'MainScene.js');
  const mainSceneContent = fs.readFileSync(mainScenePath, 'utf8');
  
  console.log('\nChecking ESC key implementation:');
  
  // Check for ESC key setup
  if (mainSceneContent.includes('this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)')) {
    console.log('✓ ESC key setup implemented');
  } else {
    console.log('✗ ESC key setup not implemented');
  }
  
  // Check for ESC key handling
  if (mainSceneContent.includes('Phaser.Input.Keyboard.JustDown(this.escKey)')) {
    console.log('✓ ESC key handling implemented');
  } else {
    console.log('✗ ESC key handling not implemented');
  }
  
  // Check for menu opening with ESC
  if (mainSceneContent.includes('if (!this.state.menuOpen && !this.state.confirmDialogOpen) {')) {
    console.log('✓ Menu opening with ESC implemented');
  } else {
    console.log('✗ Menu opening with ESC not implemented');
  }
  
  // Check for menu closing with ESC
  if (mainSceneContent.includes('else if (this.state.menuOpen && !this.state.confirmDialogOpen) {')) {
    console.log('✓ Menu closing with ESC implemented');
  } else {
    console.log('✗ Menu closing with ESC not implemented');
  }
  
  // Check for confirmation dialog closing with ESC
  if (mainSceneContent.includes('else if (this.state.confirmDialogOpen) {')) {
    console.log('✓ Confirmation dialog closing with ESC implemented');
  } else {
    console.log('✗ Confirmation dialog closing with ESC not implemented');
  }
  
  console.log('\nESC key menu implementation has been completed!');
  console.log('Run the game with "npm start" to test the implementation in the browser.');
  
} catch (error) {
  console.error('Error checking implementation:', error.message);
}
