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

  // Stage control bar (positioned on left side, horizontal layout)
  const stageBar = document.createElement('div');
  stageBar.id = 'mobile-stage-bar';
  stageBar.style.cssText = `
    position: fixed;
    top: 10px;
    left: 10px;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 5px 8px;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.2);
    z-index: 1001;
  `;
  mobileUI.appendChild(stageBar);

  // Stage cycling - previous stage button (left arrow)
  const prevStageBtn = document.createElement('div');
  prevStageBtn.id = 'mobile-prev-stage';
  prevStageBtn.innerHTML = '&#9664;'; // Left triangle
  prevStageBtn.style.cssText = `
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: rgba(100, 100, 100, 0.8);
    border: 2px solid rgba(255, 255, 255, 0.4);
    color: white;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    touch-action: none;
    user-select: none;
  `;
  stageBar.appendChild(prevStageBtn);

  // Stage name display (in the middle)
  const stageDisplay = document.createElement('div');
  stageDisplay.id = 'mobile-stage-display';
  stageDisplay.textContent = 'Idle';
  stageDisplay.style.cssText = `
    min-width: 50px;
    max-width: 70px;
    text-align: center;
    padding: 4px 6px;
    color: white;
    font-family: monospace;
    font-size: 10px;
    line-height: 1.2;
    user-select: none;
    word-wrap: break-word;
    overflow-wrap: break-word;
  `;
  stageBar.appendChild(stageDisplay);

  // Short stage names for mobile
  const shortStageNames = {
    'Idle': 'Idle',
    'Setup Projectile': 'Setup Ball',
    'Adjust Cannon': 'Aim',
    'Fire Cannon': 'Fire',
    'Drone View': 'Drone',
    'Move To Next Shot': 'Next'
  };

  // Stage cycling - next stage button (right arrow)
  const nextStageBtn = document.createElement('div');
  nextStageBtn.id = 'mobile-next-stage';
  nextStageBtn.innerHTML = '&#9654;'; // Right triangle
  nextStageBtn.style.cssText = `
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: rgba(100, 100, 100, 0.8);
    border: 2px solid rgba(255, 255, 255, 0.4);
    color: white;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    touch-action: none;
    user-select: none;
  `;
  stageBar.appendChild(nextStageBtn);

  // Action button (green, part of the bar)
  const actionBtn = document.createElement('div');
  actionBtn.id = 'mobile-action-btn';
  actionBtn.textContent = 'GO';
  actionBtn.style.cssText = `
    margin-left: 6px;
    padding: 8px 12px;
    border-radius: 8px;
    background: rgba(60, 180, 60, 0.8);
    border: 2px solid rgba(100, 220, 100, 0.8);
    color: white;
    font-family: monospace;
    font-weight: bold;
    font-size: 11px;
    display: flex;
    align-items: center;
    justify-content: center;
    touch-action: none;
    user-select: none;
  `;
  stageBar.appendChild(actionBtn);

  // State for thumbsticks
  const state = {
    left: { x: 0, y: 0, active: false, touchId: null },
    right: { x: 0, y: 0, active: false, touchId: null },
    // Smoothed look values with inertia
    lookSmooth: { x: 0, y: 0 }
  };

  // Inertia settings for look
  const lookInertia = {
    acceleration: 8.0,  // How fast it responds to input
    damping: 5.0        // How fast it slows down
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

  // Stage cycling callbacks
  let onPrevStage = null;
  let onNextStage = null;
  let onAction = null;

  // Previous stage button handler
  prevStageBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    prevStageBtn.style.background = 'rgba(150, 150, 150, 0.9)';
    if (onPrevStage) onPrevStage();
  }, { passive: false });
  prevStageBtn.addEventListener('touchend', () => {
    prevStageBtn.style.background = 'rgba(100, 100, 100, 0.7)';
  });

  // Next stage button handler
  nextStageBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    nextStageBtn.style.background = 'rgba(150, 150, 150, 0.9)';
    if (onNextStage) onNextStage();
  }, { passive: false });
  nextStageBtn.addEventListener('touchend', () => {
    nextStageBtn.style.background = 'rgba(100, 100, 100, 0.7)';
  });

  // Action button handler
  actionBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    actionBtn.style.background = 'rgba(80, 220, 80, 0.9)';
    if (onAction) onAction();
  }, { passive: false });
  actionBtn.addEventListener('touchend', () => {
    actionBtn.style.background = 'rgba(60, 180, 60, 0.7)';
  });

  return {
    // Get movement input (-1 to 1)
    getMovement() {
      return { x: state.left.x, y: state.left.y };
    },
    // Get look input with inertia (-1 to 1, smoothed)
    getLook() {
      return { x: state.lookSmooth.x, y: state.lookSmooth.y };
    },
    // Update inertia (call each frame with delta time)
    update(dt) {
      // Apply inertia to look controls
      const targetX = state.right.x;
      const targetY = state.right.y;

      // Accelerate towards target
      const diffX = targetX - state.lookSmooth.x;
      const diffY = targetY - state.lookSmooth.y;

      state.lookSmooth.x += diffX * lookInertia.acceleration * dt;
      state.lookSmooth.y += diffY * lookInertia.acceleration * dt;

      // Apply damping when stick is released (target is 0)
      if (!state.right.active) {
        state.lookSmooth.x *= Math.max(0, 1 - lookInertia.damping * dt);
        state.lookSmooth.y *= Math.max(0, 1 - lookInertia.damping * dt);

        // Snap to zero when very small
        if (Math.abs(state.lookSmooth.x) < 0.01) state.lookSmooth.x = 0;
        if (Math.abs(state.lookSmooth.y) < 0.01) state.lookSmooth.y = 0;
      }
    },
    // Set stage cycling callbacks
    setOnPrevStage(callback) {
      onPrevStage = callback;
    },
    setOnNextStage(callback) {
      onNextStage = callback;
    },
    setOnAction(callback) {
      onAction = callback;
    },
    // Show/hide stage cycling arrows (hidden in Drone View, but keep action button)
    setStageCyclingVisible(visible) {
      const display = visible ? 'flex' : 'none';
      prevStageBtn.style.display = display;
      nextStageBtn.style.display = display;
      // Always keep action button and stage display visible (needed to exit Drone View)
      actionBtn.style.display = 'flex';
      stageDisplay.style.display = 'block';
    },
    // Update stage display (uses short names for mobile)
    setStageDisplay(stageName) {
      stageDisplay.textContent = shortStageNames[stageName] || stageName;
    },
    // Show/hide mobile UI
    setVisible(visible) {
      mobileUI.style.display = visible ? 'block' : 'none';
    }
  };
}
