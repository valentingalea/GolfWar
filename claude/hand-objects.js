// Hand Objects - 3D models held between hands for each stage
import * as THREE from 'three';

// Shared materials
const darkMetal = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6, metalness: 0.4 });
const midMetal = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.5, metalness: 0.5 });
const lightMetal = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.4, metalness: 0.6 });

// Drone model for Idle stage - with animated rotors
function createDroneModel() {
  const group = new THREE.Group();
  const rotorBlades = []; // Store blade pairs for animation

  // Central body - flat rectangular box
  const bodyGeom = new THREE.BoxGeometry(0.06, 0.015, 0.06);
  const body = new THREE.Mesh(bodyGeom, darkMetal);
  group.add(body);

  // 4 arms extending diagonally
  const armGeom = new THREE.BoxGeometry(0.04, 0.006, 0.008);
  const armPositions = [
    { x: 0.035, z: 0.035, rot: Math.PI / 4 },
    { x: -0.035, z: 0.035, rot: -Math.PI / 4 },
    { x: 0.035, z: -0.035, rot: -Math.PI / 4 },
    { x: -0.035, z: -0.035, rot: Math.PI / 4 }
  ];

  armPositions.forEach((pos, index) => {
    const arm = new THREE.Mesh(armGeom, midMetal);
    arm.position.set(pos.x, 0, pos.z);
    arm.rotation.y = pos.rot;
    group.add(arm);

    // Rotor disc at each arm end
    const rotorGeom = new THREE.CylinderGeometry(0.012, 0.012, 0.003, 8);
    const rotor = new THREE.Mesh(rotorGeom, lightMetal);
    rotor.position.set(pos.x * 1.6, 0.005, pos.z * 1.6);
    group.add(rotor);

    // Rotor blades group (for rotation animation)
    const bladeGroup = new THREE.Group();
    bladeGroup.position.set(pos.x * 1.6, 0.008, pos.z * 1.6);

    const bladeGeom = new THREE.BoxGeometry(0.025, 0.001, 0.004);
    const blade1 = new THREE.Mesh(bladeGeom, midMetal);
    bladeGroup.add(blade1);

    const blade2 = new THREE.Mesh(bladeGeom, midMetal);
    blade2.rotation.y = Math.PI / 2;
    bladeGroup.add(blade2);

    group.add(bladeGroup);
    rotorBlades.push(bladeGroup);
  });

  // Camera/sensor underneath
  const camGeom = new THREE.SphereGeometry(0.008, 8, 6);
  const cam = new THREE.Mesh(camGeom, darkMetal);
  cam.position.y = -0.012;
  group.add(cam);

  // Landing skids
  const skidGeom = new THREE.BoxGeometry(0.004, 0.015, 0.05);
  const leftSkid = new THREE.Mesh(skidGeom, darkMetal);
  leftSkid.position.set(-0.025, -0.02, 0);
  group.add(leftSkid);

  const rightSkid = new THREE.Mesh(skidGeom, darkMetal);
  rightSkid.position.set(0.025, -0.02, 0);
  group.add(rightSkid);

  // Scale to fit between hands
  group.scale.setScalar(1.8);

  // Raise drone higher than other held objects
  group.position.y = 0.06;

  // Store rotor references for animation
  group.userData.rotorBlades = rotorBlades;

  return group;
}

// Sphere model for Setup Projectile stage - scaled up
function createSphereModel() {
  const geometry = new THREE.SphereGeometry(0.05, 16, 16); // Increased from 0.035
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.3,
    metalness: 0.1
  });
  const sphere = new THREE.Mesh(geometry, material);
  return sphere;
}

// Create circular arrow indicator for rotation mode
// Parallel to floor (rotated 90 deg on X), rotates on Z axis
function createRotationIndicator() {
  const group = new THREE.Group();

  // Circular arrow on XY plane
  const curve = new THREE.EllipseCurve(0, 0, 0.05, 0.05, 0, Math.PI * 1.5, false, 0);
  const points = curve.getPoints(32);
  const arrowPath = new THREE.BufferGeometry().setFromPoints(
    points.map(p => new THREE.Vector3(p.x, p.y, 0)) // XY plane
  );
  const arrowMat = new THREE.LineBasicMaterial({ color: 0x44ff44, linewidth: 2 });
  const arc = new THREE.Line(arrowPath, arrowMat);
  group.add(arc);

  // Arrow head pointing in rotation direction
  const headGeom = new THREE.ConeGeometry(0.012, 0.025, 8);
  const headMat = new THREE.MeshBasicMaterial({ color: 0x44ff44 });
  const head = new THREE.Mesh(headGeom, headMat);
  // Position at end of arc (270 degrees = bottom)
  head.position.set(0.05, 0, 0);
  head.rotation.z = -Math.PI / 2; // Point tangent to circle
  group.add(head);

  // Rotate to be parallel to floor
  group.rotation.x = Math.PI / 2;
  group.visible = false;

  return group;
}

