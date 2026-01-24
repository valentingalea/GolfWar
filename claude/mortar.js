// Mortar module - M252-style mortar model, controls, and firing animation
// Used for "putting" phase when ball is close to flag
import * as THREE from 'three';

// ========== MATERIALS ==========
const metalDark = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6, metalness: 0.4 });
const metalMid = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.5, metalness: 0.5 });
const mortarOlive = new THREE.MeshStandardMaterial({ color: 0x4a5a3a, roughness: 0.7, metalness: 0.3 });
const mortarDark = new THREE.MeshStandardMaterial({ color: 0x2a3a2a, roughness: 0.6, metalness: 0.4 });

// ========== MUZZLE FLASH TEXTURE ==========
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

// ========== MORTAR MODEL ==========
// M252-style 81mm mortar
// Based on M252 specs: 1.27m barrel, 81mm bore, elevation 45-85 degrees

export function createMortar(scene, config = {}) {
  const position = config.position || { x: 0, y: 0, z: 0 };
  const rotation = config.rotation !== undefined ? config.rotation : 0;
  const scale = config.scale || 1.0;

  const mortar = new THREE.Group();
  mortar.position.set(position.x, position.y, position.z);
  mortar.rotation.y = rotation;
  mortar.scale.setScalar(scale);
  scene.add(mortar);

  // ========== M252 DIMENSIONS ==========
  const tubeLength = 1.27;        // M252 barrel: 1.27m (56 inches)
  const tubeRadius = 0.075;       // Enlarged for visual impact (actual 81mm = 0.04m)
  const baseplateRadius = 0.38;   // M3A1 baseplate ~30" diameter
  const defaultElevation = 60;    // Degrees from horizontal

  // ========== BASEPLATE (M3A1) ==========
  const baseplateGeometry = new THREE.CylinderGeometry(baseplateRadius, baseplateRadius + 0.03, 0.025, 12);
  const baseplate = new THREE.Mesh(baseplateGeometry, mortarDark);
  baseplate.position.set(0, 0.0125, 0);
  mortar.add(baseplate);

  // Baseplate reinforcement ribs (radial)
  for (let i = 0; i < 6; i++) {
    const ribGeometry = new THREE.BoxGeometry(baseplateRadius * 0.8, 0.02, 0.025);
    const rib = new THREE.Mesh(ribGeometry, metalDark);
    rib.rotation.y = (i / 6) * Math.PI;
    rib.position.set(0, 0.035, 0);
    mortar.add(rib);
  }

  // Socket mount (rotatable ball joint)
  const socketGeometry = new THREE.SphereGeometry(0.09, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  const socket = new THREE.Mesh(socketGeometry, metalMid);
  socket.position.set(0, 0.025, 0);
  mortar.add(socket);

  // Socket collar ring
  const socketCollarGeometry = new THREE.TorusGeometry(0.095, 0.015, 8, 16);
  const socketCollar = new THREE.Mesh(socketCollarGeometry, metalDark);
  socketCollar.rotation.x = Math.PI / 2;
  socketCollar.position.set(0, 0.04, 0);
  mortar.add(socketCollar);

  // ========== TRAVERSING GROUP (rotates left/right) ==========
  const traverseGroup = new THREE.Group();
  traverseGroup.position.set(0, 0.025, 0);
  mortar.add(traverseGroup);

  // ========== ELEVATING GROUP (tilts up/down) ==========
  const elevatingGroup = new THREE.Group();
  elevatingGroup.position.set(0, 0.09, 0);
  elevatingGroup.rotation.x = -THREE.MathUtils.degToRad(defaultElevation);
  traverseGroup.add(elevatingGroup);

  // ========== TUBE/BARREL (M253 Cannon) ==========
  const tubeGeometry = new THREE.CylinderGeometry(tubeRadius * 0.92, tubeRadius * 1.08, tubeLength, 32);
  const tube = new THREE.Mesh(tubeGeometry, mortarOlive);
  tube.rotation.x = Math.PI / 2;
  tube.position.set(0, 0, tubeLength / 2);
  elevatingGroup.add(tube);

  // Muzzle reinforcement ring
  const muzzleRingGeometry = new THREE.TorusGeometry(tubeRadius + 0.012, 0.015, 12, 24);
  const muzzleRing = new THREE.Mesh(muzzleRingGeometry, metalMid);
  muzzleRing.position.set(0, 0, tubeLength - 0.01);
  elevatingGroup.add(muzzleRing);

  // ========== BLAST ATTENUATOR DEVICE (BAD) ==========
  const badBaseZ = tubeLength;

  // BAD base collar
  const badCollarGeometry = new THREE.CylinderGeometry(tubeRadius * 1.15, tubeRadius * 1.2, 0.04, 24);
  const badCollar = new THREE.Mesh(badCollarGeometry, metalDark);
  badCollar.rotation.x = Math.PI / 2;
  badCollar.position.set(0, 0, badBaseZ + 0.02);
  elevatingGroup.add(badCollar);

  // BAD main body
  const badBodyGeometry = new THREE.CylinderGeometry(tubeRadius * 1.25, tubeRadius * 1.15, 0.08, 24);
  const badBody = new THREE.Mesh(badBodyGeometry, metalDark);
  badBody.rotation.x = Math.PI / 2;
  badBody.position.set(0, 0, badBaseZ + 0.08);
  elevatingGroup.add(badBody);

  // BAD expansion chamber
  const badChamberGeometry = new THREE.CylinderGeometry(tubeRadius * 1.4, tubeRadius * 1.25, 0.06, 24);
  const badChamber = new THREE.Mesh(badChamberGeometry, metalMid);
  badChamber.rotation.x = Math.PI / 2;
  badChamber.position.set(0, 0, badBaseZ + 0.15);
  elevatingGroup.add(badChamber);

  // BAD cone section
  const badConeGeometry = new THREE.CylinderGeometry(tubeRadius * 1.6, tubeRadius * 1.4, 0.07, 24);
  const badCone = new THREE.Mesh(badConeGeometry, metalDark);
  badCone.rotation.x = Math.PI / 2;
  badCone.position.set(0, 0, badBaseZ + 0.215);
  elevatingGroup.add(badCone);

  // BAD outer rim
  const badRimGeometry = new THREE.TorusGeometry(tubeRadius * 1.6, 0.018, 12, 24);
  const badRim = new THREE.Mesh(badRimGeometry, metalMid);
  badRim.position.set(0, 0, badBaseZ + 0.25);
  elevatingGroup.add(badRim);

  // BAD vent rings
  for (let i = 0; i < 3; i++) {
    const ventGeometry = new THREE.TorusGeometry(tubeRadius * (1.2 + i * 0.12), 0.006, 8, 24);
    const vent = new THREE.Mesh(ventGeometry, mortarOlive);
    vent.position.set(0, 0, badBaseZ + 0.06 + i * 0.06);
    elevatingGroup.add(vent);
  }

  // ========== BREECH ==========
  const breechGeometry = new THREE.CylinderGeometry(tubeRadius * 1.1, tubeRadius * 1.2, 0.08, 24);
  const breech = new THREE.Mesh(breechGeometry, metalDark);
  breech.rotation.x = Math.PI / 2;
  breech.position.set(0, 0, -0.04);
  elevatingGroup.add(breech);

  // Breech ball (fits into baseplate socket)
  const breechBallGeometry = new THREE.SphereGeometry(0.07, 16, 12);
  const breechBall = new THREE.Mesh(breechBallGeometry, metalMid);
  breechBall.position.set(0, 0, -0.09);
  elevatingGroup.add(breechBall);

  // Carrying handle
  const handleGeometry = new THREE.TorusGeometry(0.05, 0.01, 8, 16, Math.PI);
  const handle = new THREE.Mesh(handleGeometry, metalMid);
  handle.rotation.y = Math.PI / 2;
  handle.rotation.z = Math.PI / 2;
  handle.position.set(0, 0.07, tubeLength * 0.35);
  elevatingGroup.add(handle);

  // ========== BIPOD (M177 Mount) ==========
  const bipodAttachPoint = tubeLength * 0.70;

  // Calculate leg length to reach ground
  const collarHeight = 0.09 + bipodAttachPoint * Math.sin(THREE.MathUtils.degToRad(defaultElevation));
  const legAngle = 0.18; // ~10 degrees outward
  const bipodLegLength = (collarHeight + 0.05) / Math.cos(legAngle);
  const bipodSpread = 0.5;

  // Bipod collar
  const collarGeometry = new THREE.CylinderGeometry(tubeRadius + 0.025, tubeRadius + 0.025, 0.08, 24);
  const collar = new THREE.Mesh(collarGeometry, metalMid);
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, 0, bipodAttachPoint);
  elevatingGroup.add(collar);

  // Collar clamp bands
  const bandGeometry = new THREE.TorusGeometry(tubeRadius + 0.03, 0.008, 8, 24);
  const frontBand = new THREE.Mesh(bandGeometry, metalDark);
  frontBand.position.set(0, 0, bipodAttachPoint + 0.03);
  elevatingGroup.add(frontBand);
  const rearBand = new THREE.Mesh(bandGeometry, metalDark);
  rearBand.position.set(0, 0, bipodAttachPoint - 0.03);
  elevatingGroup.add(rearBand);

  // Bipod yoke
  const yokeGeometry = new THREE.BoxGeometry(bipodSpread + 0.1, 0.04, 0.06);
  const yoke = new THREE.Mesh(yokeGeometry, metalMid);
  yoke.position.set(0, -tubeRadius - 0.04, bipodAttachPoint);
  elevatingGroup.add(yoke);

  // Leg construction helper
  function createBipodLeg(side) {
    const legGroup = new THREE.Group();
    const xOffset = side * (bipodSpread / 2);

    const legGeometry = new THREE.CylinderGeometry(0.022, 0.018, bipodLegLength, 12);
    const leg = new THREE.Mesh(legGeometry, mortarOlive);
    legGroup.add(leg);

    const clampGeometry = new THREE.BoxGeometry(0.05, 0.06, 0.04);
    const clamp = new THREE.Mesh(clampGeometry, metalMid);
    clamp.position.y = bipodLegLength / 2 - 0.02;
    legGroup.add(clamp);

    const footDiscGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.015, 12);
    const footDisc = new THREE.Mesh(footDiscGeometry, metalDark);
    footDisc.position.y = -bipodLegLength / 2;
    footDisc.rotation.z = -side * legAngle;
    legGroup.add(footDisc);

    const spikeGeometry = new THREE.ConeGeometry(0.02, 0.08, 8);
    const spike = new THREE.Mesh(spikeGeometry, metalDark);
    spike.position.y = -bipodLegLength / 2 - 0.05;
    spike.rotation.z = Math.PI - side * legAngle;
    legGroup.add(spike);

    legGroup.position.set(xOffset, -tubeRadius - 0.06 - bipodLegLength / 2, bipodAttachPoint);
    legGroup.rotation.z = side * legAngle;

    return legGroup;
  }

  elevatingGroup.add(createBipodLeg(-1));
  elevatingGroup.add(createBipodLeg(1));

  // Elevating mechanism
  const elevMechGeometry = new THREE.BoxGeometry(0.08, 0.15, 0.06);
  const elevMech = new THREE.Mesh(elevMechGeometry, metalMid);
  elevMech.position.set(0, -tubeRadius - 0.15, bipodAttachPoint);
  elevatingGroup.add(elevMech);

  // Elevation handwheel
  const handwheelGeometry = new THREE.TorusGeometry(0.04, 0.008, 8, 16);
  const handwheel = new THREE.Mesh(handwheelGeometry, metalDark);
  handwheel.rotation.x = Math.PI / 2;
  handwheel.position.set(0, -tubeRadius - 0.25, bipodAttachPoint);
  elevatingGroup.add(handwheel);

  // Traversing handwheel
  const travHandwheelGeometry = new THREE.TorusGeometry(0.035, 0.007, 8, 16);
  const travHandwheel = new THREE.Mesh(travHandwheelGeometry, metalDark);
  travHandwheel.rotation.z = Math.PI / 2;
  travHandwheel.position.set(-0.12, -tubeRadius - 0.12, bipodAttachPoint);
  elevatingGroup.add(travHandwheel);

  // ========== SIGHT (M64A1) ==========
  const sightBaseGeometry = new THREE.BoxGeometry(0.04, 0.04, 0.05);
  const sightBase = new THREE.Mesh(sightBaseGeometry, metalDark);
  sightBase.position.set(0.08, 0.06, tubeLength * 0.45);
  elevatingGroup.add(sightBase);

  const sightPostGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.12, 12);
  const sightPost = new THREE.Mesh(sightPostGeometry, metalDark);
  sightPost.position.set(0.08, 0.14, tubeLength * 0.45);
  elevatingGroup.add(sightPost);

  const sightHeadGeometry = new THREE.BoxGeometry(0.03, 0.05, 0.08);
  const sightHead = new THREE.Mesh(sightHeadGeometry, metalDark);
  sightHead.position.set(0.08, 0.22, tubeLength * 0.45);
  elevatingGroup.add(sightHead);

  // ========== LOADED BALL ==========
  const loadedBallGeometry = new THREE.SphereGeometry(0.1, 16, 16);
  const loadedBallMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.2,
    metalness: 0.1
  });
  const loadedBall = new THREE.Mesh(loadedBallGeometry, loadedBallMaterial);
  loadedBall.position.set(0, 0, 0.2);
  loadedBall.visible = false;
  loadedBall.castShadow = true;
  elevatingGroup.add(loadedBall);

  // ========== MUZZLE FLASH ==========
  const muzzleFlash = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createMuzzleFlashTexture(),
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0
    })
  );
  muzzleFlash.scale.set(0.8, 0.8, 1);
  muzzleFlash.position.set(0, 0, tubeLength + 0.3);
  elevatingGroup.add(muzzleFlash);

  // Enable shadows
  mortar.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return {
    group: mortar,
    traverseGroup,
    elevatingGroup,
    tube,
    baseplate,
    muzzleFlash,
    loadedBall,
    tubeLength,
    tubeRadius,
    bipodLegLength,
    defaultElevation,
    // Base values for animation
    tubeBaseZ: tube.position.z,
    elevationBase: elevatingGroup.rotation.x,
    traverseBase: traverseGroup.rotation.y
  };
}

