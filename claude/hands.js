// First-person hands module - more realistic low poly
import * as THREE from 'three';

// Create a finger segment (tapered cylinder)
function createFingerSegment(radiusTop, radiusBottom, length, material) {
  const geom = new THREE.CylinderGeometry(radiusTop, radiusBottom, length, 8);
  const mesh = new THREE.Mesh(geom, material);
  mesh.rotation.x = Math.PI / 2;
  return mesh;
}

// Create a complete finger with 3 segments
function createFinger(baseRadius, length, material, curl = [0.3, 0.4, 0.3]) {
  const finger = new THREE.Group();

  // Segment lengths (proximal, middle, distal)
  const segLengths = [length * 0.45, length * 0.30, length * 0.25];
  const radii = [baseRadius, baseRadius * 0.9, baseRadius * 0.8, baseRadius * 0.6];

  let zOffset = 0;
  let currentGroup = finger;

  for (let i = 0; i < 3; i++) {
    const joint = new THREE.Group();
    joint.position.z = zOffset;
    joint.rotation.x = curl[i];

    const segment = createFingerSegment(radii[i + 1], radii[i], segLengths[i], material);
    segment.position.z = segLengths[i] / 2;
    joint.add(segment);

    currentGroup.add(joint);
    currentGroup = joint;
    zOffset = segLengths[i];
  }

  return finger;
}

// Create thumb with 2 main segments
function createThumb(material, isLeft) {
  const thumb = new THREE.Group();
  const side = isLeft ? 1 : -1;

  // Base/metacarpal
  const baseGeom = new THREE.CylinderGeometry(0.012, 0.014, 0.035, 8);
  const base = new THREE.Mesh(baseGeom, material);
  base.rotation.x = -Math.PI / 2;
  base.rotation.z = side * 0.8;
  base.position.z = 0.015;
  thumb.add(base);

  // Proximal segment
  const proxGroup = new THREE.Group();
  proxGroup.position.set(side * 0.02, 0, 0.035);
  proxGroup.rotation.x = 0.4;
  proxGroup.rotation.z = side * 0.3;

  const proxGeom = new THREE.CylinderGeometry(0.010, 0.012, 0.03, 8);
  const prox = new THREE.Mesh(proxGeom, material);
  prox.rotation.x = Math.PI / 2;
  prox.position.z = 0.015;
  proxGroup.add(prox);

  // Distal segment
  const distGroup = new THREE.Group();
  distGroup.position.z = 0.03;
  distGroup.rotation.x = 0.3;

  const distGeom = new THREE.CylinderGeometry(0.007, 0.010, 0.025, 8);
  const dist = new THREE.Mesh(distGeom, material);
  dist.rotation.x = Math.PI / 2;
  dist.position.z = 0.012;
  distGroup.add(dist);

  proxGroup.add(distGroup);
  thumb.add(proxGroup);

  return thumb;
}

