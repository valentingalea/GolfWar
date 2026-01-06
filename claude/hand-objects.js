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

// Cog wheel model for Adjust Cannon stage - with oscillating rotation
function createCogWheelModel() {
  const group = new THREE.Group();

  // Central hub
  const hubGeom = new THREE.CylinderGeometry(0.018, 0.018, 0.012, 16);
  const hub = new THREE.Mesh(hubGeom, lightMetal);
  hub.rotation.x = Math.PI / 2;
  group.add(hub);

  // Outer ring
  const ringGeom = new THREE.TorusGeometry(0.032, 0.006, 8, 24);
  const ring = new THREE.Mesh(ringGeom, midMetal);
  group.add(ring);

  // Teeth (12 teeth around the wheel)
  const toothCount = 12;
  const toothGeom = new THREE.BoxGeometry(0.012, 0.008, 0.012);

  for (let i = 0; i < toothCount; i++) {
    const angle = (i / toothCount) * Math.PI * 2;
    const tooth = new THREE.Mesh(toothGeom, midMetal);
    tooth.position.set(
      Math.cos(angle) * 0.042,
      Math.sin(angle) * 0.042,
      0
    );
    tooth.rotation.z = angle;
    group.add(tooth);
  }

  // Spokes connecting hub to ring
  const spokeGeom = new THREE.BoxGeometry(0.025, 0.004, 0.006);
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const spoke = new THREE.Mesh(spokeGeom, lightMetal);
    spoke.position.set(
      Math.cos(angle) * 0.018,
      Math.sin(angle) * 0.018,
      0
    );
    spoke.rotation.z = angle;
    group.add(spoke);
  }

  // Center hole
  const holeGeom = new THREE.CylinderGeometry(0.006, 0.006, 0.015, 6);
  const holeMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const hole = new THREE.Mesh(holeGeom, holeMat);
  hole.rotation.x = Math.PI / 2;
  group.add(hole);

  group.scale.setScalar(1.5);

  // Store animation state
  group.userData.animTime = 0;

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

// Placeholder model for Move To Next Shot stage
function createPlaceholderModel() {
  const group = new THREE.Group();

  // Simple cube with question mark texture idea
  const cubeGeom = new THREE.BoxGeometry(0.04, 0.04, 0.04);
  const cubeMat = new THREE.MeshStandardMaterial({
    color: 0x666688,
    roughness: 0.5,
    metalness: 0.3
  });
  const cube = new THREE.Mesh(cubeGeom, cubeMat);
  group.add(cube);

  // Arrow pointing forward
  const arrowShaftGeom = new THREE.BoxGeometry(0.008, 0.008, 0.04);
  const arrowMat = new THREE.MeshStandardMaterial({ color: 0x88ff88 });
  const shaft = new THREE.Mesh(arrowShaftGeom, arrowMat);
  shaft.position.z = 0.03;
  group.add(shaft);

  // Arrow head
  const arrowHeadGeom = new THREE.ConeGeometry(0.012, 0.02, 6);
  const head = new THREE.Mesh(arrowHeadGeom, arrowMat);
  head.position.z = 0.06;
  head.rotation.x = Math.PI / 2;
  group.add(head);

  group.scale.setScalar(1.3);

  return group;
}

// Create all hand objects
export function createHandObjects() {
  return {
    'drone': createDroneModel(),
    'sphere': createSphereModel(),
    'cogwheel': createCogWheelModel(),
    'button-box': createButtonBoxModel(),
    'placeholder': createPlaceholderModel()
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

  // Cog oscillation animation (Adjust Cannon stage)
  const cog = handObjects['cogwheel'];
  if (cog && currentStageId === 'adjust-cannon') {
    cog.userData.animTime = (cog.userData.animTime || 0) + dt;
    const oscillation = Math.sin(cog.userData.animTime * 1.5) * 0.3; // Slow oscillation
    cog.rotation.z = oscillation;
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
}

// Trigger button press animation
export function triggerButtonPress(handObjects) {
  const buttonBox = handObjects['button-box'];
  if (buttonBox) {
    buttonBox.userData.pressing = true;
    buttonBox.userData.pressTime = 0;
  }
}