// ========== MORTAR CONTROLS ==========
// Similar interface to howitzer controls

export function createMortarControls(mortarData) {
  let rotationDeg = 0;
  let elevationDeg = mortarData.defaultElevation;

  // Mortar has more limited traverse than howitzer
  const minElevation = 45;  // Mortars are high-angle weapons
  const maxElevation = 85;
  const maxTraverse = 30;   // Limited traverse (±30°)

  function updateRotation() {
    mortarData.traverseGroup.rotation.y = THREE.MathUtils.degToRad(rotationDeg);
  }

  function updateElevation() {
    elevationDeg = THREE.MathUtils.clamp(elevationDeg, minElevation, maxElevation);
    mortarData.elevatingGroup.rotation.x = -THREE.MathUtils.degToRad(elevationDeg);
  }

  function adjustRotation(delta) {
    rotationDeg = THREE.MathUtils.clamp(rotationDeg + delta, -maxTraverse, maxTraverse);
    updateRotation();
    return rotationDeg;
  }

  function adjustElevation(delta) {
    elevationDeg += delta;
    updateElevation();
    return elevationDeg;
  }

  function setRotation(deg) {
    rotationDeg = THREE.MathUtils.clamp(deg, -maxTraverse, maxTraverse);
    updateRotation();
    return rotationDeg;
  }

  function setElevation(deg) {
    elevationDeg = THREE.MathUtils.clamp(deg, minElevation, maxElevation);
    updateElevation();
    return elevationDeg;
  }

  // Initialize
  updateRotation();
  updateElevation();

  return {
    getRotation: () => rotationDeg,
    getElevation: () => elevationDeg,
    adjustRotation,
    adjustElevation,
    setRotation,
    setElevation,
    // Expose limits
    minElevation,
    maxElevation,
    maxTraverse
  };
}

