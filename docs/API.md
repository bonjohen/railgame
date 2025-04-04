# Rail Game API Documentation

This document provides detailed information about the Rail Game's API, including classes, methods, and properties.

## Table of Contents

- [Game Configuration](#game-configuration)
- [Scenes](#scenes)
  - [LoadingScene](#loadingscene)
  - [MainScene](#mainscene)
- [Game Objects](#game-objects)
  - [Player](#player)
  - [Obstacles](#obstacles)
- [UI Components](#ui-components)
  - [Menu](#menu)

## Game Configuration

The game is configured in `src/index.js` with the following settings:

```javascript
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
```

| Property | Type | Description |
|----------|------|-------------|
| `type` | `Phaser.AUTO` | Renderer type (WebGL with Canvas fallback) |
| `parent` | String | DOM element ID for the game canvas |
| `width` | Number | Game canvas width in pixels |
| `height` | Number | Game canvas height in pixels |
| `scale.mode` | `Phaser.Scale.FIT` | Scaling mode for responsive design |
| `scale.autoCenter` | `Phaser.Scale.CENTER_BOTH` | Canvas centering mode |
| `physics.default` | String | Physics engine type |
| `physics.arcade.gravity` | Object | Gravity settings |
| `physics.arcade.debug` | Boolean | Whether to show physics bodies |
| `scene` | Array | Game scenes in order of execution |

## Scenes

### LoadingScene

The LoadingScene is responsible for preloading all game assets and displaying a loading screen.

**File:** `src/scenes/LoadingScene.js`

#### Methods

##### `constructor()`

Creates a new LoadingScene instance.

##### `preload()`

Preloads all game assets and sets up the loading screen UI.

**Loading Events:**

| Event | Description |
|-------|-------------|
| `progress` | Fired when loading progress updates |
| `complete` | Fired when all assets are loaded |

### MainScene

The MainScene is the primary gameplay scene where the player controls a character moving down a road.

**File:** `src/scenes/MainScene.js`

#### Methods

##### `constructor()`

Creates a new MainScene instance.

##### `create()`

Sets up the game scene, UI elements, and event handlers.

##### `update()`

Runs on each frame to update game logic.

## Game Objects

### Player

The player character that moves along the road.

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `sprite` | Phaser.GameObjects.Sprite | The visual representation of the player |
| `speed` | Number | Movement speed of the player |

**Methods:**

| Method | Description |
|--------|-------------|
| `moveLeft()` | Moves the player to the left |
| `moveRight()` | Moves the player to the right |

### Obstacles

Objects that appear on the road and must be avoided by the player.

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `sprite` | Phaser.GameObjects.Sprite | The visual representation of the obstacle |
| `speed` | Number | Movement speed of the obstacle |

## UI Components

### Menu

The game menu accessible via the vertical ellipsis button.

**Options:**

| Option | Description |
|--------|-------------|
| `Resume` | Continues gameplay from the paused state |
| `Exit` | Exits the game (with confirmation dialog) |

**Methods:**

| Method | Description |
|--------|-------------|
| `show()` | Displays the menu |
| `hide()` | Hides the menu |
| `handleResume()` | Resumes the game |
| `handleExit()` | Shows exit confirmation dialog |
