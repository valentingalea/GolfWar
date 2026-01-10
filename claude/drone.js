// Drone flight system module
import * as THREE from 'three';

export function createDroneSystem(camera, renderer, config) {
  const state = {
    active: false,
    savedCameraPosition: new THREE.Vector3(),
    savedCameraRotation: new THREE.Euler(),
    savedYaw: 0,
    savedPitch: 0,
    speed: config.defaultSpeed || 50,
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
    if (state.active) return;

    // Save current camera state
    state.savedCameraPosition.copy(camera.position);
    state.savedCameraRotation.copy(camera.rotation);
    state.savedYaw = currentYaw;
    state.savedPitch = currentPitch;

    // Move camera to drone start position (offset from cannon)
    camera.position.set(
      state.cannonPosition.x + state.startOffset.x,
      state.startHeight,
      state.cannonPosition.z + state.startOffset.z
    );

    state.active = true;

    // Show vignette and HUD
    vignette.style.opacity = '1';
    scanlines.style.opacity = '1';
    droneHud.style.opacity = '1';

    console.log(`Drone activated at height ${state.startHeight}m`);

    return { yaw: currentYaw, pitch: currentPitch };
  }

  function deactivate() {
    if (!state.active) return null;

    // Restore camera to saved position
    camera.position.copy(state.savedCameraPosition);
    camera.rotation.copy(state.savedCameraRotation);

    const savedYaw = state.savedYaw;
    const savedPitch = state.savedPitch;

    state.active = false;

    // Hide vignette and HUD
    vignette.style.opacity = '0';
    scanlines.style.opacity = '0';
    droneHud.style.opacity = '0';

    console.log('Drone deactivated, returning to ground camera');

    return { yaw: savedYaw, pitch: savedPitch };
  }

  function toggle(currentYaw, currentPitch) {
    if (state.active) {
      return { active: false, ...deactivate() };
    } else {
      return { active: true, ...activate(currentYaw, currentPitch) };
    }
  }

  function update(dt, moveForward, moveRight, yaw) {
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
    return state.active;
  }

  return {
    activate,
    deactivate,
    toggle,
    update,
    adjustSpeed,
    setSpeed,
    setStartHeight,
    getSpeed,
    isActive
  };
}
