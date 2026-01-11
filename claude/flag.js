// Flag module - golf hole marker
import * as THREE from 'three';

export function createFlag(config = {}) {
  const group = new THREE.Group();

  // Scale up for visibility from drone (configurable, default 4x)
  const scale = config.scale !== undefined ? config.scale : 4;
  const poleHeight = (config.poleHeight || 2.0) * scale;
  const poleRadius = (config.poleRadius || 0.02) * scale;
  const flagWidth = (config.flagWidth || 0.6) * scale;
  const flagHeight = (config.flagHeight || 0.4) * scale;

  // Pole - white/light gray cylinder
  const poleGeometry = new THREE.CylinderGeometry(poleRadius, poleRadius * 1.2, poleHeight, 8);
  const poleMaterial = new THREE.MeshStandardMaterial({
    color: 0xeeeeee,
    roughness: 0.3,
    metalness: 0.1
  });
  const pole = new THREE.Mesh(poleGeometry, poleMaterial);
  pole.position.y = poleHeight / 2;
  pole.castShadow = true;
  group.add(pole);

  // Flag - triangular shape (red)
  const flagShape = new THREE.Shape();
  flagShape.moveTo(0, 0);
  flagShape.lineTo(flagWidth, flagHeight / 2);
  flagShape.lineTo(0, flagHeight);
  flagShape.lineTo(0, 0);

  const flagGeometry = new THREE.ShapeGeometry(flagShape);
  const flagMaterial = new THREE.MeshStandardMaterial({
    color: 0xcc2222,
    roughness: 0.6,
    metalness: 0.0,
    side: THREE.DoubleSide
  });
  const flag = new THREE.Mesh(flagGeometry, flagMaterial);
  flag.position.set(poleRadius, poleHeight - flagHeight - poleRadius * 2, 0);
  flag.castShadow = true;
  group.add(flag);

  // Ball/finial on top of pole
  const finialGeometry = new THREE.SphereGeometry(poleRadius * 2, 8, 6);
  const finialMaterial = new THREE.MeshStandardMaterial({
    color: 0xffcc00,
    roughness: 0.3,
    metalness: 0.2
  });
  const finial = new THREE.Mesh(finialGeometry, finialMaterial);
  finial.position.y = poleHeight;
  finial.castShadow = true;
  group.add(finial);

  // Hole ring on ground (visual indicator)
  const ringGeometry = new THREE.RingGeometry(
    (config.holeRadius || 0.15) * scale * 0.8,
    (config.holeRadius || 0.15) * scale * 1.2,
    24
  );
  const ringMaterial = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.8,
    metalness: 0.0,
    side: THREE.DoubleSide
  });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.01; // Slightly above ground to prevent z-fighting
  group.add(ring);

  return group;
}

// Position flag at a specific hole
export function positionFlag(flag, position) {
  flag.position.set(position.x, position.y, position.z);
}
