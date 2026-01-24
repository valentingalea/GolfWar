// Cannon/Howitzer module - model, controls, firing animation
import * as THREE from 'three';

// Materials shared across howitzer components
const metalDark = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6, metalness: 0.4 });
const metalMid = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.5, metalness: 0.5 });
const metalLight = new THREE.MeshStandardMaterial({ color: 0x6a6a6a, roughness: 0.4, metalness: 0.6 });
const rubber = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9, metalness: 0.0 });

// Wheel dimensions
const wheelRadius = 0.5;
const wheelWidth = 0.28;
const wheelGeometry = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 32);

// Create a wheel with hub and spokes
function createWheel() {
  const wheelGroup = new THREE.Group();

  const tire = new THREE.Mesh(wheelGeometry, rubber);
  tire.rotation.z = Math.PI / 2;
  wheelGroup.add(tire);

  const hubGeometry = new THREE.CylinderGeometry(0.15, 0.15, wheelWidth + 0.02, 16);
  const hub = new THREE.Mesh(hubGeometry, metalMid);
  hub.rotation.z = Math.PI / 2;
  wheelGroup.add(hub);

  const spokeGeometry = new THREE.BoxGeometry(0.04, wheelRadius * 1.6, 0.03);
  for (let i = 0; i < 6; i++) {
    const spoke = new THREE.Mesh(spokeGeometry, metalMid);
    spoke.rotation.x = (i / 6) * Math.PI;
    wheelGroup.add(spoke);
  }

  return wheelGroup;
}

// Create trail leg with spade
function createTrail(side) {
  const trailGroup = new THREE.Group();

  const beamGeometry = new THREE.BoxGeometry(0.12, 0.15, 2.5);
  const beam = new THREE.Mesh(beamGeometry, metalMid);
  beam.position.set(0, 0.08, -1.25);
  trailGroup.add(beam);

  const spadeGeometry = new THREE.BoxGeometry(0.3, 0.4, 0.05);
  const spade = new THREE.Mesh(spadeGeometry, metalDark);
  spade.position.set(0, 0.1, -2.5);
  spade.rotation.x = -0.3;
  trailGroup.add(spade);

  const spikeGeometry = new THREE.ConeGeometry(0.06, 0.2, 8);
  const spike = new THREE.Mesh(spikeGeometry, metalDark);
  spike.position.set(0, -0.05, -2.55);
  spike.rotation.x = Math.PI / 2;
  trailGroup.add(spike);

  trailGroup.position.x = side * 0.5;
  return trailGroup;
}

// Create muzzle flash texture
function createMuzzleFlashTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  gradient.addColorStop(0, 'rgba(255, 255, 200, 1)');
  gradient.addColorStop(0.2, 'rgba(255, 200, 100, 0.9)');
  gradient.addColorStop(0.5, 'rgba(255, 150, 50, 0.5)');
  gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Create the complete howitzer model
