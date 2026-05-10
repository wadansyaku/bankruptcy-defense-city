import { useEffect, useRef } from "react";
import { useAppState } from "../../state/appState";

export function PhaserGameHost() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const { snapshot } = useAppState();
  const { city } = snapshot;

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !window.mountPhaserGame) return undefined;
    const controller = window.mountPhaserGame(host, {
      seed: city.seed,
      phase: city.phase,
      day: city.day,
      onEvent: (event) => host.dispatchEvent(new CustomEvent("phaser-game-event", { detail: event })),
    });
    return () => controller?.destroy?.();
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    host.dataset.phase = city.phase;
    host.dataset.day = String(city.day);
  }, [city.day, city.phase]);

  return (
    <div className="phaser-frame" data-testid="phaser-host">
      <div ref={hostRef} className="phaser-host" aria-label="Phaserゲーム表示領域">
        <div className="phaser-fallback">
          <span>都市コア</span>
          <small>PhaserGame接続待ち</small>
        </div>
      </div>
    </div>
  );
}
