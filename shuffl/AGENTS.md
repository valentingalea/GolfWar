# AGENTS.md

## Project: Shuffleboard Table – Three.js + Lightweight Physics

### Purpose
This project is an interactive **3D shuffleboard table prototype** built in **Three.js**, with a **physically-motivated puck slide simulation** for experimentation and tuning.

The goal is **visual + interaction fidelity**, not a full rigid-body game engine.

---

## How to run (important)
This is a **static site** meant to run via HTTP (not `file://`).

Recommended local run:
```bash
python -m http.server 8000
```

Then open:
```
http://localhost:8000
```

This is required for:
- ES module imports
- Three.js import maps
- stable browser behavior

---

## Deployment
- Designed to work on **GitHub Pages**
- No build step, no bundlers

---

## Tech stack
- **Three.js** (via CDN + importmap)
- **OrbitControls**
- **cannon-es** (physics)
- Plain HTML / JS (no framework)

---

## Coordinate system (critical)
- **Y** = up (vertical)
- **Z** = along the table length (down-table direction)
- **X** = table width (left/right)

A **3D axis tripod** is intentionally placed near the starting area:
- X = red
- Y = green
- Z = blue

This is a debugging aid and **must not be removed**.

---

## Camera
- Camera starts near the **player / starting end**
- Looks **down the table**
- OrbitControls enabled
- Zoom behavior must remain smooth (no min/max regressions)

Avoid locking or over-constraining camera controls.

---

## Table model
- Scale approximates a **22-foot regulation shuffleboard table**
- Key elements:
  - Playfield slab
  - Side gutters
  - Rails
  - End bumpers
  - Scoring lines (drawn, not textured)
- **No texture projection** (removed intentionally)

---

## Pucks
- Visual pucks are Three.js meshes
- One **active puck** (the starting puck) is physics-driven
- Other pucks are static reference props

The active puck:
- starts **resting visibly on the table**
- must be visible immediately on page load
- must not move unless **Start** is pressed

---

## Physics model (important lessons learned)

### Engine
- `cannon-es`

### Shape choice
- **DO NOT use Cylinder shapes** (orientation instability)
- Use a **thin Box shape** to approximate a puck

### Known failure modes to avoid
- Initial interpenetration → puck explodes upward
- Wrong plane normal → puck falls forever
- Y-motion allowed → puck launches vertically
- Over-large impulses → tunneling / teleporting

### Table plane
- Infinite plane
- Must have normal pointing **+Y**
- Carefully rotated with quaternion

---

## Debug UI (must remain)
On-screen debug panel includes:
- Gravity (numeric input)
- Puck mass
- Friction coefficient
- Initial impulse magnitude
- **Start** button
- **Reset** button (reloads page)

Live readout shows:
- puck position
- puck velocity
- speed
- current physics parameters
- last applied impulse vector

This UI is essential for iteration and must not be removed.

---

## Interaction flow
1. Page loads
2. Puck is visible and stationary
3. User tweaks parameters
4. User presses **Start**
5. Impulse is applied along **+Z**
6. Puck slides down the table

No automatic timers.

---

## What Codex should NOT do
- ❌ Do not remove debug helpers
- ❌ Do not “optimize” physics without validation
- ❌ Do not change coordinate conventions

---

## What Codex MAY do
- Improve stability while preserving behavior
- Tune friction / damping values
- Improve visual clarity
- Add **optional toggles** (never remove defaults)
- Add comments explaining tricky sections

---

## Regression policy
If a change causes:
- puck not visible at load
- camera zoom broken
- vertical puck launch
- scene not rendering

→ **Revert immediately**.

---

## Notes for future work
- Optional: toggle between 2D-locked vs full 3D physics
- Optional: collision with side rails
- Optional: impulse direction arrow visualization

But always keep the **current debug-first approach** intact.
