import type { RouteId } from "../../types";
import { useAppState } from "../../state/appState";
import { Icon } from "../icons";

type IconName = "city" | "shield" | "card" | "bag" | "gear" | "map" | "moon" | "save";

const items: Array<{ route: RouteId; label: string; icon: IconName }> = [
  { route: "dashboard", label: "本部", icon: "shield" },
  { route: "game", label: "都市", icon: "city" },
  { route: "gacha", label: "支援", icon: "card" },
  { route: "inventory", label: "保管", icon: "bag" },
  { route: "settings", label: "設定", icon: "gear" },
];

export function BottomNav() {
  const { route, actions } = useAppState();

  return (
    <nav className="bottom-nav" aria-label="主要画面">
      {items.map((item) => (
        <button
          key={item.route}
          type="button"
          className={route === item.route ? "active" : ""}
          onClick={() => actions.navigate(item.route)}
          data-testid={`nav-${item.route}`}
        >
          <Icon name={item.icon} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
