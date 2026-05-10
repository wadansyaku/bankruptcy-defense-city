import type { BuildingType } from "../../types";
import { useAppState } from "../../state/appState";

const buildings: Array<{ type: BuildingType; label: string; cost: number; help: string }> = [
  { type: "shelter", label: "避難所", cost: 60, help: "都市HPを守る" },
  { type: "market", label: "市場", cost: 60, help: "翌日の資金源" },
  { type: "watch", label: "監視塔", cost: 60, help: "敵圧を早期検知" },
  { type: "clinic", label: "診療所", cost: 90, help: "士気低下を抑える" },
];

export function BuildSheet() {
  const { snapshot, actions } = useAppState();
  const selected = snapshot.city.selectedBuilding;

  return (
    <aside className="build-sheet" aria-label="建設パネル">
      <div className="sheet-handle" />
      <div className="sheet-title">
        <strong>建設</strong>
        <span>{snapshot.city.phase === "planning" ? "配置先をタップ" : "夜間は建設停止"}</span>
      </div>
      <div className="build-options">
        {buildings.map((building) => (
          <button
            key={building.type}
            type="button"
            className={selected === building.type ? "active" : ""}
            onClick={() => actions.selectBuilding(building.type)}
            data-testid={`select-${building.type}`}
          >
            <strong>{building.label}</strong>
            <span>{building.cost} 資金</span>
            <small>{building.help}</small>
          </button>
        ))}
      </div>
    </aside>
  );
}