// Create up/down arrow indicator for elevation mode
// Centered on wrench center, rotated -45 deg on Z to be vertical
function createElevationIndicator() {
  const group = new THREE.Group();
  const arrowMat = new THREE.MeshBasicMaterial({ color: 0x44ff44 });

  // Shaft (vertical on Y axis)
  const shaftGeom = new THREE.BoxGeometry(0.006, 0.07, 0.006);
  const shaft = new THREE.Mesh(shaftGeom, arrowMat);
  group.add(shaft);

  // Up arrow head
  const upHeadGeom = new THREE.ConeGeometry(0.012, 0.02, 8);
  const upHead = new THREE.Mesh(upHeadGeom, arrowMat);
  upHead.position.y = 0.045;
  group.add(upHead);

  // Down arrow head
  const downHeadGeom = new THREE.ConeGeometry(0.012, 0.02, 8);
  const downHead = new THREE.Mesh(downHeadGeom, arrowMat);
  downHead.position.y = -0.045;
  downHead.rotation.z = Math.PI; // Point downward
  group.add(downHead);

  group.visible = false;

  return group;
}

// Wrench model for Adjust Cannon stage
function createWrenchModel() {
  const group = new THREE.Group();

  // Wrench body group (for shake animation)
  const wrenchBody = new THREE.Group();

  // Handle (long shaft)
  const handleGeom = new THREE.BoxGeometry(0.012, 0.08, 0.006);
  const handle = new THREE.Mesh(handleGeom, lightMetal);
  handle.position.y = -0.01;
  wrenchBody.add(handle);

  // Head base (thicker part at top)
  const headBaseGeom = new THREE.BoxGeometry(0.035, 0.025, 0.008);
  const headBase = new THREE.Mesh(headBaseGeom, midMetal);
  headBase.position.y = 0.04;
  wrenchBody.add(headBase);

  // Open jaw - left side (longer, open ended)
  const jawGeom = new THREE.BoxGeometry(0.008, 0.025, 0.008);
  const leftJaw = new THREE.Mesh(jawGeom, midMetal);
  leftJaw.position.set(-0.014, 0.062, 0);
  wrenchBody.add(leftJaw);

  // Open jaw - right side (shorter to show opening)
  const rightJawGeom = new THREE.BoxGeometry(0.008, 0.018, 0.008);
  const rightJaw = new THREE.Mesh(rightJawGeom, midMetal);
  rightJaw.position.set(0.014, 0.058, 0);
  wrenchBody.add(rightJaw);

  // Handle grip texture (small ridges)
  const gripGeom = new THREE.BoxGeometry(0.014, 0.004, 0.008);
  for (let i = 0; i < 4; i++) {
    const grip = new THREE.Mesh(gripGeom, darkMetal);
    grip.position.y = -0.035 + i * 0.012;
    wrenchBody.add(grip);
  }

  group.add(wrenchBody);

  // Add indicators (both centered on wrench)
  const rotationIndicator = createRotationIndicator();
  rotationIndicator.position.set(0, 0.02, 0); // Centered on wrench head
  group.add(rotationIndicator);

  const elevationIndicator = createElevationIndicator();
  elevationIndicator.position.set(0, 0.02, 0); // Centered on wrench head
  group.add(elevationIndicator);

  group.scale.setScalar(1.8);

  // Static rotation - -40 degrees on Z
  group.rotation.z = THREE.MathUtils.degToRad(-40);

  // Store references for animation
  group.userData.wrenchBody = wrenchBody;
  group.userData.rotationIndicator = rotationIndicator;
  group.userData.elevationIndicator = elevationIndicator;
  group.userData.baseRotationZ = THREE.MathUtils.degToRad(-40);
  group.userData.shaking = false;
  group.userData.shakeTime = 0;
  group.userData.mode = 'none'; // 'none', 'rotation', 'elevation'
  group.userData.indicatorTime = 0;

  return group;
}

