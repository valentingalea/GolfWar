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
    ├── cannon.js       # Howitzer model, firing, projectile physics
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

1. **Setup Projectile**: Configure ball velocity/mass, load into cannon
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

// Projectile system (terrain enables heightmap collision)
const projectileSystem = createProjectileSystem(scene, howitzerData, firingAnim, terrain);
projectileSystem.loadCannon();         // Load ball
projectileSystem.fire();               // Returns true if fired
projectileSystem.isBallAvailable();    // True if can pick up ball
projectileSystem.isBallStabilized();   // True if ball stopped
projectileSystem.getBallPosition();    // THREE.Vector3 or null
projectileSystem.clearProjectiles();   // Remove all balls
projectileSystem.setCannonPosition({ x, y, z }); // Move howitzer
projectileSystem.onBallStabilized(callback);     // Register callback
```

**Projectile Physics** (in cannon.js):
- Gravity: 9.81 m/s²
- Base restitution: 0.65 (bounciness)
- Friction: 0.35 (tangent velocity loss on bounce)
- Rolling friction: 2.5 m/s² deceleration
- Slope friction: 0.4 (extra friction on steep terrain)
- Slow roll timeout: 2 sec at <0.5 m/s forces stop (prevents infinite creep)
- States: `flying` → `bouncing` → `rolling` → `stopped`

**Terrain Collision**:
- Ball collides with terrain heightmap (not flat ground)
- Bounce reflects off terrain normal using `v' = v - 2(v·n)n` with restitution
- Rolling follows terrain slope (gravity projects onto surface)
- Ball stays on terrain surface during rolling
- Slow roll detection: force-stops after 2s of slow movement on shallow slopes
- Pass terrain to: `createProjectileSystem(scene, howitzer, firingAnim, terrain)`

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
```

**Drone model has animated rotors**, button-box has press animation.

### Game UI (`game-ui.js`)

```javascript
const gameUI = createGameUI();
gameUI.show('projectile');  // Velocity/mass panel
gameUI.show('cannon');      // Rotation/elevation panel
gameUI.hide();
gameUI.onHide(callback);
gameUI.updateCannonDisplay(rotation, elevation);
gameUI.syncProjectileValues(velocityEl, massEl);  // Sync with hidden inputs
```

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
- `CANNON` - Offset, rotation, scale, load distance (3.5m)
- `CAMERA` - FOV (65), near/far, start position offset
- `CONTROLS` - Look sensitivity, move speed (5 m/s)
- `DRONE` - Flight speed (30 m/s), transition speed, start height (15m)
- `PROJECTILE` - Default velocity (20), mass (10), physics constants
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
2. Walk close to cannon (within 3.5m)
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
- `debug-recoil`: Inner/Outer Recoil, Auto-follow, Delay (Fire Cannon stage)

Hidden inputs synced with Game UI:
- `#velocityInput`, `#massInput` - projectile params
- `#rotationValue`, `#elevationValue` - cannon angles

## Trees System

The `trees.js` module provides procedural tree placement for heightmap-based terrain:
- Pine trees, deciduous trees, bushes
- Density, clustering, slope-based placement
- Requires heightmap object from `terrain-heightmap.js` with `getHeightInterpolated(u, v)`
- Use `createTrees(heightmap, terrainConfig, treeConfig)` after loading terrain

## Files by Size (Complexity Indicator)

| File | Lines | Notes |
|------|-------|-------|
| cannon.js | ~760 | Most complex - model + physics + animation |
| index.html | ~975 | Main orchestration, async init, event handling |
| hand-objects.js | ~320 | 5 hand object models |
| mobile-controls.js | ~350 | Touch controls system |
| trees.js | ~350 | Procedural tree placement |
| terrain-heightmap.js | ~320 | Heightmap loading from binary |
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
1. Edit constants in `createProjectileSystem()` in `cannon.js` (~line 450)
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

January 2025 - Terrain collision physics:
- `cannon.js`: Ball now collides with terrain heightmap
  - Bounce reflects off terrain normals
  - Rolling follows slope with gravity projection
  - Extra friction on steep slopes
- `terrain-renderer.js`: Wireframe overlay, vertex coloring
- `terrain-heightmap.js`: Heightmap loading from JSON + binary
