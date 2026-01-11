# Claude Folder - Artillery Golf Prototype

This folder contains a Three.js web prototype for an artillery golf game. The player controls a howitzer cannon to launch golf balls toward flags across a course.

## Technology Stack

- **Three.js** (v0.160.0) - 3D rendering via ES modules
- **Vanilla JavaScript** - No build tools, runs directly in browser
- **ES Modules** - All JS files use import/export
- **HTML5** - Single `index.html` entry point

## File Architecture

### Entry Point
- **index.html** - Main HTML file with embedded JavaScript that orchestrates all modules, handles input, and runs the animation loop

### Core Systems

| File | Purpose |
|------|---------|
| `config.js` | Centralized game configuration (course data, physics, camera, controls) |
| `game-state.js` | State machine managing 6 gameplay stages |
| `cannon.js` | Howitzer model, firing animation, projectile physics |
| `drone.js` | Aerial camera view with transition animation |

### Rendering & Environment

| File | Purpose |
|------|---------|
| `lighting.js` | Scene lighting setup (ambient, directional, shadows) |
| `sun.js` | Skybox gradient, sun sphere, day/night cycle |
| `terrain.js` | Procedural terrain mesh generation |
| `terrain-heightmap.js` | Heightmap-based terrain (alternative) |
| `trees.js` | Procedural tree placement system |
| `flag.js` | Golf flag marker at hole position (scaled up for drone visibility) |

### Player & UI

| File | Purpose |
|------|---------|
| `hands.js` | First-person hands rig attached to camera |
| `hand-objects.js` | 3D models held in hands per stage (drone, ball, wrench, button) |
| `game-ui.js` | Center-screen overlay panels for projectile/cannon settings |
| `mobile-controls.js` | Touch thumbsticks and buttons for mobile devices |

## Game State Machine

The game uses a 6-stage state machine defined in `game-state.js`:

| Index | Stage ID | Hand Object | Action |
|-------|----------|-------------|--------|
| 0 | `idle` | Drone model | Enter Drone View |
| 1 | `setup-projectile` | Golf ball | Toggle velocity/mass UI (or load cannon if close) |
| 2 | `adjust-cannon` | Wrench | Toggle rotation/elevation UI |
| 3 | `fire-cannon` | Button box | Fire the cannon |
| 4 | `drone-view` | (hidden) | Exit back to Idle |
| 5 | `move-next` | Placeholder | (not implemented) |

### Stage Navigation
- **Q/E keys** cycle through stages (skips drone-view)
- **F key** triggers the current stage's action
- **1-6 keys** jump directly to stages (except drone-view)
- Drone-view can only be entered via Idle action or auto-follow

## Cannon & Projectile System

Located in `cannon.js`:

- **Howitzer Model**: Procedural low-poly cannon with barrel, wheels, base
- **Loading**: Ball must be loaded into cannon before firing (walk close, press F)
- **Firing Animation**: Barrel recoil, muzzle flash, smoke trail
- **Projectile Physics**: Gravity, bouncing (restitution), rolling friction
- **Ball State**: Tracks if ball is loaded, in flight, or stopped

Key methods:
```javascript
projectileSystem.loadCannon()    // Load ball into cannon
projectileSystem.fire()          // Fire (returns true if successful)
projectileSystem.isBallAvailable() // Check if ball can be picked up
```

## Drone System

Located in `drone.js`:

- **Transition Animation**: Smooth vertical rise to target height
- **Free View**: Player can look around during transition
- **Visual Effects**: Vignette, scanlines, altitude HUD
- **Auto-follow**: After firing, optionally auto-switches to drone view (configurable delay)

## Configuration System

`config.js` exports centralized settings:

```javascript
COURSE      // 9 holes with cannon/flag positions, par values
WORLD       // Floor size, sky radius, axis helper
CANNON      // Offset, rotation, scale, load distance
CAMERA      // FOV, near/far, start position offset
CONTROLS    // Look sensitivity, move speed
DRONE       // Flight speed, transition speed, start height
PROJECTILE  // Velocity, mass, physics (gravity, restitution, friction)
FIRING      // Animation durations, recoil distances
FLAG        // Pole dimensions, hole radius
```

Helper functions build per-hole configs:
```javascript
getHole(holeNumber)
getCannonPosition(holeNumber)
buildCannonConfig(holeNumber)
buildCameraStartPosition(holeNumber)
buildDroneConfig(holeNumber)
```

## Debug UI

The HUD (`#hud` in index.html) has:

1. **Shared section** (always visible): Stage name, camera position/rotation, hour slider, lock lighting
2. **Per-stage sections** (shown based on current stage):
   - `debug-drone`: Drone Height, Speed, Transition speed
   - `debug-recoil`: Inner/Outer Recoil, Auto-follow shot, Follow Delay

## Mobile Support

`mobile-controls.js` provides:
- Left thumbstick for movement (WASD equivalent)
- Right thumbstick for look (mouse equivalent)
- Stage navigation arrows (Q/E equivalent)
- Action button (F equivalent)
- Stage display bar at top

## Input Handling

### Desktop
- **WASD**: Move (ground) or fly (drone mode)
- **Mouse drag**: Look around
- **Q/E**: Cycle stages
- **F**: Trigger action
- **1-6**: Direct stage access
- **Mouse wheel**: Adjust drone speed (when in drone mode)

### Mobile
- Touch controls via `mobile-controls.js`

## Key Implementation Details

### Ball Loading Flow
1. Player in `setup-projectile` stage with ball in hand
2. Walk close to cannon (within `CANNON.loadDistance`)
3. Press F → ball loads into cannon, disappears from hand
4. Switch to `fire-cannon` stage, press F → fires
5. Ball flies, bounces, rolls, stops
6. `onBallStabilized` callback resets ball to hand

### Auto-Follow Shot
1. In `fire-cannon` stage, fire successfully
2. If "Auto-follow shot" checkbox enabled, wait for delay
3. Force-transition to drone-view stage
4. Drone rises while player can track the ball

### Stage Transition Callbacks
```javascript
createGameState({
  onStageEnter: (stage) => { /* update hand object, debug UI */ },
  onStageExit: (stage) => { /* cleanup, hide UI */ },
  setGameUIVisible: (panelType, visible) => { /* show/hide overlay */ },
  tryLoadCannon: () => { /* attempt to load ball */ },
  fireCannon: () => { /* fire cannon, trigger auto-follow */ }
})
```

## Assets

- `golf_course.png` - Floor texture (4k)

## Running the Prototype

Simply open `index.html` in a browser. No build step required. Uses unpkg CDN for Three.js.

## Current Limitations / TODOs

- Stage 5 (`move-next`) is a placeholder
- No actual hole/scoring logic yet
- Terrain modules exist but aren't integrated into main game
- Trees module exists but isn't integrated
- Single ball only (no multi-ball)
