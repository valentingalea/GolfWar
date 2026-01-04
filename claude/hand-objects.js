// Hand Objects - 3D models held between hands for each stage
import * as THREE from 'three';

// Shared materials
const darkMetal = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6, metalness: 0.4 });
const midMetal = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.5, metalness: 0.5 });
const lightMetal = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.4, metalness: 0.6 });

// Drone model for Idle stage
function createDroneModel() {
  const group = new THREE.Group();

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

  armPositions.forEach(pos => {
    const arm = new THREE.Mesh(armGeom, midMetal);
    arm.position.set(pos.x, 0, pos.z);
    arm.rotation.y = pos.rot;
    group.add(arm);

    // Rotor disc at each arm end
    const rotorGeom = new THREE.CylinderGeometry(0.012, 0.012, 0.003, 8);
    const rotor = new THREE.Mesh(rotorGeom, lightMetal);
    rotor.position.set(pos.x * 1.6, 0.005, pos.z * 1.6);
    group.add(rotor);

    // Rotor blades (simple cross)
    const bladeGeom = new THREE.BoxGeometry(0.025, 0.001, 0.004);
    const blade1 = new THREE.Mesh(bladeGeom, midMetal);
    blade1.position.set(pos.x * 1.6, 0.008, pos.z * 1.6);
    group.add(blade1);

    const blade2 = new THREE.Mesh(bladeGeom, midMetal);
    blade2.position.set(pos.x * 1.6, 0.008, pos.z * 1.6);
    blade2.rotation.y = Math.PI / 2;
    group.add(blade2);
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

  return group;
}

// Sphere model for Setup Projectile stage
function createSphereModel() {
  const geometry = new THREE.SphereGeometry(0.035, 16, 16);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.3,
    metalness: 0.1
  });
  const sphere = new THREE.Mesh(geometry, material);
  return sphere;
}

// Cog wheel model for Adjust Cannon stage
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

  return group;
}

// Button box model for Fire Cannon stage
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

  // Red button on top
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
