# Terminal ASCII Live Renderer Design Specification

## Document Control

| Field | Value |
| --- | --- |
| Title | Terminal ASCII Live Renderer Prototype |
| Status | Draft |
| Rigor level | `R0 Discovery` |
| Rigor justification | The requested outcome is a prototype to retire rendering and interaction uncertainty. Failure is acceptable if the prototype identifies why the terminal-to-live-content illusion does or does not work. |
| Author(s) | Codex |
| Reviewers | Product/design reviewer, frontend/rendering engineer |
| Decision owner | Project owner |
| Target milestone or release | Prototype review |
| Last updated | 2026-04-24 |
| Related docs | Chat discussion on Skills Directory ASCII/WebGL effect |
| Related tickets | N/A |

## 0. Executive Summary

Decision requested: Approve for experiment

Problem summary: The product concept is unable to make terminal text appear to become live visual content because the rendering model has not been validated, resulting in uncertainty about whether the transition can feel seamless rather than like a mode switch.

Proposed outcome: A browser prototype demonstrates a terminal grid whose cells transition from semantic terminal text into ASCII-rendered live content while preserving the same font, spacing, grid, and visual language.

Why now: The observed Skills Directory effect proves that video-to-ASCII rendering is visually compelling, but the next product decision depends on whether the same mechanism can support live content without breaking terminal continuity.

Top risks or unknowns:

- `RISK-1`: A perceptible renderer switch may break the illusion.
- `RISK-2`: Real-time glyph selection may lose too much detail at terminal cell density.
- `RISK-3`: A real terminal integration may constrain animation timing, selection, accessibility, or scrollback.

Section status: Complete

## Layer 1: Problem and Requirements

## 1. Problem Definition

Problem declaration: The prototype team is unable to evaluate the terminal-comes-alive interaction because the current concept exists only as a description and a reference site analysis, resulting in unresolved uncertainty about whether semantic terminal cells and live ASCII cells can occupy the same visual system.

Affected actors or systems: Product owner, interface designer, frontend renderer, future terminal users.

Current-state baseline: Estimated from 1 reference implementation inspection on 2026-04-24: the reference site renders pre-recorded MP4 content through a WebGL ASCII shader, but it does not render live semantic terminal content.

Evidence or source: Direct inspection of `https://www.skillsdirectory.com` and its client bundles on 2026-04-24 showed MP4 inputs, hidden video elements, WebGL texture sampling, a glyph atlas, and brightness-to-character mapping.

Consequence of inaction: Without a prototype, design decisions may overfit to a video-background effect and miss the stricter continuity requirements of an interactive terminal.

Decision deadline or trigger: Decide after a first prototype review whether to continue toward a durable renderer, pivot to a simpler effect, or abandon the interaction.

Section status: Complete

## 2. Objectives and Non-Objectives

| ID | Statement | Measurement or decision horizon |
| --- | --- | --- |
| OBJ-1 | The prototype shall demonstrate a normal-looking terminal grid that can transition into live ASCII-rendered content without changing font, cell spacing, or renderer surface. | Prototype review |
| OBJ-2 | The prototype shall validate whether the live ASCII state remains legible enough to read as intentional content at common terminal densities. | Prototype review |
| OBJ-3 | The prototype shall identify the minimum rendering architecture needed for semantic terminal cells and sampled live cells to coexist. | Prototype review |
| NG-1 | The prototype will not implement a full terminal emulator backend. | Prototype review |
| NG-2 | The prototype will not depend on glow, scanlines, color bloom, or fever-dream effects to sell the core transition. | Prototype review |
| NG-3 | The prototype does not include production accessibility, copy/paste, remote shell execution, or scrollback guarantees. | Prototype review |

Section status: Complete

## 3. Stakeholders and Decision Authorities

