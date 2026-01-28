# Claude Context Recovery - GolfWar Artillery Golf Prototype

This document serves as a comprehensive context dump to help Claude (or future AI assistants) quickly understand the codebase after full context loss.

## Quick Overview

**Project**: GolfWar - Artillery Golf game prototype
**Location**: `/mnt/c/Dev/AI/GolfWar/claude/`
**Tech Stack**: Three.js (v0.160.0) + Vanilla JavaScript + ES Modules
**Entry Point**: `index.html` - no build step required, runs directly in browser

**Concept**: Golf but with howitzer cannons instead of clubs. Players fire giant ball projectiles, observe trajectories with binoculars/drone view, then navigate to the landing position for the next shot. Scale is larger than real golf.

## Project Structure

```
GolfWar/
├── Concept.md          # High-level game concept
├── Gameplay.md         # Detailed gameplay stages design
└── claude/             # Three.js web prototype (THIS FOLDER)
    ├── index.html      # Main entry, orchestrates all modules, animation loop
    ├── config.js       # Centralized game configuration
    ├── game-state.js   # 6-stage state machine
    ├── cannon.js       # Howitzer model, controls, firing animation
    ├── mortar.js       # M252 mortar model, controls, firing animation
    ├── projectile.js   # Weapon-agnostic projectile physics system
    ├── Mortar.md       # Mortar technical reference documentation
    ├── drone.js        # Aerial camera view system
    ├── hands.js        # First-person hands rig
    ├── hand-objects.js # 3D objects held in hands per stage
    ├── game-ui.js      # Center-screen overlay panels
    ├── mobile-controls.js # Touch thumbsticks and buttons
    ├── flag.js         # Golf hole marker
    ├── lighting.js     # Scene lighting and shadows
    ├── sun.js          # Skybox, sun, day/night cycle
    ├── terrain-heightmap.js # Heightmap loading from JSON + binary data
    ├── terrain-renderer.js  # Terrain mesh with vertex coloring (main entry)
    ├── trees.js        # Procedural tree placement (requires heightmap)
    ├── golf_course.json # Terrain config (terrainSize, resolution, maxHeight, etc.)
    ├── golf_course.raw  # Binary heightmap data (referenced by JSON)
    └── golf_course.png # Floor/terrain texture
```

## Core Game Loop

1. **Setup Projectile**: Configure shot profile (Charge/Kick/Hang/Break), load into cannon
2. **Adjust Cannon**: Set rotation and elevation angles
3. **Fire Cannon**: Fire and watch the ball fly (auto-follow available)
4. **Observe**: Use drone view to track ball trajectory
5. **Navigate**: Move cannon to ball landing position
6. **Repeat** until ball reaches flag

## State Machine (6 Stages)

Defined in `game-state.js`, STAGES array:

| Index | ID | Name | Hand Object | Action | Debug Section |
|-------|-----|------|-------------|--------|---------------|
| 0 | `idle` | Idle | drone | Enter Drone View | drone |
| 1 | `setup-projectile` | Setup Projectile | sphere | Toggle UI / Load cannon | null |
| 2 | `adjust-cannon` | Adjust Cannon | wrench | Toggle rotation/elevation UI | null |
| 3 | `fire-cannon` | Fire Cannon | button-box | Fire the cannon | recoil |
| 4 | `drone-view` | Drone View | null (hands hidden) | Exit to Idle | null |
| 5 | `move-next` | Move To Next Shot | move-marker | Teleport cannon to ball | null |

**Stage Navigation**:
- Q/E keys cycle through stages (skips drone-view)
- 1-6 keys jump directly to stages (drone-view blocked via keyboard)
- F key triggers current stage's action
- Drone-view only accessible via Idle action or auto-follow after firing

## Key Systems & APIs

### Cannon System (`cannon.js`)

```javascript
// Create howitzer
const howitzerData = createHowitzer(scene, { position, rotation, scale });

// Cannon controls
const cannonControls = createCannonControls(howitzerData);
cannonControls.adjustRotation(delta);  // degrees
cannonControls.adjustElevation(delta); // degrees, clamped 0-80

// Weapon adapter (for projectile system)
const howitzerAdapter = createHowitzerAdapter(howitzerData, firingAnim);
```

### Projectile System (`projectile.js`)

Weapon-agnostic projectile physics. Works with any weapon that provides an adapter.

