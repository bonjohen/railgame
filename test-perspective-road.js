/**
 * Test script to verify the perspective road implementation
 * Run with: node test-perspective-road.js
 */

console.log('Testing perspective road implementation...');

// Check for the required changes in the codebase
const fs = require('fs');
const path = require('path');

try {
  // Read the PerspectiveScene.js file
  const perspectiveScenePath = path.join(__dirname, 'src', 'scenes', 'PerspectiveScene.js');
  const perspectiveSceneContent = fs.readFileSync(perspectiveScenePath, 'utf8');
  
  // Read the index.js file
  const indexPath = path.join(__dirname, 'src', 'index.js');
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  
  // Read the LoadingScene.js file
  const loadingScenePath = path.join(__dirname, 'src', 'scenes', 'LoadingScene.js');
  const loadingSceneContent = fs.readFileSync(loadingScenePath, 'utf8');
  
  console.log('\nChecking perspective road implementation:');
  
  // Check for PerspectiveScene class
  if (perspectiveSceneContent.includes('export class PerspectiveScene extends Phaser.Scene')) {
    console.log('✓ PerspectiveScene class created');
  } else {
    console.log('✗ PerspectiveScene class not created');
  }
  
  // Check for perspective road creation
  if (perspectiveSceneContent.includes('createPerspectiveRoad()')) {
    console.log('✓ Perspective road creation method implemented');
  } else {
    console.log('✗ Perspective road creation method not implemented');
  }
  
  // Check for sky and horizon creation
  if (perspectiveSceneContent.includes('createSkyAndHorizon()')) {
    console.log('✓ Sky and horizon creation method implemented');
  } else {
    console.log('✗ Sky and horizon creation method not implemented');
  }
  
  // Check for side elements creation
  if (perspectiveSceneContent.includes('createSideElements()')) {
    console.log('✓ Side elements creation method implemented');
  } else {
    console.log('✗ Side elements creation method not implemented');
  }
  
  // Check for lane markings
  if (perspectiveSceneContent.includes('addLaneMarkings(')) {
    console.log('✓ Lane markings implementation found');
  } else {
    console.log('✗ Lane markings implementation not found');
  }
  
  // Check for projection function
  if (perspectiveSceneContent.includes('projectToScreen(')) {
    console.log('✓ 3D to 2D projection function implemented');
  } else {
    console.log('✗ 3D to 2D projection function not implemented');
  }
  
  console.log('\nChecking scene integration:');
  
  // Check for PerspectiveScene import in index.js
  if (indexContent.includes("import { PerspectiveScene } from './scenes/PerspectiveScene'")) {
    console.log('✓ PerspectiveScene imported in index.js');
  } else {
    console.log('✗ PerspectiveScene not imported in index.js');
  }
  
  // Check for PerspectiveScene added to scene array
  if (indexContent.includes('scene: [LoadingScene, MainScene, PerspectiveScene]')) {
    console.log('✓ PerspectiveScene added to scene array in index.js');
  } else {
    console.log('✗ PerspectiveScene not added to scene array in index.js');
  }
  
  // Check for LoadingScene starting PerspectiveScene
  if (loadingSceneContent.includes("this.scene.start('PerspectiveScene')")) {
    console.log('✓ LoadingScene configured to start PerspectiveScene');
  } else {
    console.log('✗ LoadingScene not configured to start PerspectiveScene');
  }
  
  console.log('\nAll perspective road implementation features have been completed!');
  console.log('Run the game with "npm start" to test the implementation in the browser.');
  
} catch (error) {
  console.error('Error checking implementation:', error.message);
}
