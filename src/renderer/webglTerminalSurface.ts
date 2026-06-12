import { composeCells, sampleToAsciiCell } from "./asciiSampler";
import { createGlyphAtlas } from "./glyphAtlas";
import { sampleLiveSource } from "./liveSource";
import { createTerminalBuffer } from "./terminalBuffer";
import { transitionState, transitionWeight } from "./transitionController";
import type { Cell, GlyphAtlas, GridMetrics, RendererSettings } from "./types";
import type { FrameMetrics } from "../prototype/settings";

type RenderResult = FrameMetrics & {
  error?: string;
};

const FLOATS_PER_INSTANCE = 9;
const MIX_SPEED_SCALE = 0.36;
const CLEAR_COLOR = [0.012, 0.018, 0.018, 1] as const;
const FALLBACK_CELL: Cell = {
  alpha: 1,
  background: [0.012, 0.018, 0.018, 1],
  foreground: [0.44, 0.96, 0.36, 1],
  glyphIndex: 0
};

export class WebGLTerminalSurface {
  private atlas: GlyphAtlas | null = null;
  private atlasTexture: WebGLTexture | null = null;
  private autoProgress: number;
  private autoDirection = 1;
  private cellData = new Float32Array();
  private frame = 0;
  private gl: WebGL2RenderingContext;
  private instanceBuffer: WebGLBuffer;
  private lastFrameTime = performance.now();
  private lastRenderTime = 0;
  private metrics: GridMetrics = {
    cellHeight: 18,
    cellWidth: 10,
    columns: 1,
    devicePixelRatio: 1,
    rows: 1
  };
  private program: WebGLProgram;
  private settings: RendererSettings;
  private vao: WebGLVertexArrayObject;

