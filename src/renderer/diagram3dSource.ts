import type { GridMetrics, LiveSample, RGBA } from "./types";

type Vec2 = {
  x: number;
  y: number;
};

type Vec3 = Vec2 & {
  z: number;
};

type SceneNode = {
  detail: string;
  label: string;
  position: Vec3;
  tone: RGBA;
};

type ProjectedNode = SceneNode & {
  backOffset: Vec2;
  center: Vec2;
  depth: number;
  height: number;
  width: number;
};

const BG: RGBA = [0.06, 0.1, 0.1, 1];
const TEXT: RGBA = [0.9, 0.96, 0.78, 1];
const GREEN: RGBA = [0.44, 0.96, 0.36, 1];
const AMBER: RGBA = [0.96, 0.72, 0.32, 1];
const BLUE: RGBA = [0.42, 0.74, 0.94, 1];
const CYAN: RGBA = [0.44, 0.86, 0.8, 1];
const MUTED: RGBA = [0.28, 0.42, 0.39, 1];

const WIDE_NODES: SceneNode[] = [
  { detail: "events", label: "INPUT", position: { x: -1.0, y: 0.56, z: 0.04 }, tone: BLUE },
  { detail: "cards", label: "VIEW", position: { x: -0.68, y: 0.18, z: 0.86 }, tone: GREEN },
  { detail: "logic", label: "MODEL", position: { x: 0.18, y: 0.16, z: 0.24 }, tone: AMBER },
  { detail: "jobs", label: "QUEUE", position: { x: -0.52, y: -0.52, z: -0.54 }, tone: AMBER },
  { detail: "state", label: "STORE", position: { x: 0.78, y: -0.26, z: -0.2 }, tone: BLUE }
];

const COMPACT_NODES: SceneNode[] = [
  { detail: "cards", label: "VIEW", position: { x: -0.58, y: 0.44, z: 0.62 }, tone: GREEN },
  { detail: "logic", label: "API", position: { x: 0.48, y: 0.22, z: 0.18 }, tone: AMBER },
  { detail: "jobs", label: "JOB", position: { x: -0.48, y: -0.38, z: -0.58 }, tone: AMBER },
  { detail: "state", label: "DB", position: { x: 0.52, y: -0.34, z: -0.22 }, tone: BLUE }
];

const WIDE_LINKS = [
  [0, 1],
  [1, 2],
  [2, 4],
  [2, 3],
  [0, 3],
  [3, 4]
] as const;

const COMPACT_LINKS = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 3]
] as const;

export function sampleDiagram3dSource(
  column: number,
  row: number,
  metrics: GridMetrics,
  time: number
): LiveSample {
  const compact = metrics.columns < 78 || metrics.rows < 31;
  const nodes = (compact ? COMPACT_NODES : WIDE_NODES)
    .map((node) => projectNode(node, metrics, time, compact))
    .sort((a, b) => b.depth - a.depth);
  const links = compact ? COMPACT_LINKS : WIDE_LINKS;
  const title = sampleText(
    column,
    row,
    Math.max(2, Math.floor(metrics.columns * (compact ? 0.08 : 0.34))),
    Math.max(2, Math.floor(metrics.rows * 0.1)),
    compact ? "3D ASCII MAP" : "3D ASCII SYSTEM MAP",
    GREEN,
    0.94
  );
  if (title) {
    return title;
  }

  const axes = sampleAxes(column, row, metrics, time, compact);
  if (axes) {
    return axes;
  }

  for (const node of nodes) {
    const sample = sampleNode(column, row, node);
    if (sample) {
      return sample;
    }
  }

  for (const [fromIndex, toIndex] of links) {
    const from = nodes.find((node) => node.label === (compact ? COMPACT_NODES : WIDE_NODES)[fromIndex].label);
    const to = nodes.find((node) => node.label === (compact ? COMPACT_NODES : WIDE_NODES)[toIndex].label);
    if (!from || !to) {
      continue;
    }

    const sample = sampleLink(column, row, from, to);
    if (sample) {
      return sample;
    }
  }

  const legend = sampleText(
    column,
    row,
    Math.max(2, Math.floor(metrics.columns * (compact ? 0.08 : 0.29))),
    Math.min(metrics.rows - 3, Math.floor(metrics.rows * 0.86)),
    compact ? "projected 3d nodes through ascii" : "perspective nodes + depth links -> ascii surface",
    MUTED,
    0.46
  );
  if (legend) {
    return legend;
  }

  return sampleDepthGrid(column, row, metrics, time, compact);
}

function projectNode(
  node: SceneNode,
  metrics: GridMetrics,
  time: number,
  compact: boolean
): ProjectedNode {
  const projected = project(node.position, metrics, time, compact);
  const depthScale = 0.78 + projected.depth * 0.44;
  const width = Math.max(
    node.label.length + 4,
    node.detail.length + 4,
    Math.round((compact ? 10 : 13) * depthScale)
  );
  const height = compact ? 5 : 6;

  return {
    ...node,
    backOffset: {
      x: Math.round(2.2 + projected.depth * 4.4),
      y: -Math.round(1.4 + projected.depth * 2.4)
    },
    center: projected.center,
    depth: projected.depth,
    height,
    width
  };
}

