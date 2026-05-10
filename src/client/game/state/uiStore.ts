import { create } from "zustand";

type Route = "landing" | "login" | "signup" | "dashboard" | "map" | "game" | "gacha" | "inventory" | "settings";

interface UiStore {
  route: Route;
  mobileBuildPanelOpen: boolean;
  setRoute: (route: Route) => void;
  setBuildPanelOpen: (open: boolean) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  route: "landing",
  mobileBuildPanelOpen: true,
  setRoute: (route) => set({ route }),
  setBuildPanelOpen: (mobileBuildPanelOpen) => set({ mobileBuildPanelOpen }),
}));
