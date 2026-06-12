import type {
  LiveSourceKind,
  RevealShape,
  TransitionMode
} from "../renderer/types";

export type PrototypeSettings = {
  cardDepth: number;
  cardFocus: number;
  cardTilt: number;
  cardsEnabled: boolean;
  cellSize: number;
  colorAdoption: number;
  glyphDensity: number;
  liveSource: LiveSourceKind;
  mix: number;
  playing: boolean;
  revealFeather: number;
  revealOrigin: { x: number; y: number };
  revealShape: RevealShape;
  revealSpeed: number;
  transitionMode: TransitionMode;
};

export type FrameMetrics = {
  cellCount: number;
  columns: number;
  frame: number;
  frameMs: number;
  fps: number;
  liveSourceAvailable: boolean;
  mix: number;
  renderer: string;
  rows: number;
  state: "terminal" | "transition" | "live-ascii";
};

export const defaultPrototypeSettings: PrototypeSettings = {
  cardDepth: 0.42,
  cardFocus: 1.45,
  cardTilt: 0.58,
  cardsEnabled: true,
  cellSize: 10,
  colorAdoption: 0.82,
  glyphDensity: 0.76,
  liveSource: "city",
  mix: 0.52,
  playing: true,
  revealFeather: 0.16,
  revealOrigin: { x: 0.42, y: 0.42 },
  revealShape: "radial",
  revealSpeed: 0.42,
  transitionMode: "text-to-ascii"
};

export function createDefaultMetrics(): FrameMetrics {
  return {
    cellCount: 0,
    columns: 0,
    frame: 0,
    frameMs: 0,
    fps: 0,
    liveSourceAvailable: true,
    mix: 0,
    renderer: "WebGL",
    rows: 0,
    state: "terminal"
  };
}
