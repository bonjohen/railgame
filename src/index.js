import Phaser from 'phaser';
import { LoadingScene } from './scenes/LoadingScene';
import { MainScene } from './scenes/MainScene';

// Game configuration
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

// Initialize the game
window.addEventListener('load', () => {
  const game = new Phaser.Game(config);
});
