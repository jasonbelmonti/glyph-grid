import { useEffect, useRef, useState } from "react";
import type { FrameMetrics, PrototypeSettings } from "../prototype/settings";
import { WebGLTerminalSurface } from "../renderer/webglTerminalSurface";

type TerminalSurfaceProps = {
  ariaLabel: string;
  onMetrics: (metrics: FrameMetrics) => void;
  settings: PrototypeSettings;
};

export function TerminalSurface({
  ariaLabel,
  onMetrics,
  settings
}: TerminalSurfaceProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<WebGLTerminalSurface | null>(null);
  const settingsRef = useRef(settings);
  const reportTimeRef = useRef(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    let animationFrame = 0;
    let disposed = false;

    try {
      rendererRef.current = new WebGLTerminalSurface(canvas, settingsRef.current);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "WebGL renderer failed.");
      return;
    }

    const render = (now: number) => {
      if (disposed || !rendererRef.current) {
        return;
      }

      try {
        const metrics = rendererRef.current.render(now / 1000, settingsRef.current);
        if (now - reportTimeRef.current > 110) {
          onMetrics(metrics);
          reportTimeRef.current = now;
        }
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Render loop failed.");
      }

      animationFrame = window.requestAnimationFrame(render);
    };

    animationFrame = window.requestAnimationFrame(render);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(animationFrame);
      rendererRef.current?.destroy();
      rendererRef.current = null;
    };
  }, [onMetrics]);

  return (
    <div className="terminal-surface" data-live-source={settings.liveSource}>
      <canvas ref={canvasRef} aria-label={ariaLabel} role="img" />
      {error ? (
        <div className="surface-error" role="status">
          <strong>WebGL offline</strong>
          <span>{error}</span>
        </div>
      ) : null}
      {settings.liveSource === "offline" ? (
        <div className="source-warning" role="status">
          live source unavailable; terminal buffer retained
        </div>
      ) : null}
    </div>
  );
}