| Stakeholder or role | Interest | Required action |
| --- | --- | --- |
| Project owner | Decide whether the interaction is worth continued investment. | Approve |
| Product/design reviewer | Evaluate whether the illusion matches the intended experience. | Review |
| Frontend/rendering engineer | Evaluate feasibility, performance, and implementation path. | Review |

Decision owner: Project owner

Required reviewers: Product/design reviewer, frontend/rendering engineer

Consulted domains: Accessibility consultation is deferred until the prototype proves the interaction.

Section status: Complete

## 4. Constraints, Invariants, and Assumptions

| ID | Type | Statement | Source or rationale | Validation or resolution plan |
| --- | --- | --- | --- | --- |
| CON-1 | Constraint | The normal terminal state and live ASCII state shall use the same visible grid, font metrics, and canvas surface. | Terminal continuity is the core uncertainty the prototype must test. | `VAL-4` verifies shared grid metrics during terminal and live states. |
| CON-2 | Constraint | The default transition shall not rely on additional visual language such as heavy glow, bloom, scanline distortion, or chromatic effects. | The experiment must validate renderer continuity before optional effects can mask defects. | `VAL-6` records the default transition with optional effects disabled. |
| CON-3 | Constraint | The prototype shall run locally in a browser using client-side rendering. | The prototype is intended for local design review without backend infrastructure. | Prototype review confirms no backend service is required to run the demo. |
| ASM-1 | Assumption | Browser WebGL is available for the prototype audience. | The inspected reference effect depends on browser GPU rendering, and the prototype audience is expected to use modern desktop browsers. | At prototype kickoff, the frontend/rendering engineer confirms target browser support or records a fallback Canvas 2D plan. |
| ASM-2 | Assumption | A simulated terminal buffer is sufficient to validate the illusion before integrating a real PTY or terminal emulator. | `NG-1` excludes a full terminal emulator from R0 scope. | `SM-1`, `SM-2`, `SM-5`, and `KC-3` determine at prototype review whether simulation answered the continuity question without requiring production-terminal features. |
| ASM-3 | Assumption | Live content can initially be a procedural canvas or WebGL scene rather than arbitrary DOM capture. | `ALT-3` defers DOM capture to avoid browser capture complexity before the core transition is validated. | `Q-1` selects the first live source at prototype kickoff, and `VAL-5` verifies that the selected source changes over time. |

Section status: Complete

## 5. Requirements

| ID | Type | Priority | Requirement statement | Rationale | Verification |
| --- | --- | --- | --- | --- | --- |
| REQ-1 | Functional | Must | The renderer shall draw terminal text and live ASCII content through one shared glyph atlas and grid coordinate system. | A shared renderer surface is required to test whether terminal and live cells can occupy one visual system. | `VAL-4` |
| REQ-2 | Functional | Must | The prototype shall support at least one transition from semantic terminal cells to sampled live-content cells. | The experiment cannot answer the terminal-comes-alive question without an observable ownership transition. | `VAL-6` |
| REQ-3 | Functional | Must | The transition shall preserve terminal visual continuity by keeping cell size, font, baseline, and background treatment stable by default. | The core illusion depends on continuity rather than a visible renderer swap. | `VAL-4`, `VAL-6` |
| REQ-4 | Functional | Must | The prototype shall render a live source that changes over time instead of using pre-rendered video as the only source. | The target product behavior requires live content, not only replayed media. | `VAL-5`, `VAL-9` |
| REQ-5 | Functional | Must | The prototype shall expose tunable transition parameters for mix, reveal shape, glyph density, color adoption, cell size, transition mode, reveal origin, and live source. | Tunable controls are required to evaluate which mechanisms affect continuity and legibility. | `VAL-8`, `VAL-9` |
| REQ-6 | Operability | Should | The prototype shall report frame timing during terminal, transition, and live states during the demo. | Reviewers need a visible performance signal to distinguish visual failure from frame-time failure. | `VAL-7` |

Section status: Complete

## 6. Success Measures and Kill Criteria