export function createHowitzer(scene, config = {}) {
  const position = config.position || { x: 3, y: 0, z: 0 };
  const rotation = config.rotation !== undefined ? config.rotation : Math.PI;
  const scale = config.scale || 1.2;

  const howitzer = new THREE.Group();
  howitzer.position.set(position.x, position.y, position.z);
  howitzer.rotation.y = rotation;
  howitzer.scale.setScalar(scale);
  scene.add(howitzer);

  // Carriage group - moves during recoil
  const carriageGroup = new THREE.Group();
  howitzer.add(carriageGroup);

  // Wheels
  const leftWheel = createWheel();
  leftWheel.position.set(-0.9, wheelRadius, 0.3);
  carriageGroup.add(leftWheel);

  const rightWheel = createWheel();
  rightWheel.position.set(0.9, wheelRadius, 0.3);
  carriageGroup.add(rightWheel);

  // Axle
  const axleGeometry = new THREE.CylinderGeometry(0.06, 0.06, 2.0, 16);
  const axle = new THREE.Mesh(axleGeometry, metalDark);
  axle.rotation.z = Math.PI / 2;
  axle.position.set(0, wheelRadius, 0.3);
  carriageGroup.add(axle);

  // Trails
  howitzer.add(createTrail(-1));
  howitzer.add(createTrail(1));

  // Trail cross-brace
  const braceGeometry = new THREE.BoxGeometry(1.1, 0.08, 0.08);
  const brace = new THREE.Mesh(braceGeometry, metalMid);
  brace.position.set(0, 0.12, -1.8);
  howitzer.add(brace);

  // Carriage body
  const carriageGeometry = new THREE.BoxGeometry(0.9, 0.35, 0.8);
  const carriage = new THREE.Mesh(carriageGeometry, metalMid);
  carriage.position.set(0, 0.45, 0.1);
  carriageGroup.add(carriage);

  const topPlateGeometry = new THREE.BoxGeometry(0.7, 0.08, 0.6);
  const topPlate = new THREE.Mesh(topPlateGeometry, metalLight);
  topPlate.position.set(0, 0.65, 0.1);
  carriageGroup.add(topPlate);

  // Turret group
  const turretGroup = new THREE.Group();
  turretGroup.position.set(0, 0.75, 0.1);
  carriageGroup.add(turretGroup);

  const pivotBaseGeometry = new THREE.CylinderGeometry(0.25, 0.3, 0.2, 24);
  const pivotBase = new THREE.Mesh(pivotBaseGeometry, metalLight);
  turretGroup.add(pivotBase);

  // Elevating group
  const elevatingGroup = new THREE.Group();
  elevatingGroup.position.set(0, 0.1, 0);
  elevatingGroup.rotation.x = -THREE.MathUtils.degToRad(40);
  turretGroup.add(elevatingGroup);

  // Cradle
  const cradleGeometry = new THREE.BoxGeometry(0.5, 0.25, 0.8);
  const cradle = new THREE.Mesh(cradleGeometry, metalMid);
  cradle.position.set(0, 0, 0.2);
  elevatingGroup.add(cradle);

  // Barrel assembly
  const outerBarrelRadius = 0.14;
  const outerBarrelLength = 1.8;
  const outerBarrelGeometry = new THREE.CylinderGeometry(
    outerBarrelRadius, outerBarrelRadius * 1.1, outerBarrelLength, 32
  );
  const outerBarrel = new THREE.Mesh(outerBarrelGeometry, metalMid);
  outerBarrel.rotation.x = Math.PI / 2;
  outerBarrel.position.set(0, 0.05, outerBarrelLength / 2 + 0.3);
  elevatingGroup.add(outerBarrel);

  const innerBarrelRadius = 0.09;
  const innerBarrelLength = 2.2;
  const innerBarrelGeometry = new THREE.CylinderGeometry(
    innerBarrelRadius, innerBarrelRadius, innerBarrelLength, 32
  );
  const innerBarrel = new THREE.Mesh(innerBarrelGeometry, metalLight);
  innerBarrel.rotation.x = Math.PI / 2;
  innerBarrel.position.set(0, 0.05, innerBarrelLength / 2 + 0.6);
  elevatingGroup.add(innerBarrel);

  // Muzzle brake
  const muzzleBrakeGeometry = new THREE.CylinderGeometry(0.12, 0.11, 0.25, 32);
  const muzzleBrake = new THREE.Mesh(muzzleBrakeGeometry, metalDark);
  muzzleBrake.rotation.x = Math.PI / 2;
  muzzleBrake.position.set(0, 0.05, innerBarrelLength + 0.75);
  elevatingGroup.add(muzzleBrake);

  // Breech
  const breechGeometry = new THREE.CylinderGeometry(0.16, 0.18, 0.35, 32);
  const breech = new THREE.Mesh(breechGeometry, metalDark);
  breech.rotation.x = Math.PI / 2;
  breech.position.set(0, 0.05, 0);
  elevatingGroup.add(breech);

  const breechBlockGeometry = new THREE.BoxGeometry(0.22, 0.22, 0.12);
  const breechBlock = new THREE.Mesh(breechBlockGeometry, metalDark);
  breechBlock.position.set(0, 0.05, -0.15);
  elevatingGroup.add(breechBlock);

  // Recoil cylinders
  const recoilCylinderGeometry = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 16);
  const leftRecoilCyl = new THREE.Mesh(recoilCylinderGeometry, metalDark);
  leftRecoilCyl.rotation.x = Math.PI / 2;
  leftRecoilCyl.position.set(-0.18, 0.12, 0.8);
  elevatingGroup.add(leftRecoilCyl);

  const rightRecoilCyl = new THREE.Mesh(recoilCylinderGeometry, metalDark);
  rightRecoilCyl.rotation.x = Math.PI / 2;
  rightRecoilCyl.position.set(0.18, 0.12, 0.8);
  elevatingGroup.add(rightRecoilCyl);

  // Equilibrators
  const equilibratorGeometry = new THREE.CylinderGeometry(0.05, 0.06, 0.7, 16);
  const leftEquilibrator = new THREE.Mesh(equilibratorGeometry, metalMid);
  leftEquilibrator.position.set(-0.35, 0.3, -0.1);
  leftEquilibrator.rotation.z = 0.3;
  leftEquilibrator.rotation.x = -0.2;
  elevatingGroup.add(leftEquilibrator);

  const rightEquilibrator = new THREE.Mesh(equilibratorGeometry, metalMid);
  rightEquilibrator.position.set(0.35, 0.3, -0.1);
  rightEquilibrator.rotation.z = -0.3;
  rightEquilibrator.rotation.x = -0.2;
  elevatingGroup.add(rightEquilibrator);

  // Shield
  const shieldGeometry = new THREE.BoxGeometry(1.4, 0.9, 0.04);
  const shield = new THREE.Mesh(shieldGeometry, metalMid);
  shield.position.set(0, 0.35, 0.5);
  shield.rotation.x = -0.15;
  elevatingGroup.add(shield);

  const shieldNotchGeometry = new THREE.CylinderGeometry(0.18, 0.18, 0.06, 16, 1, false, 0, Math.PI);
  const shieldNotch = new THREE.Mesh(shieldNotchGeometry, metalMid);
  shieldNotch.rotation.x = Math.PI / 2;
  shieldNotch.rotation.z = Math.PI;
  shieldNotch.position.set(0, -0.05, 0.52);
  elevatingGroup.add(shieldNotch);

  // Sight
  const sightBaseGeometry = new THREE.BoxGeometry(0.08, 0.12, 0.08);
  const sightBase = new THREE.Mesh(sightBaseGeometry, metalDark);
  sightBase.position.set(0.25, 0.15, 0.25);
  elevatingGroup.add(sightBase);

  const sightTubeGeometry = new THREE.CylinderGeometry(0.025, 0.025, 0.15, 12);
  const sightTube = new THREE.Mesh(sightTubeGeometry, metalDark);
  sightTube.position.set(0.25, 0.27, 0.25);
  elevatingGroup.add(sightTube);

  // Muzzle flash
  const muzzleFlash = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createMuzzleFlashTexture(),
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0
    })
  );
  muzzleFlash.scale.set(1.2, 1.2, 1);
  muzzleFlash.position.set(0, 0.05, innerBarrelLength + 1.0);
  elevatingGroup.add(muzzleFlash);

  // Loaded ball (shown at breech when cannon is loaded)
  const loadedBallGeometry = new THREE.SphereGeometry(0.12, 16, 16);
  const loadedBallMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.2,
    metalness: 0.1
  });
  const loadedBall = new THREE.Mesh(loadedBallGeometry, loadedBallMaterial);
  loadedBall.position.set(0, 0.05, 0.35); // Near the breech
  loadedBall.visible = false;
  loadedBall.castShadow = true;
  elevatingGroup.add(loadedBall);

  // Enable shadows
  howitzer.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return {
    group: howitzer,
    carriageGroup,
    turretGroup,
    elevatingGroup,
    leftWheel,
    rightWheel,
    innerBarrel,
    outerBarrel,
    muzzleBrake,
    muzzleFlash,
    loadedBall,
    wheelRadius,
    innerBarrelLength,
    // Base positions for animation
    innerBarrelBaseZ: innerBarrel.position.z,
    outerBarrelBaseZ: outerBarrel.position.z,
    muzzleBrakeBaseZ: muzzleBrake.position.z,
    carriageBaseZ: carriageGroup.position.z,
    carriageBaseRotX: carriageGroup.rotation.x
  };
}

