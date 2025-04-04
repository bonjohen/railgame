import Phaser from 'phaser';

export class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }

  create() {
    // Add game elements here
    this.add.text(400, 300, 'Rail Game', {
      font: '32px Arial',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    // Add menu button (vertical ellipsis)
    const menuButton = this.add.text(780, 20, '⋮', {
      font: '32px Arial',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    menuButton.setInteractive();
    menuButton.on('pointerdown', () => {
      // Pause the game and show menu
      console.log('Menu button clicked');
      // Menu implementation will be added later
    });
  }

  update() {
    // Game update logic will be implemented here
  }
}
