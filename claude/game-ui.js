// Game UI - center screen overlays for stage-specific controls

// Create Game UI system
export function createGameUI() {
  // Create overlay container (centered on screen)
  const overlay = document.createElement('div');
  overlay.id = 'game-ui-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 20px 30px;
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.85);
    border: 2px solid rgba(255, 255, 255, 0.3);
    color: #fff;
    font-family: monospace;
    font-size: 14px;
    display: none;
    z-index: 500;
    min-width: 220px;
  `;
  document.body.appendChild(overlay);

  // Shot Profile panel
  const projectilePanel = document.createElement('div');
  projectilePanel.id = 'game-ui-projectile';

  function createShotRow(id, label, options, defaultValue) {
    const optionsHtml = options.map(opt =>
      `<button class="shot-btn${opt.value === defaultValue ? ' active' : ''}" data-value="${opt.value}">${opt.label}</button>`
    ).join('');
    return `<div class="game-ui-row shot-row">
      <span class="game-ui-label">${label}</span>
      <div class="shot-group" id="${id}">${optionsHtml}</div>
    </div>`;
  }

  projectilePanel.innerHTML = `
    <h3 style="margin: 0 0 16px 0; text-align: center; color: #8cf;">Shot Profile</h3>
    ${createShotRow('shotCharge', 'Charge', [
      { label: 'Light', value: 'light' },
      { label: 'Standard', value: 'standard' },
      { label: 'Heavy', value: 'heavy' }
    ], 'standard')}
    ${createShotRow('shotKick', 'Kick', [
      { label: 'Chip', value: 'chip' },
      { label: 'Full', value: 'full' },
      { label: 'Crush', value: 'crush' }
    ], 'full')}
    ${createShotRow('shotHang', 'Hang', [
      { label: 'Punch', value: 'punch' },
      { label: 'Carry', value: 'carry' },
      { label: 'Loft', value: 'loft' }
    ], 'carry')}
    ${createShotRow('shotBreak', 'Break', [
      { label: 'Stick', value: 'stick' },
      { label: 'Roll', value: 'roll' },
      { label: 'Bounce', value: 'bounce' }
    ], 'roll')}
    <div class="game-ui-hint">Press F to close</div>
  `;
  projectilePanel.style.display = 'none';
  overlay.appendChild(projectilePanel);

  // Wire up shot group button clicks
  projectilePanel.querySelectorAll('.shot-group').forEach(group => {
    group.addEventListener('click', (e) => {
      const btn = e.target.closest('.shot-btn');
      if (!btn) return;
      group.querySelectorAll('.shot-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Cannon controls panel
  const cannonPanel = document.createElement('div');
  cannonPanel.id = 'game-ui-cannon';
  cannonPanel.innerHTML = `
    <h3 id="cannonPanelTitle" style="margin: 0 0 16px 0; text-align: center; color: #fc8;">Cannon Adjust</h3>
    <div id="cannonRotationRow" class="game-ui-row">
      <span class="game-ui-label">Rotation</span>
      <span id="gameRotationValue" class="game-ui-value">0°</span>
      <button id="gameRotLeft" class="game-ui-btn">&lt;</button>
      <button id="gameRotRight" class="game-ui-btn">&gt;</button>
    </div>
    <div id="cannonElevationRow" class="game-ui-row">
      <span class="game-ui-label">Elevation</span>
      <span id="gameElevationValue" class="game-ui-value">40°</span>
      <button id="gameElevDown" class="game-ui-btn">-</button>
      <button id="gameElevUp" class="game-ui-btn">+</button>
    </div>
    <div class="game-ui-hint">Press F to close</div>
  `;
  cannonPanel.style.display = 'none';
  overlay.appendChild(cannonPanel);

  // Add styles for game UI elements
  const style = document.createElement('style');
  style.textContent = `
    .game-ui-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 12px;
    }
    .game-ui-label {
      flex: 1;
      color: #ccc;
    }
    .game-ui-value {
      min-width: 50px;
      text-align: center;
      background: rgba(255, 255, 255, 0.1);
      padding: 4px 8px;
      border-radius: 4px;
    }
    .game-ui-input {
      width: 70px;
      padding: 6px 8px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
      border-radius: 4px;
      font-family: monospace;
      font-size: 14px;
    }
    .game-ui-input:focus {
      outline: none;
      border-color: rgba(255, 255, 255, 0.6);
    }
    .game-ui-unit {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.6);
      min-width: 30px;
    }
    .game-ui-btn {
      width: 32px;
      height: 32px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
    }
    .game-ui-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    .game-ui-btn:active {
      background: rgba(255, 255, 255, 0.3);
    }
    .game-ui-hint {
      margin-top: 16px;
      text-align: center;
      font-size: 11px;
      color: rgba(255, 255, 255, 0.4);
    }
    .shot-row {
      margin-bottom: 10px;
    }
    .shot-group {
      display: flex;
      gap: 2px;
    }
    .shot-btn {
      padding: 5px 10px;
      border: 1px solid rgba(255, 255, 255, 0.25);
      background: rgba(255, 255, 255, 0.05);
      color: rgba(255, 255, 255, 0.6);
      font-family: monospace;
      font-size: 12px;
      cursor: pointer;
      border-radius: 3px;
    }
    .shot-btn:hover {
      background: rgba(255, 255, 255, 0.15);
    }
    .shot-btn.active {
      background: rgba(100, 180, 255, 0.3);
      border-color: rgba(100, 180, 255, 0.7);
      color: #fff;
    }
  `;
  document.head.appendChild(style);

  let currentPanel = null;
  let onHideCallback = null;

  // Click outside to close
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      hide();
    }
  });

  function show(panelType) {
    overlay.style.display = 'block';
    projectilePanel.style.display = panelType === 'projectile' ? 'block' : 'none';

    // Handle cannon panel variants
    const isCannonPanel = panelType === 'cannon' || panelType === 'cannon-rotation' || panelType === 'cannon-elevation';
    cannonPanel.style.display = isCannonPanel ? 'block' : 'none';

    if (isCannonPanel) {
      const titleEl = document.getElementById('cannonPanelTitle');
      const rotationRow = document.getElementById('cannonRotationRow');
      const elevationRow = document.getElementById('cannonElevationRow');

      if (panelType === 'cannon-rotation') {
        titleEl.textContent = 'Cannon Rotation';
        rotationRow.style.display = 'flex';
        elevationRow.style.display = 'none';
      } else if (panelType === 'cannon-elevation') {
        titleEl.textContent = 'Cannon Elevation';
        rotationRow.style.display = 'none';
        elevationRow.style.display = 'flex';
      } else {
        titleEl.textContent = 'Cannon Adjust';
        rotationRow.style.display = 'flex';
        elevationRow.style.display = 'flex';
      }
    }

    currentPanel = panelType;
  }

  function hide() {
    if (overlay.style.display !== 'none') {
      overlay.style.display = 'none';
      currentPanel = null;
      if (onHideCallback) {
        onHideCallback();
      }
    }
  }

  function isVisible() {
    return overlay.style.display !== 'none';
  }

  return {
    show,
    hide,
    isVisible,
    getCurrentPanel: () => currentPanel,
    onHide(callback) {
      onHideCallback = callback;
    },
    // Get current shot profile selections
    getShotSelections() {
      function getActive(groupId) {
        const active = document.querySelector(`#${groupId} .shot-btn.active`);
        return active ? active.dataset.value : null;
      }
      return {
        charge: getActive('shotCharge') || 'standard',
        kick: getActive('shotKick') || 'full',
        hang: getActive('shotHang') || 'carry',
        break: getActive('shotBreak') || 'roll'
      };
    },
    // Setup cannon controls with callbacks
    setupCannonControls(onRotLeft, onRotRight, onElevUp, onElevDown, updateDisplay) {
      document.getElementById('gameRotLeft').addEventListener('click', () => {
        onRotLeft();
        updateDisplay();
      });
      document.getElementById('gameRotRight').addEventListener('click', () => {
        onRotRight();
        updateDisplay();
      });
      document.getElementById('gameElevUp').addEventListener('click', () => {
        onElevUp();
        updateDisplay();
      });
      document.getElementById('gameElevDown').addEventListener('click', () => {
        onElevDown();
        updateDisplay();
      });
    },
    // Update cannon display values
    updateCannonDisplay(rotation, elevation) {
      document.getElementById('gameRotationValue').textContent = `${rotation}°`;
      document.getElementById('gameElevationValue').textContent = `${elevation}°`;
    }
  };
}
