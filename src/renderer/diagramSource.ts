import type { GridMetrics, LiveSample, RGBA } from "./types";

type DiagramBox = {
  detail: string;
  label: string;
  tone: RGBA;
  x: number;
  y: number;
  width: number;
  height: number;
};

const DIAGRAM_BG: RGBA = [0.08, 0.13, 0.12, 1];
const DIAGRAM_TEXT: RGBA = [0.88, 0.95, 0.76, 1];
const DIAGRAM_LINE: RGBA = [0.38, 0.8, 0.74, 1];
const DIAGRAM_GREEN: RGBA = [0.44, 0.96, 0.36, 1];
const DIAGRAM_AMBER: RGBA = [0.96, 0.72, 0.32, 1];
const DIAGRAM_BLUE: RGBA = [0.38, 0.72, 0.92, 1];
const DIAGRAM_MUTED: RGBA = [0.32, 0.42, 0.4, 1];

export function sampleDiagramSource(
  column: number,
  row: number,
  metrics: GridMetrics,
  time: number
): LiveSample {
  return metrics.columns < 62 || metrics.rows < 34
    ? sampleCompactDiagram(column, row, metrics, time)
    : sampleWideDiagram(column, row, metrics, time);
}

function sampleWideDiagram(
  column: number,
  row: number,
  metrics: GridMetrics,
  time: number
): LiveSample {
  const width = Math.min(68, metrics.columns - 6);
  const left = Math.max(2, Math.floor((metrics.columns - width) / 2));
  const top = Math.max(3, Math.floor((metrics.rows - 32) / 2));
  const nodeWidth = Math.min(16, Math.max(13, Math.floor((width - 14) / 3)));
  const gap = Math.max(4, Math.floor((width - nodeWidth * 3) / 2));
  const rowA = top + 6;
  const rowB = top + 19;
  const xA = left;
  const xB = left + nodeWidth + gap;
  const xC = left + nodeWidth * 2 + gap * 2;
  const scan = Math.floor((time * 10) % Math.max(12, width));
  const title = sampleText(
    column,
    row,
    left + Math.max(0, Math.floor((width - 29) / 2)),
    top + 1,
    "ASCII UI PIPELINE / UNDERLAY",
    DIAGRAM_GREEN,
    0.94
  );
  if (title) {
    return title;
  }

  const rule = sampleHorizontal(
    column,
    row,
    left + 2,
    left + width - 3,
    top + 3,
    DIAGRAM_MUTED,
    0.42
  );
  if (rule) {
    return rule;
  }

  const boxes: DiagramBox[] = [
    {
      detail: "input",
      label: "CLIENT",
      tone: DIAGRAM_BLUE,
      x: xA,
      y: rowA,
      width: nodeWidth,
      height: 6
    },
    {
      detail: "cards+tabs",
      label: "UI PANEL",
      tone: DIAGRAM_GREEN,
      x: xB,
      y: rowA,
      width: nodeWidth,
      height: 6
    },
    {
      detail: "json",
      label: "API",
      tone: DIAGRAM_AMBER,
      x: xC,
      y: rowA,
      width: nodeWidth,
      height: 6
    },
    {
      detail: "stream",
      label: "EVENT LOG",
      tone: DIAGRAM_AMBER,
      x: xA,
      y: rowB,
      width: nodeWidth,
      height: 6
    },
    {
      detail: "queue",
      label: "WORKER",
      tone: DIAGRAM_GREEN,
      x: xB,
      y: rowB,
      width: nodeWidth,
      height: 6
    },
    {
      detail: "state",
      label: "DB",
      tone: DIAGRAM_BLUE,
      x: xC,
      y: rowB,
      width: nodeWidth,
      height: 6
    }
  ];

  for (const box of boxes) {
    const sample = sampleBox(column, row, box, time);
    if (sample) {
      return sample;
    }
  }

  const connectors = [
    sampleArrowRight(column, row, xA + nodeWidth, xB - 1, rowA + 2, DIAGRAM_LINE),
    sampleArrowRight(column, row, xB + nodeWidth, xC - 1, rowA + 2, DIAGRAM_LINE),
    sampleArrowRight(column, row, xA + nodeWidth, xB - 1, rowB + 2, DIAGRAM_LINE),
    sampleArrowRight(column, row, xB + nodeWidth, xC - 1, rowB + 2, DIAGRAM_LINE),
    sampleArrowDown(
      column,
      row,
      xA + Math.floor(nodeWidth / 2),
      rowA + 6,
      rowB - 1,
      DIAGRAM_LINE
    ),
    sampleArrowDown(
      column,
      row,
      xB + Math.floor(nodeWidth / 2),
      rowA + 6,
      rowB - 1,
      DIAGRAM_LINE
    ),
    sampleArrowDown(
      column,
      row,
      xC + Math.floor(nodeWidth / 2),
      rowA + 6,
      rowB - 1,
      DIAGRAM_LINE
    )
  ].find(Boolean);
  if (connectors) {
    return connectors;
  }

  const chart = sampleMiniChart(column, row, left + 3, top + 28, width - 6, scan);
  if (chart) {
    return chart;
  }

  const legend = sampleText(
    column,
    row,
    left + 4,
    top + 30,
    "blend: terminal text -> structured diagram -> ascii surface",
    DIAGRAM_MUTED,
    0.46
  );
  if (legend) {
    return legend;
  }

  return sampleDiagramBackground(column, row, left, top, width, 32, scan);
}

