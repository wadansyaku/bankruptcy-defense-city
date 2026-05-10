import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BUILDING_DEFINITIONS } from "../shared/constants";
import type { AuthUser, ClientConfig, GachaBanner, GachaRollResult, MeResponse } from "../shared/apiTypes";
import type { Biome, BuildingKey, GameMap, Resources } from "../shared/gameTypes";
import { api } from "./api";
import { PhaserGame } from "./game/phaser/PhaserGame";
import { CARD_DEFINITIONS } from "./game/core/cards";
import { generateMap } from "./game/core/mapgen";
import { renderGameToText } from "./game/core/game";
import { useGameStore } from "./game/state/gameStore";
import { useUiStore } from "./game/state/uiStore";

const buildKeys = Object.keys(BUILDING_DEFINITIONS).filter((key) => BUILDING_DEFINITIONS[key as BuildingKey].buildable) as BuildingKey[];
const priorityBuildKeys: BuildingKey[] = ["Road", "GunTurret", "PowerPlant", "Factory", "House", "TaxOffice", "LoanOffice"];
const rarityOrder = ["all", "N", "R", "SR", "UR"] as const;

function formatMoney(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 100_000_000) return `${value < 0 ? "-" : ""}¥${(abs / 100_000_000).toFixed(1)}億`;
  if (abs >= 10_000) return `${value < 0 ? "-" : ""}¥${Math.round(abs / 10_000).toLocaleString()}万`;
  return `¥${value.toLocaleString()}`;
}

function formatCost(cost: Partial<Resources>): string {
  const money = cost.money;
  return typeof money === "number" ? formatMoney(money) : "資材のみ";
}

type TurnstileApi = {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      action?: string;
      theme?: "auto" | "light" | "dark";
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ) => string;
  remove?: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    __bankruptcyTurnstileScript?: Promise<void>;
  }
}

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (window.__bankruptcyTurnstileScript) return window.__bankruptcyTurnstileScript;

  window.__bankruptcyTurnstileScript = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-bankruptcy-turnstile]");
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("turnstile script failed")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.dataset.bankruptcyTurnstile = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("turnstile script failed"));
    document.head.appendChild(script);
  });

  return window.__bankruptcyTurnstileScript;
}

function TurnstileWidget({
  siteKey,
  action,
  onToken,
}: {
  siteKey: string | null | undefined;
  action: string;
  onToken: (token: string) => void;
}): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onToken("");
    if (!siteKey) return undefined;
    let cancelled = false;
    let widgetId: string | null = null;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        containerRef.current.replaceChildren();
        widgetId = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action,
          theme: "auto",
          callback: onToken,
          "expired-callback": () => onToken(""),
          "error-callback": () => onToken(""),
        });
      })
      .catch(() => onToken(""));

    return () => {
      cancelled = true;
      if (widgetId && window.turnstile?.remove) window.turnstile.remove(widgetId);
    };
  }, [action, onToken, siteKey]);

  if (!siteKey) {
    return <div className="turnstile-placeholder">Turnstile: ローカル開発では secret 未設定時に検証をバイパス</div>;
  }

  return <div className="turnstile-widget" ref={containerRef} aria-label="Turnstile 検証" />;
}

export function App(): JSX.Element {
  const { route, setRoute } = useUiStore();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (localStorage.getItem("bankruptcy-defense-city:session-hint") !== "1") return;
    api.me().then((result) => {
      if (result.ok) setUser(result.data.user);
    });
  }, []);

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setRoute(user ? "dashboard" : "landing")} aria-label="ホーム">
          <span className="brand-mark">破</span>
          <span>破産防衛都市</span>
        </button>
        <nav className="nav">
          <button onClick={() => setRoute("game")} data-testid="nav-game">都市</button>
          <button onClick={() => setRoute("gacha")} data-testid="nav-gacha">ガチャ</button>
          <button onClick={() => setRoute("inventory")} data-testid="nav-inventory">カード</button>
          <button onClick={() => setRoute("settings")} data-testid="nav-settings">設定</button>
        </nav>
        <span className="user-pill">{user ? user.username : "ゲスト"}</span>
      </header>
      <main className="main">
        {route === "landing" && <Landing />}
        {route === "login" && <AuthScreen mode="login" onUser={setUser} onDone={() => setRoute("dashboard")} />}
        {route === "signup" && <AuthScreen mode="signup" onUser={setUser} onDone={() => setRoute("dashboard")} />}
        {route === "dashboard" && <Dashboard user={user} onRoute={setRoute} />}
        {route === "map" && <MapScreen onDone={() => setRoute("game")} />}
        {route === "game" && <GameScreen />}
        {route === "gacha" && <GachaScreen />}
        {route === "inventory" && <InventoryScreen />}
        {route === "settings" && <SettingsScreen onLogout={() => { setUser(null); setRoute("landing"); }} />}
      </main>
    </div>
  );
}

