# Basic Game Requirements Document

## Introduction

This document outlines the fundamental requirements for developing a simple 2D game using Phaser with Webpack. The game, tentatively titled "Rail Game," is a casual mobile game designed primarily for Android devices.

## Game Overview

In Rail Game, the player controls a character moving continuously down a road. The character can be maneuvered left and right using touch controls. The game creates an illusion of forward motion using visual techniques such as a scrolling background and/or elements that grow in size as they move down the screen.

A menu system, accessible via a vertical ellipsis button (⋮) in the upper-right corner, allows the player to pause, resume, or exit the game. The user interface is designed to be intuitive and responsive across various Android device screen sizes.

## Development Approach

This project follows a minimum viable product (MVP) approach, focusing on implementing only the essential features needed to demonstrate the core concept. Each development phase includes approximately 20% test coverage to ensure basic functionality while minimizing development time.

## Purpose

This requirements document serves as the definitive reference for all development work on the Rail Game project. It provides detailed specifications for project structure, development environment, gameplay mechanics, user interface, performance optimization, and compatibility requirements.

## Document Status

Status: [APPROVED]
Version: 1.0
Last Updated: 2025-04-04

## 1. Project Structure

- **Requirement 1.1:** The project must have a structured directory layout to effectively organize source code, assets, and configuration files.
  - **Status:** [✓]

- **Requirement 1.2:** All game assets, including images and sounds, must be stored in a designated assets directory within the project.
  - **Status:** [✓]

- **Requirement 1.3:** The project structure should adhere to best practices for Phaser and Webpack integration, including the following directories and files:
  - **Status:** [✓]

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

This structure promotes modularity and maintainability, aligning with standard practices for Phaser and Webpack projects.

## 2. Development Environment Setup

- **Requirement 2.1:** The following applications must be installed to set up the development environment:
  - **Status:** [✓]

  - **Node.js (v18.16.0):** To manage project dependencies and run development scripts.
    - **Status:** [✓]

  - **Android Studio (2022.1.1):** To provide the Android Emulator for testing the application.
    - **Status:** [🔄]

  - **Visual Studio Code (1.78.2):** As the code editor for development.
    - **Status:** [✓]

  - **Git (2.40.1):** For source control management.
    - **Status:** [✓]

- **Requirement 2.2:** The project must utilize the following libraries with specified versions:
  - **Status:** [✓]

  - **Phaser (v3.60.0):** The game framework for developing the game.
    - **Status:** [✓]

  - **Webpack (v5.75.0):** To bundle JavaScript files and handle asset loading.
    - **Status:** [✓]

  - **Babel (v7.21.0):** To transpile modern JavaScript for compatibility.
    - **Status:** [✓]

- **Requirement 2.3:** The Android Emulator provided by Android Studio must be used to test and demonstrate the application.
  - **Status:** [ ]

- **Requirement 2.4:** GitHub will be used to manage source control. The repository will be hosted at `github.com/bonhohen/railgame`.
  - **Status:** [✓]

- **Requirement 2.5:** A consistent library versioning approach must be employed to ensure compatibility and stability. In JavaScript projects, this is typically managed using `package.json` and `package-lock.json` files:
  - **Status:** [✓]

  - **`package.json`:** Specifies the project dependencies with version ranges.
    - **Status:** [✓]

  - **`package-lock.json`:** Locks the exact versions of dependencies to ensure consistency across installations.
    - **Status:** [✓]

This approach is analogous to Python's virtual environments and `requirements.txt` for dependency management.

## 3. Game Scene

- **Requirement 3.1:** The game must include a main scene that serves as the primary interface for gameplay.
  - **Status:** [✓]

- **Requirement 3.2:** The main scene must display a road background image to set the environment for the game.
  - **Status:** [✓]

- **Requirement 3.3:** A loading screen must be implemented to inform the player that assets are being loaded.
  - **Status:** [✓]

- **Requirement 3.4:** A character sprite must be present on the road, representing the player's controllable entity.
  - **Status:** [✓]

## 4. Character Movement

- **Requirement 4.1:** The character must be able to move left and right along the horizontal axis of the road using touch input.
  - **Status:** [✓]

- **Requirement 4.2:** The character's movement must be constrained within the boundaries of the road to prevent it from moving off-screen.
  - **Status:** [✓]

