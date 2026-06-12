import {
  Folder,
  Grid3X3,
  Pause,
  Play,
  RotateCcw,
  Settings,
  Square,
  Terminal
} from "lucide-react";
import type { PrototypeSettings } from "../prototype/settings";

type TopBarProps = {
  settings: PrototypeSettings;
  updateSettings: (patch: Partial<PrototypeSettings>) => void;
};

export function TopBar({ settings, updateSettings }: TopBarProps) {
  return (
    <header className="top-bar">
      <button className="icon-button" type="button" aria-label="Menu">
        <Grid3X3 size={18} />
      </button>

      <div className="brand-lockup">
        <Terminal size={17} />
        <span>glyph-grid</span>
      </div>

      <div className="command-tabs" aria-label="terminal commands">
        <button className="command-tab" type="button">
          <Terminal size={15} />
          terminal
        </button>
        <button className="command-field" type="button">
          <Terminal size={15} />
          render ./scene
        </button>
      </div>

      <div className="transport-controls" aria-label="renderer controls">
        <button
          className="icon-button is-accent"
          type="button"
          aria-label={settings.playing ? "Pause transition" : "Play transition"}
          onClick={() => updateSettings({ playing: !settings.playing })}
        >
          {settings.playing ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button
          className="icon-button"
          type="button"
          aria-label="Hold terminal state"
          onClick={() => updateSettings({ playing: false, mix: 0 })}
        >
          <Square size={16} />
        </button>
        <button
          className="icon-button"
          type="button"
          aria-label="Reset transition mix"
          onClick={() => updateSettings({ mix: 0.52, playing: true })}
        >
          <RotateCcw size={17} />
        </button>
      </div>

      <div className="mode-switch" aria-label="transition mode">
        <button
          className={settings.transitionMode === "text-to-ascii" ? "is-selected" : ""}
          type="button"
          onClick={() => updateSettings({ transitionMode: "text-to-ascii" })}
        >
          transition
        </button>
        <button
          className={settings.transitionMode === "ascii-to-text" ? "is-selected" : ""}
          type="button"
          onClick={() => updateSettings({ transitionMode: "ascii-to-text" })}
        >
          live-ascii
        </button>
      </div>

      <div className="top-actions">
        <button className="icon-button" type="button" aria-label="Open source">
          <Folder size={17} />
        </button>
        <button className="icon-button" type="button" aria-label="Settings">
          <Settings size={17} />
        </button>
      </div>
    </header>
  );
}