function Landing(): JSX.Element {
  const setRoute = useUiStore((state) => state.setRoute);
  const startNewGame = useGameStore((state) => state.startNewGame);
  return (
    <section className="landing">
      <div className="landing-copy">
        <p className="screen-label">社会と戦う司令室</p>
        <h1>破産防衛都市</h1>
        <p>借金まみれの荒地に都市・工場・防衛拠点を作り、税金・利息・不満・敵襲を処理する社会派タワーディフェンスです。</p>
        <div className="landing-status" aria-label="ゲームの特徴">
          <span>昼は建設</span>
          <span>夜は防衛</span>
          <span>決算で震える</span>
        </div>
        <div className="cta-row">
          <button className="primary" onClick={() => { startNewGame(); setRoute("game"); }}>ゲストプレイ</button>
          <button onClick={() => setRoute("login")} data-testid="landing-login">ログイン</button>
          <button onClick={() => setRoute("signup")} data-testid="landing-signup">新規登録</button>
        </div>
        <p className="sync-note">ゲストでも開始できます。ログイン後に端末データを同期する設計です。</p>
      </div>
      <div className="hero-panel" aria-hidden="true">
        <img src="/assets/placeholders/city-core.svg" alt="" />
      </div>
    </section>
  );
}

function AuthScreen({ mode, onUser, onDone }: { mode: "login" | "signup"; onUser: (user: AuthUser) => void; onDone: () => void }): JSX.Element {
  const [email, setEmail] = useState("demo@example.com");
  const [username, setUsername] = useState("倒産寸前市長");
  const [password, setPassword] = useState("password-demo-123");
  const [error, setError] = useState("");
  const [clientConfig, setClientConfig] = useState<ClientConfig | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);
  const setToken = useCallback((token: string) => setTurnstileToken(token), []);
  const requiresTurnstile = Boolean(clientConfig?.turnstileRequired && clientConfig.turnstileSiteKey);

  useEffect(() => {
    api.clientConfig().then((result) => {
      if (result.ok) setClientConfig(result.data);
    });
  }, []);

  const submit = async (): Promise<void> => {
    setError("");
    if (requiresTurnstile && !turnstileToken) {
      setError("Turnstile の確認が完了していません。少し待ってからもう一度押してください。");
      return;
    }

    const result =
      mode === "signup"
        ? await api.signup(email, username, password, turnstileToken || undefined)
        : await api.login(email, password, turnstileToken || undefined);
    if (result.ok) {
      onUser((result.data as MeResponse).user);
      localStorage.setItem("bankruptcy-defense-city:session-hint", "1");
      onDone();
    } else {
      setError(result.error.message);
      setTurnstileToken("");
      setTurnstileReset((value) => value + 1);
    }
  };
  return (
    <section className="panel narrow">
      <h2>{mode === "signup" ? "新規登録" : "ログイン"}</h2>
      <label>メールアドレス<input value={email} onChange={(event) => setEmail(event.target.value)} /></label>
      {mode === "signup" && <label>ユーザー名<input value={username} onChange={(event) => setUsername(event.target.value)} /></label>}
      <label>パスワード<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
      <TurnstileWidget key={`${mode}-${turnstileReset}`} siteKey={clientConfig?.turnstileSiteKey} action={mode} onToken={setToken} />
      {error && <p className="error">{error}</p>}
      <button className="primary" onClick={submit} data-testid={mode === "signup" ? "signup-submit" : "login-submit"}>
        {mode === "signup" ? "登録して本社を守る" : "ログイン"}
      </button>
    </section>
  );
}

