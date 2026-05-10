import Phaser from "phaser";

export class LoadingScene extends Phaser.Scene {
  constructor() {
    super("LoadingScene");
  }

  create(): void {
    this.scene.start("GameScene");
  }
}