function sampleCompactDiagram(
  column: number,
  row: number,
  metrics: GridMetrics,
  time: number
): LiveSample {
  const width = Math.min(metrics.columns - 4, 44);
  const left = Math.max(2, Math.floor((metrics.columns - width) / 2));
  const top = Math.max(2, Math.floor((metrics.rows - 24) / 2));
  const nodeWidth = Math.max(11, Math.floor((width - 6) / 2));
  const gap = Math.max(3, width - nodeWidth * 2);
  const xA = left;
  const xB = left + nodeWidth + gap;
  const rowA = top + 5;
  const rowB = top + 15;
  const scan = Math.floor((time * 9) % Math.max(12, width));

  const title = sampleText(
    column,
    row,
    left + 1,
    top + 1,
    "ASCII UI FLOW",
    DIAGRAM_GREEN,
    0.92
  );
  if (title) {
    return title;
  }

  const boxes: DiagramBox[] = [
    {
      detail: "cards",
      label: "UI",
      tone: DIAGRAM_GREEN,
      x: xA,
      y: rowA,
      width: nodeWidth,
      height: 5
    },
    {
      detail: "json",
      label: "API",
      tone: DIAGRAM_AMBER,
      x: xB,
      y: rowA,
      width: nodeWidth,
      height: 5
    },
    {
      detail: "queue",
      label: "JOBS",
      tone: DIAGRAM_AMBER,
      x: xA,
      y: rowB,
      width: nodeWidth,
      height: 5
    },
    {
      detail: "state",
      label: "DB",
      tone: DIAGRAM_BLUE,
      x: xB,
      y: rowB,
      width: nodeWidth,
      height: 5
    }
  ];

  for (const box of boxes) {
    const sample = sampleBox(column, row, box, time);
    if (sample) {
      return sample;
    }
  }

  const connectors = [
    sampleArrowRight(column, row, xA + nodeWidth, xB - 1, rowA + 2, DIAGRAM_LINE),
    sampleArrowRight(column, row, xA + nodeWidth, xB - 1, rowB + 2, DIAGRAM_LINE),
    sampleArrowDown(
      column,
      row,
      xA + Math.floor(nodeWidth / 2),
      rowA + 5,
      rowB - 1,
      DIAGRAM_LINE
    ),
    sampleArrowDown(
      column,
      row,
      xB + Math.floor(nodeWidth / 2),
      rowA + 5,
      rowB - 1,
      DIAGRAM_LINE
    )
  ].find(Boolean);
  if (connectors) {
    return connectors;
  }

  const legend = sampleText(
    column,
    row,
    left + 1,
    top + 22,
    "diagram source under terminal",
    DIAGRAM_MUTED,
    0.44
  );
  if (legend) {
    return legend;
  }

  return sampleDiagramBackground(column, row, left, top, width, 24, scan);
}

