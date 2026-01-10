// Drone flight system module
import * as THREE from 'three';

export function createDroneSystem(camera, renderer, config) {
  const state = {
    active: false,
    transitioning: false,        // True while animating to drone position
    transitionProgress: 0,       // 0 to 1
    transitionStart: new THREE.Vector3(),
    transitionEnd: new THREE.Vector3(),
    savedCameraPosition: new THREE.Vector3(),
    savedCameraRotation: new THREE.Euler(),
    savedYaw: 0,
    savedPitch: 0,
    speed: config.defaultSpeed || 50,
    transitionSpeed: config.transitionSpeed || 15, // Vertical m/s during transition
    startHeight: config.startHeight || 25,
    startOffset: config.startOffset || { x: -3, z: 5 },
    cannonPosition: config.cannonPosition || { x: 3, y: 0, z: 0 }
  };

  // Vignette overlay element
  const vignette = document.createElement('div');
  vignette.id = 'drone-vignette';
  vignette.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s ease;
    background: radial-gradient(ellipse at center,
      transparent 0%,
      transparent 50%,
      rgba(0,0,0,0.3) 70%,
      rgba(0,0,0,0.7) 90%,
      rgba(0,0,0,0.9) 100%);
    z-index: 100;
  `;
  document.body.appendChild(vignette);

  // Scanline effect overlay
  const scanlines = document.createElement('div');
  scanlines.id = 'drone-scanlines';
  scanlines.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s ease;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0,0,0,0.1) 2px,
      rgba(0,0,0,0.1) 4px
    );
    z-index: 101;
  `;
  document.body.appendChild(scanlines);

  // Drone HUD overlay
  const droneHud = document.createElement('div');
  droneHud.id = 'drone-hud';
  droneHud.style.cssText = `
    position: fixed;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    color: #0f0;
    font-family: monospace;
    font-size: 14px;
    text-shadow: 0 0 5px #0f0;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 102;
    text-align: center;
  `;
  droneHud.innerHTML = `
    <div>DRONE CAM</div>
    <div id="drone-altitude">ALT: 0m</div>
  `;
  document.body.appendChild(droneHud);

  function activate(currentYaw, currentPitch) {
    if (state.active || state.transitioning) return;

    // Save current camera state for restoration on deactivate
    state.savedCameraPosition.copy(camera.position);
    state.savedCameraRotation.copy(camera.rotation);
    state.savedYaw = currentYaw;
    state.savedPitch = currentPitch;

    // Setup transition animation - only move vertically, view stays free
    state.transitionStart.copy(camera.position);
    state.transitionEnd.set(
      camera.position.x,  // Keep X position
      state.startHeight,
      camera.position.z   // Keep Z position
    );
    state.transitionProgress = 0;
    state.transitioning = true;

    // Show vignette and HUD immediately
    vignette.style.opacity = '1';
    scanlines.style.opacity = '1';
    droneHud.style.opacity = '1';

    console.log(`Drone transition started, target height ${state.startHeight}m`);

    return { yaw: currentYaw, pitch: currentPitch };
  }

  function deactivate() {
    if (!state.active && !state.transitioning) return null;

    // Restore camera to saved position
    camera.position.copy(state.savedCameraPosition);
    camera.rotation.copy(state.savedCameraRotation);

    const savedYaw = state.savedYaw;
    const savedPitch = state.savedPitch;

    state.active = false;
    state.transitioning = false;

    // Hide vignette and HUD
    vignette.style.opacity = '0';
    scanlines.style.opacity = '0';
    droneHud.style.opacity = '0';

    console.log('Drone deactivated, returning to ground camera');

    return { yaw: savedYaw, pitch: savedPitch };
  }

  function toggle(currentYaw, currentPitch) {
    if (state.active || state.transitioning) {
      return { active: false, ...deactivate() };
    } else {
      return { active: true, ...activate(currentYaw, currentPitch) };
    }
  }

  function update(dt, moveForward, moveRight, yaw) {
    // Handle transition animation (position only - view is free for user control)
    if (state.transitioning) {
      // Instant teleport if transitionSpeed is 0
      if (state.transitionSpeed <= 0) {
        state.transitionProgress = 1;
      } else {
        // Calculate distance and travel time
        const totalDistance = state.transitionStart.distanceTo(state.transitionEnd);
        const travelTime = totalDistance / state.transitionSpeed;
        // Update progress
        state.transitionProgress += dt / travelTime;
      }

      if (state.transitionProgress >= 1) {
        // Transition complete
        state.transitionProgress = 1;
        state.transitioning = false;
        state.active = true;
        camera.position.copy(state.transitionEnd);
        console.log('Drone transition complete, control released');
      } else {
        // Smooth easing (ease-out cubic)
        const t = state.transitionProgress;
        const eased = 1 - Math.pow(1 - t, 3);

        // Interpolate position (Y only) - rotation is free for user control
        camera.position.lerpVectors(state.transitionStart, state.transitionEnd, eased);
      }

      // Update altitude display during transition
      const altitudeEl = document.getElementById('drone-altitude');
      if (altitudeEl) {
        altitudeEl.textContent = `ALT: ${camera.position.y.toFixed(0)}m`;
      }
      return;
    }

    if (!state.active) return;

    // Update altitude display
    const altitudeEl = document.getElementById('drone-altitude');
    if (altitudeEl) {
      altitudeEl.textContent = `ALT: ${camera.position.y.toFixed(0)}m`;
    }
  }

  function adjustSpeed(delta) {
    state.speed = Math.max(10, Math.min(500, state.speed + delta));
    return state.speed;
  }

  function setSpeed(speed) {
    state.speed = Math.max(10, Math.min(500, speed));
    return state.speed;
  }

  function setStartHeight(height) {
    state.startHeight = Math.max(10, Math.min(2000, height));
    return state.startHeight;
  }

  function getSpeed() {
    return state.speed;
  }

  function isActive() {
    return state.active || state.transitioning;
  }

  function isTransitioning() {
    return state.transitioning;
  }

  function setTransitionSpeed(speed) {
    state.transitionSpeed = Math.max(0, Math.min(100, speed));
    return state.transitionSpeed;
  }

  function getTransitionSpeed() {
    return state.transitionSpeed;
  }

  return {
    activate,
    deactivate,
    toggle,
    update,
    adjustSpeed,
    setSpeed,
    setStartHeight,
    setTransitionSpeed,
    getSpeed,
    getTransitionSpeed,
    isActive,
    isTransitioning
  };
}