function Dashboard({ user, onRoute }: { user: AuthUser | null; onRoute: (route: ReturnType<typeof useUiStore.getState>["route"]) => void }): JSX.Element {
  const game = useGameStore((state) => state.state);
  const cardCount = CARD_DEFINITIONS.length;
  return (
    <section className="dashboard">
      <div className="dashboard-hero-panel">
        <div>
          <p className="screen-label">本日の経営会議</p>
          <h2>{user?.username ?? "ゲスト市長"}の経営会議 / 防衛本部</h2>
          <p>税務署がこちらを見ています。だいたい見ています。</p>
        </div>
        <button className="primary" onClick={() => onRoute("game")}>続きから</button>
      </div>
      <div className="metric-grid operations">
        <Metric label="最終セーブ" value={`Day ${game.day}`} tone="info" />
        <Metric label="所持通貨" value={formatMoney(game.resources.money)} tone="good" />
        <Metric label="無料ガチャ通貨" value={game.resources.gachaCurrency.toLocaleString()} tone="info" />
        <Metric label="所持カード数" value={`${cardCount}枚`} tone="warn" />
      </div>
      <div className="action-grid">
        <button className="primary" onClick={() => onRoute("map")} data-testid="new-game">新規ゲーム</button>
        <button onClick={() => onRoute("game")}>続きから</button>
        <button onClick={() => onRoute("map")}>マップ生成</button>
        <button onClick={() => onRoute("gacha")}>支援ガチャ</button>
        <button onClick={() => onRoute("settings")}>設定</button>
      </div>
      <div className="incident-strip" aria-label="最新ログ">
        <span>弾薬ラインが詰まっています</span>
        <span>住民がやや人間らしい不満を述べています</span>
        <span>破産管財人の足音がします</span>
      </div>
    </section>
  );
}

function MapScreen({ onDone }: { onDone: () => void }): JSX.Element {
  const [seed, setSeed] = useState("hasan-seed-001");
  const [difficulty, setDifficulty] = useState("normal");
  const [biomeBias, setBiomeBias] = useState<Biome>("ruinedIndustrial");
  const preview = useMemo(() => generateMap(seed, { difficulty: difficulty as GameMap["difficulty"], biomeBias }), [seed, difficulty, biomeBias]);
  const startNewGame = useGameStore((state) => state.startNewGame);
  return (
    <section className="map-screen">
      <div className="panel">
        <h2>マップ生成</h2>
        <label>シード<input value={seed} onChange={(event) => setSeed(event.target.value)} /></label>
        <div className="inline-controls">
          <button onClick={() => setSeed(`hasan-${Math.random().toString(36).slice(2, 8)}`)}>ランダム生成</button>
          <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
            <option value="easy">やさしい</option><option value="normal">普通</option><option value="hard">厳しい</option><option value="bankruptcy">破産</option>
          </select>
          <select value={biomeBias} onChange={(event) => setBiomeBias(event.target.value as Biome)}>
            <option value="ruinedIndustrial">廃工業地帯</option><option value="swamp">沼地</option><option value="housingRuins">住宅跡地</option><option value="wasteland">荒野</option><option value="mountainResource">山岳資源地帯</option>
          </select>
        </div>
        <button className="primary" onClick={() => { startNewGame(seed); void api.generateMap(seed, 96, 64, difficulty, biomeBias); onDone(); }} data-testid="generate-map">この土地で防衛する</button>
      </div>
      <MapPreview map={preview} />
    </section>
  );
}

