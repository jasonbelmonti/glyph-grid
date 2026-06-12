import { Camera, ChartNoAxesCombined, Maximize, Terminal } from "lucide-react";
import type { FrameMetrics, PrototypeSettings } from "../prototype/settings";

type StatusStripProps = {
  history: number[];
  metrics: FrameMetrics;
  settings: PrototypeSettings;
};

export function StatusStrip({ history, metrics, settings }: StatusStripProps) {
  const points = toSparklinePoints(history);

  return (
    <footer className="status-strip" aria-label="renderer status">
      <span className="status-pill is-accent">{metrics.renderer}</span>
      <span>{metrics.columns}x{metrics.rows}</span>
      <span>{settings.cellSize}x{Math.round(settings.cellSize * 1.8)}</span>
      <span>{metrics.cellCount.toLocaleString()} cells</span>
      <span>{metrics.fps.toFixed(1)} FPS</span>
      <span className="status-pill">{metrics.frameMs.toFixed(1)} ms</span>
      <span className={metrics.liveSourceAvailable ? "source-ok" : "source-down"}>
        {metrics.state}
      </span>
      <span className={settings.perspectiveEnabled ? "source-ok" : ""}>
        {settings.perspectiveEnabled ? "perspective" : "flat"}
      </span>
      <svg className="frame-sparkline" viewBox="0 0 240 34" aria-hidden="true">
        <polyline points={points} />
      </svg>
      <div className="status-actions" aria-label="capture controls">
        <button className="icon-button" type="button" aria-label="Pause status">
          <ChartNoAxesCombined size={17} />
        </button>
        <button className="icon-button" type="button" aria-label="Capture frame">
          <Camera size={17} />
        </button>
        <button className="icon-button" type="button" aria-label="Fullscreen">
          <Maximize size={17} />
        </button>
        <button className="icon-button" type="button" aria-label="Open terminal">
          <Terminal size={17} />
        </button>
      </div>
    </footer>
  );
}

function toSparklinePoints(history: number[]) {
  if (history.length === 0) {
    return "";
  }

  const max = Math.max(33, ...history);
  const min = Math.min(0, ...history);
  return history
    .map((value, index) => {
      const x = history.length === 1 ? 0 : (index / (history.length - 1)) * 240;
      const y = 30 - ((value - min) / Math.max(1, max - min)) * 24;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}
