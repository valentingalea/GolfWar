// Game Configuration Module
// Centralizes all game settings, course data, and tunable parameters

// ========== COURSE DEFINITION ==========
export const COURSE = {
  name: "Artillery Range",
  holeCount: 9,
  holes: [
    { number: 1, par: 3, cannon: { x: 0, y: 0, z: 0 }, flag: { x: 0, y: 0, z: 150 } },
    { number: 2, par: 3, cannon: { x: 0, y: 0, z: 0 }, flag: { x: 50, y: 0, z: 150 } },
    { number: 3, par: 3, cannon: { x: 0, y: 0, z: 0 }, flag: { x: -50, y: 0, z: 150 } },
    { number: 4, par: 3, cannon: { x: 0, y: 0, z: 0 }, flag: { x: 0, y: 0, z: 200 } },
    { number: 5, par: 3, cannon: { x: 0, y: 0, z: 0 }, flag: { x: 75, y: 0, z: 175 } },
    { number: 6, par: 3, cannon: { x: 0, y: 0, z: 0 }, flag: { x: -75, y: 0, z: 175 } },
    { number: 7, par: 3, cannon: { x: 0, y: 0, z: 0 }, flag: { x: 0, y: 0, z: 250 } },
    { number: 8, par: 3, cannon: { x: 0, y: 0, z: 0 }, flag: { x: 100, y: 0, z: 200 } },
    { number: 9, par: 3, cannon: { x: 0, y: 0, z: 0 }, flag: { x: -100, y: 0, z: 200 } }
  ]
};

// ========== WORLD SETTINGS ==========
export const WORLD = {
  floor: {
    size: 4000,           // Floor texture size (4k x 4k)
    texture: './golf_course.png'
  },
  sky: {
    radius: 3000,
    sunDistance: 2900,
    sunSize: 200,
    defaultHour: 12       // Starting time of day
  },
  axis: {
    origin: { x: 0, y: 0.5, z: 0 },
    size: 2,
    labelOffset: 2.3,
    labelSize: 0.3,
    visible: true         // Toggle axis helper visibility
  }
};

// ========== CANNON SETTINGS ==========
export const CANNON = {
  // Default offset from hole's cannon position
  offset: { x: 3, y: 0, z: 0 },
  rotation: Math.PI,      // Facing direction
  scale: 1.2,
  loadDistance: 2,      // Max distance to load ball into cannon
  adjustDistance: 2.0     // Max distance to adjust cannon rotation/elevation
};

// ========== CAMERA SETTINGS ==========
export const CAMERA = {
  fov: 65,
  near: 0.1,
  far: 5000,
  // Offset from cannon position
  startOffset: { x: -1.5, y: 1.6, z: 2.2 },
  initialYawDeg: 356,
  initialPitchDeg: 0
};

// ========== CONTROLS SETTINGS ==========
export const CONTROLS = {
  lookSensitivity: 0.003,
  maxPitchDeg: 89,
  moveSpeed: 5.0          // Walking speed in m/s
};

// ========== DRONE SETTINGS ==========
export const DRONE = {
  defaultSpeed: 30,       // Flying speed in m/s
  minSpeed: 10,
  maxSpeed: 500,
  transitionSpeed: 5,    // Speed during transition animation (m/s), 0 = instant
  minTransitionSpeed: 0,
  maxTransitionSpeed: 100,
  startHeight: 15,        // Height above ground when activating drone
  startOffset: { x: -3, z: 5 }  // Offset from cannon when entering drone mode
};

// ========== PROJECTILE SETTINGS ==========
export const PROJECTILE = {
  radius: 0.15,           // Ball radius in meters
  gravity: 9.81,
  rollingFriction: 2.5,   // Base deceleration when rolling (m/s²)
  slopeFriction: 0.4,     // Extra friction on steep terrain
  minBounceVelocity: 0.5, // Below this, stop bouncing
  minRollVelocity: 0.1,   // Below this, stop completely
  slowRollSpeed: 0.5,     // Speed considered "slow rolling"
  maxSlowRollTime: 2.0    // Max seconds of slow rolling before force-stop
};

// ========== SHOT PROFILE ==========
export const SHOT_PROFILE = {
  baseSpeed: 20,          // Base launch speed (m/s)
  fixedMass: 10,          // Standardized ball mass (kg)

  // Charge: energy budget multiplier
  charge: {
    light:    0.85,
    standard: 1.00,
    heavy:    1.20
  },

  // Kick: launch character (speed multiplier + vertical pitch bias)
  kick: {
    chip:  { speedMult: 0.92, pitch: -0.04 },
    full:  { speedMult: 1.00, pitch: 0 },
    crush: { speedMult: 1.08, pitch: 0.05 }
  },

  // Hang: air drag coefficient (higher = drops faster)
  hang: {
    punch: 0.12,
    carry: 0.08,
    loft:  0.05
  },

  // Break: ground response (restitution + friction)
  break: {
    stick:  { restitution: 0.12, friction: 0.55, rollMult: 1.5 },
    roll:   { restitution: 0.30, friction: 0.35, rollMult: 1.0 },
    bounce: { restitution: 0.60, friction: 0.18, rollMult: 0.6 }
  },

  // Charge coupling: slight restitution modifier
  chargeCoupling: { heavy: 0.05, light: -0.03 }
};