function GameScreen(): JSX.Element {
  const game = useGameStore((state) => state.state);
  const selectTile = useGameStore((state) => state.selectTile);
  const placeSelected = useGameStore((state) => state.placeSelected);
  const selectBuilding = useGameStore((state) => state.selectBuilding);
  const startNight = useGameStore((state) => state.startNight);
  const settle = useGameStore((state) => state.settle);
  const saveLocal = useGameStore((state) => state.saveLocal);
  const advance = useGameStore((state) => state.advance);
  const [savedAt, setSavedAt] = useState("");
  const selectedBuilding = game.selectedBuilding ? BUILDING_DEFINITIONS[game.selectedBuilding] : null;
  const alertLines = [
    game.resources.taxRisk >= 45 ? "税務調査のリスクが高まっています" : null,
    game.resources.ammo < 20 ? "弾薬の備蓄が少なくなっています" : null,
    game.resources.power < 10 ? "発電所の設備率が低下しています" : null,
    game.resources.happiness < 45 ? "住民がやや人間らしい不満を述べています" : null,
  ].filter(Boolean) as string[];

  useEffect(() => {
    if (game.phase !== "night") return;
    const id = window.setInterval(() => advance(500), 500);
    return () => window.clearInterval(id);
  }, [game.phase, advance]);

  return (
    <section className="game-layout">
      <div className="game-status-strip" aria-label="都市ステータス">
        <Metric label={`Day ${game.day}`} value={phaseJa(game.phase)} tone="info" />
        <Metric label="本社HP" value={game.hqHp} tone={game.hqHp < 900 ? "danger" : "good"} />
        <Metric label="資金" value={formatMoney(game.resources.money)} tone={game.resources.money < 400 ? "danger" : "good"} />
        <Metric label="借金残高" value={formatMoney(game.resources.debt)} tone="danger" />
        <Metric label="本日の利息" value={formatMoney(Math.ceil(game.resources.debt * game.resources.interestRate))} tone="warn" />
        <Metric label="住民幸福度" value={`${game.resources.happiness}%`} tone={game.resources.happiness < 45 ? "danger" : "good"} />
        <Metric label="税務リスク" value={`${game.resources.taxRisk}%`} tone={game.resources.taxRisk > 45 ? "danger" : "warn"} />
      </div>
      <div className="game-stage">
        <div className="mission-panel">
          <strong>メインミッション</strong>
          <span>30日間、生き延びろ</span>
          <small>残り {Math.max(0, 30 - game.day)} 日</small>
        </div>
        <PhaserGame state={game} onTileSelect={(point) => { selectTile(point); if (game.selectedBuilding) placeSelected(point); }} />
        <div className="map-legend" aria-label="凡例">
          <span><i className="legend-power" />電力網</span>
          <span><i className="legend-danger" />危険エリア</span>
          <span><i className="legend-build" />建設候補</span>
        </div>
        <TouchPlacementGrid game={game} onPlace={(point) => { selectTile(point); if (game.selectedBuilding) placeSelected(point); }} />
      </div>
      <aside className="hud">
        <div className="rail-tabs" aria-label="操作タブ">
          <button className="active">コマンド</button>
          <button>調査メモ</button>
        </div>
        <div className="supply-cluster">
          <Metric label="電力" value={game.resources.power} tone={game.resources.power < 10 ? "danger" : "good"} />
          <Metric label="弾薬" value={game.resources.ammo} tone={game.resources.ammo < 20 ? "danger" : "warn"} />
          <Metric label="燃料" value={game.resources.fuel} tone={game.resources.fuel < 15 ? "danger" : "info"} />
        </div>
        <div className="build-panel">
          <div className="section-title">
            <h3>建設パネル</h3>
            <span>{selectedBuilding?.nameJa ?? "未選択"}</span>
          </div>
          {selectedBuilding && (
            <div className="selected-building-card">
              <strong>{selectedBuilding.nameJa}</strong>
              <p>{selectedBuilding.descriptionJa}</p>
              <span>費用 {formatCost(selectedBuilding.cost)}</span>
            </div>
          )}
          <div className="build-list">
            {buildKeys.map((key) => (
              <button
                key={key}
                className={game.selectedBuilding === key ? "selected" : ""}
                onClick={() => selectBuilding(key)}
                data-testid={`select-${key}`}
              >
                <strong>{BUILDING_DEFINITIONS[key].nameJa}</strong>
                <small>{formatCost(BUILDING_DEFINITIONS[key].cost)}</small>
              </button>
            ))}
          </div>
        </div>
        {game.phase === "night" && <div className="enemy-banner" data-testid="enemy-state">敵勢力可視化: {game.enemies.length}体接近中</div>}
        <div className="command-row">
          {game.phase === "day" && <button className="primary" onClick={startNight} data-testid="start-night">夜を開始</button>}
          {game.phase === "settlement" && <button className="primary" onClick={settle}>決算を見る</button>}
          <button onClick={() => { saveLocal(); setSavedAt(new Date().toLocaleTimeString("ja-JP")); void api.saveGame(game); }} data-testid="save-game">セーブ</button>
        </div>
        {savedAt && <p className="save-status">端末に保存しました {savedAt}</p>}
        <div className="alert-stack" aria-label="警報">
          {(alertLines.length ? alertLines : ["社会はまだギリギリ社会です"]).map((line) => <span key={line}>{line}</span>)}
        </div>
        <details className="log-drawer">
          <summary>防衛記録</summary>
          <ol className="log-list">{game.logs.slice(-6).map((entry) => <li key={entry.id}>{entry.text}</li>)}</ol>
        </details>
      </aside>
      <div className="build-dock" aria-label="建設ショートカット">
        {priorityBuildKeys.map((key) => (
          <button key={key} className={game.selectedBuilding === key ? "selected" : ""} onClick={() => selectBuilding(key)}>
            <span>{BUILDING_DEFINITIONS[key].nameJa}</span>
            <small>{formatCost(BUILDING_DEFINITIONS[key].cost)}</small>
          </button>
        ))}
      </div>
    </section>
  );
}

