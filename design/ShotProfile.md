# GolfWar – Shot Profile Integration Prompt

## Concept

Your task is to **replace numeric projectile controls (velocity/mass)** with a **discrete, expressive shot-profile system** based on:
- Kick / Hang / Break (3-way each)
- Charge (3-way)
- One standardized ball (fixed mass)

This features tries to introduce more nuanced controls to setting up a shot. It's inspired from the ADSR audio concept but omitting Sustain so: Attack is "Kick", Delay is "Hang", and Release is "Break".

All this applies for the "Setup Projectile" phase.

---

## 1) Design Goals
- Replace numeric **velocity** and **mass** inputs with discrete 3-way controls:
  - **Charge:** Light / Standard / Heavy
  - **Kick:** Chip / Full / Crush
  - **Hang:** Punch / Carry / Loft
  - **Break:** Stick / Roll / Bounce
- Ball/shell is **standardized**:
  - Fixed mass
  - No player-facing mass choice
- Keep the simulation **simple, deterministic, and predictable**.
- No complex aerodynamics, spin, or Magnus effects.
- Each choice must affect a **distinct phase**:
  1. Launch → Kick + Charge
  2. Flight → Hang
  3. Ground → Break

---

## 2) Architecture Change: Shot Profile
Introduce a helper such as `getShotProfile()` that reads the UI controls and returns a **small, explicit profile object**.

### Required Fields
- `speed` – baseSpeed × chargeMult × kickMult
- `kickPitch` – small vertical bias applied at launch
- `airDragK` – exponential air-drag coefficient per second
- `restitution` – baseline bounce restitution
- `friction` – baseline ground friction
- `mass` – fixed constant (same for all shots)

Keep all tuning constants and their defaults in the Config module.

---

## 3) Suggested Discrete Values (Starting Point)

### Charge (energy budget)
- Light: `0.85`
- Standard: `1.00`
- Heavy: `1.20`

### Kick (launch character)
- Chip: speed × `0.92`, pitch `-0.04`
- Full: speed × `1.00`, pitch `0`
- Crush: speed × `1.08`, pitch `+0.05`

*(Pitch bias is subtle; never dominates ballistic arc.)*

### Hang (in-air behaviour)
Applied as simple exponential drag:
- Punch: `airDragK = 0.12`
- Carry: `airDragK = 0.08`
- Loft: `airDragK = 0.05`

### Break (ground behaviour)
- Stick: restitution `0.12`, friction `0.55`
- Roll: restitution `0.30`, friction `0.35`
- Bounce: restitution `0.60`, friction `0.18`

Optional coupling:
- Heavy charge slightly increases restitution (+~5%)
- Light charge slightly reduces restitution (-~3%)

---

## 4) Launch Integration (Kick + Charge)
In `fire()`:
- Stop reading numeric velocity/mass inputs.
- Call `getShotProfile()`.
- Apply `kickPitch` to the firing direction (addScaledVector(up, kickPitch), then normalize).
- Apply `speed` to projectile velocity.
- Store per-shot parameters on the projectile instance:
  ```js
  proj.shot = { airDragK, restitution, friction };
  ```
- Set projectile mass to the fixed ball mass.

---

## 5) Flight Integration (Hang)
In `update(dt)` during `flying` and `bouncing`:
- After gravity integration, apply air drag:
  ```js
  v *= exp(-airDragK * dt)
  ```
- No lift or spin required.
- Behaviour must remain stable and predictable.

---

## 6) Bounce & Ground Integration (Break)
In the bounce logic:
- Use `proj.shot.restitution` and `proj.shot.friction` as the base material response.
- You may keep the existing `speedFactor` dampener (fast impacts bounce less) if it improves stability, but it must **multiply**, not replace, Break restitution.
- Remove or neutralize mass-based scaling (mass is fixed).

Optional:
- Subtly modulate rolling friction using Break so:
  - Stick stops sooner
  - Bounce rolls/slides longer

Do not destabilize the current rolling behaviour.

---

## 7) UI Changes
Replace numeric inputs with 4 discrete 3-way controls:
- `chargeInput`
- `kickInput`
- `hangInput`
- `breakInput`

Implementation notes:
- Use sliders or segmented buttons initially.
- Defaults: Full / Carry / Roll / Standard.
- Remove old numeric inputs
- Add a permanent read-only Debug UI summary line "Last Shot":
  > Charge: Standard | Kick: Full | Hang: Carry | Break: Roll

---
