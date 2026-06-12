import { Circle, Minus, ScanLine, Square, Waves } from "lucide-react";
import type { ReactNode } from "react";
import type { PrototypeSettings } from "../prototype/settings";
import type { LiveSourceKind, RevealShape, TransitionMode } from "../renderer/types";

type ControlPanelProps = {
  settings: PrototypeSettings;
  updateOrigin: (axis: "x" | "y", value: number) => void;
  updateSettings: (patch: Partial<PrototypeSettings>) => void;
};

const shapeOptions: Array<{ icon: JSX.Element; label: string; value: RevealShape }> = [
  { icon: <Circle size={16} />, label: "Radial reveal", value: "radial" },
  { icon: <Square size={16} />, label: "Wipe reveal", value: "wipe" },
  { icon: <Minus size={16} />, label: "Scanline reveal", value: "scanline" },
  { icon: <Waves size={16} />, label: "Noise reveal", value: "noise" }
];

const liveSources: Array<{ label: string; value: LiveSourceKind }> = [
  { label: "city", value: "city" },
  { label: "field", value: "field" },
  { label: "waves", value: "waves" },
  { label: "offline", value: "offline" }
];

export function ControlPanel({
  settings,
  updateOrigin,
  updateSettings
}: ControlPanelProps) {
  return (
    <aside className="control-panel" aria-label="transition controls">
      <nav className="panel-tabs" aria-label="control categories">
        <span className="is-active">Mix</span>
        <span>Reveal</span>
        <span>Glyphs</span>
        <span>Color</span>
        <span>Cell</span>
      </nav>

      <ControlGroup title="Mix">
        <Slider
          label="Mix"
          max={1}
          min={0}
          step={0.01}
          value={settings.mix}
          onChange={(mix) => updateSettings({ mix, playing: false })}
        />
        <SegmentedControl<TransitionMode>
          label="Mode"
          options={[
            { label: "Text -> ASCII", value: "text-to-ascii" },
            { label: "ASCII -> Text", value: "ascii-to-text" }
          ]}
          value={settings.transitionMode}
          onChange={(transitionMode) => updateSettings({ transitionMode })}
        />
      </ControlGroup>

      <ControlGroup title="Reveal">
        <div className="shape-grid" role="group" aria-label="Reveal shape">
          {shapeOptions.map((option) => (
            <button
              className={settings.revealShape === option.value ? "is-selected" : ""}
              key={option.value}
              type="button"
              aria-label={option.label}
              onClick={() => updateSettings({ revealShape: option.value })}
            >
              {option.value === "scanline" ? <ScanLine size={16} /> : option.icon}
            </button>
          ))}
        </div>
        <Slider
          label="Feather"
          max={0.22}
          min={0.02}
          step={0.01}
          value={settings.revealFeather}
          onChange={(revealFeather) => updateSettings({ revealFeather })}
        />
        <Slider
          label="Speed"
          max={1.4}
          min={0.12}
          step={0.02}
          value={settings.revealSpeed}
          onChange={(revealSpeed) => updateSettings({ revealSpeed })}
        />
      </ControlGroup>

      <ControlGroup title="Origin">
        <div className="origin-row">
          <Slider
            label="X"
            max={1}
            min={0}
            step={0.01}
            value={settings.revealOrigin.x}
            onChange={(value) => updateOrigin("x", value)}
          />
          <Slider
            label="Y"
            max={1}
            min={0}
            step={0.01}
            value={settings.revealOrigin.y}
            onChange={(value) => updateOrigin("y", value)}
          />
        </div>
        <div className="origin-grid" aria-label="Origin presets">
          {[0, 0.5, 1].map((y) =>
            [0, 0.5, 1].map((x) => (
              <button
                className={
                  Math.abs(settings.revealOrigin.x - x) < 0.01 &&
                  Math.abs(settings.revealOrigin.y - y) < 0.01
                    ? "is-selected"
                    : ""
                }
                key={`${x}-${y}`}
                type="button"
                aria-label={`Set origin ${x}, ${y}`}
                onClick={() =>
                  updateSettings({ revealOrigin: { x, y }, playing: false })
                }
              />
            ))
          )}
        </div>
      </ControlGroup>

      <ControlGroup title="Glyphs / Color / Cell">
        <Slider
          label="Glyphs"
          max={1}
          min={0.2}
          step={0.01}
          value={settings.glyphDensity}
          onChange={(glyphDensity) => updateSettings({ glyphDensity })}
        />
        <Slider
          label="Color"
          max={1}
          min={0}
          step={0.01}
          value={settings.colorAdoption}
          onChange={(colorAdoption) => updateSettings({ colorAdoption })}
        />
        <Slider
          label="Cell"
          max={14}
          min={8}
          step={1}
          value={settings.cellSize}
          onChange={(cellSize) => updateSettings({ cellSize })}
        />
      </ControlGroup>

      <PerspectiveControls settings={settings} updateSettings={updateSettings} />

      <ControlGroup title="Source">
        <div className="source-grid">
          {liveSources.map((source) => (
            <button
              className={settings.liveSource === source.value ? "is-selected" : ""}
              key={source.value}
              type="button"
              onClick={() => updateSettings({ liveSource: source.value })}
            >
              {source.label}
            </button>
          ))}
        </div>
      </ControlGroup>
    </aside>
  );
}