function GachaScreen(): JSX.Element {
  const [banner, setBanner] = useState<GachaBanner | null>(null);
  const [result, setResult] = useState<GachaRollResult | null>(null);
  const [error, setError] = useState("");
  const [clientConfig, setClientConfig] = useState<ClientConfig | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);
  const setToken = useCallback((token: string) => setTurnstileToken(token), []);
  const requiresTurnstile = Boolean(clientConfig?.turnstileRequired && clientConfig.turnstileSiteKey);
  useEffect(() => { api.banners().then((res) => { if (res.ok) setBanner(res.data[0]); }); }, []);
  useEffect(() => {
    api.clientConfig().then((res) => {
      if (res.ok) setClientConfig(res.data);
    });
  }, []);
  const roll = async (pullCount: 1 | 10): Promise<void> => {
    setError("");
    if (requiresTurnstile && !turnstileToken) {
      setError("Turnstile の確認を待っています。無料通貨の安全確認なので少しだけお待ちください。");
      return;
    }
    const res = await api.roll(banner?.id ?? "start-dash", pullCount, turnstileToken || undefined);
    if (res.ok) setResult(res.data); else setError(res.error.message);
    setTurnstileToken("");
    setTurnstileReset((value) => value + 1);
  };
  return (
    <section className="gacha-layout">
      <div className="panel gacha-banner">
        <p className="screen-label">復興支援パッケージ</p>
        <h2>ガチャ: 破産防衛スタートダッシュ</h2>
        <p>無料ゲーム内通貨のみ使用。購入導線なし。N 70% / R 22% / SR 7% / UR 1%。10連はR以上1枚保証、100連でUR天井。</p>
        <div className="gacha-meta">
          <span>無料通貨のみ</span>
          <span>UR天井まで 100</span>
          <span>1回 10 / 10回 100</span>
        </div>
        <TurnstileWidget key={`gacha-${turnstileReset}`} siteKey={clientConfig?.turnstileSiteKey} action="gacha" onToken={setToken} />
        <div className="cta-row"><button className="primary" onClick={() => roll(1)} data-testid="pull-gacha">1回引く</button><button onClick={() => roll(10)}>10回引く</button></div>
        {error && <p className="error">{error}</p>}
      </div>
      <div className="panel gacha-rates">
        <h3>確率と安全確認</h3>
        <div className="rate-bars">
          {[["N", 70], ["R", 22], ["SR", 7], ["UR", 1]].map(([rarity, rate]) => (
            <div key={rarity}>
              <span>{rarity}</span>
              <i style={{ width: `${rate}%` }} />
              <strong>{rate}%</strong>
            </div>
          ))}
        </div>
        <p>Turnstile は無料通貨の連打対策です。財布には触りません。</p>
      </div>
      {result && <div className="gacha-result panel" data-testid="gacha-result">{result.results.map((card) => <article key={`${result.rollId}-${card.itemKey}`}><strong>{card.name}</strong><span>{card.rarity}</span><small>所持カードへ反映</small></article>)}</div>}
    </section>
  );
}

