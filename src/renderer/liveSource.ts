import { sampleDiagram3dSource } from "./diagram3dSource";
import { sampleDiagramSource } from "./diagramSource";
import type { GridMetrics, LiveSample, LiveSourceKind } from "./types";

export function sampleLiveSource(
  column: number,
  row: number,
  metrics: GridMetrics,
  time: number,
  source: LiveSourceKind
): LiveSample | null {
  if (source === "offline") {
    return null;
  }

  const x = metrics.columns <= 1 ? 0 : column / (metrics.columns - 1);
  const y = metrics.rows <= 1 ? 0 : row / (metrics.rows - 1);

  if (source === "field") {
    return sampleField(x, y, time);
  }

  if (source === "diagram") {
    return sampleDiagramSource(column, row, metrics, time);
  }

  if (source === "diagram3d") {
    return sampleDiagram3dSource(column, row, metrics, time);
  }

  if (source === "waves") {
    return sampleWaves(x, y, time);
  }

  return sampleCity(x, y, time, column);
}

function sampleCity(x: number, y: number, time: number, column: number): LiveSample {
  const horizon = 0.61 + Math.sin(time * 0.21) * 0.012;
  const group = Math.floor(x * 34);
  const groupHash = hash(group * 13.13);
  const buildingWidth = 0.012 + groupHash * 0.025;
  const groupCenter = (group + 0.5) / 34;
  const height = 0.18 + hash(group * 4.9) * 0.42;
  const inBuilding =
    Math.abs(x - groupCenter) < buildingWidth &&
    y > horizon - height &&
    y < horizon + 0.02;
  const windowRow = Math.floor(y * 130);
  const windowCol = Math.floor(x * 220);
  const windowPulse = Math.sin(time * 2.1 + group * 0.7) * 0.12;
  const windowLit =
    inBuilding &&
    windowRow % 4 < 2 &&
    windowCol % 5 < 2 &&
    hash(windowRow * 1.7 + windowCol * 9.1) > 0.42 - windowPulse;

  const bridge = Math.abs(y - (0.52 - x * 0.1)) < 0.006 && x > 0.56;
  const bridgeCable = x > 0.7 && Math.abs(y - (0.3 + Math.abs(x - 0.85) * 1.15)) < 0.008;
  const water = y > horizon + 0.04;
  const reflection =
    water &&
    Math.abs(x - groupCenter) < buildingWidth * 1.8 &&
    y < horizon + height * 0.78 &&
    hash(column * 0.7 + Math.floor(y * 90)) > 0.48;
  const ripple = water ? 0.08 * Math.sin(x * 80 + time * 2.5 + y * 20) : 0;
  const skylineGlow = Math.max(0, 1 - Math.abs(y - horizon) * 8) * 0.12;

  const brightness = clamp(
    (windowLit ? 0.95 : 0) +
      (bridge || bridgeCable ? 0.82 : 0) +
      (reflection ? 0.42 : 0) +
      skylineGlow +
      ripple +
      hash(x * 21 + y * 31 + time * 0.02) * 0.035,
    0,
    1
  );

  const warm = 0.52 + brightness * 0.42;
  return {
    brightness,
    color: [warm, 0.44 + brightness * 0.36, 0.18 + brightness * 0.18, 1]
  };
}

function sampleField(x: number, y: number, time: number): LiveSample {
  const dx = x - 0.5 + Math.sin(time * 0.3) * 0.06;
  const dy = y - 0.48 + Math.cos(time * 0.24) * 0.04;
  const radius = Math.sqrt(dx * dx + dy * dy);
  const rings = 0.5 + 0.5 * Math.sin(radius * 62 - time * 3.2);
  const lattice = Math.abs(Math.sin((x + time * 0.03) * 34)) * Math.abs(Math.cos(y * 30));
  const brightness = clamp(rings * 0.62 + lattice * 0.38 - radius * 0.45, 0, 1);
  return {
    brightness,
    color: [0.2 + brightness * 0.32, 0.78 + brightness * 0.2, 0.5 + brightness * 0.26, 1]
  };
}

function sampleWaves(x: number, y: number, time: number): LiveSample {
  const waveA = Math.sin((x * 18 + y * 7) - time * 1.8);
  const waveB = Math.cos((x * 6 - y * 22) + time * 1.2);
  const crest = Math.abs(waveA + waveB);
  const brightness = clamp(Math.pow(crest * 0.5, 1.8), 0, 1);
  return {
    brightness,
    color: [0.28 + brightness * 0.38, 0.62 + brightness * 0.3, 0.7 + brightness * 0.22, 1]
  };
}

function hash(value: number) {
  return fract(Math.sin(value * 12.9898) * 43758.5453);
}

function fract(value: number) {
  return value - Math.floor(value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
