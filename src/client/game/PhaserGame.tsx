import { useEffect, useRef } from "react";
import Phaser from "phaser";
import type { BuildingKey, GameState } from "../../shared/gameTypes";
import { BootScene } from "./scenes/BootScene";
import { LoadingScene } from "./scenes/LoadingScene";
import { GameScene, type GameSceneOptions } from "./scenes/GameScene";
import { useGameStore, type GameHudEvent } from "./gameStore";

export interface PhaserGameProps {
  readonly seed: string;
  readonly phase?: string;
  readonly day?: number;
  readonly onEvent?: (event: GameHudEvent | { type: string; payload?: unknown }) => void;
}

export interface PhaserGameController {
  readonly game: Phaser.Game;
  destroy(): void;
  advanceTime(ms: number): GameState;
  renderToText(): string;
  setBuildMode(type?: BuildingKey): void;
}

export function mountPhaserGame(parent: HTMLElement, options: PhaserGameProps): PhaserGameController {
  useGameStore.getState().setSeed(options.seed);
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent,
    backgroundColor: "#111820",
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: Math.max(320, parent.clientWidth || 960),
      height: Math.max(240, parent.clientHeight || 540),
    },
    scene: [BootScene, LoadingScene, GameScene],
    callbacks: {
      postBoot(game) {
        const sceneOptions: GameSceneOptions = { seed: options.seed, onEvent: options.onEvent };
        game.registry.set("mountOptions", sceneOptions);
      },
    },
  };
  const game = new Phaser.Game(config);
  const controller: PhaserGameController = {
    game,
    destroy() {
      game.destroy(true);
    },
    advanceTime(ms) {
      return useGameStore.getState().advanceTime(ms);
    },
    renderToText() {
      return useGameStore.getState().renderText();
    },
    setBuildMode(type) {
      useGameStore.getState().setBuildMode(type);
      const scene = game.scene.getScene("GameScene");
      if (scene instanceof GameScene) {
        scene.setBuildMode(type);
      }
    },
  };
  installWindowHooks(controller);
  return controller;
}

export function PhaserGame({ seed, onEvent }: PhaserGameProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!ref.current) {
      return undefined;
    }
    const controller = mountPhaserGame(ref.current, { seed, onEvent });
    return () => controller.destroy();
  }, [seed, onEvent]);
  return <div ref={ref} style={{ width: "100%", height: "100%", minHeight: 360 }} />;
}

function installWindowHooks(controller: PhaserGameController): void {
  window.mountPhaserGame = mountPhaserGame;
  (window as typeof window & { render_game_to_text?: () => string; advanceTime?: (ms: number) => GameState }).render_game_to_text =
    () => controller.renderToText();
  (window as typeof window & { render_game_to_text?: () => string; advanceTime?: (ms: number) => GameState }).advanceTime =
    (ms: number) => controller.advanceTime(ms);
}

if (typeof window !== "undefined") {
  window.mountPhaserGame = mountPhaserGame;
}
