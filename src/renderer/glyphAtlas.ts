import type { GlyphAtlas } from "./types";

const PRINTABLE_ASCII = Array.from({ length: 95 }, (_, index) =>
  String.fromCharCode(index + 32)
).join("");

export const GLYPH_RAMP = " .,:;irsXA253hMHGS#9B&@";

export function createGlyphAtlas(cellWidth: number, cellHeight: number): GlyphAtlas {
  const chars = PRINTABLE_ASCII;
  const columns = 16;
  const rows = Math.ceil(chars.length / columns);
  const canvas = document.createElement("canvas");
  canvas.width = columns * cellWidth;
  canvas.height = rows * cellHeight;

  const context = canvas.getContext("2d", { alpha: true });
  if (!context) {
    throw new Error("Unable to create glyph atlas canvas context.");
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(255,255,255,1)";
  context.textAlign = "center";
  context.textBaseline = "alphabetic";
  context.font = `${Math.max(10, Math.round(cellHeight * 0.72))}px \"SFMono-Regular\", \"Roboto Mono\", \"Cascadia Mono\", Menlo, Consolas, monospace`;

  const charToIndex = new Map<string, number>();
  const baseline = Math.round(cellHeight * 0.78);

  for (let index = 0; index < chars.length; index += 1) {
    const char = chars[index];
    const col = index % columns;
    const row = Math.floor(index / columns);
    charToIndex.set(char, index);
    context.fillText(
      char,
      col * cellWidth + cellWidth / 2,
      row * cellHeight + baseline
    );
  }

  return {
    canvas,
    charToIndex,
    columns,
    rows,
    cellHeight,
    cellWidth
  };
}

export function glyphIndexForChar(atlas: GlyphAtlas, char: string): number {
  return atlas.charToIndex.get(char[0] ?? " ") ?? atlas.charToIndex.get("?") ?? 0;
}

export function glyphIndexFromRamp(atlas: GlyphAtlas, brightness: number, density: number) {
  const visibleRampLength = Math.max(
    5,
    Math.round(GLYPH_RAMP.length * clamp(density, 0.2, 1))
  );
  const ramp = GLYPH_RAMP.slice(0, visibleRampLength);
  const rampIndex = Math.min(
    ramp.length - 1,
    Math.max(0, Math.round(clamp(brightness, 0, 1) * (ramp.length - 1)))
  );
  return glyphIndexForChar(atlas, ramp[rampIndex]);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