// Create realistic hand
function createHand(isLeft) {
  const hand = new THREE.Group();
  const side = isLeft ? 1 : -1;

  // Skin tone material with some shading
  const skinMaterial = new THREE.MeshStandardMaterial({
    color: 0xd4a574,
    roughness: 0.7,
    metalness: 0.0,
    side: THREE.DoubleSide
  });

  // Palm - rounded box shape using multiple parts (scaled down 37.5%)
  const palmGroup = new THREE.Group();
  const palmScale = 0.625;

  // Main palm body
  const palmGeom = new THREE.BoxGeometry(0.075 * palmScale, 0.025 * palmScale, 0.085 * palmScale);
  palmGeom.translate(0, 0, 0.01 * palmScale);
  const palm = new THREE.Mesh(palmGeom, skinMaterial);
  palmGroup.add(palm);

  // Palm top (where fingers connect) - slightly rounded
  const palmTopGeom = new THREE.CylinderGeometry(0.035 * palmScale, 0.038 * palmScale, 0.075 * palmScale, 8);
  const palmTop = new THREE.Mesh(palmTopGeom, skinMaterial);
  palmTop.rotation.z = Math.PI / 2;
  palmTop.position.set(0, 0.005 * palmScale, 0.05 * palmScale);
  palmGroup.add(palmTop);

  // Heel of palm
  const heelGeom = new THREE.SphereGeometry(0.025 * palmScale, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  const heel = new THREE.Mesh(heelGeom, skinMaterial);
  heel.rotation.x = Math.PI;
  heel.position.set(0, -0.005 * palmScale, -0.03 * palmScale);
  palmGroup.add(heel);

  // Thumb mount area
  const thumbMountGeom = new THREE.SphereGeometry(0.02 * palmScale, 8, 6);
  const thumbMount = new THREE.Mesh(thumbMountGeom, skinMaterial);
  thumbMount.position.set(side * 0.04 * palmScale, 0.005 * palmScale, 0.01 * palmScale);
  thumbMount.scale.set(1, 0.8, 1.2);
  palmGroup.add(thumbMount);

  hand.add(palmGroup);

  // Fingers - index, middle, ring, pinky
  const fingerConfigs = [
    { x: -0.024, length: 0.065, radius: 0.009, curl: [0.35, 0.45, 0.35] }, // Index
    { x: -0.008, length: 0.072, radius: 0.0095, curl: [0.30, 0.40, 0.30] }, // Middle
    { x: 0.008, length: 0.065, radius: 0.009, curl: [0.35, 0.45, 0.35] },  // Ring
    { x: 0.024, length: 0.052, radius: 0.008, curl: [0.40, 0.50, 0.40] }   // Pinky
  ];

  const fingersGroup = new THREE.Group();
  fingersGroup.position.set(0, 0.005, 0.055);

  fingerConfigs.forEach(config => {
    const finger = createFinger(config.radius, config.length, skinMaterial, config.curl);
    finger.position.x = config.x * side * -1; // Mirror for left hand
    finger.rotation.x = -0.1; // Slight forward angle
    fingersGroup.add(finger);
  });

  hand.add(fingersGroup);

  // Thumb
  const thumb = createThumb(skinMaterial, isLeft);
  thumb.position.set(side * 0.038, 0.01, 0.01);
  hand.add(thumb);

  // Wrist (scaled down 50%)
  const wristGeom = new THREE.CylinderGeometry(0.028 * palmScale, 0.032 * palmScale, 0.05 * palmScale, 10);
  const wrist = new THREE.Mesh(wristGeom, skinMaterial);
  wrist.rotation.x = Math.PI / 2;
  wrist.position.set(0, 0, -0.055 * palmScale);
  hand.add(wrist);

  // Forearm hint (scaled down 50%)
  const forearmGeom = new THREE.CylinderGeometry(0.032 * palmScale, 0.035 * palmScale, 0.08 * palmScale, 10);
  const forearm = new THREE.Mesh(forearmGeom, skinMaterial);
  forearm.rotation.x = Math.PI / 2;
  forearm.position.set(0, 0, -0.11 * palmScale);
  hand.add(forearm);

  // Miror so thumbs are on outside
  hand.scale.x = -1;

  return hand;
}

// Create the first-person hands rig
export function createFirstPersonHands(camera) {
  // Container that follows the camera
  const handsRig = new THREE.Group();

  // Default rotation: X=-137, Y=0, Z=41 degrees
  const defaultRotX = THREE.MathUtils.degToRad(-137);
  const defaultRotZ = THREE.MathUtils.degToRad(41);

  // Left hand
  const leftHand = createHand(true);
  leftHand.position.set(-0.15, -0.15, -0.35);
  leftHand.rotation.set(defaultRotX, 0, defaultRotZ);
  handsRig.add(leftHand);

  // Right hand
  const rightHand = createHand(false);
  rightHand.position.set(0.15, -0.15, -0.35);
  rightHand.rotation.set(defaultRotX, 0, -defaultRotZ);
  handsRig.add(rightHand);

  // Attach to camera
  camera.add(handsRig);

  return {
    rig: handsRig,
    leftHand,
    rightHand,
    setVisible(visible) {
      handsRig.visible = visible;
    }
  };
}
