import {
  Box,
  Braces,
  CircuitBoard,
  ClipboardList,
  Radar,
  Terminal
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { FrameMetrics, PrototypeSettings } from "../prototype/settings";

type InterfaceDockProps = {
  metrics: FrameMetrics;
  settings: PrototypeSettings;
  updateSettings: (patch: Partial<PrototypeSettings>) => void;
};

type DockAction = {
  command: string;
  description: string;
  icon: LucideIcon;
  id: string;
  label: string;
  patch: Partial<PrototypeSettings>;
};

const dockActions: DockAction[] = [
  {
    command: "render --source diagram3d --mix 0.74",
    description: "Route structured UI through the 3D ASCII renderer.",
    icon: CircuitBoard,
    id: "diagram3d",
    label: "3D diagram",
    patch: {
      assemblyEnabled: false,
      liveSource: "diagram3d",
      mix: 0.74,
      perspectiveAmount: 0.82,
      perspectiveMotion: 0.78,
      perspectiveSkew: 0.58,
      playing: true
    }
  },
  {
    command: "blend --source diagram --foreground transcript",
    description: "Keep UI readable while the glyph layer carries atmosphere.",
    icon: ClipboardList,
    id: "readable",
    label: "Readable UI",
    patch: {
      assemblyEnabled: false,
      liveSource: "diagram",
      mix: 0.54,
      playing: true,
      transitionMode: "text-to-ascii"
    }
  }
];

const eventLog = [
  "input focus acquired",
  "glyph sampler locked",
  "depth field streaming",
  "operator preset armed"
];

export function InterfaceDock({
  metrics,
  settings,
  updateSettings
}: InterfaceDockProps) {
  const activeCommand = describeActiveCommand(settings);
  const modeLabel = describeMode(settings);

  return (
    <section className="interface-dock" aria-label="application console">
      <div className="command-console">
        <div className="dock-section-heading">
          <Terminal size={15} />
          <span>Command deck</span>
        </div>
        <button
          className="command-composer"
          type="button"
          onClick={() => updateSettings({ playing: !settings.playing })}
        >
          <span className="prompt-sign">$</span>
          <span>{activeCommand}</span>
        </button>
      </div>

      <div className="workflow-actions" aria-label="scenario presets">
        {dockActions.map((action) => {
          const Icon = action.icon;
          const selected = isActionSelected(action, settings);

          return (
            <button
              className={selected ? "workflow-action is-selected" : "workflow-action"}
              data-testid={`dock-action-${action.id}`}
              key={action.label}
              type="button"
              onClick={() => updateSettings(action.patch)}
            >
              <Icon size={17} />
              <span>{action.label}</span>
              <small>{action.description}</small>
              <code>{action.command}</code>
            </button>
          );
        })}
      </div>

      <div className="signal-panel" aria-label="runtime signal">
        <div className="dock-section-heading">
          <Radar size={15} />
          <span>Signal</span>
        </div>
        <dl className="signal-grid">
          <div>
            <dt>Mode</dt>
            <dd>{modeLabel}</dd>
          </div>
          <div>
            <dt>Source</dt>
            <dd>{settings.liveSource}</dd>
          </div>
          <div>
            <dt>Mix</dt>
            <dd>{Math.round(settings.mix * 100)}%</dd>
          </div>
          <div>
            <dt>FPS</dt>
            <dd>{metrics.fps.toFixed(1)}</dd>
          </div>
        </dl>
        <ol className="event-log" aria-label="recent events">
          {eventLog.map((event) => (
            <li key={event}>
              <Braces size={13} />
              <span>{event}</span>
            </li>
          ))}
        </ol>
      </div>

      <button
        className="dock-primary-action"
        data-testid="dock-primary-action"
        type="button"
        onClick={() => {
          const assemblyEnabled = !settings.assemblyEnabled;

          updateSettings({
            assemblyEnabled,
            playing: true,
            zRippleEnabled: assemblyEnabled,
            zScatterEnabled: assemblyEnabled
          });
        }}
      >
        <Box size={18} />
        <span>{settings.assemblyEnabled ? "Return to page" : "Assemble cube"}</span>
      </button>
    </section>
  );
}

function describeActiveCommand(settings: PrototypeSettings) {
  if (settings.assemblyEnabled) {
    return "assemble --target cube --reverse false";
  }

  return `render --source ${settings.liveSource} --mix ${settings.mix.toFixed(2)}`;
}

function describeMode(settings: PrototypeSettings) {
  const flags = [
    settings.perspectiveEnabled ? "perspective" : "",
    settings.zRippleEnabled ? "leap" : "",
    settings.zScatterEnabled ? "scatter" : ""
  ].filter(Boolean);

  return flags.length > 0 ? flags.join("+") : "flat";
}

function isActionSelected(action: DockAction, settings: PrototypeSettings) {
  return (
    action.patch.liveSource === settings.liveSource &&
    action.patch.assemblyEnabled === settings.assemblyEnabled
  );
}