// ========== FIRING ANIMATION ==========

export function createMortarFiringAnimation() {
  return {
    active: false,
    time: 0,
    duration: 0.8,        // Shorter than howitzer
    tubeRecoilDist: 0.08, // Tube drops into baseplate
    baseShakeIntensity: 0.02
  };
}

export function updateMortarFiringAnimation(firingAnim, mortarData, dt) {
  if (!firingAnim.active) return;

  firingAnim.time += dt;
  const t = firingAnim.time;
  const duration = firingAnim.duration;

  if (t < duration) {
    // Muzzle flash (brief)
    const flashDuration = 0.08;
    if (t < flashDuration) {
      mortarData.muzzleFlash.material.opacity = 1 - (t / flashDuration);
      mortarData.muzzleFlash.scale.setScalar(0.8 + t * 4);
    } else {
      mortarData.muzzleFlash.material.opacity = 0;
    }

    // Tube recoil (drops into baseplate then returns)
    const recoilPhase = t * 10;
    const tubeOffset = firingAnim.tubeRecoilDist * Math.exp(-recoilPhase) * Math.sin(recoilPhase * Math.PI);
    mortarData.tube.position.z = mortarData.tubeBaseZ - Math.max(0, tubeOffset);

    // Baseplate shake
    const shakeDecay = Math.exp(-t * 8);
    const shakeFreq = 30;
    mortarData.baseplate.position.x = firingAnim.baseShakeIntensity * shakeDecay * Math.sin(t * shakeFreq);
    mortarData.baseplate.position.z = firingAnim.baseShakeIntensity * shakeDecay * Math.cos(t * shakeFreq * 1.3);

  } else {
    // Reset
    firingAnim.active = false;
    firingAnim.time = 0;
    mortarData.muzzleFlash.material.opacity = 0;
    mortarData.tube.position.z = mortarData.tubeBaseZ;
    mortarData.baseplate.position.x = 0;
    mortarData.baseplate.position.z = 0;
  }
}

