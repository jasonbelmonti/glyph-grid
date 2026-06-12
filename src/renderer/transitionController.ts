import type { GridMetrics, RendererSettings } from "./types";

export function transitionWeight(
  column: number,
  row: number,
  metrics: GridMetrics,
  settings: RendererSettings,
  time: number
): number {
  const progress = settings.mix;
  const x = metrics.columns <= 1 ? 0 : column / (metrics.columns - 1);
  const y = metrics.rows <= 1 ? 0 : row / (metrics.rows - 1);
  const feather = Math.max(0.015, settings.revealFeather);
  const field = revealField(x, y, settings, time);
  const jitter = (hash(column * 3.7 + row * 9.1) - 0.5) * 0.025;
  let mix = smoothstep(progress + feather, progress - feather, field + jitter);

  if (settings.revealShape === "noise") {
    mix = hash(column * 17.7 + row * 4.2 + Math.floor(time * 4)) < progress ? 1 : 0;
  }

  return settings.transitionMode === "ascii-to-text" ? 1 - mix : mix;
}

export function transitionState(mix: number): "terminal" | "transition" | "live-ascii" {
  if (mix <= 0.03) {
    return "terminal";
  }
  if (mix >= 0.97) {
    return "live-ascii";
  }
  return "transition";
}

function revealField(
  x: number,
  y: number,
  settings: RendererSettings,
  time: number
) {
  if (settings.revealShape === "wipe") {
    return x;
  }

  if (settings.revealShape === "scanline") {
    return y + Math.sin(x * 20 + time * 0.7) * 0.04;
  }

  const dx = x - settings.revealOrigin.x;
  const dy = y - settings.revealOrigin.y;
  return Math.sqrt(dx * dx + dy * dy) * 1.22;
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function hash(value: number) {
  const raw = Math.sin(value * 12.9898) * 43758.5453;
  return raw - Math.floor(raw);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