```javascript
// Create with weapon adapter + optional terrain for heightmap collision
const projectileSystem = createProjectileSystem(scene, weaponAdapter, terrain);
projectileSystem.loadCannon();         // Load ball
projectileSystem.fire(shotSelections);  // Returns true if fired
projectileSystem.isBallAvailable();    // True if can pick up ball
projectileSystem.isBallStabilized();   // True if ball stopped
projectileSystem.getBallPosition();    // THREE.Vector3 or null
projectileSystem.clearProjectiles();   // Remove all balls
projectileSystem.setWeaponPosition({ x, y, z }); // Move weapon
projectileSystem.getWeaponPosition();  // THREE.Vector3
projectileSystem.onBallStabilized(callback);     // Register callback
```

**Weapon Adapter Interface** (duck-typed):
```javascript
{
  getMuzzlePosition()     // → THREE.Vector3 (world coords)
  getFiringDirection()    // → THREE.Vector3 (normalized, world coords)
  getPosition()           // → THREE.Vector3 (weapon world position)
  setPosition(pos)        // Move weapon to {x, y, z}
  showLoadedBall(visible) // Show/hide loaded ball mesh
  triggerFire()           // Start firing animation + muzzle flash
}
```

Adapters: `createHowitzerAdapter()` in cannon.js, `createMortarAdapter()` in mortar.js.

**Shot Profile System** (ADSR-inspired):
- `fire(shotSelections)` takes `{ charge, kick, hang, break }` strings
- Charge: Light/Standard/Heavy — energy budget multiplier
- Kick: Chip/Full/Crush — launch speed + vertical pitch bias
- Hang: Punch/Carry/Loft — air drag coefficient (higher = drops faster)
- Break: Stick/Roll/Bounce — restitution + friction + roll multiplier
- Charge coupling: Heavy slightly increases restitution, Light decreases it
- Config values in `SHOT_PROFILE` constant in config.js

**Envelope Preview Graph** (in game-ui.js):
- Canvas-based ADSR-style behaviour envelope
- X-axis: Launch → Flight → Impact (3 phase bands)
- Y-axis: AIR (top) to GROUND (bottom)
- 7 control points forming: attack rise (Kick), decay slope (Hang), sharp release (Break)
- Curve type configurable: `ENVELOPE_MAP.curveType` = `'linear'` (sharp) or `'catmull-rom'` (smooth)
- Charge does NOT affect the envelope shape
- Config values in `ENVELOPE_MAP` constant in config.js
- UI-only: physics code does not read from the envelope

**Projectile Physics** (in projectile.js):
- Gravity: 9.81 m/s²
- Per-shot restitution/friction from Break profile
- Air drag: exponential `v *= exp(-airDragK * dt)` from Hang profile
- Rolling friction: 2.5 m/s² base, modulated by Break rollMult
- Slope friction: 0.4 (extra friction on steep terrain)
- Slow roll timeout: 2 sec at <0.5 m/s forces stop
- States: `flying` → `bouncing` → `rolling` → `stopped`

**Terrain Collision**:
- Ball collides with terrain heightmap (not flat ground)
- Bounce reflects off terrain normal using `v' = v - 2(v·n)n` with restitution
- Rolling follows terrain slope (gravity projects onto surface)
- Ball stays on terrain surface during rolling
- Slow roll detection: force-stops after 2s of slow movement on shallow slopes

### Mortar System (`mortar.js`)

M252-style 81mm mortar for the "putting" phase (close to flag). See `Mortar.md` for detailed specs.

```javascript
// Create mortar
const mortarData = createMortar(scene, { position, rotation, scale });

// Mortar controls (limited traverse compared to howitzer)
const mortarControls = createMortarControls(mortarData);
mortarControls.adjustRotation(delta);   // ±30° max traverse
mortarControls.adjustElevation(delta);  // 45-85° (high-angle weapon)

// Firing animation
const mortarFiringAnim = createMortarFiringAnimation();
updateMortarFiringAnimation(mortarFiringAnim, mortarData, dt); // In loop

// Weapon adapter (for projectile system)
const mortarAdapter = createMortarAdapter(mortarData, mortarFiringAnim);
```

**Key Differences from Howitzer**:
| Feature | Howitzer | Mortar |
|---------|----------|--------|
| Size | ~3m long | 1.27m tube |
| Elevation | 0-80° | 45-85° (high angle) |
| Traverse | Full rotation | ±30° limited |
| Mobility | Wheeled carriage | Baseplate + bipod |
| Color | Dark metal grays | Olive drab green |
| Intended Use | Long range shots | "Putting" phase |

### Drone System (`drone.js`)