// ========== ENVELOPE PREVIEW MAP ==========
// ADSR-style parameters for the behaviour envelope graph
export const ENVELOPE_MAP = {
  curveType: 'linear',    // 'catmull-rom' for smooth, 'linear' for sharp gradients
  // Kick → attack peak height (how high the rise goes)
  kick:  { chip: 0.30, full: 0.55, crush: 0.85 },
  // Hang → decay drop from peak (how much it drops during flight)
  hang:  { punch: 0.35, carry: 0.15, loft: 0.04 },
  // Break → release endpoint (where the sharp drop lands; lower = sharper)
  break: { stick: -0.30, roll: -0.05, bounce: 0.15 }
};

// ========== DIAL SETTINGS ==========
export const DIAL = {
  ratio: 3.0,           // Dial degrees to cannon degrees (3:1)
  friction: 0.92,       // Velocity decay per frame (0.92 = moderate spin)
  minVelocity: 0.5,     // Stop threshold (deg/sec)
  maxVelocity: 720,     // Max spin speed (deg/sec)
  size: 120             // Dial diameter in pixels
};

// ========== FIRING ANIMATION SETTINGS ==========
export const FIRING = {
  duration: 1.2,
  barrelRecoilDist: 1.0,
  defaultBarrelRecoilSpeed: 2,
  defaultOuterRecoilSpeed: 4,
  cannonRecoilDist: 0.15,
  cannonRockAngle: 0.08
};

// ========== SMOKE TRAIL SETTINGS ==========
export const SMOKE = {
  spawnRate: 0.02,        // Time between smoke spawns (seconds)
  lifetime: 2.0,          // How long smoke particles live
  startSize: 0.3,
  endSize: 1.5,
  startOpacity: 0.6,
  drift: 0.5              // Random drift speed
};

// ========== FLAG/TARGET SETTINGS ==========
export const FLAG = {
  scale: 4,               // Overall scale factor (for drone visibility)
  poleHeight: 2.0,
  poleRadius: 0.02,
  flagWidth: 0.6,
  flagHeight: 0.4,
  holeRadius: 0.15,       // Radius for "in the hole" detection
  nearRadius: 1.0         // Radius for "near the hole" feedback
};

// ========== UI SETTINGS ==========
export const UI = {
  debugPanelVisible: true,
  showLightingControls: false,  // Hour and Lock Lighting debug options
  mobileStageBarTop: 10,
  hudPadding: 12
};

// ========== AUTO-FOLLOW SETTINGS ==========
export const AUTO_FOLLOW = {
  enabled: true,          // Auto-switch to drone view after firing
  delaySec: 1             // Delay before switching to drone view
};

// ========== TERRAIN SETTINGS ==========
export const TERRAIN = {
  configFile: './golf_course.json',  // JSON file with terrain heightmap config
  enabled: true,                      // Whether to use heightmap terrain
  texture: './golf_course.png',       // Texture to apply to terrain
  fallbackSize: 4000,                 // Size if heightmap fails to load
  fallbackResolution: 64              // Resolution if heightmap fails
};

// ========== HELPER FUNCTIONS ==========

// Get hole data by number (1-indexed)
export function getHole(holeNumber) {
  return COURSE.holes.find(h => h.number === holeNumber) || COURSE.holes[0];
}

// Get cannon world position for a specific hole
export function getCannonPosition(holeNumber) {
  const hole = getHole(holeNumber);
  return {
    x: hole.cannon.x + CANNON.offset.x,
    y: hole.cannon.y + CANNON.offset.y,
    z: hole.cannon.z + CANNON.offset.z
  };
}

// Get flag world position for a specific hole
export function getFlagPosition(holeNumber) {
  const hole = getHole(holeNumber);
  return { ...hole.flag };
}

// Get total par for the course
export function getCoursePar() {
  return COURSE.holes.reduce((total, hole) => total + hole.par, 0);
}

// Build cannon config for createHowitzer
export function buildCannonConfig(holeNumber) {
  const pos = getCannonPosition(holeNumber);
  return {
    position: pos,
    rotation: CANNON.rotation,
    scale: CANNON.scale
  };
}

// Build camera start position for a hole
export function buildCameraStartPosition(holeNumber) {
  const cannonPos = getCannonPosition(holeNumber);
  return {
    x: cannonPos.x + CAMERA.startOffset.x,
    y: cannonPos.y + CAMERA.startOffset.y,
    z: cannonPos.z + CAMERA.startOffset.z
  };
}

// Build drone config for a hole
export function buildDroneConfig(holeNumber) {
  const cannonPos = getCannonPosition(holeNumber);
  return {
    defaultSpeed: DRONE.defaultSpeed,
    transitionSpeed: DRONE.transitionSpeed,
    startHeight: DRONE.startHeight,
    startOffset: DRONE.startOffset,
    cannonPosition: cannonPos
  };
}
