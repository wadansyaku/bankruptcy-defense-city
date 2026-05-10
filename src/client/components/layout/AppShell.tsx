import type { ReactNode } from "react";
import { useAppState } from "../../state/appState";
import { Icon } from "../icons";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: ReactNode }) {
  const { route, snapshot, busyLabel, notice, actions } = useAppState();
  const isAppRoute = !["landing", "login", "signup"].includes(route);

  return (
    <div
      className={`app-root ${snapshot.settings.largeControls ? "large-controls" : ""} ${
        snapshot.settings.leftHandMode ? "left-hand" : ""
      } ${snapshot.settings.reducedMotion ? "reduced-motion" : ""}`}
    >
      <header className="topbar">
        <button className="brand-button" type="button" onClick={() => actions.navigate(isAppRoute ? "dashboard" : "landing")}>
          <Icon name="city" />
          <span>破産防衛都市</span>
        </button>
        <div className="topbar-actions">
          {snapshot.pendingSync && (
            <button className="sync-chip" type="button" onClick={actions.sync} data-testid="sync-now">
              同期待ち
            </button>
          )}
          <span className="user-chip">{snapshot.user.name}</span>
        </div>
      </header>

      {notice && <div className="notice-bar">{notice}</div>}
      {busyLabel && <div className="busy-overlay">{busyLabel}</div>}

      <main className={`main-view route-${route}`}>{children}</main>

      {isAppRoute && <BottomNav />}
    </div>
  );
}