// Button box model for Fire Cannon stage - with animated button
function createButtonBoxModel() {
  const group = new THREE.Group();

  // Box base
  const boxGeom = new THREE.BoxGeometry(0.055, 0.025, 0.055);
  const boxMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.7 });
  const box = new THREE.Mesh(boxGeom, boxMat);
  group.add(box);

  // Top plate with slight bevel
  const plateGeom = new THREE.BoxGeometry(0.05, 0.004, 0.05);
  const plateMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.5 });
  const plate = new THREE.Mesh(plateGeom, plateMat);
  plate.position.y = 0.014;
  group.add(plate);

  // Red button on top (will be animated)
  const buttonGeom = new THREE.CylinderGeometry(0.016, 0.018, 0.012, 16);
  const buttonMat = new THREE.MeshStandardMaterial({
    color: 0xcc2222,
    roughness: 0.3,
    metalness: 0.2
  });
  const button = new THREE.Mesh(buttonGeom, buttonMat);
  button.position.y = 0.022;
  group.add(button);

  // Button rim
  const rimGeom = new THREE.TorusGeometry(0.018, 0.003, 8, 16);
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const rim = new THREE.Mesh(rimGeom, rimMat);
  rim.position.y = 0.016;
  rim.rotation.x = Math.PI / 2;
  group.add(rim);

  // Button highlight (shiny top)
  const highlightGeom = new THREE.CircleGeometry(0.008, 12);
  const highlightMat = new THREE.MeshStandardMaterial({
    color: 0xff4444,
    roughness: 0.1,
    metalness: 0.3
  });
  const highlight = new THREE.Mesh(highlightGeom, highlightMat);
  highlight.position.y = 0.029;
  highlight.rotation.x = -Math.PI / 2;
  group.add(highlight);

  group.scale.setScalar(1.4);

  // Store button reference for animation
  group.userData.button = button;
  group.userData.highlight = highlight;
  group.userData.buttonBaseY = 0.022;
  group.userData.highlightBaseY = 0.029;
  group.userData.pressing = false;
  group.userData.pressTime = 0;

  return group;
}

// Move marker model for Move To Next Shot stage (arrow/flag icon)
function createMoveMarkerModel() {
  const group = new THREE.Group();

  // Flag pole
  const poleGeom = new THREE.CylinderGeometry(0.003, 0.003, 0.08, 8);
  const poleMat = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    roughness: 0.3,
    metalness: 0.2
  });
  const pole = new THREE.Mesh(poleGeom, poleMat);
  pole.position.y = 0.02;
  group.add(pole);

  // Flag (triangular)
  const flagShape = new THREE.Shape();
  flagShape.moveTo(0, 0);
  flagShape.lineTo(0.04, 0.015);
  flagShape.lineTo(0, 0.03);
  flagShape.lineTo(0, 0);

  const flagGeom = new THREE.ShapeGeometry(flagShape);
  const flagMat = new THREE.MeshStandardMaterial({
    color: 0x44cc44,
    roughness: 0.6,
    side: THREE.DoubleSide
  });
  const flag = new THREE.Mesh(flagGeom, flagMat);
  flag.position.set(0.003, 0.03, 0);
  flag.rotation.y = Math.PI / 2;
  group.add(flag);

  // Base ring
  const ringGeom = new THREE.TorusGeometry(0.015, 0.003, 8, 16);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x44cc44,
    roughness: 0.4
  });
  const ring = new THREE.Mesh(ringGeom, ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -0.02;
  group.add(ring);

  group.scale.setScalar(1.5);
  group.rotation.x = -0.2; // Tilt slightly towards camera

  return group;
}

// Create all hand objects
export function createHandObjects() {
  return {
    'drone': createDroneModel(),
    'sphere': createSphereModel(),
    'wrench': createWrenchModel(),
    'button-box': createButtonBoxModel(),
    'move-marker': createMoveMarkerModel()
  };
}