function InventoryScreen(): JSX.Element {
  const [filter, setFilter] = useState<(typeof rarityOrder)[number]>("all");
  const [category, setCategory] = useState("all");
  const cards = CARD_DEFINITIONS.filter((card) => (filter === "all" || card.rarity === filter) && (category === "all" || card.category === category));
  const selected = cards[0] ?? CARD_DEFINITIONS[0];
  return (
    <section className="inventory-layout">
      <div className="panel inventory-main">
        <div className="section-title">
          <h2>カード / デッキ</h2>
          <span>無料通貨で獲得した政策カード</span>
        </div>
        <div className="filter-row" aria-label="カードフィルター">
          {rarityOrder.map((rarity) => (
            <button key={rarity} className={filter === rarity ? "selected" : ""} onClick={() => setFilter(rarity)}>
              {rarity === "all" ? "ALL" : rarity}
            </button>
          ))}
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="all">全カテゴリ</option>
            <option value="city">都市</option><option value="defense">防衛</option><option value="economy">経済</option><option value="logistics">物流</option><option value="risk">リスク</option>
          </select>
        </div>
        <div className="deck-slots" aria-label="装備枠">
          <span>装備枠 1</span><span>装備枠 2</span><span>装備枠 3</span>
        </div>
        <div className="card-grid" data-testid="inventory-cards">
          {cards.map((card) => (
            <article key={card.key} className={`card rarity-${card.rarity}`}>
              <strong>{card.nameJa}</strong>
              <span>{card.rarity} / {card.category}</span>
              <p>{card.descriptionJa}</p>
              <small>所持 1</small>
            </article>
          ))}
        </div>
      </div>
      <aside className="panel inventory-detail">
        <span className={`rarity-chip rarity-${selected.rarity}`}>{selected.rarity}</span>
        <h3>{selected.nameJa}</h3>
        <p>{selected.descriptionJa}</p>
        <blockquote>{selected.flavorTextJa}</blockquote>
        <button className="primary">デッキに装備</button>
      </aside>
    </section>
  );
}

function SettingsScreen({ onLogout }: { onLogout: () => void }): JSX.Element {
  return (
    <section className="panel narrow">
      <h2>設定</h2>
      <label>音量<input type="range" min="0" max="100" defaultValue="55" /></label>
      <label>描画品質<select defaultValue="balanced"><option value="battery">省電力</option><option value="balanced">標準</option><option value="quality">高品質</option></select></label>
      <label><input type="checkbox" defaultChecked /> タッチUIを大きくする</label>
      <label><input type="checkbox" /> 点滅を減らす</label>
      <button onClick={() => { localStorage.removeItem("bankruptcy-defense-city:session-hint"); void api.logout(); onLogout(); }}>ログアウト</button>
      <button className="danger" onClick={() => localStorage.clear()}>ローカルデータ削除</button>
    </section>
  );
}

function MapPreview({ map }: { map: ReturnType<typeof generateMap> }): JSX.Element {
  return <div className="map-preview" aria-label="マッププレビュー">{map.tiles.filter((_, index) => index % 48 === 0).slice(0, 128).map((tile, index) => <span key={index} className={`terrain-${tile.terrain}`} />)}</div>;
}

function TouchPlacementGrid({ game, onPlace }: { game: ReturnType<typeof useGameStore.getState>["state"]; onPlace: (point: { x: number; y: number }) => void }): JSX.Element {
  const candidates = game.map.tiles
    .filter((tile) => tile.buildable && !game.buildings.some((building) => building.x === tile.x && building.y === tile.y))
    .slice(0, 20);

  return (
    <div className="touch-placement-grid" data-testid="city-grid" aria-label="建設タッチグリッド">
      {candidates.map((tile, index) => {
        const building = game.buildings.find((item) => item.x === tile.x && item.y === tile.y);
        return (
          <button
            key={`${tile.x}-${tile.y}`}
            type="button"
            data-testid={`tile-${index}`}
            onClick={() => onPlace(tile)}
            aria-label={`${tile.x},${tile.y}へ建設`}
          >
            {building ? BUILDING_DEFINITIONS[building.key].nameJa.slice(0, 1) : "・"}
          </button>
        );
      })}
    </div>
  );
}

function Metric({ label, value, tone = "neutral" }: { label: string; value: string | number; tone?: "neutral" | "good" | "warn" | "danger" | "info" }): JSX.Element {
  return <div className={`metric metric-${tone}`}><span>{label}</span><strong>{value}</strong></div>;
}

function phaseJa(phase: string): string {
  return { day: "昼フェーズ", night: "夜フェーズ", settlement: "決算フェーズ", victory: "勝利", defeat: "敗北" }[phase] ?? phase;
}