```javascript
const droneSystem = createDroneSystem(camera, renderer, config);
droneSystem.toggle(yaw, pitch);     // Toggle on/off, returns { active, yaw, pitch }
droneSystem.isActive();             // True if in drone mode or transitioning
droneSystem.isTransitioning();      // True during rise animation
droneSystem.update(dt, moveForward, moveRight, yaw);
droneSystem.setStartHeight(height); // Target altitude
droneSystem.setSpeed(speed);        // Flight speed
droneSystem.setTransitionSpeed(speed); // Rise speed, 0 = instant
```

**Visual Effects**: Vignette overlay, scanlines, altitude HUD

### Game State (`game-state.js`)

```javascript
const gameState = createGameState({
  onStageEnter: (stage) => { ... },
  onStageExit: (stage) => { ... },
  setGameUIVisible: (panelType, visible) => { ... },
  tryLoadCannon: () => { ... },  // Returns true if loaded
  fireCannon: () => { ... },
  moveToNextShot: () => { ... }
});

gameState.getCurrentStage();     // { id, name, handObject, ... }
gameState.cycleNext();           // Q key
gameState.cyclePrev();           // E key
gameState.goToStage(index, force); // Direct jump
gameState.triggerAction();       // F key
```

### Hands System (`hands.js`)

```javascript
const hands = createFirstPersonHands(camera);
hands.setHeldObject(object);  // Set 3D object between hands
hands.setVisible(visible);    // Show/hide hands (hidden in drone view)
```

### Hand Objects (`hand-objects.js`)

```javascript
const handObjects = createHandObjects();
// Returns: { 'drone', 'sphere', 'wrench', 'button-box', 'move-marker' }

updateHandObjectAnimations(handObjects, currentStageId, dt); // Call in loop
triggerButtonPress(handObjects);  // Animate button press

// Wrench mode controls (for position-aware cannon adjustment)
triggerWrenchShake(handObjects);          // Shake animation when too far
setWrenchMode(handObjects, 'rotation');   // Show rotating arrow indicator
setWrenchMode(handObjects, 'elevation');  // Show up/down arrow indicator
setWrenchMode(handObjects, 'none');       // Hide all indicators
getWrenchMode(handObjects);               // Get current mode
```

**Animations**: Drone rotors spin, button-box has press animation, wrench has shake animation and rotating/bobbing arrow indicators.

### Game UI (`game-ui.js`)

```javascript
const gameUI = createGameUI();
gameUI.show('projectile');  // Shot profile panel
gameUI.show('cannon');      // Rotation/elevation dial panel
gameUI.hide();
gameUI.onHide(callback);
gameUI.updateCannonDisplay(rotation, elevation);
gameUI.getShotSelections(); // Returns { charge, kick, hang, break } strings

// Dial control for cannon adjustment
gameUI.setupDialControl(onRotation, onElevation, updateDisplay);
gameUI.updateDial(dt);       // Call in animation loop for inertia
gameUI.setDialRatio(ratio);  // Runtime tuning
gameUI.setDialFriction(friction);
```

**Dial Control**: The cannon adjustment panel uses a spinning dial instead of buttons:
- Drag to rotate dial, which adjusts cannon rotation or elevation
- Release with momentum for inertia effect (dial keeps spinning)
- Ratio: dial degrees to cannon degrees (default 3:1, configurable via `DIAL.ratio`)
- Friction: velocity decay per frame (default 0.92, configurable via `DIAL.friction`)
- Mode determined by player position: breech side = rotation, sides/front = elevation

### Terrain System (`terrain-renderer.js` + `terrain-heightmap.js`)

Main entry point is `terrain-renderer.js` which uses `terrain-heightmap.js` internally:

```javascript
// Load terrain with vertex coloring (async)
const terrain = await createTerrain({
  configFile: './golf_course.json'
});
scene.add(terrain.mesh);

// Or create flat colored fallback (sync)
const terrain = createFlatColoredTerrain({ size: 4000, resolution: 64 });

// Query height at world position
const y = terrain.getHeightAt(worldX, worldZ);

// Get terrain normal
const normal = terrain.getNormalAt(worldX, worldZ);

// Check bounds
if (terrain.isInBounds(x, z)) { ... }

// Update vertex colors with custom gradient
terrain.updateColors([
  { height: 0.0, color: new THREE.Color(0x2d5016) },
  { height: 0.5, color: new THREE.Color(0x8ab84a) },
  { height: 1.0, color: new THREE.Color(0xffffff) }
]);

// Wireframe overlay
terrain.setWireframeVisible(true);   // Toggle wireframe
terrain.setWireframeOpacity(0.15);   // Adjust opacity (0-1)
terrain.isWireframeVisible();        // Check state
```

