import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create(): void {
    this.scale.scaleMode = Phaser.Scale.RESIZE;
    this.scene.start("LoadingScene");
  }
}

