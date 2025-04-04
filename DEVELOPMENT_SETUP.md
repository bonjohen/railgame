# Development Environment Setup

This document outlines the steps to set up the development environment for the Rail Game project.

## Required Applications

The following applications must be installed to set up the development environment:

- **Node.js (v18.16.0):** To manage project dependencies and run development scripts.
  - Download from: https://nodejs.org/

- **Android Studio (2022.1.1):** To provide the Android Emulator for testing the application.
  - Download from: https://developer.android.com/studio

- **Visual Studio Code (1.78.2):** As the code editor for development.
  - Download from: https://code.visualstudio.com/

- **Git (2.40.1):** For source control management.
  - Download from: https://git-scm.com/

## Project Dependencies

The project uses the following libraries with specified versions:

- **Phaser (v3.60.0):** The game framework for developing the game.
- **Webpack (v5.75.0):** To bundle JavaScript files and handle asset loading.
- **Babel (v7.21.0):** To transpile modern JavaScript for compatibility.

## Setting Up the Development Environment

1. **Clone the Repository:**
   ```
   git clone https://github.com/bonhohen/railgame.git
   cd railgame
   ```

2. **Install Dependencies:**
   ```
   npm install
   ```

3. **Start the Development Server:**
   ```
   npm start
   ```
   This will start a local development server at http://localhost:8080

4. **Build for Production:**
   ```
   npm run build
   ```
   This will create a production build in the `dist` directory.

## Testing with Android Emulator

1. **Set Up Android Emulator:**
   - Open Android Studio
   - Go to Tools > AVD Manager
   - Create a new virtual device (Pixel 4 or similar recommended)
   - Start the emulator

2. **Access the Game in Emulator:**
   - With the development server running, open the browser in the emulator
   - Navigate to http://10.0.2.2:8080 (special IP that redirects to host's localhost)

## Recommended VS Code Extensions

For an enhanced development experience, the following VS Code extensions are recommended:

- ESLint Extension
- Debugger for Chrome
- Prettier - Code formatter
- JavaScript (ES6) code snippets
- GitLens
- Phaser JS Snippets
- Phaser Snippets
