# Terrain Sculpt App Context

This file summarizes the work done so far in this repository (`codex` folder) so a new agent can pick up quickly.

## Project setup
- Bundler: Vite vanilla JS.
- Dependency: `three`.
- Node requirement: Vite requires Node 20+; Node 18 will fail at `npm run dev`.
- Entry: `index.html` + `src/main.js` + `src/style.css`.

## Current features (MVP)
- 3D sculptable terrain (tessellated plane) with OrbitControls.
- Tools: Sculpt (raise/lower), Smooth, Flatten.
- Brush controls: Size, Strength, Falloff.
- UI panel with tool buttons, sliders, toggles, resolution selector.
- Reference image overlay: load image, projected or flat decal, opacity/scale/rotation/offset controls.
- Export heightmap: Float32 raw or Uint16 raw (Uint16 normalized from 0..max height).
- Brush previews: size ring, strength inner ring, falloff curve arc facing camera.
- Max height readout (tracks highest terrain point).

## Controls
- Left drag: sculpt (hold Shift to lower).
- Right drag: orbit camera.
- Wheel: zoom.
- Ctrl + wheel: change brush size (blocks zoom when modifier held).
- Shift + wheel: change brush strength (blocks zoom when modifier held).
- Alt + wheel: change brush falloff (blocks zoom when modifier held).
- Keys: `1` sculpt, `2` smooth, `3` flatten, `R` reset.

## File map
- `index.html`: UI layout for HUD/panel, controls, reference section, export selector.
- `src/style.css`: custom UI theme and layout.
- `src/main.js`: scene setup, sculpt logic, raycast, overlays, export, input handling.
- `src/config.js`: constants for tuning (terrain size, brush scaling, preview sizes, export epsilon).

## Implementation notes
- Terrain is `PlaneGeometry` rotated flat; vertex Y values are sculpted.
- Sculpt uses radial falloff: `influence = (1 - dist / radius) ** falloff`.
- Strength multiplier: `BRUSH_STRENGTH_SCALE` from `src/config.js`.
- Smooth tool averages 3x3 neighbor heights within brush region.
- Flatten lerps vertex heights to `flattenHeight` captured on pointer down.
- Overlay projection uses a textured mesh over the same geometry, with polygon offset.
- Flat overlay is a separate plane slightly above terrain.
- Export uses row-major array order of vertex heights.
- Max height recomputed after each brush operation and reset.
- Falloff preview arc is camera-facing via per-vertex direction using camera->hitPoint vectors.

## Known constraints / TODO ideas
- Vite requires Node 20+; if you need Node 18 support, downgrade Vite or use another bundler.
- Terrain size and brush ranges are hardcoded in `src/config.js`.
- Possible future enhancements: undo/redo, save/load heightmaps, brush presets, texture painting.

## Commit history (high level)
- Initial terrain sculpt prototype.
- Reference image overlay with projected/flat modes.
- Height export with Float32/Uint16 options + max height readout.
- Modifier wheel controls for brush params.
- Config module for tuning constants.
- Falloff preview visualization refinement.
