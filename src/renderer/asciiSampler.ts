import { glyphIndexForChar, glyphIndexFromRamp } from "./glyphAtlas";
import type { Cell, GlyphAtlas, LiveSample, RendererSettings, TerminalCell } from "./types";

const LIVE_BACKGROUND: [number, number, number, number] = [0.012, 0.018, 0.018, 1];

export function sampleToAsciiCell(
  atlas: GlyphAtlas,
  sample: LiveSample,
  settings: RendererSettings
): Cell {
  return {
    alpha: 1,
    background: LIVE_BACKGROUND,
    foreground: sample.color,
    glyphIndex: sample.glyph
      ? glyphIndexForChar(atlas, sample.glyph)
      : glyphIndexFromRamp(atlas, sample.brightness, settings.glyphDensity)
  };
}

export function composeCells(
  terminal: TerminalCell,
  live: Cell,
  mix: number,
  settings: RendererSettings
): Cell {
  const adoption = clamp(mix * settings.colorAdoption, 0, 1);
  const foreground = lerpColor(terminal.foreground, live.foreground, adoption);
  const background = lerpColor(terminal.background, live.background, mix * 0.32);
  const glyphIndex = mix > deterministicThreshold(terminal.glyphIndex) ? live.glyphIndex : terminal.glyphIndex;

  return {
    alpha: 1,
    background,
    foreground,
    glyphIndex
  };
}

function deterministicThreshold(seed: number) {
  const raw = Math.sin(seed * 12.9898) * 43758.5453;
  return 0.28 + (raw - Math.floor(raw)) * 0.18;
}

function lerpColor(
  from: [number, number, number, number],
  to: [number, number, number, number],
  amount: number
): [number, number, number, number] {
  return [
    lerp(from[0], to[0], amount),
    lerp(from[1], to[1], amount),
    lerp(from[2], to[2], amount),
    lerp(from[3], to[3], amount)
  ];
}

function lerp(from: number, to: number, amount: number) {
  return from + (to - from) * clamp(amount, 0, 1);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
