// Mobile virtual thumbstick controls
import * as THREE from 'three';

// Detect if device is mobile/touch
export function isMobileDevice() {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );
}

// Create virtual thumbstick element
function createThumbstick(id, side) {
  const container = document.createElement('div');
  container.id = id;
  container.className = 'thumbstick-container';
  container.style.cssText = `
    position: fixed;
    bottom: 30px;
    ${side}: 30px;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.15);
    border: 2px solid rgba(255, 255, 255, 0.3);
    touch-action: none;
    z-index: 1000;
  `;

  const knob = document.createElement('div');
  knob.className = 'thumbstick-knob';
  knob.style.cssText = `
    position: absolute;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.5);
    border: 2px solid rgba(255, 255, 255, 0.7);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
  `;

  container.appendChild(knob);
  return { container, knob };
}

// Create mobile controls system
export function createMobileControls() {
  if (!isMobileDevice()) {
    return null;
  }

  // Create container for all mobile UI
  const mobileUI = document.createElement('div');
  mobileUI.id = 'mobile-ui';
  document.body.appendChild(mobileUI);

  // Left thumbstick (movement)
  const leftStick = createThumbstick('left-stick', 'left');
  mobileUI.appendChild(leftStick.container);

  // Right thumbstick (look)
  const rightStick = createThumbstick('right-stick', 'right');
  mobileUI.appendChild(rightStick.container);

  // Fire button
  const fireBtn = document.createElement('div');
  fireBtn.id = 'mobile-fire-btn';
  fireBtn.textContent = 'FIRE';
  fireBtn.style.cssText = `
    position: fixed;
    bottom: 170px;
    right: 50px;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: rgba(200, 60, 60, 0.7);
    border: 2px solid rgba(255, 100, 100, 0.8);
    color: white;
    font-family: monospace;
    font-weight: bold;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    touch-action: none;
    z-index: 1000;
    user-select: none;
  `;
  mobileUI.appendChild(fireBtn);

  // Drone toggle button
  const droneBtn = document.createElement('div');
  droneBtn.id = 'mobile-drone-btn';
  droneBtn.textContent = 'DRONE';
  droneBtn.style.cssText = `
    position: fixed;
    bottom: 170px;
    left: 50px;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: rgba(60, 120, 200, 0.7);
    border: 2px solid rgba(100, 150, 255, 0.8);
    color: white;
    font-family: monospace;
    font-weight: bold;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    touch-action: none;
    z-index: 1000;
    user-select: none;
  `;
  mobileUI.appendChild(droneBtn);

  // State for thumbsticks
  const state = {
    left: { x: 0, y: 0, active: false, touchId: null },
    right: { x: 0, y: 0, active: false, touchId: null }
  };

  // Handle thumbstick touch
  function handleStickTouch(stick, knob, stickState, maxRadius = 35) {
    const rect = stick.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    function updateKnob(touchX, touchY) {
      let dx = touchX - centerX;
      let dy = touchY - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > maxRadius) {
        dx = (dx / dist) * maxRadius;
        dy = (dy / dist) * maxRadius;
      }

      knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      stickState.x = dx / maxRadius;
      stickState.y = -dy / maxRadius; // Invert Y for natural feel
    }

    function resetKnob() {
      knob.style.transform = 'translate(-50%, -50%)';
      stickState.x = 0;
      stickState.y = 0;
      stickState.active = false;
      stickState.touchId = null;
    }

    stick.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      stickState.active = true;
      stickState.touchId = touch.identifier;
      updateKnob(touch.clientX, touch.clientY);
    }, { passive: false });

    stick.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        if (touch.identifier === stickState.touchId) {
          updateKnob(touch.clientX, touch.clientY);
          break;
        }
      }
    }, { passive: false });

    stick.addEventListener('touchend', (e) => {
      for (const touch of e.changedTouches) {
        if (touch.identifier === stickState.touchId) {
          resetKnob();
          break;
        }
      }
    });

    stick.addEventListener('touchcancel', resetKnob);
  }

  // Setup thumbstick handlers
  handleStickTouch(leftStick.container, leftStick.knob, state.left);
  handleStickTouch(rightStick.container, rightStick.knob, state.right);

  // Fire button handler
  let onFire = null;
  fireBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    fireBtn.style.background = 'rgba(255, 100, 100, 0.9)';
    if (onFire) onFire();
  }, { passive: false });
  fireBtn.addEventListener('touchend', () => {
    fireBtn.style.background = 'rgba(200, 60, 60, 0.7)';
  });

  // Drone button handler
  let onDroneToggle = null;
  let droneActive = false;
  droneBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    droneActive = !droneActive;
    droneBtn.style.background = droneActive
      ? 'rgba(60, 180, 100, 0.8)'
      : 'rgba(60, 120, 200, 0.7)';
    droneBtn.textContent = droneActive ? 'EXIT' : 'DRONE';
    if (onDroneToggle) onDroneToggle();
  }, { passive: false });

  return {
    // Get movement input (-1 to 1)
    getMovement() {
      return { x: state.left.x, y: state.left.y };
    },
    // Get look input (-1 to 1)
    getLook() {
      return { x: state.right.x, y: state.right.y };
    },
    // Set fire callback
    setOnFire(callback) {
      onFire = callback;
    },
    // Set drone toggle callback
    setOnDroneToggle(callback) {
      onDroneToggle = callback;
    },
    // Update drone button state externally
    setDroneActive(active) {
      droneActive = active;
      droneBtn.style.background = active
        ? 'rgba(60, 180, 100, 0.8)'
        : 'rgba(60, 120, 200, 0.7)';
      droneBtn.textContent = active ? 'EXIT' : 'DRONE';
    },
    // Show/hide mobile UI
    setVisible(visible) {
      mobileUI.style.display = visible ? 'block' : 'none';
    }
  };
}