function project(
  point: Vec3,
  metrics: GridMetrics,
  time: number,
  compact: boolean
): { center: Vec2; depth: number } {
  const yaw = -0.76 + Math.sin(time * 0.46) * 0.34 + Math.sin(time * 0.17) * 0.08;
  const pitch = 0.54 + Math.cos(time * 0.36) * 0.18;
  const roll = Math.sin(time * 0.21) * 0.08;
  const rotated = rotateZ(rotateX(rotateY(point, yaw), pitch), roll);
  const perspective = (compact ? 1.12 : 1.24) / Math.max(0.56, 1.72 - rotated.z * 0.76);
  const xScale = compact ? 0.34 : 0.42;
  const yScale = compact ? 0.48 : 0.43;
  const x = (0.5 + rotated.x * perspective * xScale) * (metrics.columns - 1);
  const y = ((compact ? 0.54 : 0.56) - rotated.y * perspective * yScale) * (metrics.rows - 1);

  return {
    center: { x, y },
    depth: clamp((rotated.z + 1.22) / 2.44, 0, 1)
  };
}

function sampleNode(column: number, row: number, node: ProjectedNode): LiveSample | null {
  const left = Math.round(node.center.x - node.width / 2);
  const top = Math.round(node.center.y - node.height / 2);
  const right = left + node.width - 1;
  const bottom = top + node.height - 1;
  const backLeft = left + node.backOffset.x;
  const backTop = top + node.backOffset.y;
  const backRight = backLeft + node.width - 1;
  const backBottom = backTop + node.height - 1;
  const shade = 0.48 + node.depth * 0.44;

  const label = sampleCenteredText(
    column,
    row,
    left,
    node.width,
    top + Math.floor(node.height / 2),
    node.label,
    TEXT,
    0.92
  );
  if (label) {
    return label;
  }

  const detail = sampleCenteredText(
    column,
    row,
    left,
    node.width,
    top + Math.floor(node.height / 2) + 1,
    node.detail,
    node.tone,
    0.66 + node.depth * 0.18
  );
  if (detail) {
    return detail;
  }

  const front = sampleRectEdge(column, row, left, top, right, bottom, node.tone, 0.74 + shade * 0.2);
  if (front) {
    return front;
  }

  const back = sampleRectEdge(column, row, backLeft, backTop, backRight, backBottom, node.tone, 0.42 + shade * 0.18);
  if (back) {
    return { ...back, glyph: back.glyph === "|" ? ":" : back.glyph };
  }

  const extrusion = [
    sampleLine(column, row, { x: left, y: top }, { x: backLeft, y: backTop }, node.tone, 0.52),
    sampleLine(column, row, { x: right, y: top }, { x: backRight, y: backTop }, node.tone, 0.52),
    sampleLine(column, row, { x: right, y: bottom }, { x: backRight, y: backBottom }, node.tone, 0.52),
    sampleLine(column, row, { x: left, y: bottom }, { x: backLeft, y: backBottom }, node.tone, 0.52)
  ].find(Boolean);
  if (extrusion) {
    return extrusion;
  }

  if (column > left && column < right && row > top && row < bottom) {
    return {
      brightness: ((column + row) % 5 === 0 ? 0.24 : 0.12) + node.depth * 0.1,
      color: node.tone
    };
  }

  return null;
}

function sampleLink(
  column: number,
  row: number,
  from: ProjectedNode,
  to: ProjectedNode
): LiveSample | null {
  const brightness = 0.4 + Math.max(from.depth, to.depth) * 0.36;
  const color = mixColor(from.tone, to.tone, 0.5);
  const line = sampleLine(column, row, from.center, to.center, color, brightness);
  if (!line) {
    return null;
  }

  const endDistance = distance({ x: column, y: row }, to.center);
  if (endDistance < 1.4) {
    return { ...line, glyph: directionGlyph(from.center, to.center, true), brightness: brightness + 0.16 };
  }

  return line;
}

function sampleAxes(
  column: number,
  row: number,
  metrics: GridMetrics,
  time: number,
  compact: boolean
): LiveSample | null {
  const origin = project({ x: -1.08, y: -0.7, z: -0.72 }, metrics, time, compact).center;
  const axisX = project({ x: -0.64, y: -0.7, z: -0.72 }, metrics, time, compact).center;
  const axisY = project({ x: -1.08, y: -0.28, z: -0.72 }, metrics, time, compact).center;
  const axisZ = project({ x: -1.08, y: -0.7, z: -0.26 }, metrics, time, compact).center;
  const labels = [
    sampleText(column, row, Math.round(axisX.x) + 1, Math.round(axisX.y), "X", MUTED, 0.5),
    sampleText(column, row, Math.round(axisY.x), Math.round(axisY.y) - 1, "Y", MUTED, 0.5),
    sampleText(column, row, Math.round(axisZ.x) + 1, Math.round(axisZ.y), "Z", MUTED, 0.5)
  ].find(Boolean);
  if (labels) {
    return labels;
  }

  return (
    sampleLine(column, row, origin, axisX, MUTED, 0.34) ??
    sampleLine(column, row, origin, axisY, MUTED, 0.34) ??
    sampleLine(column, row, origin, axisZ, MUTED, 0.34)
  );
}

