import { useAppState } from "../../state/appState";
import { Icon } from "../icons";

export function GameHUD() {
  const { snapshot, actions } = useAppState();
  const { city } = snapshot;

  return (
    <section className="game-hud" aria-label="都市ステータス">
      <div className="hud-row">
        <div>
          <span>DAY</span>
          <strong>{city.day}</strong>
        </div>
        <div>
          <span>資金</span>
          <strong>{city.funds}</strong>
        </div>
        <div>
          <span>士気</span>
          <strong>{city.morale}</strong>
        </div>
        <div>
          <span>都市HP</span>
          <strong>{city.cityHp}</strong>
        </div>
      </div>
      <div className="pressure-meter">
        <span>破産圧 {city.debtPressure}%</span>
        <i style={{ width: `${city.debtPressure}%` }} />
      </div>
      {city.enemyVisible && (
        <div className="enemy-banner" data-testid="enemy-state">
          敵勢力可視化: 債権者圧 {city.enemyPressure}%
        </div>
      )}
      <div className="hud-actions">
        <button type="button" onClick={actions.save} data-testid="save-game">
          <Icon name="save" />
          保存
        </button>
        {city.phase === "night" ? (
          <button type="button" onClick={actions.resolveNight} data-testid="resolve-night">
            夜を解決
          </button>
        ) : (
          <button type="button" onClick={actions.startNight} data-testid="start-night">
            <Icon name="moon" />
            夜開始
          </button>
        )}
      </div>
    </section>
  );
}