// Firing animation state
export function createFiringAnimation() {
  return {
    active: false,
    time: 0,
    duration: 1.2,
    barrelRecoilDist: 1.0,
    barrelRecoilSpeed: 2,
    outerRecoilSpeed: 4,
    cannonRecoilDist: 0.15,
    cannonRockAngle: 0.08
  };
}

// Update firing animation
export function updateFiringAnimation(firingAnim, howitzer, dt) {
  if (!firingAnim.active) return;

  firingAnim.time += dt;
  const t = firingAnim.time;
  const duration = firingAnim.duration;

  if (t < duration) {
    // Muzzle flash
    const flashDuration = 0.1;
    if (t < flashDuration) {
      howitzer.muzzleFlash.material.opacity = 1 - (t / flashDuration);
      howitzer.muzzleFlash.scale.setScalar(1.2 + t * 3);
    } else {
      howitzer.muzzleFlash.material.opacity = 0;
    }

    // Inner barrel recoil
    const recoilPhase = t * firingAnim.barrelRecoilSpeed;
    const barrelOffset = firingAnim.barrelRecoilDist * Math.exp(-recoilPhase * 2) * Math.sin(recoilPhase * Math.PI);
    const currentBarrelRecoil = Math.max(0, barrelOffset);
    howitzer.innerBarrel.position.z = howitzer.innerBarrelBaseZ - currentBarrelRecoil;
    howitzer.muzzleBrake.position.z = howitzer.muzzleBrakeBaseZ - currentBarrelRecoil;

    // Outer barrel recoil
    const outerRecoilPhase = t * firingAnim.outerRecoilSpeed;
    const outerBarrelOffset = (firingAnim.barrelRecoilDist * 0.25) * Math.exp(-outerRecoilPhase * 2) * Math.sin(outerRecoilPhase * Math.PI);
    howitzer.outerBarrel.position.z = howitzer.outerBarrelBaseZ - Math.max(0, outerBarrelOffset);

    // Cannon body recoil and rock
    const cannonPhase = t * 8;
    const dampening = Math.exp(-t * 5);
    const rockAngle = firingAnim.cannonRockAngle * dampening * Math.sin(cannonPhase);
    howitzer.carriageGroup.rotation.x = howitzer.carriageBaseRotX - rockAngle;

    const slideBack = firingAnim.cannonRecoilDist * dampening * (1 - Math.cos(cannonPhase * 0.5));
    howitzer.carriageGroup.position.z = howitzer.carriageBaseZ - slideBack;

    // Wheel rotation
    const wheelRotation = slideBack / howitzer.wheelRadius;
    howitzer.leftWheel.rotation.x = wheelRotation;
    howitzer.rightWheel.rotation.x = wheelRotation;
  } else {
    // Reset
    firingAnim.active = false;
    howitzer.muzzleFlash.material.opacity = 0;
    howitzer.innerBarrel.position.z = howitzer.innerBarrelBaseZ;
    howitzer.outerBarrel.position.z = howitzer.outerBarrelBaseZ;
    howitzer.muzzleBrake.position.z = howitzer.muzzleBrakeBaseZ;
    howitzer.carriageGroup.rotation.x = howitzer.carriageBaseRotX;
    howitzer.carriageGroup.position.z = howitzer.carriageBaseZ;
    howitzer.leftWheel.rotation.x = 0;
    howitzer.rightWheel.rotation.x = 0;
  }
}