**JSON Config Format** (`golf_course.json`):
```json
{
  "terrainSize": 4000,      // Width/depth in 3D units
  "resolution": 256,        // Segments per side (vertices = (res+1)^2)
  "maxHeight": 100,         // Maximum elevation
  "exportType": "float32",  // or "uint16"
  "binaryFile": "./golf_course.raw"
}
```

**Binary File**: Raw vertex heights, row-major order, `(resolution+1)^2` values.

**Vertex Color Gradient** (default, by normalized height):
- 0.00: Deep green (valleys)
- 0.30: Light green (grass)
- 0.50: Yellow-green (hills)
- 0.70: Brown (rocky)
- 1.00: White (snow peaks)

### Configuration (`config.js`)

All tunable parameters are centralized here:
- `COURSE` - 9 holes with cannon/flag positions, par values
- `WORLD` - Floor size, sky radius, axis helper
- `CANNON` - Offset, rotation, scale, load distance (2m)
- `CAMERA` - FOV (65), near/far, start position offset
- `CONTROLS` - Look sensitivity, move speed (5 m/s)
- `DRONE` - Flight speed (30 m/s), transition speed, start height (15m)
- `PROJECTILE` - Physics constants (rolling friction, bounce thresholds)
- `SHOT_PROFILE` - Shot profile tuning (baseSpeed, charge/kick/hang/break values)
- `ENVELOPE_MAP` - Envelope preview Y-axis mappings for kick/hang/break
- `DIAL` - Spinning dial control: ratio (3:1), friction (0.92), velocity limits
- `FIRING` - Animation durations, recoil distances
- `FLAG` - Scale (4x), dimensions
- `AUTO_FOLLOW` - Enabled (true), delay (1 sec)
- `TERRAIN` - Heightmap config file path, enabled flag, texture

Helper functions:
```javascript
getHole(holeNumber)           // 1-indexed
getCannonPosition(holeNumber)
getFlagPosition(holeNumber)
buildCannonConfig(holeNumber)
buildCameraStartPosition(holeNumber)
buildDroneConfig(holeNumber)
```

## Input Handling

### Desktop (in index.html)
- **WASD**: Move (ground mode) or fly (drone mode)
- **Mouse drag**: Look around (yaw/pitch)
- **Q/E**: Cycle stages
- **F**: Trigger action
- **1-6**: Direct stage access
- **Mouse wheel**: Adjust drone speed (in drone mode)

### Mobile (`mobile-controls.js`)
- Left thumbstick: Movement
- Right thumbstick: Look (with inertia)
- Stage bar: Previous/Next arrows + GO action button
- Auto-detected via `isMobileDevice()`

## Game Session State

Located in `index.html`:
```javascript
const gameSession = {
  currentHole: 1,
  shotCount: 0,
  scores: []  // { hole, shots, par }
};
```

**Scoring UI**: Top-right panel showing `Hole X / 9` and `Shots: X / Par Y`

## Important Implementation Details

### Ball Loading Flow
1. Player in `setup-projectile` stage holding sphere
2. Walk close to cannon (within 2m)
3. Press F → ball loads, disappears from hand
4. Switch to `fire-cannon`, press F → fires
5. Ball flies, bounces, rolls, stops
6. `onBallStabilized` callback fires

### Move To Next Shot
1. Only works when ball is stabilized
2. Screen fades to black
3. Cannon teleports to ball position
4. Player maintains relative offset to cannon
5. Ball cleared, state reset to Idle

### Auto-Follow Shot
1. In fire-cannon stage, after successful fire
2. If "Auto-follow shot" checked (in debug-recoil section)
3. After configurable delay, force-transition to drone-view
4. Player can track ball from above

### Position-Aware Cannon Adjustment
The "Adjust Cannon" stage requires proximity and behaves differently based on player position:

1. **Too far (>2m)**: Wrench shakes on action press to indicate not allowed
2. **Breech side (<2m, behind cannon where you load)**:
   - Rotating arrow appears on wrench (parallel to floor, spins continuously)
   - Action opens rotation controls only
3. **Sides/front (<2m)**:
   - Up/down arrow appears on wrench (vertical, bobs continuously)
   - Action opens elevation controls only

**Indicators appear continuously** when within range, not just on action press.

**Configuration** (`config.js`):
```javascript
CANNON.adjustDistance: 2.0  // Max distance to adjust cannon
```

**Implementation** (`index.html`):
- Continuous position check in animation loop updates wrench mode
- `tryAdjustCannon` callback handles action button press
- Uses dot product with cannon forward vector
- `dotForward > 0.3` = breech side (rotation mode)
- Otherwise = sides/front (elevation mode)

