import Phaser from "phaser";
import { BUILDING_DEFINITIONS, ENEMY_DEFINITIONS, TILE_SIZE } from "../../../shared/constants";
import type { BuildingKey, GameState, Terrain } from "../../../shared/gameTypes";
import { useGameStore, type GameHudEvent } from "../gameStore";

export interface GameSceneOptions {
  readonly seed: string;
  readonly onEvent?: (event: GameHudEvent | { type: string; payload?: unknown }) => void;
}

export class GameScene extends Phaser.Scene {
  private mapLayer?: Phaser.GameObjects.Graphics;
  private entityLayer?: Phaser.GameObjects.Graphics;
  private lastRenderedSignature = "";
  private dragStart?: Phaser.Math.Vector2;
  private dragCamera?: Phaser.Math.Vector2;
  private pinchDistance?: number;
  private onEvent?: (event: GameHudEvent | { type: string; payload?: unknown }) => void;

  constructor() {
    super("GameScene");
  }

  create(): void {
    const options = this.game.registry.get("mountOptions") as GameSceneOptions | undefined;
    this.onEvent = options?.onEvent;
    useGameStore.getState().setSeed(options?.seed ?? "PR1-DEFENSE");
    this.cameras.main.setBounds(0, 0, 96 * TILE_SIZE, 64 * TILE_SIZE);
    this.cameras.main.setZoom(1);
    this.input.addPointer(2);
    this.mapLayer = this.add.graphics();
    this.entityLayer = this.add.graphics();
    this.installInputHandlers();
    this.render(true);
    this.emitState("state");
  }

  update(_time: number, delta: number): void {
    const pointers = this.input.manager.pointers;
    const a = pointers[1];
    const b = pointers[2];
    if (a?.isDown && b?.isDown) {
      const distance = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
      if (this.pinchDistance && distance > 0) {
        const nextZoom = Phaser.Math.Clamp(this.cameras.main.zoom * (distance / this.pinchDistance), 0.45, 2.4);
        this.cameras.main.setZoom(nextZoom);
      }
      this.pinchDistance = distance;
    } else {
      this.pinchDistance = undefined;
    }

    useGameStore.getState().advanceTime(delta);
    this.render(false);
  }

  setBuildMode(type?: BuildingKey): void {
    useGameStore.getState().setBuildMode(type);
  }

