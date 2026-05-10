import Phaser from "phaser";
import { BUILDING_DEFINITIONS, ENEMY_DEFINITIONS, TILE_SIZE } from "../../../../shared/constants";
import type { BuildingInstance, GameState, Terrain } from "../../../../shared/gameTypes";
import { createInitialGame } from "../../core/game";

const terrainColors: Record<Terrain, number> = {
  plain: 0x3b4735,
  road: 0x6d6655,
  forest: 0x253f2e,
  water: 0x23526b,
  rock: 0x3d3f42,
  ironOre: 0x57606a,
  oilField: 0x2d2520,
  scrapHeap: 0x6c5b3f,
};

export class GameScene extends Phaser.Scene {
  private state?: GameState;
  private tileLayer?: Phaser.GameObjects.Graphics;
  private entityLayer?: Phaser.GameObjects.Graphics;
  private onTileSelect?: (point: { x: number; y: number }) => void;
  private dragging = false;
  private lastPointer?: Phaser.Math.Vector2;

  constructor() {
    super("GameScene");
  }

  create(): void {
    this.tileLayer = this.add.graphics();
    this.entityLayer = this.add.graphics();
    this.cameras.main.setZoom(0.72);
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.dragging = false;
      this.lastPointer = new Phaser.Math.Vector2(pointer.x, pointer.y);
    });
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!this.lastPointer || !pointer.isDown) return;
      const dx = pointer.x - this.lastPointer.x;
      const dy = pointer.y - this.lastPointer.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) this.dragging = true;
      this.cameras.main.scrollX -= dx / this.cameras.main.zoom;
      this.cameras.main.scrollY -= dy / this.cameras.main.zoom;
      this.lastPointer.set(pointer.x, pointer.y);
    });
    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      if (!this.dragging) {
        const world = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
        this.onTileSelect?.({ x: Math.floor(world.x / TILE_SIZE), y: Math.floor(world.y / TILE_SIZE) });
      }
      this.lastPointer = undefined;
    });
    this.input.on("wheel", (_pointer: Phaser.Input.Pointer, _objects: unknown, _dx: number, dy: number) => {
      this.cameras.main.setZoom(Phaser.Math.Clamp(this.cameras.main.zoom + (dy > 0 ? -0.08 : 0.08), 0.45, 1.6));
    });
    this.state = createInitialGame("phaser-visible-fallback");
    this.renderState();
  }

  setState(state: GameState): void {
    this.state = state;
    const hq = state.buildings.find((building) => building.key === "HQ");
    if (hq && this.cameras.main.scrollX === 0 && this.cameras.main.scrollY === 0) {
      this.cameras.main.centerOn(hq.x * TILE_SIZE, hq.y * TILE_SIZE);
    }
    this.renderState();
  }

  setTileSelect(handler: (point: { x: number; y: number }) => void): void {
    this.onTileSelect = handler;
  }

  private renderState(): void {
    if (!this.state || !this.tileLayer || !this.entityLayer) return;
    const state = this.state;
    const tiles = this.tileLayer.clear();
    const entities = this.entityLayer.clear();
    for (const tile of state.map.tiles) {
      tiles.fillStyle(terrainColors[tile.terrain], 1);
      tiles.fillRect(tile.x * TILE_SIZE, tile.y * TILE_SIZE, TILE_SIZE - 1, TILE_SIZE - 1);
      if (tile.spawnId) {
        tiles.fillStyle(0xb94545, 1);
        tiles.fillCircle(tile.x * TILE_SIZE + 16, tile.y * TILE_SIZE + 16, 7);
      }
    }
    for (const building of state.buildings) this.drawBuilding(entities, building);
    for (const enemy of state.enemies) {
      entities.fillStyle(0xf05252, 1);
      entities.fillCircle(enemy.x * TILE_SIZE + 16, enemy.y * TILE_SIZE + 16, enemy.key === "BankruptcyTrusteeBoss" ? 16 : 9);
      entities.lineStyle(2, 0x260f0f, 1).strokeCircle(enemy.x * TILE_SIZE + 16, enemy.y * TILE_SIZE + 16, enemy.key === "BankruptcyTrusteeBoss" ? 16 : 9);
    }
    if (state.selectedTile) {
      entities.lineStyle(3, 0xfacc15, 1);
      entities.strokeRect(state.selectedTile.x * TILE_SIZE + 1, state.selectedTile.y * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2);
    }
  }

  private drawBuilding(graphics: Phaser.GameObjects.Graphics, building: BuildingInstance): void {
    const definition = BUILDING_DEFINITIONS[building.key];
    const x = building.x * TILE_SIZE + 4;
    const y = building.y * TILE_SIZE + 4;
    const color = building.key === "HQ" ? 0xfacc15 : definition.attack ? 0x60a5fa : building.supplied ? 0x9ca3af : 0x6b7280;
    graphics.fillStyle(color, 1);
    graphics.fillRoundedRect(x, y, TILE_SIZE - 8, TILE_SIZE - 8, 4);
    graphics.lineStyle(2, building.supplied ? 0x111827 : 0xef4444, 1).strokeRoundedRect(x, y, TILE_SIZE - 8, TILE_SIZE - 8, 4);
    if (definition.attack) {
      graphics.lineStyle(1, 0x93c5fd, 0.18);
      graphics.strokeCircle(building.x * TILE_SIZE + 16, building.y * TILE_SIZE + 16, definition.attack.range * TILE_SIZE);
    }
    if (building.key === "HQ") {
      graphics.fillStyle(0x111827, 1).fillRect(x + 7, y + 7, TILE_SIZE - 22, TILE_SIZE - 22);
    }
    void ENEMY_DEFINITIONS;
  }
}