**Hand object modes** (`hand-objects.js`):
```javascript
setWrenchMode(handObjects, 'rotation'); // Show rotating arrow (parallel to floor)
setWrenchMode(handObjects, 'elevation'); // Show up/down arrow (vertical)
setWrenchMode(handObjects, 'none');      // Hide indicators
triggerWrenchShake(handObjects);         // Animate shake on failed action
```

**Panel types** (`game-ui.js`):
- `'cannon'` - Full panel (rotation + elevation)
- `'cannon-rotation'` - Rotation controls only
- `'cannon-elevation'` - Elevation controls only

## Debug UI Structure

**Shared section** (always visible):
- Stage name
- Camera position/rotation
- Ball distance (meters/yards)

**Terrain section** (`debug-terrain`, always visible):
- Show Wireframe checkbox - toggles faint white wireframe overlay
- Hour slider - time of day (0-24)
- Lock Lighting checkbox - prevents hour from affecting lighting

**Per-stage sections**:
- `debug-drone`: Drone Height, Speed, Transition speed (Idle stage)
- `debug-dial`: Dial Ratio, Inertia/Friction (Adjust Cannon stage)
- `debug-recoil`: Inner/Outer Recoil, Auto-follow, Delay (Fire Cannon stage)

Hidden inputs synced with Game UI:
- `#rotationValue`, `#elevationValue` - cannon angles

Debug display:
- `#lastShotValue` - Shows last shot profile (e.g., "Standard | Full | Carry | Roll")

## Trees System

The `trees.js` module provides procedural tree placement for heightmap-based terrain:
- Pine trees, deciduous trees, bushes
- Density, clustering, slope-based placement
- Requires heightmap object from `terrain-heightmap.js` with `getHeightInterpolated(u, v)`
- Use `createTrees(heightmap, terrainConfig, treeConfig)` after loading terrain

## Files by Size (Complexity Indicator)

| File | Lines | Notes |
|------|-------|-------|
| index.html | ~975 | Main orchestration, async init, event handling |
| mortar.js | ~490 | M252 mortar model + controls + adapter |
| cannon.js | ~450 | Howitzer model + controls + adapter |
| projectile.js | ~275 | Weapon-agnostic projectile physics |
| mobile-controls.js | ~350 | Touch controls system |
| trees.js | ~350 | Procedural tree placement |
| terrain-heightmap.js | ~320 | Heightmap loading from binary |
| hand-objects.js | ~320 | 5 hand object models |
| terrain-renderer.js | ~250 | Vertex coloring + terrain API |
| drone.js | ~250 | Drone view with transition |
| hands.js | ~230 | First-person hands model |
| game-ui.js | ~220 | Overlay panels |
| sun.js | ~215 | Skybox shader, day/night |
| config.js | ~215 | All configuration |
| game-state.js | ~195 | State machine |
| flag.js | ~80 | Simple flag model |
| lighting.js | ~60 | Light setup |

## Common Tasks

### Add a new gameplay stage
1. Add stage definition to STAGES array in `game-state.js`
2. Create hand object model in `hand-objects.js`
3. Add to `createHandObjects()` return object
4. Handle in `onStageEnter`/`onStageExit` callbacks in index.html
5. Add debug section to HTML if needed

### Modify projectile physics
1. Edit `physics` constants in `createProjectileSystem()` in `projectile.js`
2. Or expose in `config.js` under PROJECTILE

### Add new course holes
1. Add hole objects to `COURSE.holes` array in `config.js`
2. Update `COURSE.holeCount`

### Change camera/movement
1. Modify `CAMERA` or `CONTROLS` in `config.js`

### Debug without reloading
1. Use browser console
2. Access via: `window.projectileSystem`, etc. (if exposed)
3. Or add `debugger;` statements

## Related Projects

- **Unreal folder** (`/mnt/c/Dev/AI/GolfWar/Unreal/GolfWar/`): Unreal Engine version exists but details not explored in this session.

## Last Updated

January 2025 - Spinning Dial Aim Control:
- `game-ui.js`: Replaced button-based cannon controls with draggable spinning dial
- `config.js`: Added DIAL settings (ratio 3:1, friction 0.92, velocity limits)
- `game-state.js`: adjust-cannon stage now uses 'dial' debugSection
- `index.html`: Added debug-dial section with Dial Ratio and Inertia inputs

Previous updates:
- Envelope Preview + Shot Profile (ADSR-style graph, shot profiles)
- Projectile system extraction + weapon adapter pattern
- Projectile system extraction + weapon adapter pattern
- Mortar weapon with recoil animation
- Position-aware cannon adjustment (wrench modes, partial panels)
- Terrain collision physics, wireframe overlay, heightmap loading
