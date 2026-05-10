import { BuildSheet } from "../components/game/BuildSheet";
import { GameHUD } from "../components/hud/GameHUD";
import { PhaserGameHost } from "../components/phaser/PhaserGameHost";
import { useAppState } from "../state/appState";

const labels = {
  shelter: "避",
  market: "市",
  watch: "監",
  clinic: "診",
};

export function GameScreen() {
  const { snapshot, actions } = useAppState();
  const { city } = snapshot;

  return (
    <section className="game-screen" aria-label="ゲーム画面">
      <GameHUD />
      <div className="playfield">
        <PhaserGameHost />
        <div className="city-grid" data-testid="city-grid">
          {Array.from({ length: 20 }).map((_, index) => {
            const x = index % 5;
            const y = Math.floor(index / 5);
            const building = city.buildings.find((item) => item.x === x && item.y === y);
            return (
              <button
                key={`${x}-${y}`}
                type="button"
                className={building ? `tile has-building ${building.type}` : "tile"}
                onClick={() => actions.placeBuilding(x, y)}
                data-testid={`tile-${x}-${y}`}
                aria-label={building ? `${building.type} 建設済み` : `${x},${y} に建設`}
              >
                {building ? labels[building.type] : ""}
              </button>
            );
          })}
        </div>
      </div>
      <BuildSheet />
    </section>
  );
}