function PerspectiveControls({
  settings,
  updateSettings
}: Pick<ControlPanelProps, "settings" | "updateSettings">) {
  return (
    <ControlGroup title="Perspective">
      <label className="toggle-row">
        <span>Bend</span>
        <input
          checked={settings.perspectiveEnabled}
          type="checkbox"
          onChange={(event) =>
            updateSettings({ perspectiveEnabled: event.target.checked })
          }
        />
      </label>
      <label className="toggle-row">
        <span>Ripple</span>
        <input
          checked={settings.zRippleEnabled}
          type="checkbox"
          onChange={(event) =>
            updateSettings({ zRippleEnabled: event.target.checked })
          }
        />
      </label>
      <label className="toggle-row">
        <span>Scatter</span>
        <input
          checked={settings.zScatterEnabled}
          type="checkbox"
          onChange={(event) =>
            updateSettings({ zScatterEnabled: event.target.checked })
          }
        />
      </label>
      <Slider
        label="Scale"
        max={1}
        min={0}
        step={0.01}
        value={settings.perspectiveAmount}
        onChange={(perspectiveAmount) => updateSettings({ perspectiveAmount })}
      />
      <Slider
        label="Motion"
        max={1}
        min={0}
        step={0.01}
        value={settings.perspectiveMotion}
        onChange={(perspectiveMotion) => updateSettings({ perspectiveMotion })}
      />
      <Slider
        label="Skew"
        max={1}
        min={0}
        step={0.01}
        value={settings.perspectiveSkew}
        onChange={(perspectiveSkew) => updateSettings({ perspectiveSkew })}
      />
      <Slider
        label="Offset"
        max={1}
        min={0}
        step={0.01}
        value={settings.perspectivePull}
        onChange={(perspectivePull) => updateSettings({ perspectivePull })}
      />
      <Slider
        label="Jump"
        max={1}
        min={0}
        step={0.01}
        value={settings.zRippleAmount}
        onChange={(zRippleAmount) => updateSettings({ zRippleAmount })}
      />
      <Slider
        label="Spread"
        max={1}
        min={0}
        step={0.01}
        value={settings.zRippleScatter}
        onChange={(zRippleScatter) => updateSettings({ zRippleScatter })}
      />
      <Slider
        label="Rate"
        max={1}
        min={0}
        step={0.01}
        value={settings.zRippleSpeed}
        onChange={(zRippleSpeed) => updateSettings({ zRippleSpeed })}
      />
    </ControlGroup>
  );
}

function ControlGroup({
  children,
  title
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="control-group">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Slider({
  label,
  max,
  min,
  onChange,
  step,
  value
}: {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step: number;
  value: number;
}) {
  return (
    <label className="control-row">
      <span>{label}</span>
      <input
        max={max}
        min={min}
        step={step}
        type="range"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <output>{value.toFixed(step >= 1 ? 0 : 2)}</output>
    </label>
  );
}

function SegmentedControl<T extends string>({
  label,
  onChange,
  options,
  value
}: {
  label: string;
  onChange: (value: T) => void;
  options: Array<{ label: string; value: T }>;
  value: T;
}) {
  return (
    <div className="segmented-row">
      <span>{label}</span>
      <div className="segmented-control">
        {options.map((option) => (
          <button
            className={value === option.value ? "is-selected" : ""}
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
