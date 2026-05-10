import { useEffect, useMemo, useState } from "react";
import { BUILDING_DEFINITIONS } from "../shared/constants";
import type { AuthUser, GachaBanner, GachaRollResult, MeResponse } from "../shared/apiTypes";
import type { Biome, BuildingKey, GameMap } from "../shared/gameTypes";
import { api } from "./api";
import { PhaserGame } from "./game/phaser/PhaserGame";
import { CARD_DEFINITIONS } from "./game/core/cards";
import { generateMap } from "./game/core/mapgen";
import { renderGameToText } from "./game/core/game";
import { useGameStore } from "./game/state/gameStore";
import { useUiStore } from "./game/state/uiStore";

const buildKeys = Object.keys(BUILDING_DEFINITIONS).filter((key) => BUILDING_DEFINITIONS[key as BuildingKey].buildable) as BuildingKey[];

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
        <h1>破産防衛都市</h1>
        <p>借金まみれの荒地に都市・工場・防衛拠点を作り、税金・利息・不満・敵襲を処理する社会派タワーディフェンスです。</p>
        <div className="cta-row">
          <button className="primary" onClick={() => setRoute("login")} data-testid="landing-login">ログイン</button>
          <button onClick={() => setRoute("signup")} data-testid="landing-signup">新規登録</button>
          <button onClick={() => { startNewGame(); setRoute("game"); }}>ゲストプレイ</button>
        </div>
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
  const submit = async (): Promise<void> => {
    setError("");
    const result = mode === "signup" ? await api.signup(email, username, password) : await api.login(email, password);
    if (result.ok) {
      onUser((result.data as MeResponse).user);
      localStorage.setItem("bankruptcy-defense-city:session-hint", "1");
      onDone();
    } else {
      setError(result.error.message);
    }
  };
  return (
    <section className="panel narrow">
      <h2>{mode === "signup" ? "新規登録" : "ログイン"}</h2>
      <label>メールアドレス<input value={email} onChange={(event) => setEmail(event.target.value)} /></label>
      {mode === "signup" && <label>ユーザー名<input value={username} onChange={(event) => setUsername(event.target.value)} /></label>}
      <label>パスワード<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
      <div className="turnstile-placeholder">Turnstile: ローカル開発では secret 未設定時に検証をバイパス</div>
      {error && <p className="error">{error}</p>}
      <button className="primary" onClick={submit} data-testid={mode === "signup" ? "signup-submit" : "login-submit"}>
        {mode === "signup" ? "登録して本社を守る" : "ログイン"}
      </button>
    </section>
  );
}