// Cannon controls
export function createCannonControls(howitzer) {
  let rotationDeg = 0;
  let elevationDeg = 40;

  const rotationValueEl = document.getElementById('rotationValue');
  const elevationValueEl = document.getElementById('elevationValue');

  function updateRotation() {
    howitzer.turretGroup.rotation.y = THREE.MathUtils.degToRad(rotationDeg);
    if (rotationValueEl) rotationValueEl.textContent = `${rotationDeg}°`;
  }

  function updateElevation() {
    elevationDeg = THREE.MathUtils.clamp(elevationDeg, 0, 80);
    howitzer.elevatingGroup.rotation.x = -THREE.MathUtils.degToRad(elevationDeg);
    if (elevationValueEl) elevationValueEl.textContent = `${elevationDeg}°`;
  }

  function adjustRotation(delta) {
    rotationDeg += delta;
    updateRotation();
    return rotationDeg;
  }

  function adjustElevation(delta) {
    elevationDeg += delta;
    updateElevation();
    return elevationDeg;
  }

  updateRotation();
  updateElevation();

  return {
    getRotation: () => rotationDeg,
    getElevation: () => elevationDeg,
    adjustRotation,
    adjustElevation
  };
}

// Howitzer weapon adapter for the projectile system
export function createHowitzerAdapter(howitzerData, firingAnim) {
  const recoilSpeedInput = document.getElementById('recoilSpeedInput');
  const outerRecoilSpeedInput = document.getElementById('outerRecoilSpeedInput');

  return {
    getMuzzlePosition() {
      const muzzleLocal = new THREE.Vector3(0, 0.05, howitzerData.innerBarrelLength + 0.9);
      howitzerData.elevatingGroup.localToWorld(muzzleLocal);
      return muzzleLocal;
    },
    getFiringDirection() {
      const direction = new THREE.Vector3(0, 0, 1);
      direction.applyQuaternion(howitzerData.elevatingGroup.getWorldQuaternion(new THREE.Quaternion()));
      return direction.normalize();
    },
    getPosition() {
      return howitzerData.group.position.clone();
    },
    setPosition(pos) {
      howitzerData.group.position.set(pos.x, pos.y, pos.z);
    },
    showLoadedBall(visible) {
      howitzerData.loadedBall.visible = visible;
    },
    triggerFire() {
      const recoilSpeed = parseFloat(recoilSpeedInput.value) || 2;
      const outerRecoilSpeed = parseFloat(outerRecoilSpeedInput.value) || 4;
      firingAnim.barrelRecoilSpeed = recoilSpeed;
      firingAnim.outerRecoilSpeed = outerRecoilSpeed;
      firingAnim.active = true;
      firingAnim.time = 0;
      howitzerData.muzzleFlash.material.opacity = 1;
    }
  };
}
