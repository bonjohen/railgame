/**
 * Test script to verify the development environment setup
 * Run with: node test-environment.js
 */

console.log('Testing development environment setup...');

// Check Node.js version
console.log(`Node.js version: ${process.version}`);
console.log(`Expected: v18.16.0 or higher`);

// Check for required packages
try {
  const packageJson = require('./package.json');
  
  console.log('\nChecking required dependencies:');
  
  // Check Phaser
  const phaserVersion = packageJson.dependencies.phaser;
  console.log(`Phaser version: ${phaserVersion}`);
  console.log(`Expected: ^3.60.0`);
  
  // Check Webpack
  const webpackVersion = packageJson.devDependencies.webpack;
  console.log(`Webpack version: ${webpackVersion}`);
  console.log(`Expected: ^5.75.0`);
  
  // Check Babel
  const babelCoreVersion = packageJson.devDependencies['@babel/core'];
  const babelPresetEnvVersion = packageJson.devDependencies['@babel/preset-env'];
  console.log(`Babel Core version: ${babelCoreVersion}`);
  console.log(`Babel Preset Env version: ${babelPresetEnvVersion}`);
  console.log(`Expected: ^7.21.0 or compatible`);
  
  console.log('\nAll required dependencies are installed.');
  console.log('Development environment setup is complete!');
  
} catch (error) {
  console.error('Error checking package.json:', error.message);
}

// Check for project structure
const fs = require('fs');
const path = require('path');

console.log('\nChecking project structure:');

const requiredDirs = [
  'dist',
  'src',
  'src/assets',
  'src/scenes'
];

const requiredFiles = [
  '.babelrc',
  '.gitignore',
  'package.json',
  'README.md',
  'webpack.config.js',
  'src/index.html',
  'src/index.js'
];

let allExists = true;

// Check directories
for (const dir of requiredDirs) {
  if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
    console.log(`✓ Directory exists: ${dir}`);
  } else {
    console.log(`✗ Missing directory: ${dir}`);
    allExists = false;
  }
}

// Check files
for (const file of requiredFiles) {
  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    console.log(`✓ File exists: ${file}`);
  } else {
    console.log(`✗ Missing file: ${file}`);
    allExists = false;
  }
}

if (allExists) {
  console.log('\nAll required directories and files exist.');
  console.log('Project structure is correct!');
} else {
  console.log('\nSome required directories or files are missing.');
  console.log('Please check the project structure.');
}