  private installInputHandlers(): void {
    this.input.on("wheel", (_pointer: Phaser.Input.Pointer, _objects: unknown[], _dx: number, dy: number) => {
      const camera = this.cameras.main;
      camera.setZoom(Phaser.Math.Clamp(camera.zoom + (dy > 0 ? -0.08 : 0.08), 0.45, 2.4));
    });

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.dragStart = new Phaser.Math.Vector2(pointer.x, pointer.y);
      this.dragCamera = new Phaser.Math.Vector2(this.cameras.main.scrollX, this.cameras.main.scrollY);
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown || !this.dragStart || !this.dragCamera || this.input.manager.pointers[2]?.isDown) {
        return;
      }
      const camera = this.cameras.main;
      camera.scrollX = this.dragCamera.x - (pointer.x - this.dragStart.x) / camera.zoom;
      camera.scrollY = this.dragCamera.y - (pointer.y - this.dragStart.y) / camera.zoom;
    });

    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      if (!this.dragStart) {
        return;
      }
      const moved = Phaser.Math.Distance.Between(pointer.x, pointer.y, this.dragStart.x, this.dragStart.y);
      this.dragStart = undefined;
      this.dragCamera = undefined;
      if (moved > 8) {
        return;
      }
      const world = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
      const tile = { x: Math.floor(world.x / TILE_SIZE), y: Math.floor(world.y / TILE_SIZE) };
      useGameStore.getState().selectTile(tile);
      const placed = useGameStore.getState().placeSelected(tile);
      this.emitState(placed ? "placement" : "tile");
      this.render(true);
    });

    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
      const mode = keyToBuildMode(event.key);
      if (mode) {
        this.setBuildMode(mode);
      }
    });
  }

  private render(force: boolean): void {
    const state = useGameStore.getState().gameState;
    const signature = signatureFor(state);
    if (!force && signature === this.lastRenderedSignature) {
      return;
    }
    this.lastRenderedSignature = signature;
    this.drawMap(state);
    this.drawEntities(state);
    this.emitState("state");
  }

  private drawMap(state: GameState): void {
    const layer = this.mapLayer;
    if (!layer) {
      return;
    }
    layer.clear();
    for (const tile of state.map.tiles) {
      layer.fillStyle(colorForTerrain(tile.terrain), 1);
      layer.fillRect(tile.x * TILE_SIZE, tile.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      if (tile.spawnId) {
        layer.fillStyle(0xd14a4a, 0.85);
        layer.fillCircle(tile.x * TILE_SIZE + 12, tile.y * TILE_SIZE + 12, 5);
      }
      if (tile.hqCandidate) {
        layer.lineStyle(2, 0xf2d66b, 0.65);
        layer.strokeRect(tile.x * TILE_SIZE + 3, tile.y * TILE_SIZE + 3, 18, 18);
      }
    }
  }

  private drawEntities(state: GameState): void {
    const layer = this.entityLayer;
    if (!layer) {
      return;
    }
    layer.clear();
    for (const building of state.buildings) {
      const color = colorForBuilding(building.key);
      layer.fillStyle(color, building.enabled ? 1 : 0.45);
      layer.fillRoundedRect(building.x * TILE_SIZE + 3, building.y * TILE_SIZE + 3, TILE_SIZE - 6, TILE_SIZE - 6, 3);
      layer.lineStyle(2, building.supplied ? 0xffffff : 0xff3f3f, 0.55);
      layer.strokeRoundedRect(building.x * TILE_SIZE + 3, building.y * TILE_SIZE + 3, TILE_SIZE - 6, TILE_SIZE - 6, 3);
    }
    for (const enemy of state.enemies) {
      const spec = ENEMY_DEFINITIONS[enemy.key];
      const health = Phaser.Math.Clamp(enemy.hp / spec.maxHp, 0, 1);
      layer.fillStyle(0x111111, 0.75);
      layer.fillCircle(enemy.x * TILE_SIZE + 12, enemy.y * TILE_SIZE + 12, 9);
      layer.fillStyle(0xef5a45, 1);
      layer.fillCircle(enemy.x * TILE_SIZE + 12, enemy.y * TILE_SIZE + 12, 7);
      layer.fillStyle(0x62d26f, 1);
      layer.fillRect(enemy.x * TILE_SIZE + 4, enemy.y * TILE_SIZE + 2, 16 * health, 2);
    }
  }

  private emitState(type: GameHudEvent["type"]): void {
    this.onEvent?.({ type, payload: useGameStore.getState().gameState });
  }
}

function keyToBuildMode(key: string): BuildingKey | undefined {
  const modes: readonly BuildingKey[] = ["Road", "Wall", "GunTurret", "LaserTurret", "FlameTurret", "Conveyor", "House", "Shop"];
  const index = Number.parseInt(key, 10) - 1;
  return Number.isInteger(index) ? modes[index] : undefined;
}

function signatureFor(state: GameState): string {
  return [
    state.phase,
    state.resources.money,
    state.resources.debt,
    state.hqHp,
    state.buildings.map((building) => `${building.id}:${building.hp}:${building.enabled}:${building.supplied}`).join("|"),
    state.enemies.map((enemy) => `${enemy.id}:${enemy.x}:${enemy.y}:${Math.round(enemy.hp)}`).join("|"),
  ].join(";");
}

function colorForTerrain(terrain: Terrain): number {
  switch (terrain) {
    case "water": return 0x356b9a;
    case "rock": return 0x68615d;
    case "ironOre": return 0x7b8794;
    case "oilField": return 0x5c4a2f;
    case "scrapHeap": return 0x8b765f;
    case "forest": return 0x2f6f45;
    case "road": return 0x9f9a81;
    default: return 0x5f8f58;
  }
}

function colorForBuilding(type: BuildingKey): number {
  if (type === "HQ") return 0xf0d76d;
  if (type === "Wall") return 0x737b83;
  if (type.includes("Turret")) return 0xd85d49;
  if (type === "Road" || type === "Conveyor") return 0xb8a66d;
  if (BUILDING_DEFINITIONS[type].produces.money) return 0x6abf75;
  return 0x6a8fcc;
}
