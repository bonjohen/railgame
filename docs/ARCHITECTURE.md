# Game Architecture

This document outlines the architecture of the Rail Game, explaining the key components and their interactions.

## Overview

Rail Game is built using the Phaser 3 game framework with a modular architecture. The game is organized into scenes, with each scene responsible for a specific part of the game flow.

## Core Components

### Game Initialization

The game is initialized in `src/index.js`, which sets up the Phaser game instance with the appropriate configuration:

```javascript
import Phaser from 'phaser';
import { LoadingScene } from './scenes/LoadingScene';
import { MainScene } from './scenes/MainScene';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 800,
  height: 600,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [LoadingScene, MainScene]
};

window.addEventListener('load', () => {
  const game = new Phaser.Game(config);
});
```

### Scene Management

The game uses Phaser's scene management system to organize gameplay:

1. **LoadingScene (`src/scenes/LoadingScene.js`)**: Handles asset preloading and displays a loading screen.
2. **MainScene (`src/scenes/MainScene.js`)**: The primary gameplay scene where the player controls the character.

### Asset Management

Game assets are organized in the `src/assets` directory:

- `images/`: Contains all game graphics
- `audio/`: Contains sound effects and music
- `fonts/`: Contains any custom fonts

Assets are preloaded in the LoadingScene before the game starts.

## Game Flow

1. The game starts with the LoadingScene, which preloads all necessary assets.
2. Once assets are loaded, the game transitions to the MainScene.
3. In the MainScene, the player controls a character moving down a road.
4. The player can pause the game by tapping the menu button (vertical ellipsis) in the upper-right corner.

## UI Components

### Menu System

The game includes a menu system accessible via a vertical ellipsis button in the upper-right corner:

1. Tapping the button pauses the game and displays the menu.
2. The menu offers "Resume" and "Exit" options.
3. Selecting "Exit" displays a confirmation dialog.

## Input Handling

The game uses touch input for control:

- Tapping on the left or right side of the screen moves the character in that direction.
- Tapping the menu button opens the game menu.

## Responsive Design

The game is designed to be responsive and adapt to different screen sizes:

- The game canvas scales to fit the device screen while maintaining aspect ratio.
- UI elements are positioned relative to the canvas size.

## Build System

The game uses Webpack for bundling and building:

- Development mode includes hot reloading for faster development.
- Production builds are optimized for performance.

## Future Enhancements

Potential areas for future development:

- Score tracking system
- Multiple levels with increasing difficulty
- Power-ups and special abilities
- Multiplayer capabilities
