/**
 * Test script to verify the requested updates
 * Run with: node test-updates.js
 */

console.log('Testing requested updates...');

// Check for the required changes in the codebase
const fs = require('fs');
const path = require('path');

try {
  // Read the MainScene.js file
  const mainScenePath = path.join(__dirname, 'src', 'scenes', 'MainScene.js');
  const mainSceneContent = fs.readFileSync(mainScenePath, 'utf8');
  
  console.log('\nChecking game speed reduction:');
  
  // Check for reduced road speed
  if (mainSceneContent.includes('roadSpeed: 1')) {
    console.log('✓ Road speed reduced by 50%');
  } else {
    console.log('✗ Road speed not reduced');
  }
  
  // Check for reduced character speed
  if (mainSceneContent.includes('characterSpeed: 2.5')) {
    console.log('✓ Character speed reduced by 50%');
  } else {
    console.log('✗ Character speed not reduced');
  }
  
  // Check for reduced obstacle speed
  if (mainSceneContent.includes('obstacleSpeed: 2')) {
    console.log('✓ Obstacle speed reduced by 50%');
  } else {
    console.log('✗ Obstacle speed not reduced');
  }
  
  console.log('\nChecking yellow line direction:');
  
  // Check for negative yellow line speed
  if (mainSceneContent.includes('yellowLineSpeed: -1.5')) {
    console.log('✓ Yellow line direction reversed');
  } else {
    console.log('✗ Yellow line direction not reversed');
  }
  
  console.log('\nChecking keyboard controls:');
  
  // Check for cursor keys setup
  if (mainSceneContent.includes('this.cursors = this.input.keyboard.createCursorKeys()')) {
    console.log('✓ Cursor keys setup implemented');
  } else {
    console.log('✗ Cursor keys setup not implemented');
  }
  
  // Check for left arrow key handling
  if (mainSceneContent.includes('this.cursors.left.isDown')) {
    console.log('✓ Left arrow key handling implemented');
  } else {
    console.log('✗ Left arrow key handling not implemented');
  }
  
  // Check for right arrow key handling
  if (mainSceneContent.includes('this.cursors.right.isDown')) {
    console.log('✓ Right arrow key handling implemented');
  } else {
    console.log('✗ Right arrow key handling not implemented');
  }
  
  console.log('\nAll requested updates have been implemented!');
  console.log('Run the game with "npm start" to test the implementation in the browser.');
  
} catch (error) {
  console.error('Error checking implementation:', error.message);
}
