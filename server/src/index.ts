import WorldScene from "./WorldScene";

const config = {
  type: Phaser.HEADLESS,
  parent: 'phaser-example',
  width: 800,
  height: 600,
  physics: {
    default: 'arcade'
  },
  scene: [WorldScene],
  autoFocus: false
};

const game = new Phaser.Game(config);
(window as any).gameLoaded();