function Dashboard({ user, onRoute }: { user: AuthUser | null; onRoute: (route: ReturnType<typeof useUiStore.getState>["route"]) => void }): JSX.Element {
  const game = useGameStore((state) => state.state);
  const startNewGame = useGameStore((state) => state.startNewGame);
  const cardCount = CARD_DEFINITIONS.length;
  return (
    <section className="dashboard">
      <h2>{user?.username ?? "ゲスト市長"}の経営会議</h2>
      <div className="metric-grid">
        <Metric label="最終セーブ" value={`Day ${game.day}`} />
        <Metric label="所持通貨" value={game.resources.money.toLocaleString()} />
        <Metric label="無料ガチャ通貨" value={game.resources.gachaCurrency.toLocaleString()} />
        <Metric label="カード定義" value={`${cardCount}枚`} />
      </div>
      <div className="action-grid">
        <button className="primary" onClick={() => onRoute("map")} data-testid="new-game">新規ゲーム</button>
        <button onClick={() => onRoute("game")}>続きから</button>
        <button onClick={() => onRoute("map")}>マップ生成</button>
        <button onClick={() => onRoute("gacha")}>ガチャ</button>
        <button onClick={() => onRoute("settings")}>設定</button>
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

  useEffect(() => {
    if (game.phase !== "night") return;
    const id = window.setInterval(() => advance(500), 500);
    return () => window.clearInterval(id);
  }, [game.phase, advance]);

  return (
    <section className="game-layout">
      <div className="game-stage">
        <PhaserGame state={game} onTileSelect={(point) => { selectTile(point); if (game.selectedBuilding) placeSelected(point); }} />
        <TouchPlacementGrid game={game} onPlace={(point) => { selectTile(point); if (game.selectedBuilding) placeSelected(point); }} />
      </div>
      <aside className="hud">
        <div className="phase-row"><strong>Day {game.day}</strong><span>{phaseJa(game.phase)}</span></div>
        <div className="metric-grid small">
          <Metric label="本社HP" value={game.hqHp} /><Metric label="借金残高" value={game.resources.debt} />
          <Metric label="本日の利息" value={Math.ceil(game.resources.debt * game.resources.interestRate)} /><Metric label="住民幸福度" value={game.resources.happiness} />
          <Metric label="電力" value={game.resources.power} /><Metric label="弾薬" value={game.resources.ammo} />
          <Metric label="燃料" value={game.resources.fuel} /><Metric label="税務リスク" value={game.resources.taxRisk} />
        </div>
        <div className="build-panel">
          <h3>建設パネル</h3>
          <div className="build-list">
            {buildKeys.map((key) => (
              <button
                key={key}
                className={game.selectedBuilding === key ? "selected" : ""}
                onClick={() => selectBuilding(key)}
                data-testid={`select-${key}`}
              >
                {BUILDING_DEFINITIONS[key].nameJa}
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
        <ol className="log-list">{game.logs.slice(-6).map((entry) => <li key={entry.id}>{entry.text}</li>)}</ol>
      </aside>
    </section>
  );
}

function GachaScreen(): JSX.Element {
  const [banner, setBanner] = useState<GachaBanner | null>(null);
  const [result, setResult] = useState<GachaRollResult | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { api.banners().then((res) => { if (res.ok) setBanner(res.data[0]); }); }, []);
  const roll = async (pullCount: 1 | 10): Promise<void> => {
    setError("");
    const res = await api.roll(banner?.id ?? "start-dash", pullCount);
    if (res.ok) setResult(res.data); else setError(res.error.message);
  };
  return (
    <section className="panel">
      <h2>ガチャ: 破産防衛スタートダッシュ</h2>
      <p>無料ゲーム内通貨のみ使用。N 70% / R 22% / SR 7% / UR 1%。10連はR以上1枚保証、100連でUR天井。</p>
      <div className="cta-row"><button className="primary" onClick={() => roll(1)} data-testid="pull-gacha">1回引く</button><button onClick={() => roll(10)}>10回引く</button></div>
      {error && <p className="error">{error}</p>}
      {result && <div className="gacha-result" data-testid="gacha-result">{result.results.map((card) => <article key={`${result.rollId}-${card.itemKey}`}><strong>{card.name}</strong><span>{card.rarity}</span></article>)}</div>}
    </section>
  );
}

function InventoryScreen(): JSX.Element {
  const [filter, setFilter] = useState("all");
  const cards = CARD_DEFINITIONS.filter((card) => filter === "all" || card.rarity === filter);
  return (
    <section className="panel">
      <h2>カード / デッキ</h2>
      <select value={filter} onChange={(event) => setFilter(event.target.value)}>
        <option value="all">全レアリティ</option><option value="N">N</option><option value="R">R</option><option value="SR">SR</option><option value="UR">UR</option>
      </select>
      <div className="card-grid" data-testid="inventory-cards">
        {cards.map((card) => (
          <article key={card.key} className={`card rarity-${card.rarity}`}>
            <strong>{card.nameJa}</strong>
            <span>{card.rarity}</span>
            <p>{card.descriptionJa}</p>
            <small>所持 1</small>
          </article>
        ))}
      </div>
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

function Metric({ label, value }: { label: string; value: string | number }): JSX.Element {
  return <div className="metric"><span>{label}</span><strong>{value}</strong></div>;
}

function phaseJa(phase: string): string {
  return { day: "昼フェーズ", night: "夜フェーズ", settlement: "決算フェーズ", victory: "勝利", defeat: "敗北" }[phase] ?? phase;
}
