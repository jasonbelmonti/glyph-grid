export type RGBA = [number, number, number, number];

export type Cell = {
  alpha: number;
  background: RGBA;
  foreground: RGBA;
  glyphIndex: number;
};

export type TerminalCell = Cell & {
  isCursor?: boolean;
  regionId?: string;
  semanticChar: string;
};

export type TransitionCell = {
  live: Cell;
  mix: number;
  terminal: TerminalCell;
};

export type GridMetrics = {
  cellHeight: number;
  cellWidth: number;
  columns: number;
  devicePixelRatio: number;
  rows: number;
};

export type GlyphAtlas = {
  canvas: HTMLCanvasElement;
  charToIndex: Map<string, number>;
  columns: number;
  rows: number;
  cellHeight: number;
  cellWidth: number;
};

export type LiveSourceKind = "city" | "field" | "waves" | "offline";

export type LiveSample = {
  brightness: number;
  color: RGBA;
};

export type RevealShape = "radial" | "wipe" | "scanline" | "noise";

export type TransitionMode = "text-to-ascii" | "ascii-to-text";

export type RendererSettings = {
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