| Measure | Baseline | Target or decision threshold | Evaluation date or decision event | Related IDs |
| --- | --- | --- | --- | --- |
| `SM-1`: Terminal recognition | Current concept is a written description with 0 working prototype frames. | Continue if both required reviewers identify the pre-transition viewport as a conventional terminal before being told the effect goal. | Prototype review | `OBJ-1`, `REQ-1`, `REQ-3` |
| `SM-2`: Transition continuity | Current concept has 0 observed terminal-to-live transitions. | Continue if both required reviewers describe the default transition as terminal content becoming live rather than a hard switch; pivot if either reviewer identifies a renderer surface swap. | Prototype review | `OBJ-1`, `REQ-2`, `REQ-3` |
| `SM-3`: Live-state legibility | Current concept has 0 live-source samples at terminal cell density. | Continue if both required reviewers identify the live source as intentional animated content at one practical terminal density; stop if every tested density reads as noise. | Prototype review | `OBJ-2`, `REQ-4`, `REQ-5`, `VAL-9` |
| `SM-4`: Preview performance | Current concept has no frame timing signal. | Continue if frame timing is visible or logged for terminal, transition, and live states with no recorded transition interval above 100 ms for more than 1 consecutive second; pivot if the threshold is missed. | Prototype review | `REQ-6` |
| `SM-5`: Mechanism isolation | Current concept does not identify which mechanisms are necessary. | Continue if both required reviewers can name at least one control that materially affects continuity; pivot if only decorative effects make the transition acceptable. | Prototype review | `OBJ-3`, `REQ-5` |
| `KC-1`: Effect masking kill criterion | Optional effects are not required in the current concept. | Stop if the transition only works when heavy visual effects hide the renderer change. | Prototype review | `OBJ-1`, `REQ-3` |
| `KC-2`: Legibility kill criterion | Current concept has no measured legibility at terminal density. | Stop if the live content cannot be read as intentional at practical terminal cell densities. | Prototype review | `OBJ-2`, `REQ-4`, `VAL-9` |
| `KC-3`: Integration-cost kill criterion | Full terminal emulator integration is out of R0 scope. | Stop if maintaining the illusion requires production-terminal features before the core visual question can be answered. | Prototype review | `OBJ-3`, `NG-1` |

Section status: Complete

## 7. System Context and External Interfaces

System context: The prototype is a browser-rendered interface with a simulated terminal buffer and a live visual source rendered into a texture or canvas.

External interfaces:

- Browser rendering APIs: Canvas 2D, WebGL or WebGPU.
- Optional future interface: xterm.js or a custom PTY-backed terminal adapter.
- Optional future input source: live media stream, WebGL scene, app viewport, or procedural field.

Section status: Complete

## Layer 2: Externally Visible Behavior

## 8. Operational Scenarios and Functional Behavior

| ID | Trigger | Preconditions | Behavior or outcome | Related requirements |
| --- | --- | --- | --- | --- |
| FLOW-1 | Prototype loads. | Local browser can run the prototype. | A user sees a normal terminal prompt and simulated command output. | `REQ-1`, `REQ-3` |
| FLOW-2 | User command or timed event starts, such as `render ./scene`. | Terminal state is visible and a live source is available. | The output region begins a per-cell transition from semantic terminal cells to live sampled ASCII cells. | `REQ-2`, `REQ-3` |
| FLOW-3 | Transition progress advances. | The output region is transitioning to live ownership. | Cells convert according to the transition map while grid metrics and renderer surface remain stable. | `REQ-1`, `REQ-2`, `REQ-3` |
| FLOW-4 | Live mode is active. | The transition to live ownership has completed. | The live source animates while still appearing to occupy the original terminal grid. | `REQ-1`, `REQ-4` |
| FLOW-5 | Return-to-terminal command or timed event starts. | Live mode is active and semantic terminal content is still available. | The scene returns to normal terminal text without a visible renderer surface swap. | `REQ-1`, `REQ-3` |
| FUNC-1 | Terminal state is active. | No transition is running. | The terminal state displays stable monospaced text, prompt, cursor, and output cells. | `REQ-1`, `REQ-3` |
| FUNC-2 | Live state is active. | Live source texture or canvas is available. | The live state displays animated content represented by terminal glyphs on the same grid. | `REQ-1`, `REQ-4` |
| FUNC-3 | Transition controls are changed. | Transition controls are visible. | Mix, reveal shape, glyph density, color adoption, cell size, transition mode, reveal origin, and live source each visibly affect the rendered output while the renderer surface remains unchanged. | `REQ-5` |
| FUNC-4 | Default visual mode is selected. | Optional effects are disabled. | Optional effects remain disabled by default and can be layered after the core transition succeeds. | `REQ-3` |