function sampleBox(
  column: number,
  row: number,
  box: DiagramBox,
  time: number
): LiveSample | null {
  if (
    column < box.x ||
    column >= box.x + box.width ||
    row < box.y ||
    row >= box.y + box.height
  ) {
    return null;
  }

  const localX = column - box.x;
  const localY = row - box.y;
  const isTopOrBottom = localY === 0 || localY === box.height - 1;
  const isSide = localX === 0 || localX === box.width - 1;
  const pulse = 0.07 * Math.sin(time * 2.4 + box.x * 0.31);

  if (isTopOrBottom || isSide) {
    const isCorner = isTopOrBottom && isSide;
    return {
      brightness: clamp(0.78 + pulse, 0, 1),
      color: box.tone,
      glyph: isCorner ? "+" : isTopOrBottom ? "-" : "|"
    };
  }

  const label = sampleCenteredText(
    column,
    row,
    box.x,
    box.width,
    box.y + 2,
    box.label,
    DIAGRAM_TEXT,
    0.9
  );
  if (label) {
    return label;
  }

  const detail = sampleCenteredText(
    column,
    row,
    box.x,
    box.width,
    box.y + 3,
    box.detail,
    box.tone,
    0.64
  );
  if (detail) {
    return detail;
  }

  return {
    brightness: ((column + row) % 6 === 0 ? 0.24 : 0.12) + pulse * 0.35,
    color: box.tone
  };
}

function sampleMiniChart(
  column: number,
  row: number,
  left: number,
  top: number,
  width: number,
  scan: number
): LiveSample | null {
  if (row < top || row > top + 1 || column < left || column >= left + width) {
    return null;
  }

  if (row === top) {
    if (column === left) {
      return glyphSample("[", DIAGRAM_MUTED, 0.5);
    }
    if (column === left + width - 1) {
      return glyphSample("]", DIAGRAM_MUTED, 0.5);
    }
    return glyphSample(
      column - left < scan ? "=" : "-",
      DIAGRAM_GREEN,
      column - left < scan ? 0.72 : 0.34
    );
  }

  const wave = Math.sin((column - left) * 0.55) + Math.cos((column - left) * 0.23);
  const active = wave > 0.72;
  return glyphSample(
    active ? "^" : ".",
    active ? DIAGRAM_AMBER : DIAGRAM_MUTED,
    active ? 0.72 : 0.28
  );
}

function sampleArrowRight(
  column: number,
  row: number,
  start: number,
  end: number,
  arrowRow: number,
  color: RGBA
): LiveSample | null {
  if (row !== arrowRow || column < start || column > end) {
    return null;
  }

  return glyphSample(column === end ? ">" : "-", color, column === end ? 0.82 : 0.58);
}

function sampleArrowDown(
  column: number,
  row: number,
  arrowColumn: number,
  start: number,
  end: number,
  color: RGBA
): LiveSample | null {
  if (column !== arrowColumn || row < start || row > end) {
    return null;
  }

  return glyphSample(row === end ? "v" : "|", color, row === end ? 0.82 : 0.52);
}

function sampleHorizontal(
  column: number,
  row: number,
  start: number,
  end: number,
  lineRow: number,
  color: RGBA,
  brightness: number
): LiveSample | null {
  if (row !== lineRow || column < start || column > end) {
    return null;
  }

  return glyphSample("-", color, brightness);
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

  return glyphSample(text[column - start], color, brightness);
}

function sampleDiagramBackground(
  column: number,
  row: number,
  left: number,
  top: number,
  width: number,
  height: number,
  scan: number
): LiveSample {
  const inside = column >= left && column < left + width && row >= top && row < top + height;
  const grid = inside && (column - left) % 8 === 0 && (row - top) % 4 === 0;
  const sweep = inside && Math.abs(column - left - scan) < 1;
  const brightness = clamp((grid ? 0.22 : 0.05) + (sweep ? 0.18 : 0), 0, 1);
  return {
    brightness,
    color: sweep ? DIAGRAM_GREEN : grid ? DIAGRAM_MUTED : DIAGRAM_BG
  };
}

function glyphSample(glyph: string, color: RGBA, brightness: number): LiveSample {
  return { brightness, color, glyph };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
