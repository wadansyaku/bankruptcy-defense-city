import type { TouchSettings } from "../../types";
import { useAppState } from "../../state/appState";

const settings: Array<{ key: keyof TouchSettings; label: string; help: string }> = [
  { key: "largeControls", label: "大きいタッチUI", help: "360px幅でも押しやすいサイズにします" },
  { key: "confirmPlacement", label: "建設前に確認", help: "誤タップを避けたい端末向け" },
  { key: "reducedMotion", label: "動きを減らす", help: "画面遷移と警告の動きを抑えます" },
  { key: "leftHandMode", label: "左手操作", help: "主要ボタンを左寄せにします" },
];

export function SettingsScreen() {
  const { snapshot, actions } = useAppState();

  return (
    <section className="settings-screen" aria-labelledby="settings-title">
      <div className="section-head">
        <p className="screen-label">設定</p>
        <h1 id="settings-title">操作と保存</h1>
      </div>
      <div className="settings-list">
        {settings.map((setting) => (
          <label key={setting.key} className="toggle-row">
            <span>
              <strong>{setting.label}</strong>
              <small>{setting.help}</small>
            </span>
            <input
              type="checkbox"
              checked={snapshot.settings[setting.key]}
              onChange={(event) => actions.updateSettings({ [setting.key]: event.target.checked } as Partial<TouchSettings>)}
            />
          </label>
        ))}
      </div>
      <div className="settings-actions">
        <button type="button" className="secondary-action" onClick={actions.sync} data-testid="settings-sync">
          アカウントへ同期
        </button>
        <button type="button" className="danger-action" onClick={actions.resetGuest}>
          ゲスト初期化
        </button>
      </div>
    </section>
  );
}