  constructor(private canvas: HTMLCanvasElement, settings: RendererSettings) {
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      powerPreference: "high-performance",
      stencil: false
    });

    if (!gl) {
      throw new Error("WebGL2 is unavailable in this browser.");
    }

    this.gl = gl;
    this.settings = settings;
    this.autoProgress = settings.mix;
    this.program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
    const geometry = createVertexArray(gl, this.program);
    this.vao = geometry.vao;
    this.instanceBuffer = geometry.instanceBuffer;
    this.gl.clearColor(CLEAR_COLOR[0], CLEAR_COLOR[1], CLEAR_COLOR[2], CLEAR_COLOR[3]);
  }

  destroy() {
    if (this.atlasTexture) {
      this.gl.deleteTexture(this.atlasTexture);
    }
    this.gl.deleteProgram(this.program);
    this.gl.deleteVertexArray(this.vao);
  }

  render(time: number, settings: RendererSettings): RenderResult {
    const effectiveSettings = this.resolveFrameSettings(time, settings);
    this.settings = effectiveSettings;
    this.frame += 1;
    this.ensureSize();
    this.ensureAtlas();

    if (!this.atlas) {
      throw new Error("Glyph atlas failed to initialize.");
    }

    const terminal = createTerminalBuffer(
      this.metrics,
      this.atlas,
      effectiveSettings,
      this.frame
    );
    const cellCount = this.metrics.columns * this.metrics.rows;
    const requiredLength = cellCount * FLOATS_PER_INSTANCE;
    if (this.cellData.length !== requiredLength) {
      this.cellData = new Float32Array(requiredLength);
    }

    let liveSourceAvailable = effectiveSettings.liveSource !== "offline";
    let accumulatedMix = 0;

    for (let row = 0; row < this.metrics.rows; row += 1) {
      for (let column = 0; column < this.metrics.columns; column += 1) {
        const index = row * this.metrics.columns + column;
        const sample = sampleLiveSource(
          column,
          row,
          this.metrics,
          time,
          effectiveSettings.liveSource
        );
        liveSourceAvailable = liveSourceAvailable && sample !== null;
        const live = sample
          ? sampleToAsciiCell(this.atlas, sample, effectiveSettings)
          : FALLBACK_CELL;
        const weight = sample
          ? transitionWeight(column, row, this.metrics, effectiveSettings, time)
          : 0;
        accumulatedMix += weight;
        this.writeCell(
          index,
          composeCells(terminal[index], live, weight, effectiveSettings)
        );
      }
    }

    this.draw(cellCount, time);

    const now = performance.now();
    const frameMs = now - this.lastFrameTime;
    this.lastFrameTime = now;
    const averageMix = cellCount > 0 ? accumulatedMix / cellCount : 0;

    return {
      cellCount,
      columns: this.metrics.columns,
      frame: this.frame,
      frameMs,
      fps: frameMs > 0 ? 1000 / frameMs : 0,
      liveSourceAvailable,
      mix: Number(effectiveSettings.mix.toFixed(3)),
      renderer: "WebGL2",
      rows: this.metrics.rows,
      state: sampleLiveSource(0, 0, this.metrics, time, effectiveSettings.liveSource)
        ? transitionState(averageMix)
        : "terminal"
    };
  }

  private resolveFrameSettings(time: number, settings: RendererSettings): RendererSettings {
    const delta = this.lastRenderTime > 0 ? Math.min(0.08, time - this.lastRenderTime) : 0;
    this.lastRenderTime = time;

    if (!settings.playing) {
      this.autoProgress = settings.mix;
      return settings;
    }

    this.autoProgress +=
      this.autoDirection * delta * settings.revealSpeed * MIX_SPEED_SCALE;

    if (this.autoProgress >= 1) {
      this.autoProgress = 1;
      this.autoDirection = -1;
    }

    if (this.autoProgress <= 0) {
      this.autoProgress = 0;
      this.autoDirection = 1;
    }

    return { ...settings, mix: this.autoProgress };
  }

  private ensureSize() {
    const rect = this.canvas.getBoundingClientRect();
    const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const cellWidth = Math.round(this.settings.cellSize);
    const cellHeight = Math.round(this.settings.cellSize * 1.8);
    const width = Math.max(320, Math.floor(rect.width * devicePixelRatio));
    const height = Math.max(240, Math.floor(rect.height * devicePixelRatio));
    const columns = Math.max(48, Math.floor(width / (cellWidth * devicePixelRatio)));
    const rows = Math.max(24, Math.floor(height / (cellHeight * devicePixelRatio)));

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.gl.viewport(0, 0, width, height);
    }

    const atlasChanged =
      this.metrics.cellWidth !== cellWidth || this.metrics.cellHeight !== cellHeight;

    this.metrics = {
      cellHeight,
      cellWidth,
      columns,
      devicePixelRatio,
      rows
    };

    if (atlasChanged) {
      this.atlas = null;
    }
  }

  private ensureAtlas() {
    if (this.atlas) {
      return;
    }

    this.atlas = createGlyphAtlas(this.metrics.cellWidth, this.metrics.cellHeight);
    const texture = this.atlasTexture ?? this.gl.createTexture();
    if (!texture) {
      throw new Error("Unable to create WebGL glyph texture.");
    }

    this.atlasTexture = texture;
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      this.atlas.canvas
    );
  }

  private writeCell(index: number, cell: Cell) {
    const offset = index * FLOATS_PER_INSTANCE;
    this.cellData[offset] = cell.glyphIndex;
    this.cellData[offset + 1] = cell.foreground[0];
    this.cellData[offset + 2] = cell.foreground[1];
    this.cellData[offset + 3] = cell.foreground[2];
    this.cellData[offset + 4] = cell.foreground[3] * cell.alpha;
    this.cellData[offset + 5] = cell.background[0];
    this.cellData[offset + 6] = cell.background[1];
    this.cellData[offset + 7] = cell.background[2];
    this.cellData[offset + 8] = cell.background[3];
  }

  private draw(cellCount: number, time: number) {
    const gl = this.gl;
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.cellData, gl.DYNAMIC_DRAW);

    setUniform2f(gl, this.program, "uGrid", this.metrics.columns, this.metrics.rows);
    gl.uniform2f(
      gl.getUniformLocation(this.program, "uPerspectiveOrigin"),
      this.settings.revealOrigin.x,
      this.settings.revealOrigin.y
    );
    gl.uniform4f(
      gl.getUniformLocation(this.program, "uPerspective"),
      this.settings.perspectiveEnabled ? 1 : 0,
      this.settings.perspectiveAmount,
      this.settings.perspectiveSkew,
      this.settings.perspectivePull
    );
    gl.uniform4f(
      gl.getUniformLocation(this.program, "uProjection"),
      this.settings.zRippleEnabled ? 1 : 0,
      this.settings.zRippleAmount,
      this.settings.zRippleSpeed,
      this.settings.perspectiveMotion
    );
    gl.uniform1f(
      gl.getUniformLocation(this.program, "uProjectionScatter"),
      this.settings.zRippleScatter
    );
    gl.uniform1f(
      gl.getUniformLocation(this.program, "uScatterEnabled"),
      this.settings.zScatterEnabled ? 1 : 0
    );
    gl.uniform1f(gl.getUniformLocation(this.program, "uTime"), time);
    if (this.atlas) {
      setUniform2f(gl, this.program, "uAtlasGrid", this.atlas.columns, this.atlas.rows);
    }

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.atlasTexture);
    gl.uniform1i(gl.getUniformLocation(this.program, "uAtlas"), 0);

    gl.disable(gl.BLEND);
    gl.uniform1f(gl.getUniformLocation(this.program, "uRenderLayer"), 0);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, cellCount);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.uniform1f(gl.getUniformLocation(this.program, "uRenderLayer"), 1);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, cellCount);
    gl.disable(gl.BLEND);
  }
}

