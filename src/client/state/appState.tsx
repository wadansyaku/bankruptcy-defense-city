import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiClient } from "../api/client";
import type {
  AppSnapshot,
  AuthPayload,
  Building,
  BuildingType,
  Card,
  CityState,
  RouteId,
  TouchSettings,
  UserProfile,
} from "../types";

const STORAGE_KEY = "bankruptcy-defense-city:v1";

const STARTER_CARDS: Card[] = [
  { id: "card-budget-wall", name: "予算防壁", rarity: "N", effect: "夜間の債務圧を少し減らす", owned: 1 },
  { id: "card-food-route", name: "炊き出し動線", rarity: "R", effect: "士気の回復量が増える", owned: 1 },
  { id: "card-audit-lamp", name: "監査灯", rarity: "SR", effect: "敵の出現を早めに可視化する", owned: 0 },
];

function createGuest(): UserProfile {
  return {
    id: `guest-${Date.now()}`,
    name: "ゲスト隊長",
    mode: "guest",
  };
}

function createCity(seed = "PR1-DEFENSE"): CityState {
  return {
    id: `city-${Date.now()}`,
    seed,
    districtName: "未生成区画",
    day: 1,
    phase: "planning",
    funds: 420,
    morale: 72,
    debtPressure: 18,
    cityHp: 100,
    nightProgress: 0,
    enemyVisible: false,
    enemyPressure: 0,
    selectedBuilding: "shelter",
    buildings: [],
  };
}

const DEFAULT_SETTINGS: TouchSettings = {
  largeControls: true,
  confirmPlacement: false,
  reducedMotion: false,
  leftHandMode: false,
};

function defaultSnapshot(): AppSnapshot {
  return {
    version: 1,
    user: createGuest(),
    city: createCity(),
    cards: STARTER_CARDS,
    settings: DEFAULT_SETTINGS,
    pendingSync: false,
  };
}

function loadSnapshot(): AppSnapshot {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSnapshot();
    const parsed = JSON.parse(raw) as AppSnapshot;
    if (parsed.version !== 1) return defaultSnapshot();
    return {
      ...defaultSnapshot(),
      ...parsed,
      city: { ...createCity(parsed.city?.seed), ...parsed.city },
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
      cards: parsed.cards?.length ? parsed.cards : STARTER_CARDS,
    };
  } catch {
    return defaultSnapshot();
  }
}

function nextCard(): Card {
  const pool: Omit<Card, "owned">[] = [
    { id: "card-shelter-kit", name: "避難キット", rarity: "N", effect: "住民被害を軽減" },
    { id: "card-tax-bridge", name: "税収ブリッジ", rarity: "R", effect: "昼の資金回復を強化" },
    { id: "card-crisis-room", name: "危機対策室", rarity: "SR", effect: "夜フェーズ開始時に敵圧を抑制" },
  ];
  const index = Math.floor(Date.now() / 997) % pool.length;
  return { ...pool[index], owned: 1 };
}

interface AppActions {
  navigate: (route: RouteId) => void;
  login: (payload: AuthPayload) => Promise<void>;
  signup: (payload: AuthPayload) => Promise<void>;
  generateMap: (seed: string, districtName: string) => void;
  selectBuilding: (type: BuildingType) => void;
  placeBuilding: (x: number, y: number) => void;
  startNight: () => void;
  resolveNight: () => void;
  save: () => Promise<void>;
  sync: () => Promise<void>;
  pullGacha: () => Promise<void>;
  updateSettings: (settings: Partial<TouchSettings>) => void;
  resetGuest: () => void;
}

