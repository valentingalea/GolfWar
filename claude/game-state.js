// Game State Machine - manages gameplay stages and transitions
import * as THREE from 'three';

// Stage definitions
const STAGES = [
  {
    id: 'idle',
    index: 0,
    name: 'Idle',
    handObject: 'drone',
    debugSection: 'drone',
    gameUI: null,
    canCycle: true,
    action: 'goToDroneView'
  },
  {
    id: 'setup-projectile',
    index: 1,
    name: 'Setup Projectile',
    handObject: 'sphere',
    debugSection: null,
    gameUI: 'projectile',
    canCycle: true,
    action: 'toggleGameUI'
  },
  {
    id: 'adjust-cannon',
    index: 2,
    name: 'Adjust Cannon',
    handObject: 'cogwheel',
    debugSection: null,
    gameUI: 'cannon',
    canCycle: true,
    action: 'toggleGameUI'
  },
  {
    id: 'fire-cannon',
    index: 3,
    name: 'Fire Cannon',
    handObject: 'button-box',
    debugSection: 'recoil',
    gameUI: null,
    canCycle: true,
    action: 'fireCannon'
  },
  {
    id: 'drone-view',
    index: 4,
    name: 'Drone View',
    handObject: null,
    debugSection: null,
    gameUI: null,
    canCycle: false,
    action: 'exitDroneView'
  },
  {
    id: 'move-next',
    index: 5,
    name: 'Move To Next Shot',
    handObject: 'placeholder',
    debugSection: null,
    gameUI: null,
    canCycle: true,
    action: null
  }
];

// Create the game state machine
export function createGameState(callbacks) {
  const state = {
    currentIndex: 0,
    gameUIVisible: false,
    listeners: []
  };

  function canCycle() {
    return STAGES[state.currentIndex].canCycle;
  }

  function setStage(newIndex) {
    if (newIndex < 0 || newIndex >= STAGES.length) return false;

    const oldIndex = state.currentIndex;
    if (oldIndex === newIndex) return false;

    const oldStage = STAGES[oldIndex];
    const newStage = STAGES[newIndex];

    // Exit current stage
    if (callbacks.onStageExit) {
      callbacks.onStageExit(oldStage);
    }

    // Hide any visible Game UI
    state.gameUIVisible = false;

    state.currentIndex = newIndex;

    // Enter new stage
    if (callbacks.onStageEnter) {
      callbacks.onStageEnter(newStage);
    }

    // Notify listeners
    state.listeners.forEach(fn => fn(newStage, oldStage));

    return true;
  }

  function cycleNext() {
    if (!canCycle()) return false;
    // Cycle forward, skipping drone-view (index 4)
    let next = (state.currentIndex + 1) % STAGES.length;
    if (next === 4) next = 5; // Skip drone view
    setStage(next);
    return true;
  }

  function cyclePrev() {
    if (!canCycle()) return false;
    // Cycle backward, skipping drone-view (index 4)
    let prev = state.currentIndex - 1;
    if (prev < 0) prev = STAGES.length - 1;
    if (prev === 4) prev = 3; // Skip drone view
    setStage(prev);
    return true;
  }

  function goToStage(index, force = false) {
    // Direct stage access (1-6 keys map to 0-5 indices)
    if (!force) {
      if (index === 4) return false; // Cannot directly enter drone view via keyboard
      if (!canCycle() && index !== 0) return false; // From drone view, only allow going to idle
    }
    return setStage(index);
  }

  function triggerAction() {
    const stage = STAGES[state.currentIndex];

    switch (stage.action) {
      case 'goToDroneView':
        setStage(4); // Drone View
        break;
      case 'toggleGameUI':
        // For setup-projectile, check if we should load cannon instead
        if (stage.id === 'setup-projectile' && callbacks.tryLoadCannon) {
          const loaded = callbacks.tryLoadCannon();
          if (loaded) {
            // Ball was loaded into cannon, don't show UI
            return;
          }
        }
        state.gameUIVisible = !state.gameUIVisible;
        if (callbacks.setGameUIVisible) {
          callbacks.setGameUIVisible(stage.gameUI, state.gameUIVisible);
        }
        break;
      case 'fireCannon':
        if (callbacks.fireCannon) {
          callbacks.fireCannon();
        }
        break;
      case 'exitDroneView':
        setStage(0); // Return to Idle
        break;
      default:
        // Placeholder or no action
        break;
    }
  }

  return {
    getCurrentStage: () => STAGES[state.currentIndex],
    getStageIndex: () => state.currentIndex,
    cycleNext,
    cyclePrev,
    goToStage,
    triggerAction,
    canCycleStages: canCycle,
    isGameUIVisible: () => state.gameUIVisible,
    hideGameUI: () => {
      state.gameUIVisible = false;
    },
    onStageChange: (fn) => state.listeners.push(fn),
    getStages: () => STAGES
  };
}