function createVertexArray(gl: WebGL2RenderingContext, program: WebGLProgram) {
  const vao = gl.createVertexArray();
  const quadBuffer = gl.createBuffer();
  const instanceBuffer = gl.createBuffer();
  if (!vao || !quadBuffer || !instanceBuffer) {
    throw new Error("Unable to create WebGL buffers.");
  }

  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]),
    gl.STATIC_DRAW
  );
  const vertexLocation = gl.getAttribLocation(program, "aVertex");
  gl.enableVertexAttribArray(vertexLocation);
  gl.vertexAttribPointer(vertexLocation, 2, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
  const stride = FLOATS_PER_INSTANCE * Float32Array.BYTES_PER_ELEMENT;
  defineAttribute(gl, program, "aGlyph", 1, stride, 0);
  defineAttribute(gl, program, "aFg", 4, stride, 1);
  defineAttribute(gl, program, "aBg", 4, stride, 5);
  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
  return { instanceBuffer, vao };
}

function defineAttribute(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  name: string,
  size: number,
  stride: number,
  floatOffset: number
) {
  const location = gl.getAttribLocation(program, name);
  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(
    location,
    size,
    gl.FLOAT,
    false,
    stride,
    floatOffset * Float32Array.BYTES_PER_ELEMENT
  );
  gl.vertexAttribDivisor(location, 1);
}

function setUniform2f(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  name: string,
  x: number,
  y: number
) {
  gl.uniform2f(gl.getUniformLocation(program, name), x, y);
}

function createProgram(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string
) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!program) {
    throw new Error("Unable to create WebGL program.");
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) ?? "Unable to link WebGL program.");
  }

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  return program;
}

function createShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string
) {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error("Unable to create WebGL shader.");
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) ?? "Unable to compile WebGL shader.");
  }

  return shader;
}

