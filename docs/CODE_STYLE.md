# Code Style Guide

This document outlines the coding standards and style guidelines for the Rail Game project.

## JavaScript Style Guide

### General Guidelines

- Use ES6+ syntax where appropriate
- Use semicolons at the end of statements
- Use 2-space indentation
- Limit line length to 100 characters
- Use single quotes for strings
- Add trailing commas in objects and arrays
- Use camelCase for variables and functions
- Use PascalCase for classes and constructors
- Use UPPER_CASE for constants

### Example

```javascript
// Good
const DEFAULT_SPEED = 5;

class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, 'player');
    this.speed = DEFAULT_SPEED;
  }
  
  moveLeft() {
    this.sprite.x -= this.speed;
  }
  
  moveRight() {
    this.sprite.x += this.speed;
  }
}

// Bad
var DEFAULT_SPEED = 5;

class player {
  constructor(scene, x, y) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, "player");
    this.speed = DEFAULT_SPEED;
  }
  
  move_left() {
    this.sprite.x -= this.speed;
  }
  
  move_right() {
    this.sprite.x += this.speed;
  }
}
```

## File Organization

### Directory Structure

- Keep related files together in directories
- Use lowercase with hyphens for directory and file names
- Group files by feature or component

### File Naming

- Use descriptive names that reflect the file's purpose
- Use `.js` extension for JavaScript files
- Use `.md` extension for documentation files
- Use lowercase with hyphens for file names (e.g., `game-scene.js`)

## Comments

### Code Comments

- Use JSDoc-style comments for functions and classes
- Add comments for complex logic or non-obvious code
- Keep comments up-to-date with code changes
- Avoid redundant comments that just repeat the code

### Example

```javascript
/**
 * Represents the player character in the game
 * @class
 */
class Player {
  /**
   * Create a new player
   * @param {Phaser.Scene} scene - The scene this player belongs to
   * @param {number} x - The initial x position
   * @param {number} y - The initial y position
   */
  constructor(scene, x, y) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, 'player');
    
    // Set up collision detection
    this.sprite.setCollideWorldBounds(true);
  }
  
  /**
   * Move the player to the left
   * @param {number} speed - The speed to move (optional, defaults to player's speed)
   */
  moveLeft(speed = this.speed) {
    this.sprite.x -= speed;
  }
}
```

## Best Practices

### Performance

- Minimize DOM manipulations
- Use object pooling for frequently created/destroyed objects
- Optimize asset loading and management
- Use requestAnimationFrame for animations

### Security

- Validate all user inputs
- Avoid using eval() or Function constructor
- Be cautious with localStorage and sessionStorage

### Accessibility

- Ensure the game is playable with different input methods
- Provide visual feedback for actions
- Consider color blindness in UI design
- Include options for sound/music volume control

## Git Workflow

### Commit Messages

- Use present tense ("Add feature" not "Added feature")
- Start with a capital letter
- Keep the first line under 50 characters
- Add more detailed explanation in the commit body if necessary

### Branches

- Use feature branches for new features
- Use fix branches for bug fixes
- Use the format: `feature/feature-name` or `fix/bug-name`

## Testing

- Write tests for critical game functionality
- Test on multiple devices and screen sizes
- Test with different input methods (touch, keyboard, etc.)
- Verify performance on lower-end devices