interface AppContextValue {
  route: RouteId;
  snapshot: AppSnapshot;
  busyLabel?: string;
  notice?: string;
  actions: AppActions;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<RouteId>("landing");
  const [snapshot, setSnapshot] = useState<AppSnapshot>(() => loadSnapshot());
  const [busyLabel, setBusyLabel] = useState<string>();
  const [notice, setNotice] = useState<string>();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }, [snapshot]);

  const mergeCard = useCallback((card: Card) => {
    setSnapshot((current) => {
      const found = current.cards.find((item) => item.id === card.id);
      const cards = found
        ? current.cards.map((item) => (item.id === card.id ? { ...item, owned: item.owned + 1 } : item))
        : [...current.cards, card];
      return { ...current, cards, pendingSync: current.user.mode === "account" };
    });
  }, []);

  const sync = useCallback(async () => {
    setBusyLabel("同期中");
    const latest = loadSnapshot();
    const result = await apiClient.sync(latest);
    setBusyLabel(undefined);
    if (result.ok) {
      setSnapshot((current) => ({ ...current, pendingSync: false }));
      setNotice("アカウントへ同期しました");
      return;
    }
    setSnapshot((current) => ({ ...current, pendingSync: true }));
    setNotice("通信できないため端末に保存しました");
  }, []);

  const actions = useMemo<AppActions>(
    () => ({
      navigate: setRoute,
      async login(payload) {
        setBusyLabel("ログイン中");
        const result = await apiClient.login(payload);
        setBusyLabel(undefined);
        if (result.ok && result.data) {
          setSnapshot((current) => ({ ...current, user: result.data!, pendingSync: true }));
          setRoute("dashboard");
          setNotice(result.offline ? "モックログインで開始しました。接続後に同期できます" : "ログインしました");
        }
      },
      async signup(payload) {
        setBusyLabel("登録中");
        const result = await apiClient.signup(payload);
        setBusyLabel(undefined);
        if (result.ok && result.data) {
          setSnapshot((current) => ({ ...current, user: result.data!, pendingSync: true }));
          setRoute("dashboard");
          setNotice(result.offline ? "モック登録で開始しました。接続後に同期できます" : "登録しました");
        }
      },
      generateMap(seed, districtName) {
        setSnapshot((current) => ({
          ...current,
          city: {
            ...createCity(seed || `CITY-${Date.now()}`),
            districtName: districtName || "再建中央区",
          },
          pendingSync: current.user.mode === "account",
        }));
        setRoute("game");
        setNotice("地図を生成しました");
      },
      selectBuilding(type) {
        setSnapshot((current) => ({
          ...current,
          city: { ...current.city, selectedBuilding: type },
        }));
      },
      placeBuilding(x, y) {
        setSnapshot((current) => {
          const occupied = current.city.buildings.some((building) => building.x === x && building.y === y);
          const cost = current.city.selectedBuilding === "clinic" ? 90 : 60;
          if (occupied || current.city.funds < cost || current.city.phase !== "planning") return current;
          const building: Building = {
            id: `b-${x}-${y}-${Date.now()}`,
            type: current.city.selectedBuilding,
            x,
            y,
            level: 1,
          };
          return {
            ...current,
            city: {
              ...current.city,
              funds: current.city.funds - cost,
              morale: Math.min(100, current.city.morale + 2),
              buildings: [...current.city.buildings, building],
            },
            pendingSync: current.user.mode === "account",
          };
        });
      },
      startNight() {
        setSnapshot((current) => ({
          ...current,
          city: {
            ...current.city,
            phase: "night",
            enemyVisible: true,
            enemyPressure: Math.min(100, current.city.debtPressure + 22),
            nightProgress: 35,
          },
        }));
        setNotice("夜フェーズに入りました");
      },
      resolveNight() {
        setSnapshot((current) => {
          const defense = current.city.buildings.length * 8 + current.cards.filter((card) => card.owned > 0).length * 2;
          const damage = Math.max(4, current.city.enemyPressure - defense);
          return {
            ...current,
            city: {
              ...current.city,
              phase: "planning",
              day: current.city.day + 1,
              funds: current.city.funds + 110,
              cityHp: Math.max(0, current.city.cityHp - damage),
              debtPressure: Math.min(100, current.city.debtPressure + 8),
              nightProgress: 0,
              enemyVisible: false,
              enemyPressure: 0,
            },
            pendingSync: current.user.mode === "account",
          };
        });
      },
      async save() {
        setBusyLabel("保存中");
        const current = loadSnapshot();
        const result = await apiClient.saveGame(current);
        const savedAt = result.data?.savedAt ?? new Date().toISOString();
        setSnapshot((prev) => ({
          ...prev,
          city: { ...prev.city, savedAt },
          pendingSync: result.ok ? false : prev.user.mode === "account",
        }));
        setBusyLabel(undefined);
        setNotice(result.ok ? "保存しました" : "端末に保存しました");
      },
      sync,
      async pullGacha() {
        setBusyLabel("抽選中");
        const result = await apiClient.pullGacha();
        setBusyLabel(undefined);
        if (result.ok && result.data?.length) {
          result.data.forEach(mergeCard);
          setNotice("支援カードを受け取りました");
          return;
        }
        mergeCard(nextCard());
        setNotice("端末内抽選でカードを受け取りました");
      },
      updateSettings(settings) {
        setSnapshot((current) => ({
          ...current,
          settings: { ...current.settings, ...settings },
        }));
      },
      resetGuest() {
        const fresh = defaultSnapshot();
        setSnapshot(fresh);
        setRoute("landing");
        setNotice("ゲストデータを初期化しました");
      },
    }),
    [mergeCard, sync],
  );

  const value = useMemo(
    () => ({ route, snapshot, busyLabel, notice, actions }),
    [actions, busyLabel, notice, route, snapshot],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppState must be used inside AppStateProvider");
  }
  return context;
}