const VERTEX_SHADER = `#version 300 es
in vec2 aVertex;
in float aGlyph;
in vec4 aFg;
in vec4 aBg;

uniform vec2 uGrid;
uniform vec2 uAtlasGrid;
uniform vec4 uPerspective;
uniform vec4 uProjection;
uniform vec2 uPerspectiveOrigin;
uniform float uRenderLayer;
uniform float uScatterEnabled;
uniform float uProjectionScatter;
uniform float uTime;

out vec2 vUv;
out vec4 vFg;
out vec4 vBg;
out float vLift;

float hashCell(vec2 value) {
  return fract(sin(dot(value, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  int columns = int(uGrid.x);
  int cell = gl_InstanceID;
  float column = float(cell % columns);
  float row = floor(float(cell) / uGrid.x);
  vec2 center = (vec2(column, row) + vec2(0.5)) / uGrid;
  float bendMotion = uPerspective.x * uProjection.w;
  float bendClock = uTime * 0.72;
  vec2 animatedOrigin = uPerspectiveOrigin + vec2(
    sin(bendClock * 0.73) * 0.045,
    cos(bendClock * 0.57) * 0.035
  ) * bendMotion;
  vec2 delta = center - animatedOrigin;
  float distanceFromOrigin = length(delta);
  vec2 radial = delta / max(0.001, distanceFromOrigin);
  float bendBreath = 1.0 + bendMotion * (
    sin(bendClock + center.x * 2.8) * 0.16 +
    cos(bendClock * 0.73 + center.y * 3.6) * 0.11
  );
  float effect = uPerspective.x * uPerspective.y * bendBreath;
  float falloff = smoothstep(0.0, 0.82, distanceFromOrigin);
  vec2 local = aVertex - vec2(0.5);
  float rippleRate = mix(0.65, 2.15, clamp(uProjection.z, 0.0, 1.0));
  float rippleWave = sin(distanceFromOrigin * 24.0 - uTime * rippleRate * 2.8);
  float rippleCrest = pow(max(0.0, rippleWave), 4.0);
  float rippleEnvelope =
    smoothstep(0.025, 0.16, distanceFromOrigin) *
    (1.0 - smoothstep(0.72, 1.02, distanceFromOrigin));
  float rippleActive = uProjection.x;
  float scatter = clamp(uProjectionScatter, 0.0, 1.0) * uScatterEnabled;
  float cellSeed = hashCell(vec2(column + aGlyph * 0.37, row - aGlyph * 0.19));
  float cellSeedB = hashCell(vec2(row + aGlyph * 0.11, column + 9.7));
  float cellSeedC = hashCell(vec2(column * 0.41 + row * 1.37, aGlyph + 3.1));
  float pulseClock =
    uTime * rippleRate * mix(1.15, 2.9, cellSeedB) + cellSeed * 6.2831853;
  float pulseShape = mix(9.5, 3.8, scatter);
  float individualPulse = pow(max(0.0, sin(pulseClock)), pulseShape);
  float secondaryPulse =
    pow(max(0.0, sin(pulseClock * mix(0.43, 0.78, cellSeedC) + cellSeedB * 6.2831853)), 7.0);
  float individualLift = max(individualPulse, secondaryPulse * 0.55);
  individualLift *= mix(0.55, 1.35, cellSeedC);
  float rippleLift = rippleCrest * rippleActive;
  float scatterLift = individualLift * scatter;
  float liftShape = max(rippleLift, scatterLift + rippleLift * scatter * 0.18);
  float zLift = uProjection.y * liftShape * rippleEnvelope;
  float layerLift = zLift * step(0.5, uRenderLayer);
  float scale = 1.0 - effect * falloff * 0.22;
  float skew = effect * uPerspective.z * falloff;
  local.x += local.y * delta.x * skew * 0.78;
  local.y -= local.x * delta.y * skew * 0.22;
  local *= 1.0 + layerLift * mix(0.72, 1.06, scatter);

  vec2 pull = delta * falloff * falloff * effect * uPerspective.w * 0.22;
  vec2 tangent = vec2(-delta.y, delta.x) * effect * uPerspective.z * falloff * 0.032;
  vec2 cellDirection = normalize(radial + vec2(
    cos(cellSeed * 6.2831853),
    sin(cellSeedB * 6.2831853)
  ) * scatter * 0.58);
  vec2 jump = cellDirection * layerLift * mix(0.038, 0.052, scatter);
  vec2 gridPosition = center + pull + tangent + jump + (local * scale) / uGrid;
  vec2 clip = vec2(gridPosition.x * 2.0 - 1.0, 1.0 - gridPosition.y * 2.0);
  gl_Position = vec4(clip, 0.0, 1.0);

  float glyphColumn = mod(aGlyph, uAtlasGrid.x);
  float glyphRow = floor(aGlyph / uAtlasGrid.x);
  vUv = (vec2(glyphColumn, glyphRow) + aVertex) / uAtlasGrid;
  vFg = aFg;
  vBg = aBg;
  vLift = zLift;
}
`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform sampler2D uAtlas;
uniform float uRenderLayer;

in vec2 vUv;
in vec4 vFg;
in vec4 vBg;
in float vLift;

out vec4 outColor;

void main() {
  float glyphAlpha = texture(uAtlas, vUv).a * vFg.a;
  float lift = clamp(vLift, 0.0, 1.0);

  if (uRenderLayer > 0.5) {
    float liftAlpha = smoothstep(0.025, 0.18, lift);
    float strokeAlpha = glyphAlpha * liftAlpha;
    if (strokeAlpha < 0.002) {
      discard;
    }
    vec3 liftedGlyph = vFg.rgb + vFg.rgb * lift * 0.56;
    outColor = vec4(liftedGlyph, strokeAlpha);
    return;
  }

  float liftTransfer = smoothstep(0.025, 0.16, lift);
  float baseGlyphAlpha = glyphAlpha * (1.0 - liftTransfer * 0.96);
  vec3 color = mix(vBg.rgb, vFg.rgb, baseGlyphAlpha);
  outColor = vec4(color, 1.0);
}
`;
