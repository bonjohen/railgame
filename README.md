# Rail Game

A simple 2D game using Phaser with Webpack where the player controls a character moving continuously down a road. The character can be maneuvered left and right using touch controls while avoiding obstacles.

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

## License

ISC
