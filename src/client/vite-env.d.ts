/// <reference types="vite/client" />

declare global {
  interface Window {
    mountPhaserGame?: (target: HTMLElement, options: PhaserMountOptions) => PhaserController | void;
  }
}

export interface PhaserMountOptions {
  seed: string;
  phase: string;
  day: number;
  onEvent?: (event: { type: string; payload?: unknown }) => void;
}

export interface PhaserController {
  update?: (options: PhaserMountOptions) => void;
  destroy?: () => void;
}