// Animation update function - call from main loop
export function updateHandObjectAnimations(handObjects, currentStageId, dt) {
  // Drone rotor animation (always animate when visible)
  const drone = handObjects['drone'];
  if (drone && drone.userData.rotorBlades) {
    const rotorSpeed = 25; // radians per second
    drone.userData.rotorBlades.forEach((bladeGroup, index) => {
      // Alternate direction for adjacent rotors
      const direction = index % 2 === 0 ? 1 : -1;
      bladeGroup.rotation.y += rotorSpeed * direction * dt;
    });

    // Wobble animation - different frequencies for organic movement
    drone.userData.wobbleTime = (drone.userData.wobbleTime || 0) + dt;
    const t = drone.userData.wobbleTime;
    const wobbleAmount = 0.08; // radians
    drone.rotation.x = Math.sin(t * 1.3) * wobbleAmount;
    drone.rotation.y = Math.sin(t * 0.9) * wobbleAmount * 0.7;
    drone.rotation.z = Math.sin(t * 1.7) * wobbleAmount * 0.5;
  }

  // Button press animation (Fire Cannon stage)
  const buttonBox = handObjects['button-box'];
  if (buttonBox && buttonBox.userData.pressing) {
    buttonBox.userData.pressTime += dt;
    const pressDuration = 0.15;
    const returnDuration = 0.1;
    const pressDepth = 0.008;

    if (buttonBox.userData.pressTime < pressDuration) {
      // Pressing down
      const t = buttonBox.userData.pressTime / pressDuration;
      const offset = pressDepth * Math.sin(t * Math.PI / 2);
      buttonBox.userData.button.position.y = buttonBox.userData.buttonBaseY - offset;
      buttonBox.userData.highlight.position.y = buttonBox.userData.highlightBaseY - offset;
    } else if (buttonBox.userData.pressTime < pressDuration + returnDuration) {
      // Returning up
      const t = (buttonBox.userData.pressTime - pressDuration) / returnDuration;
      const offset = pressDepth * (1 - t);
      buttonBox.userData.button.position.y = buttonBox.userData.buttonBaseY - offset;
      buttonBox.userData.highlight.position.y = buttonBox.userData.highlightBaseY - offset;
    } else {
      // Animation complete
      buttonBox.userData.pressing = false;
      buttonBox.userData.pressTime = 0;
      buttonBox.userData.button.position.y = buttonBox.userData.buttonBaseY;
      buttonBox.userData.highlight.position.y = buttonBox.userData.highlightBaseY;
    }
  }

  // Wrench animations
  const wrench = handObjects['wrench'];
  if (wrench && wrench.userData) {
    // Shake animation (when too far from cannon)
    if (wrench.userData.shaking) {
      wrench.userData.shakeTime += dt;
      const shakeDuration = 0.4;
      const shakeIntensity = 0.15;
      const shakeFreq = 25;

      if (wrench.userData.shakeTime < shakeDuration) {
        const decay = 1 - (wrench.userData.shakeTime / shakeDuration);
        const shake = Math.sin(wrench.userData.shakeTime * shakeFreq) * shakeIntensity * decay;
        wrench.rotation.z = wrench.userData.baseRotationZ + shake;
      } else {
        wrench.userData.shaking = false;
        wrench.userData.shakeTime = 0;
        wrench.rotation.z = wrench.userData.baseRotationZ;
      }
    }

    // Indicator animations
    if (wrench.userData.mode !== 'none') {
      wrench.userData.indicatorTime += dt;
      const t = wrench.userData.indicatorTime;

      if (wrench.userData.mode === 'rotation' && wrench.userData.rotationIndicator) {
        // Rotate the circular arrow
        wrench.userData.rotationIndicator.rotation.z = t * 2;
      }

      if (wrench.userData.mode === 'elevation' && wrench.userData.elevationIndicator) {
        // Bob the up/down arrow around center position
        wrench.userData.elevationIndicator.position.y = 0.02 + Math.sin(t * 4) * 0.015;
      }
    }
  }
}

// Trigger button press animation
export function triggerButtonPress(handObjects) {
  const buttonBox = handObjects['button-box'];
  if (buttonBox) {
    buttonBox.userData.pressing = true;
    buttonBox.userData.pressTime = 0;
  }
}

// Trigger wrench shake animation (when action fails)
export function triggerWrenchShake(handObjects) {
  const wrench = handObjects['wrench'];
  if (wrench && wrench.userData) {
    wrench.userData.shaking = true;
    wrench.userData.shakeTime = 0;
  }
}

// Set wrench indicator mode: 'none', 'rotation', 'elevation'
export function setWrenchMode(handObjects, mode) {
  const wrench = handObjects['wrench'];
  if (wrench && wrench.userData) {
    // Only reset animation time when mode actually changes
    const modeChanged = wrench.userData.mode !== mode;
    wrench.userData.mode = mode;

    if (modeChanged) {
      wrench.userData.indicatorTime = 0;

      // Reset wrench rotation when changing modes
      if (!wrench.userData.shaking) {
        wrench.rotation.z = wrench.userData.baseRotationZ;
      }
    }

    // Show/hide indicators
    if (wrench.userData.rotationIndicator) {
      wrench.userData.rotationIndicator.visible = (mode === 'rotation');
    }
    if (wrench.userData.elevationIndicator) {
      wrench.userData.elevationIndicator.visible = (mode === 'elevation');
    }
  }
}

// Get current wrench mode
export function getWrenchMode(handObjects) {
  const wrench = handObjects['wrench'];
  if (wrench && wrench.userData) {
    return wrench.userData.mode || 'none';
  }
  return 'none';
}