Section status: Complete

## 9. State Model, Faults, and Misuse Cases

State model:

- `STATE-1`: `terminal` - cells are produced by the semantic terminal buffer.
- `STATE-2`: `transitioning-to-live` - cells blend semantic and sampled sources using a transition map.
- `STATE-3`: `live-ascii` - cells are produced primarily from the live source.
- `STATE-4`: `transitioning-to-terminal` - cells return to semantic terminal ownership.

Faults:

- `RISK-4`: Live source texture fails or is unavailable.
- `RISK-5`: Glyph atlas metrics mismatch the intended terminal metrics.
- `RISK-6`: Transition timing produces flicker, shimmer, or unreadable intermediate states.

Misuse cases:

- Treating arbitrary DOM capture as the first live source may introduce avoidable browser and security complexity.
- Adding cinematic effects before renderer continuity is proven may mask defects rather than solve them.

Section status: Complete

## 10. External Service Levels and Acceptance Cases

Service levels:

- The prototype shall target visually smooth animation in a modern desktop browser.
- The prototype shall prefer continuity and legibility over maximum detail.

| ID | Acceptance case |
| --- | --- |
| ACC-1 | Given the prototype is loaded, when no transition is active, then the viewport appears to be a conventional terminal. |
| ACC-2 | Given a transition is triggered, when cells convert to live content, then the grid dimensions and font metrics remain unchanged. |
| ACC-3 | Given live mode is active, when the source animation changes, then the displayed glyphs update without using a pre-rendered MP4 as the only source. |
| ACC-4 | Given return-to-terminal is triggered, when the transition completes, then semantic terminal text is restored on the same renderer surface. |
| ACC-5 | Given the prototype is running, when terminal, transition, or live states are active, then a frame-timing signal is visible or logged for review. |
| ACC-6 | Given the prototype controls are visible, when mix, reveal shape, glyph density, color adoption, cell size, transition mode, reveal origin, and live source are each changed, then the rendered output visibly changes in the corresponding dimension without switching renderer surfaces. |

Section status: Complete

## 11. Requirements-to-Behavior Traceability

| Requirement | Behavior | Acceptance |
| --- | --- | --- |
| REQ-1 | FUNC-1, FUNC-2 | ACC-1, ACC-2 |
| REQ-2 | FLOW-2, FLOW-3 | ACC-2 |
| REQ-3 | FUNC-1, FUNC-2, FUNC-4 | ACC-1, ACC-2 |
| REQ-4 | FLOW-4, FUNC-2 | ACC-3 |
| REQ-5 | FUNC-3 | ACC-6 |
| REQ-6 | FLOW-3, FLOW-4 | ACC-5 |

Section status: Complete

## Layer 3: Architecture and Verification

## 12. Architecture Overview

Proposed architecture: Use a single browser rendering surface that draws a terminal-sized grid from multiple cell sources. The normal terminal source emits semantic glyph/color cells. The live source emits sampled glyph/color cells derived from a changing texture. A compositor chooses or blends the cell outputs according to a transition map.

Core components:

- `TerminalBuffer`: simulated rows, columns, glyphs, foreground colors, background colors, cursor, and output regions.
- `GlyphAtlas`: pre-rendered monospace glyph texture with stable metrics.
- `LiveSource`: procedural canvas, WebGL scene, or other changing texture source.
- `AsciiSampler`: maps live texture samples to glyph indices and colors.
- `CellCompositor`: resolves terminal cells, live cells, and transition weights into final drawable cells.
- `TransitionController`: drives source mix, reveal origin, reveal shape, and timing.
- `Renderer`: draws final cells to the canvas or WebGL surface.

Section status: Complete

## 13. Technical Mechanisms and Allocation

| ID | Mechanism | Allocation |
| --- | --- | --- |
| TECH-1 | Generate a glyph atlas from the exact monospace font used by both terminal and live ASCII rendering. | `GlyphAtlas` |
| TECH-2 | Maintain a fixed cell grid with measured cell width, cell height, baseline, and device-pixel-ratio handling. | `Renderer` |
| TECH-3 | Represent terminal content as cell records rather than DOM nodes. | `TerminalBuffer` |
| TECH-4 | Render or upload a live procedural source into a texture every frame. | `LiveSource` |
| TECH-5 | Convert sampled luminance, color, and optional edge/motion signals into glyph and color choices. | `AsciiSampler` |
| TECH-6 | Blend ownership per cell using deterministic transition weights rather than replacing the whole renderer. | `CellCompositor` |
| TECH-7 | Drive transitions from semantic anchors such as cursor position, command output block, or pane rectangle. | `TransitionController` |

Section status: Complete

## 14. Data, Schemas, and Compatibility

Data model:

```ts
type Cell = {
  glyphIndex: number;
  foreground: [number, number, number, number];
  background: [number, number, number, number];
  alpha: number;
};

type TerminalCell = Cell & {
  semanticChar: string;
  isCursor?: boolean;
  regionId?: string;
};

type TransitionCell = {
  terminal: TerminalCell;
  live: Cell;
  mix: number;
};
```

Compatibility: No persisted schema, API contract, or migration is required for the prototype.

Section status: Complete

## 15. Control Logic and Non-Functional Controls

Control logic:

- The prototype shall keep terminal and live outputs aligned to the same cell grid.
- The transition shall be controlled by a scalar global progress plus a per-cell reveal map.
- The default renderer shall avoid post-processing that materially changes the terminal aesthetic.

Non-functional controls:

- Performance visibility: display or log approximate frame timing.
- Visual continuity control: expose controls for mix, reveal shape, glyph density, color adoption, cell size, transition mode, reveal origin, and live source.
- Degradation control: if the live source fails, remain in terminal mode and show a local error indicator outside the terminal illusion.

Section status: Complete

## 16. Observability, Operations, Rollout, Rollback

Observability:

- `VAL-1`: Capture frame timing during terminal, transition, and live states.
- `VAL-2`: Capture screenshots or video clips of the three states for review.
- `VAL-3`: Record reviewer notes on whether a renderer switch is perceptible.

Operations: The prototype runs locally and does not require backend infrastructure.

Rollout: Share as a local demo or static browser prototype.

Rollback: Revert to the prior static design discussion if the prototype fails the kill criteria.

Section status: Complete

## 17. Verification Strategy and Behavior-to-Mechanism Traceability

Verification strategy:

- `VAL-4`: Visual inspection verifies that terminal and live states share grid metrics. Related IDs: `REQ-1`, `REQ-3`, `FUNC-1`, `FUNC-2`, `ACC-1`, `ACC-2`.
- `VAL-5`: A live procedural source verifies the renderer is not dependent on pre-rendered video. Related IDs: `REQ-4`, `FUNC-2`, `ACC-3`.
- `VAL-6`: Transition recordings verify whether conversion reads as terminal text coming alive. Related IDs: `REQ-2`, `REQ-3`, `FUNC-4`, `ACC-2`, `ACC-4`.
- `VAL-7`: Basic frame timing verifies whether the prototype is interactive enough for design review. Related IDs: `REQ-6`, `ACC-5`.
- `VAL-8`: Control exercise verifies that mix, reveal shape, glyph density, color adoption, cell size, transition mode, reveal origin, and live source each produce the expected visible change on the shared renderer surface. Related IDs: `REQ-5`, `ACC-6`.
- `VAL-9`: Reviewer legibility exercise verifies whether both required reviewers can identify the live source as intentional animated content at one practical terminal density, and records the tested densities when every density reads as noise. Related IDs: `OBJ-2`, `SM-3`, `KC-2`, `RISK-2`, `REQ-4`, `REQ-5`, `FUNC-2`, `ACC-3`.

| Requirement | Verification |
| --- | --- |
| REQ-1 | VAL-4 |
| REQ-2 | VAL-6 |
| REQ-3 | VAL-4, VAL-6 |
| REQ-4 | VAL-5, VAL-9 |
| REQ-5 | VAL-8, VAL-9 |
| REQ-6 | VAL-7 |

| Behavior | Mechanism | Verification |
| --- | --- | --- |
| FUNC-1 | TECH-1, TECH-2, TECH-3 | VAL-4 |
| FUNC-2 | TECH-1, TECH-2, TECH-4, TECH-5 | VAL-5, VAL-9 |
| FUNC-3 | TECH-2, TECH-4, TECH-5, TECH-6, TECH-7 | VAL-8 |
| FUNC-4 | TECH-6 | VAL-6 |
| ACC-3 | TECH-4, TECH-5 | VAL-5, VAL-7, VAL-9 |
| ACC-6 | TECH-2, TECH-4, TECH-5, TECH-6, TECH-7 | VAL-8 |

Section status: Complete

## 18. Alternatives, Risks, Open Questions, Final Exit

Alternatives considered:

- `ALT-1`: Render terminal in DOM or xterm.js and overlay a separate ASCII canvas. Rejected for the core prototype because it increases the chance of a perceptible mode switch.
- `ALT-2`: Use only pre-rendered video input. Rejected because the target behavior requires live content.
- `ALT-3`: Start with arbitrary DOM-to-ASCII capture. Deferred because it adds browser capture complexity before the core transition is validated.

Risks:

| ID | Risk | Mitigation |
| --- | --- | --- |
| RISK-1 | Renderer switch is perceptible. | Use one rendering surface and shared glyph atlas from the first prototype. |
| RISK-2 | Live content loses semantic clarity at terminal density. | Use `VAL-9` to test multiple glyph sets, contrast mappings, and source compositions at practical terminal densities. |
| RISK-3 | Real terminal requirements constrain animation. | Prototype with a simulated buffer first, then evaluate terminal integration separately. |
| RISK-4 | Live source texture fails or is unavailable. | Remain in terminal mode and show a local error indicator outside the terminal illusion. |
| RISK-7 | Performance is insufficient. | Keep source simple, measure frame timing, and move expensive operations into GPU passes where needed. |

Open questions:

| ID | Question | Owner | Due date | Resolution plan |
| --- | --- | --- | --- | --- |
| Q-1 | Which live content source best proves the effect: procedural scene, canvas animation, or app preview? | Project owner | Prototype kickoff | Select one source before implementation begins. |
| Q-2 | Which glyph set best balances normal terminal credibility and live-content detail? | Frontend/rendering engineer | Prototype review | Compare at least two glyph sets during review. |
| Q-3 | Should the first transition originate from cursor, command output block, or full pane? | Product/design reviewer | Prototype kickoff | Choose one default reveal anchor and keep others as tunables. |

Final readiness statement: This document is ready to support an `R0 Discovery` prototype. It is not ready to approve production implementation because real terminal integration, accessibility behavior, input handling, and operational constraints remain intentionally deferred.

Section status: Complete
