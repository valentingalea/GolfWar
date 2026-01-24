// Projectile system - physics, smoke trails, ball management
// Weapon-agnostic: works with any weapon that implements the adapter interface
import * as THREE from 'three';

// Create smoke particle texture
function createSmokeTexture() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  gradient.addColorStop(0, 'rgba(200, 200, 200, 1)');
  gradient.addColorStop(0.3, 'rgba(180, 180, 180, 0.8)');
  gradient.addColorStop(0.6, 'rgba(150, 150, 150, 0.4)');
  gradient.addColorStop(1, 'rgba(100, 100, 100, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Reflect velocity off surface with restitution and friction
function reflectVelocity(velocity, normal, restitution, friction) {
  const vDotN = velocity.dot(normal);
  const normalComponent = normal.clone().multiplyScalar(vDotN);
  const tangentComponent = velocity.clone().sub(normalComponent);

  const reflectedNormal = normalComponent.multiplyScalar(-restitution);
  const reflectedTangent = tangentComponent.multiplyScalar(1 - friction);

  return reflectedNormal.add(reflectedTangent);
}

/**
 * Weapon adapter interface (duck-typed):
 * {
 *   getMuzzlePosition()     → THREE.Vector3 (world coords)
 *   getFiringDirection()    → THREE.Vector3 (normalized, world coords)
 *   getPosition()           → THREE.Vector3 (weapon world position)
 *   setPosition(pos)        Move weapon to {x, y, z}
 *   showLoadedBall(visible) Show/hide loaded ball mesh
 *   triggerFire()           Start firing animation + muzzle flash
 * }
 */

// Projectile system with smoke trails and bounce physics
// terrain parameter is optional - if provided, ball collides with heightmap
export function createProjectileSystem(scene, initialWeaponAdapter, terrain = null) {
  let weaponAdapter = initialWeaponAdapter;
  const projectiles = [];
  const smokeParticles = [];
  const gravity = new THREE.Vector3(0, -9.81, 0);
  const ballRadius = 0.15;
  const geometry = new THREE.SphereGeometry(ballRadius, 16, 16);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.2,
    metalness: 0.1
  });

  // Cannon loaded state
  let isLoaded = false;
  let onBallStabilizedCallback = null;

  // Physics constants
  const physics = {
    baseRestitution: 0.65,
    friction: 0.35,
    rollingFriction: 2.5,
    minBounceVelocity: 0.5,
    minRollVelocity: 0.1,
    slopeFriction: 0.4,
    slowRollSpeed: 0.5,
    maxSlowRollTime: 2.0
  };

  // Helper: get ground height at position (uses terrain if available)
  function getGroundHeight(x, z) {
    if (terrain && terrain.getHeightAt) {
      return terrain.getHeightAt(x, z);
    }
    return 0;
  }

  // Helper: get ground normal at position
  function getGroundNormal(x, z) {
    if (terrain && terrain.getNormalAt) {
      return terrain.getNormalAt(x, z);
    }
    return new THREE.Vector3(0, 1, 0);
  }

  // Smoke trail settings
  const smokeTexture = createSmokeTexture();
  const smokeConfig = {
    spawnRate: 0.02,
    lifetime: 2.0,
    startSize: 0.3,
    endSize: 1.5,
    startOpacity: 0.6,
    drift: 0.5
  };

  const velocityInput = document.getElementById('velocityInput');
  const massInput = document.getElementById('massInput');

  function createSmokeParticle(position) {
    const smokeMaterial = new THREE.SpriteMaterial({
      map: smokeTexture,
      transparent: true,
      opacity: smokeConfig.startOpacity,
      depthWrite: false
    });
    const smoke = new THREE.Sprite(smokeMaterial);
    smoke.position.copy(position);
    smoke.scale.setScalar(smokeConfig.startSize);
    scene.add(smoke);

    return {
      sprite: smoke,
      age: 0,
      drift: new THREE.Vector3(
        (Math.random() - 0.5) * smokeConfig.drift,
        Math.random() * smokeConfig.drift * 0.5,
        (Math.random() - 0.5) * smokeConfig.drift
      )
    };
  }

  function fire() {
    if (!isLoaded) {
      return false;
    }

    const velocity = parseFloat(velocityInput.value) || 20;
    const mass = parseFloat(massInput.value) || 10;

    const projectile = new THREE.Mesh(geometry, material);
    projectile.castShadow = true;

    // Get muzzle position and direction from weapon adapter
    const muzzleWorld = weaponAdapter.getMuzzlePosition();
    projectile.position.copy(muzzleWorld);
    scene.add(projectile);

    const direction = weaponAdapter.getFiringDirection();

    projectiles.push({
      mesh: projectile,
      velocity: direction.multiplyScalar(velocity),
      mass: mass,
      smokeTimer: 0,
      state: 'flying',
      bounceCount: 0,
      slowRollTime: 0,
      notifiedStabilized: false,
      launchPosition: muzzleWorld.clone()
    });

    // Unload and trigger firing animation via adapter
    isLoaded = false;
    weaponAdapter.showLoadedBall(false);
    weaponAdapter.triggerFire();

    return true;
  }

  function update(dt) {
    // Update projectiles with physics
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const proj = projectiles[i];

      if (proj.state === 'stopped') {
        continue;
      }

      if (proj.state === 'flying' || proj.state === 'bouncing') {
        // Apply gravity
        proj.velocity.addScaledVector(gravity, dt);
        proj.mesh.position.addScaledVector(proj.velocity, dt);

        // Spawn smoke particles (only while in the air and moving fast)
        if (proj.velocity.length() > 5) {
          proj.smokeTimer += dt;
          if (proj.smokeTimer >= smokeConfig.spawnRate) {
            proj.smokeTimer = 0;
            smokeParticles.push(createSmokeParticle(proj.mesh.position));
          }
        }

        // Get terrain height at ball position
        const groundHeight = getGroundHeight(proj.mesh.position.x, proj.mesh.position.z);
        const floorHeight = groundHeight + ballRadius;

        // Check terrain collision
        if (proj.mesh.position.y <= floorHeight) {
          proj.mesh.position.y = floorHeight;

          const normal = getGroundNormal(proj.mesh.position.x, proj.mesh.position.z);
          const impactSpeed = Math.abs(proj.velocity.dot(normal));

          if (impactSpeed < physics.minBounceVelocity) {
            proj.state = 'rolling';
            const vDotN = proj.velocity.dot(normal);
            if (vDotN < 0) {
              proj.velocity.sub(normal.clone().multiplyScalar(vDotN));
            }
          } else {
            proj.state = 'bouncing';
            proj.bounceCount++;

            const massRatio = Math.min(proj.mass / 20, 1.5);
            const speedFactor = Math.max(0.8, 1 - impactSpeed * 0.005);
            const restitution = physics.baseRestitution * massRatio * speedFactor;

            proj.velocity.copy(
              reflectVelocity(proj.velocity, normal, Math.min(restitution, 0.95), physics.friction)
            );
          }
        }
      }

      if (proj.state === 'rolling') {
        const groundHeight = getGroundHeight(proj.mesh.position.x, proj.mesh.position.z);
        const normal = getGroundNormal(proj.mesh.position.x, proj.mesh.position.z);

        proj.mesh.position.y = groundHeight + ballRadius;

        // Slope acceleration
        const gravityDotNormal = gravity.dot(normal);
        const slopeAccel = gravity.clone().sub(normal.clone().multiplyScalar(gravityDotNormal));
        proj.velocity.addScaledVector(slopeAccel, dt);

        // Remove velocity into ground
        const vDotN = proj.velocity.dot(normal);
        if (vDotN < 0) {
          proj.velocity.sub(normal.clone().multiplyScalar(vDotN));
        }

        const speed = proj.velocity.length();
        const slopeSteepness = 1 - normal.y;
        const extraFriction = slopeSteepness * physics.slopeFriction;

        // Track slow rolling
        if (speed < physics.slowRollSpeed) {
          proj.slowRollTime += dt;
        } else {
          proj.slowRollTime = 0;
        }

        const forceStop = proj.slowRollTime >= physics.maxSlowRollTime;

        if (speed < physics.minRollVelocity || forceStop) {
          if (forceStop || slopeAccel.length() < physics.minRollVelocity * 2) {
            proj.state = 'stopped';
            proj.velocity.set(0, 0, 0);

            if (!proj.notifiedStabilized && onBallStabilizedCallback) {
              proj.notifiedStabilized = true;
              onBallStabilizedCallback(proj);
            }
          }
        } else {
          // Apply rolling friction
          const totalFriction = (physics.rollingFriction + extraFriction) * dt;
          const newSpeed = Math.max(0, speed - totalFriction);
          const scale = speed > 0 ? newSpeed / speed : 0;
          proj.velocity.multiplyScalar(scale);

          proj.mesh.position.addScaledVector(proj.velocity, dt);

          // Re-adjust Y to terrain
          const newGroundHeight = getGroundHeight(proj.mesh.position.x, proj.mesh.position.z);
          proj.mesh.position.y = newGroundHeight + ballRadius;

          // Visual roll rotation
          const rollDistance = speed * dt;
          const rollAngle = rollDistance / ballRadius;
          if (speed > 0.01) {
            const rollAxis = new THREE.Vector3(-proj.velocity.z, 0, proj.velocity.x).normalize();
            if (rollAxis.lengthSq() > 0.001) {
              proj.mesh.rotateOnWorldAxis(rollAxis, rollAngle);
            }
          }
        }
      }

      // Remove projectile if too far out of bounds
      if (proj.mesh.position.length() > 1000) {
        scene.remove(proj.mesh);
        projectiles.splice(i, 1);
      }
    }

    // Update smoke particles
    for (let i = smokeParticles.length - 1; i >= 0; i--) {
      const smoke = smokeParticles[i];
      smoke.age += dt;

      if (smoke.age >= smokeConfig.lifetime) {
        scene.remove(smoke.sprite);
        smoke.sprite.material.dispose();
        smokeParticles.splice(i, 1);
      } else {
        const lifeRatio = smoke.age / smokeConfig.lifetime;
        smoke.sprite.position.addScaledVector(smoke.drift, dt);

        const size = smokeConfig.startSize + (smokeConfig.endSize - smokeConfig.startSize) * lifeRatio;
        smoke.sprite.scale.setScalar(size);
        smoke.sprite.material.opacity = smokeConfig.startOpacity * (1 - lifeRatio);
      }
    }
  }

  return {
    fire,
    update,
    loadCannon() {
      isLoaded = true;
      weaponAdapter.showLoadedBall(true);
    },
    unloadCannon() {
      isLoaded = false;
      weaponAdapter.showLoadedBall(false);
    },
    isLoaded() {
      return isLoaded;
    },
    isBallAvailable() {
      if (isLoaded) return false;
      const hasActiveProjectile = projectiles.some(p => p.state !== 'stopped');
      return !hasActiveProjectile;
    },
    onBallStabilized(callback) {
      onBallStabilizedCallback = callback;
    },
    getWeaponPosition() {
      return weaponAdapter.getPosition();
    },
    getBallDistance() {
      if (projectiles.length === 0) return null;
      const proj = projectiles[projectiles.length - 1];
      if (!proj.launchPosition) return null;
      const dx = proj.mesh.position.x - proj.launchPosition.x;
      const dz = proj.mesh.position.z - proj.launchPosition.z;
      return Math.sqrt(dx * dx + dz * dz);
    },
    getBallPosition() {
      if (projectiles.length === 0) return null;
      const proj = projectiles[projectiles.length - 1];
      return proj.mesh.position.clone();
    },
    isBallStabilized() {
      if (projectiles.length === 0) return false;
      const proj = projectiles[projectiles.length - 1];
      return proj.state === 'stopped';
    },
    clearProjectiles() {
      for (const proj of projectiles) {
        scene.remove(proj.mesh);
      }
      projectiles.length = 0;
    },
    setWeaponPosition(pos) {
      weaponAdapter.setPosition(pos);
    },
    setWeaponAdapter(adapter) {
      weaponAdapter = adapter;
    }
  };
}