function sampleDepthGrid(
  column: number,
  row: number,
  metrics: GridMetrics,
  time: number,
  compact: boolean
): LiveSample {
  const x = metrics.columns <= 1 ? 0 : column / (metrics.columns - 1);
  const y = metrics.rows <= 1 ? 0 : row / (metrics.rows - 1);
  const vanishX = 0.5 + Math.sin(time * 0.12) * 0.02;
  const horizon = compact ? 0.45 : 0.47;
  const travel = time * (compact ? 0.46 : 0.34);
  const lower = y > horizon;
  const rowBand = lower && Math.abs(Math.sin((y - horizon) * 56 - travel * 2.2)) < 0.08;
  const ray =
    lower &&
    Math.abs(Math.sin((x - vanishX) * 48 / Math.max(0.08, y - horizon) + travel)) < 0.08;
  const depthDot = (column + row * 2) % 9 === 0;
  const brightness = clamp((rowBand || ray ? 0.18 : 0.04) + (depthDot ? 0.04 : 0), 0, 1);

  return {
    brightness,
    color: rowBand || ray ? CYAN : BG
  };
}

function sampleRectEdge(
  column: number,
  row: number,
  left: number,
  top: number,
  right: number,
  bottom: number,
  color: RGBA,
  brightness: number
): LiveSample | null {
  const onHorizontal = row === top || row === bottom;
  const onVertical = column === left || column === right;
  if (column < left || column > right || row < top || row > bottom || (!onHorizontal && !onVertical)) {
    return null;
  }

  return {
    brightness,
    color,
    glyph: onHorizontal && onVertical ? "+" : onHorizontal ? "-" : "|"
  };
}

function sampleLine(
  column: number,
  row: number,
  from: Vec2,
  to: Vec2,
  color: RGBA,
  brightness: number
): LiveSample | null {
  const point = { x: column, y: row };
  const length = distance(from, to);
  if (length < 0.001) {
    return null;
  }

  const dist = segmentDistance(point, from, to);
  if (dist > 0.54) {
    return null;
  }

  return {
    brightness,
    color,
    glyph: directionGlyph(from, to, false)
  };
}

function sampleCenteredText(
  column: number,
  row: number,
  left: number,
  width: number,
  textRow: number,
  text: string,
  color: RGBA,
  brightness: number
): LiveSample | null {
  return sampleText(
    column,
    row,
    left + Math.max(1, Math.floor((width - text.length) / 2)),
    textRow,
    text,
    color,
    brightness
  );
}

function sampleText(
  column: number,
  row: number,
  start: number,
  textRow: number,
  text: string,
  color: RGBA,
  brightness: number
): LiveSample | null {
  if (row !== textRow || column < start || column >= start + text.length) {
    return null;
  }

  return {
    brightness,
    color,
    glyph: text[column - start]
  };
}

function directionGlyph(from: Vec2, to: Vec2, arrow: boolean) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  if (absX > absY * 1.7) {
    return arrow ? (dx >= 0 ? ">" : "<") : "-";
  }
  if (absY > absX * 1.7) {
    return arrow ? (dy >= 0 ? "v" : "^") : "|";
  }
  return dx * dy >= 0 ? "\\" : "/";
}

function rotateY(point: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return {
    x: point.x * c + point.z * s,
    y: point.y,
    z: -point.x * s + point.z * c
  };
}

function rotateX(point: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return {
    x: point.x,
    y: point.y * c - point.z * s,
    z: point.y * s + point.z * c
  };
}

function rotateZ(point: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return {
    x: point.x * c - point.y * s,
    y: point.x * s + point.y * c,
    z: point.z
  };
}

function segmentDistance(point: Vec2, from: Vec2, to: Vec2) {
  const lengthSq = squaredDistance(from, to);
  const t = clamp(
    ((point.x - from.x) * (to.x - from.x) + (point.y - from.y) * (to.y - from.y)) / lengthSq,
    0,
    1
  );
  return distance(point, {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t
  });
}

function distance(a: Vec2, b: Vec2) {
  return Math.sqrt(squaredDistance(a, b));
}

function squaredDistance(a: Vec2, b: Vec2) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function mixColor(from: RGBA, to: RGBA, amount: number): RGBA {
  return [
    from[0] + (to[0] - from[0]) * amount,
    from[1] + (to[1] - from[1]) * amount,
    from[2] + (to[2] - from[2]) * amount,
    1
  ];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
