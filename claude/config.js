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
  loadDistance: 3.5       // Max distance to load ball into cannon
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
  defaultSpeed: 50,       // Flying speed in m/s
  minSpeed: 10,
  maxSpeed: 500,
  startHeight: 25,        // Height above ground when activating drone
  startOffset: { x: -3, z: 5 }  // Offset from cannon when entering drone mode
};

// ========== PROJECTILE SETTINGS ==========
export const PROJECTILE = {
  // Default launch parameters
  defaultVelocity: 20,    // m/s
  minVelocity: 10,
  maxVelocity: 200,
  defaultMass: 10,        // kg
  minMass: 1,
  maxMass: 100,
  radius: 0.15,           // Ball radius in meters

  // Physics
  gravity: 9.81,
  baseRestitution: 0.75,  // Bounciness (0-1)
  friction: 0.3,          // Horizontal velocity loss on bounce
  rollingFriction: 2.0,   // Deceleration when rolling (m/s²)
  minBounceVelocity: 0.5, // Below this, stop bouncing
  minRollVelocity: 0.1    // Below this, stop completely
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
  mobileStageBarTop: 10,
  hudPadding: 12
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
    startHeight: DRONE.startHeight,
    startOffset: DRONE.startOffset,
    cannonPosition: cannonPos
  };
}
