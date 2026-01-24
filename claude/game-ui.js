// Game UI - center screen overlays for stage-specific controls
import { ENVELOPE_MAP } from './config.js';

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
    <canvas id="envelopeCanvas" width="260" height="120" style="
      display: block;
      margin: 14px auto 0;
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.15);
    "></canvas>
    <div class="game-ui-hint">Press F to close</div>
  `;
  projectilePanel.style.display = 'none';
  overlay.appendChild(projectilePanel);

  // Envelope preview graph
  const envelopeCanvas = projectilePanel.querySelector('#envelopeCanvas');
  const envelopeCtx = envelopeCanvas.getContext('2d');

  function computeEnvelopePoints(kick, hang, brk) {
    const peak = ENVELOPE_MAP.kick[kick] || 0.55;
    const drop = ENVELOPE_MAP.hang[hang] || 0.15;
    const end = ENVELOPE_MAP.break[brk] || -0.05;

    const decayLevel = peak - drop;

    return [
      { x: 0.00, y: 0 },                    // baseline start
      { x: 0.03, y: 0 },                    // hold at baseline (sharpens attack onset)
      { x: 0.28, y: peak },                 // attack peak
      { x: 0.55, y: decayLevel },           // post-decay (flight phase)
      { x: 0.76, y: decayLevel * 0.92 },    // pre-release plateau
      { x: 0.88, y: end },                  // release drop (sharp)
      { x: 1.00, y: end * 0.5 }             // release tail
    ];
  }

  function renderEnvelope() {
    const w = envelopeCanvas.width;
    const h = envelopeCanvas.height;
    const ctx = envelopeCtx;

    // Get current selections (only kick/hang/break affect envelope)
    const kickVal = document.querySelector('#shotKick .shot-btn.active');
    const hangVal = document.querySelector('#shotHang .shot-btn.active');
    const breakVal = document.querySelector('#shotBreak .shot-btn.active');
    const kick = kickVal ? kickVal.dataset.value : 'full';
    const hang = hangVal ? hangVal.dataset.value : 'carry';
    const brk = breakVal ? breakVal.dataset.value : 'roll';

    const points = computeEnvelopePoints(kick, hang, brk);

    ctx.clearRect(0, 0, w, h);

    // Padding for labels
    const padL = 38, padR = 8, padT = 16, padB = 18;
    const gw = w - padL - padR;
    const gh = h - padT - padB;

    // Draw phase bands
    const bandWidth = gw / 3;
    const bandColors = ['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.07)', 'rgba(255,255,255,0.04)'];
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = bandColors[i];
      ctx.fillRect(padL + i * bandWidth, padT, bandWidth, gh);
    }

    // Draw center line (dashed)
    const centerY = padT + gh / 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padL, centerY);
    ctx.lineTo(padL + gw, centerY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Convert normalized points to canvas coords
    // y: +1 = top, -1 = bottom (inverted for canvas)
    function toCanvas(pt) {
      return {
        x: padL + pt.x * gw,
        y: centerY - pt.y * (gh / 2) * 0.85
      };
    }

    const canvasPoints = points.map(toCanvas);

    // Draw smooth curve using Catmull-Rom-like cubic bezier segments
    ctx.strokeStyle = '#8cf';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = 'rgba(136, 204, 255, 0.6)';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y);

    const tension = 0.3;
    for (let i = 0; i < canvasPoints.length - 1; i++) {
      const p0 = canvasPoints[Math.max(0, i - 1)];
      const p1 = canvasPoints[i];
      const p2 = canvasPoints[i + 1];
      const p3 = canvasPoints[Math.min(canvasPoints.length - 1, i + 2)];

      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;

      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw control point dots (peak, decay, release)
    ctx.fillStyle = 'rgba(136, 204, 255, 0.8)';
    for (const i of [2, 3, 5]) {
      ctx.beginPath();
      ctx.arc(canvasPoints[i].x, canvasPoints[i].y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Labels
    ctx.font = '9px monospace';
    ctx.textBaseline = 'middle';

    // Y-axis labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.textAlign = 'left';
    ctx.fillText('AIR', 2, padT + 10);
    ctx.fillText('GND', 2, padT + gh - 8);

    // X-axis labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    const labelY = padT + gh + 5;
    ctx.fillText('Launch', padL + bandWidth * 0.5, labelY);
    ctx.fillText('Flight', padL + bandWidth * 1.5, labelY);
    ctx.fillText('Impact', padL + bandWidth * 2.5, labelY);

    // Caption
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.font = '8px monospace';
    ctx.fillText('Behaviour Envelope', w - 6, 3);
  }

  // Wire up shot group button clicks
  projectilePanel.querySelectorAll('.shot-group').forEach(group => {
    group.addEventListener('click', (e) => {
      const btn = e.target.closest('.shot-btn');
      if (!btn) return;
      group.querySelectorAll('.shot-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderEnvelope();
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
    if (panelType === 'projectile') {
      renderEnvelope();
    }

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
