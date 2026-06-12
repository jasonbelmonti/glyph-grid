import type {
  LiveSourceKind,
  RevealShape,
  TransitionMode
} from "../renderer/types";

export type PrototypeSettings = {
  cellSize: number;
  colorAdoption: number;
  glyphDensity: number;
  liveSource: LiveSourceKind;
  mix: number;
  perspectiveAmount: number;
  perspectiveEnabled: boolean;
  perspectiveMotion: number;
  perspectivePull: number;
  perspectiveSkew: number;
  playing: boolean;
  revealFeather: number;
  revealOrigin: { x: number; y: number };
  revealShape: RevealShape;
  revealSpeed: number;
  transitionMode: TransitionMode;
  zRippleAmount: number;
  zRippleEnabled: boolean;
  zRippleScatter: number;
  zRippleSpeed: number;
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
  cellSize: 10,
  colorAdoption: 0.82,
  glyphDensity: 0.76,
  liveSource: "city",
  mix: 0.52,
  perspectiveAmount: 0.58,
  perspectiveEnabled: true,
  perspectiveMotion: 0.46,
  perspectivePull: 0.52,
  perspectiveSkew: 0.34,
  playing: true,
  revealFeather: 0.16,
  revealOrigin: { x: 0.42, y: 0.42 },
  revealShape: "radial",
  revealSpeed: 0.42,
  transitionMode: "text-to-ascii",
  zRippleAmount: 0.62,
  zRippleEnabled: true,
  zRippleScatter: 0.72,
  zRippleSpeed: 0.54
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