// ========== POSITION HELPERS ==========

export function setMortarPosition(mortarData, position) {
  mortarData.group.position.set(position.x, position.y, position.z);
}

export function getMortarPosition(mortarData) {
  return mortarData.group.position.clone();
}

export function setMortarRotation(mortarData, rotationY) {
  mortarData.group.rotation.y = rotationY;
}

// Get muzzle position in world coordinates (for projectile spawning)
export function getMortarMuzzlePosition(mortarData) {
  const muzzleLocal = new THREE.Vector3(0, 0, mortarData.tubeLength + 0.3);
  mortarData.elevatingGroup.localToWorld(muzzleLocal);
  return muzzleLocal;
}

// Get firing direction in world coordinates
export function getMortarFiringDirection(mortarData) {
  const direction = new THREE.Vector3(0, 0, 1);
  direction.applyQuaternion(mortarData.elevatingGroup.getWorldQuaternion(new THREE.Quaternion()));
  return direction.normalize();
}

// Mortar weapon adapter for the projectile system
export function createMortarAdapter(mortarData, firingAnim) {
  return {
    getMuzzlePosition() {
      const muzzleLocal = new THREE.Vector3(0, 0, mortarData.tubeLength + 0.3);
      mortarData.elevatingGroup.localToWorld(muzzleLocal);
      return muzzleLocal;
    },
    getFiringDirection() {
      const direction = new THREE.Vector3(0, 0, 1);
      direction.applyQuaternion(mortarData.elevatingGroup.getWorldQuaternion(new THREE.Quaternion()));
      return direction.normalize();
    },
    getPosition() {
      return mortarData.group.position.clone();
    },
    setPosition(pos) {
      mortarData.group.position.set(pos.x, pos.y, pos.z);
    },
    showLoadedBall(visible) {
      mortarData.loadedBall.visible = visible;
    },
    triggerFire() {
      firingAnim.active = true;
      firingAnim.time = 0;
      mortarData.muzzleFlash.material.opacity = 1;
    }
  };
}
