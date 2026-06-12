import { glyphIndexForChar } from "./glyphAtlas";
import type { GlyphAtlas, GridMetrics, RGBA, RendererSettings, TerminalCell } from "./types";

const BACKGROUND: RGBA = [0.012, 0.018, 0.018, 1];
const TEXT: RGBA = [0.86, 0.82, 0.7, 1];
const GREEN: RGBA = [0.44, 0.96, 0.36, 1];
const AMBER: RGBA = [0.95, 0.66, 0.28, 1];
const MUTED: RGBA = [0.44, 0.52, 0.48, 1];
const WARNING: RGBA = [1, 0.4, 0.22, 1];

export function createTerminalBuffer(
  metrics: GridMetrics,
  atlas: GlyphAtlas,
  settings: RendererSettings,
  frame: number
): TerminalCell[] {
  const cells = Array.from({ length: metrics.columns * metrics.rows }, () =>
    createCell(" ", atlas, TEXT, BACKGROUND)
  );

  const lines = [
    { text: "> glyph-grid WebGL terminal surface", color: TEXT },
    { text: `> source: ./scene/${settings.liveSource}.glsl`, color: TEXT },
    { text: "> device: WebGL 2.0", color: TEXT },
    { text: `> resolution: ${metrics.columns}x${metrics.rows}`, color: TEXT },
    {
      text: `> glyphs: ${metrics.cellWidth}x${metrics.cellHeight} (${metrics.columns * metrics.rows} cells)`,
      color: TEXT
    },
    {
      text: `> transition: ${settings.transitionMode === "text-to-ascii" ? "text -> live-ascii" : "live-ascii -> text"}`,
      color: TEXT
    },
    { text: `> reveal mode: ${settings.revealShape}`, color: TEXT },
    { text: `> mix: ${settings.mix.toFixed(2)}`, color: TEXT },
    { text: "> --------------------------------", color: TEXT },
    { text: "[info] compiling shaders...", color: AMBER },
    { text: "[info] linking program...", color: AMBER },
    { text: "[info] buffers: ok", color: AMBER },
    { text: "[info] textures: ok", color: AMBER },
    { text: "[info] uniforms: ok", color: AMBER },
    { text: "[info] starting render loop", color: AMBER },
    {
      text:
        settings.liveSource === "offline"
          ? "[warn] live source offline; terminal retained"
          : settings.mix <= 0.03 && !settings.playing
            ? "[info] transition idle"
            : "[info] transition active",
      color: settings.liveSource === "offline" ? WARNING : AMBER
    },
    { text: "[info] press SPACE to pause", color: AMBER },
    { text: "> ", color: TEXT }
  ];

  lines.forEach((line, row) => {
    writeLine(cells, metrics, atlas, row + 1, 2, line.text, line.color);
  });

  const cursorColumn = 4;
  const cursorRow = Math.min(lines.length + 1, metrics.rows - 2);
  const cursorVisible = Math.floor(frame / 28) % 2 === 0;
  if (cursorVisible) {
    const cursorIndex = cursorRow * metrics.columns + cursorColumn;
    if (cells[cursorIndex]) {
      cells[cursorIndex] = {
        ...createCell(" ", atlas, BACKGROUND, TEXT),
        isCursor: true,
        semanticChar: " "
      };
    }
  }

  drawGridAnnotations(cells, metrics, atlas);
  return cells;
}

function drawGridAnnotations(
  cells: TerminalCell[],
  metrics: GridMetrics,
  atlas: GlyphAtlas
) {
  const lineRow = Math.max(2, Math.floor(metrics.rows * 0.66));
  for (let col = Math.floor(metrics.columns * 0.32); col < metrics.columns - 2; col += 1) {
    setCell(cells, metrics, atlas, col, lineRow, "-", MUTED);
  }

  const liveLabel = "live ascii region";
  writeLine(
    cells,
    metrics,
    atlas,
    Math.max(1, Math.floor(metrics.rows * 0.08)),
    Math.max(4, Math.floor(metrics.columns * 0.53)),
    liveLabel,
    GREEN
  );
}

function writeLine(
  cells: TerminalCell[],
  metrics: GridMetrics,
  atlas: GlyphAtlas,
  row: number,
  column: number,
  text: string,
  color: RGBA
) {
  if (row < 0 || row >= metrics.rows) {
    return;
  }

  for (let index = 0; index < text.length; index += 1) {
    setCell(cells, metrics, atlas, column + index, row, text[index], color);
  }
}

function setCell(
  cells: TerminalCell[],
  metrics: GridMetrics,
  atlas: GlyphAtlas,
  column: number,
  row: number,
  char: string,
  foreground: RGBA
) {
  if (column < 0 || column >= metrics.columns || row < 0 || row >= metrics.rows) {
    return;
  }

  cells[row * metrics.columns + column] = createCell(char, atlas, foreground, BACKGROUND);
}

function createCell(
  char: string,
  atlas: GlyphAtlas,
  foreground: RGBA,
  background: RGBA
): TerminalCell {
  return {
    alpha: 1,
    background,
    foreground,
    glyphIndex: glyphIndexForChar(atlas, char),
    semanticChar: char
  };
}
