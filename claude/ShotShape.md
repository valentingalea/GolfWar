# GolfWar – Envelope Preview Graph Prompt (UI Only)

## Context
The shot profile mechanics are already implemented and working using the ADSR like template: Kick / Hang / Break.

Your task now is to add a **read-only envelope preview graph** to the UI.

This preview must feel like an **instrument/envelope signal**, **not** a trajectory preview and **not** a graph-calculator.

---

## Goals
1. Show an **envelope curve** that changes when the player changes **Kick / Hang / Break**.
2. **Load must NOT change the envelope shape** (Load changes “how much”, the envelope shows “how”).
3. The envelope is **not editable**. Players only change knobs/sliders; the graph updates live.
4. Keep it lightweight, deterministic, and easy to tune.

---

## What the envelope represents
- **X-axis**: shot phases (qualitative, not time/distance)
  - **Launch** → **Flight** → **Impact**
- **Y-axis**: behaviour bias
  - Top: **AIR / CARRY**
  - Bottom: **GROUND / ROLL**

This is a **behaviour envelope** (how the shot’s “character” evolves), not a ballistic arc.

---

## Envelope construction (simple & robust)
Compute three normalized samples and draw a smooth curve through them.

### Control samples (derived from knobs)
- `yLaunch`  ← derived from **Kick**
- `yMid`     ← derived from **Hang**
- `yImpact`  ← derived from **Break**

### Recommended mapping (normalized -1..+1)
Use these defaults (tunable constants):

**Kick → yLaunch**
- Chip  = -0.35
- Full  =  0.00
- Crush = +0.35

**Hang → yMid**
- Punch = -0.45
- Carry =  0.00
- Loft  = +0.45

**Break → yImpact**
- Stick  = -0.40
- Roll   =  0.00
- Bounce = +0.40

> Important: **Load does not affect yLaunch/yMid/yImpact**.

### Shape/smoothing
- Use a simple spline or smooth interpolation:
  - Catmull-Rom spline, or
  - cubic bezier segments, or
  - polyline + smoothing (Canvas)
- Use 5–8 sample points across X and interpolate between (0, yLaunch), (0.5, yMid), (1, yImpact).
- Consider if it's easier using another 3rd party library and ask the user.

### Suggested endpoint handling
To avoid “trajectory arc” vibes, anchor the ends slightly toward neutral:
- Use implicit endpoints near 0:
  - P0 at x=0, y = mix(0, yLaunch, 0.85)
  - P4 at x=1, y = mix(0, yImpact, 0.85)

Or just draw through the three samples but avoid a “parabola” look by keeping the mid point dominant.

---

## UI requirements (presentation)
- Implement as **Canvas** or **SVG**.
- A small panel within your existing UI module.
- Live updates when Kick/Hang/Break change.
- No numbers, no predicted arc, no distance readouts.

### Labels (qualitative)
- Y label: **AIR** at top, **GROUND** at bottom (or “CARRY / ROLL”).
- X labels: **Launch**, **Flight**, **Impact**.
- Add a caption like: **“Behaviour Envelope (not trajectory)”** *(small, unobtrusive)*.

### Styling guidance
- Avoid a clean math graph grid.
- Prefer:
  - segmented phase bands (3 vertical bands)
  - light tick marks only
  - an “instrument panel” vibe
- Keep it readable and minimal.

---

## Implementation notes
- The envelope preview is **UI-only**; physics code should **not** read from it.
- Centralize mapping values in one place so tuning is easy.
  - e.g. `const ENVELOPE_MAP = { kick: {...}, hang: {...}, break: {...} }`
- Add a single function:
  - `computeEnvelopePoints(kick, hang, brk)` → array of points in normalized space
  - `renderEnvelope(points)` draws them

---

## Sanity checks
- Changing **Kick** moves the left (launch) part of the curve.
- Changing **Hang** moves the middle part of the curve the most.
- Changing **Break** moves the right (impact) end of the curve.
- Changing **Load** does **nothing** to the envelope.
- The curve does not resemble a ballistic parabola; it reads like a signal/envelope.

---

## Deliverables
- Add the envelope preview panel to the Action panel of the "Setup Projectile" UI.