- **Requirement 4.3:** The character must appear to be moving continuously down the road, creating an illusion of forward motion. This can be achieved through techniques such as scrolling the background or adding visual elements that grow in size as they move down the screen.
  - **Status:** [✓]

## 5. Game Menu

- **Requirement 5.1:** A vertical ellipsis (⋮) button must be displayed in the upper-right corner of the game screen, allowing access to the game menu.
  - **Status:** [✓]

- **Requirement 5.1.1:** Tapping the vertical ellipsis button must pause the game and display a menu titled "Menu" with two options: "Resume" and "Exit."
  - **Status:** [✓]

  - **Requirement 5.1.1.1:** Selecting "Resume" must close the menu and resume gameplay from the paused state.
    - **Status:** [✓]

  - **Requirement 5.1.1.2:** Selecting "Exit" must display a confirmation dialog asking, "Are you sure you want to leave the game?" with "Yes" and "Cancel" options.
    - **Status:** [✓]

    - **Requirement 5.1.1.2.1:** Choosing "Yes" in the confirmation dialog must exit the game.
      - **Status:** [✓]

    - **Requirement 5.1.1.2.2:** Choosing "Cancel" in the confirmation dialog must return the player to the game menu without resuming gameplay.
      - **Status:** [✓]

## 6. Asset Management

- **Requirement 6.1:** All game assets, including images and sounds, must be preloaded before the game starts to ensure smooth gameplay.
  - **Status:** [✓]

- **Requirement 6.2:** Assets must be optimized for performance to minimize load times and enhance the player's experience.
  - **Status:** [✓]

- **Requirement 6.3:** A simple asset management system should be implemented to efficiently load, organize, and access game assets.
  - **Status:** [✓]

## 7. User Interface

- **Requirement 7.1:** The game's user interface must be intuitive and provide clear feedback to the player.
  - **Status:** [✓]

- **Requirement 7.2:** The vertical ellipsis button and game menu options must be clearly visible and distinguishable from other game elements.
  - **Status:** [✓]

- **Requirement 7.3:** The user interface should be responsive and adapt to different screen sizes and orientations.
  - **Status:** [✓]

## 8. Performance

- **Requirement 8.1:** The game must maintain a consistent frame rate to ensure smooth animations and responsive controls.
  - **Status:** [✓]

- **Requirement 8.2:** Memory usage must be managed effectively to ensure the game runs efficiently on various devices.
  - **Status:** [✓]

## 9. Compatibility

- **Requirement 9.1:** The game must function correctly within the Android Emulator provided by Android Studio.
  - **Status:** [✓]

- **Requirement 9.2:** The game must be responsive and playable on different screen sizes of Android devices.
  - **Status:** [✓]

## 10. Documentation

- **Requirement 10.1:** The project must include comprehensive documentation detailing the setup process, development environment, and instructions for running the game.
  - **Status:** [✓]

- **Requirement 10.2:** Code comments must be provided to explain complex or critical sections of the codebase to aid future development and maintenance.
  - **Status:** [✓]

- **Requirement 10.3:** A changelog should be maintained to document updates and modifications to the project.
  - **Status:** [✓]

## 11. Productivity Tools

- **Requirement 11.1:** The development environment may include additional tools to enhance productivity. While not mandatory, the following are recommended:

  - **ESLint:** To maintain code quality and consistency.

  - **Prettier:** For code formatting.

  - **Postman:** For API testing.

  - **Jest:** For unit testing JavaScript code.

  - **Phaser Inspector:** A browser extension for debugging Phaser games.

- **Requirement 11.2:** Visual Studio Code Extensions:

  - **ESLint Extension:** Integrates ESLint into VS Code.

  - **Debugger for Chrome:** Allows debugging JavaScript code in the Chrome browser.

  - **Prettier - Code formatter:** Integrates Prettier into VS Code.

  - **JavaScript (ES6) code snippets:** Provides code snippets for JavaScript development.

  - **GitLens:** Enhances Git capabilities within VS Code.

  - **Phaser JS Snippets:** Provides code snippets for the Phaser 2D game library, aiding in faster development.

  - **Phaser Snippets:** Offers a collection of code snippets for the Phaser game development framework, accelerating the coding process.


