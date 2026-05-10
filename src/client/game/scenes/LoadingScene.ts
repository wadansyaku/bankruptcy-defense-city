import Phaser from "phaser";

export class LoadingScene extends Phaser.Scene {
  constructor() {
    super("LoadingScene");
  }

  create(): void {
    this.createTileTexture("tile-plains", 0x5f8f58);
    this.createTileTexture("tile-forest", 0x2f6f45);
    this.createTileTexture("tile-water", 0x356b9a);
    this.createTileTexture("tile-mountain", 0x68615d);
    this.createTileTexture("tile-ruins", 0x7d7568);
    this.createTileTexture("tile-road", 0x9f9a81);
    this.createTileTexture("tile-wasteland", 0x8b6a4f);
    this.scene.start("GameScene");
  }

  private createTileTexture(key: string, color: number): void {
    const graphics = this.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(color, 1);
    graphics.fillRect(0, 0, 24, 24);
    graphics.lineStyle(1, 0x1d2328, 0.22);
    graphics.strokeRect(0, 0, 24, 24);
    graphics.generateTexture(key, 24, 24);
    graphics.destroy();
  }
}

