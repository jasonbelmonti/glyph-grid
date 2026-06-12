import { useCallback, useEffect, useMemo, useState } from "react";
import { ControlPanel } from "./components/ControlPanel";
import { StatusStrip } from "./components/StatusStrip";
import { TerminalSurface } from "./components/TerminalSurface";
import { TopBar } from "./components/TopBar";
import {
  createDefaultMetrics,
  defaultPrototypeSettings,
  type FrameMetrics,
  type PrototypeSettings
} from "./prototype/settings";

const HISTORY_LIMIT = 96;
export function App() {
  const [settings, setSettings] = useState<PrototypeSettings>(
    defaultPrototypeSettings
  );
  const [metrics, setMetrics] = useState<FrameMetrics>(createDefaultMetrics);
  const [frameHistory, setFrameHistory] = useState<number[]>([]);

  const updateSettings = useCallback(
    (patch: Partial<PrototypeSettings>) => {
      setSettings((current) => ({ ...current, ...patch }));
    },
    [setSettings]
  );

  const updateOrigin = useCallback(
    (axis: "x" | "y", value: number) => {
      setSettings((current) => ({
        ...current,
        revealOrigin: { ...current.revealOrigin, [axis]: value }
      }));
    },
    [setSettings]
  );

  const handleMetrics = useCallback((nextMetrics: FrameMetrics) => {
    setMetrics(nextMetrics);
    setFrameHistory((history) => {
      const next = [...history, nextMetrics.frameMs];
      return next.slice(Math.max(0, next.length - HISTORY_LIMIT));
    });
    setSettings((current) => {
      if (!current.playing || Math.abs(current.mix - nextMetrics.mix) < 0.002) {
        return current;
      }

      return { ...current, mix: nextMetrics.mix };
    });
  }, []);

  const canvasLabel = useMemo(
    () =>
      `${metrics.columns}x${metrics.rows} ${metrics.renderer} terminal surface`,
    [metrics.columns, metrics.renderer, metrics.rows]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space") {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT"
      ) {
        return;
      }

      event.preventDefault();
      setSettings((current) => ({ ...current, playing: !current.playing }));
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <main className="app-shell">
      <TopBar settings={settings} updateSettings={updateSettings} />

      <section className="workbench" aria-label="glyph-grid prototype">
        <div className="surface-frame">
          <TerminalSurface
            ariaLabel={canvasLabel}
            settings={settings}
            onMetrics={handleMetrics}
          />
        </div>

        <ControlPanel
          settings={settings}
          updateOrigin={updateOrigin}
          updateSettings={updateSettings}
        />
      </section>

      <StatusStrip
        history={frameHistory}
        metrics={metrics}
        settings={settings}
      />
    </main>
  );
}
