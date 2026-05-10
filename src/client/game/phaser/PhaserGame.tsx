import Phaser from "phaser";
import { useEffect, useRef } from "react";
import type { GameState, Point } from "../../../shared/gameTypes";
import { BootScene } from "./scenes/BootScene";
import { GameScene } from "./scenes/GameScene";
import { LoadingScene } from "./scenes/LoadingScene";

interface PhaserGameProps {
  state: GameState;
  onTileSelect: (point: Point) => void;
}

export function PhaserGame({ state, onTileSelect }: PhaserGameProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game>();

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;
    gameRef.current = new Phaser.Game({
      type: Phaser.CANVAS,
      parent: containerRef.current,
      backgroundColor: "#151515",
      scale: {
        mode: Phaser.Scale.RESIZE,
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      },
      scene: [BootScene, LoadingScene, GameScene],
      render: { pixelArt: true, antialias: false },
    });
    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = undefined;
    };
  }, []);

  useEffect(() => {
    const game = gameRef.current;
    let cancelled = false;
    const sync = (): boolean => {
      const scene = game?.scene.getScene("GameScene") as GameScene | undefined;
      if (!scene) return false;
      scene.setState(state);
      scene.setTileSelect(onTileSelect);
      return true;
    };
    if (!sync()) {
      const id = window.setInterval(() => {
        if (cancelled || sync()) window.clearInterval(id);
      }, 50);
      return () => {
        cancelled = true;
        window.clearInterval(id);
      };
    }
    return () => {
      cancelled = true;
    };
  }, [state, onTileSelect]);

  return <div className="phaser-shell" ref={containerRef} data-testid="phaser-game" />;
}
