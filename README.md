# Rail Game

A simple 2D game using Phaser with Webpack where the player controls a character moving continuously down a road. The character can be maneuvered left and right using touch controls while avoiding obstacles.

## Overview

Rail Game is a mobile-focused game primarily targeting Android devices. The game features a character that moves continuously down a road, with the player controlling left and right movements to avoid obstacles. The game includes a menu system accessible via a vertical ellipsis button in the upper-right corner, allowing players to pause, resume, or exit the game.

## Table of Contents

- [Project Structure](#project-structure)
- [Development Environment Setup](#development-environment-setup)
- [Game Features](#game-features)
- [Game Controls](#game-controls)
- [Building and Deployment](#building-and-deployment)
- [Testing](#testing)
- [Documentation](#documentation)
- [License](#license)

## Project Structure

```
project-root/
├── dist/                # Distribution folder for production builds
├── node_modules/        # Node.js modules
├── src/                 # Source code
│   ├── assets/          # Game assets (images, sounds)
│   ├── scenes/          # Game scenes
│   ├── index.js         # Main JavaScript file
│   └── ...              # Additional source files
├── .babelrc             # Babel configuration
├── .gitignore           # Git ignore file
├── package.json         # Node.js project metadata
├── README.md            # Project overview and instructions
└── webpack.config.js    # Webpack configuration
```

## Development Environment Setup

### Prerequisites

- Node.js (v18.16.0)
- Android Studio (2022.1.1)
- Visual Studio Code (1.78.2)
- Git (2.40.1)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/bonhohen/railgame.git
   cd railgame
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. Build for production:
   ```
   npm run build
   ```

## Game Features

- Character movement along a road
- Touch controls for left and right movement
- Menu system with pause, resume, and exit options
- Obstacle avoidance gameplay
- Responsive design for various screen sizes
- Optimized for Android devices

## Game Controls

- **Touch Controls**: Tap on the left or right side of the screen to move the character in that direction
- **Menu Button**: Tap the vertical ellipsis (⋮) in the upper-right corner to access the game menu
  - **Resume**: Continue gameplay from the paused state
  - **Exit**: Leave the game (with confirmation dialog)

## Building and Deployment

### Development Build

To run the game in development mode with hot reloading:

```bash
npm start
```

This will start a development server at http://localhost:8080

### Production Build

To create a production-ready build:

```bash
npm run build
```

This will generate optimized files in the `dist/` directory.

### Deploying to Android

To test the game on an Android device or emulator:

1. Start the development server: `npm start`
2. Open the Android Emulator
3. Open the browser in the emulator and navigate to http://10.0.2.2:8080

## Testing

To verify your development environment setup:

```bash
node test-environment.js
```

This script checks for required dependencies and project structure.

## Documentation

Additional documentation files:

- [DEVELOPMENT_SETUP.md](./DEVELOPMENT_SETUP.md): Detailed instructions for setting up the development environment
- [CHANGELOG.md](./CHANGELOG.md): History of changes and updates to the project

## License

ISC
