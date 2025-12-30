// Trees module - stylized tree models and terrain placement
import * as THREE from 'three';

// Tree configuration defaults
const TREE_DEFAULTS = {
  density: 0.15,           // Base density (0-1)
  minSlope: 0,             // Minimum slope angle (degrees)
  maxSlope: 35,            // Maximum slope angle for tree placement
  minScale: 0.8,           // Minimum tree scale
  maxScale: 1.4,           // Maximum tree scale
  clusterStrength: 0.6,    // How much trees cluster into forests (0-1)
  sparseness: 0.3,         // Creates sparse clearings (0-1)
  seed: 12345              // Random seed for placement
};

// Simple seeded random number generator
function seededRandom(seed) {
  // Ensure positive seed
  let s = Math.abs(seed) % 233280;
  if (s === 0) s = 1;
  return function() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// Hash function for 2D coordinates to ensure good distribution
function hash2D(x, y, seed) {
  // Use bit manipulation to create a good hash from coordinates
  let h = seed;
  h ^= Math.floor(x * 374761393);
  h ^= Math.floor(y * 668265263);
  h = Math.abs(h);
  h = ((h ^ (h >> 13)) * 1274126177) >>> 0;
  return (h % 233280) / 233280;
}

// 2D noise for forest clustering
function noise2D(x, y, seed) {
  return hash2D(x, y, seed);
}

// Smooth noise with interpolation
function smoothNoise(x, y, scale, seed) {
  const sx = x / scale;
  const sy = y / scale;

  const x0 = Math.floor(sx);
  const y0 = Math.floor(sy);
  const x1 = x0 + 1;
  const y1 = y0 + 1;

  const fx = sx - x0;
  const fy = sy - y0;

  // Smooth interpolation
  const sfx = fx * fx * (3 - 2 * fx);
  const sfy = fy * fy * (3 - 2 * fy);

  const n00 = noise2D(x0, y0, seed);
  const n10 = noise2D(x1, y0, seed);
  const n01 = noise2D(x0, y1, seed);
  const n11 = noise2D(x1, y1, seed);

  const nx0 = n00 * (1 - sfx) + n10 * sfx;
  const nx1 = n01 * (1 - sfx) + n11 * sfx;

  return nx0 * (1 - sfy) + nx1 * sfy;
}

// Multi-octave noise for forest distribution
function forestNoise(x, y, seed) {
  let value = 0;
  value += smoothNoise(x, y, 25, seed) * 0.5;
  value += smoothNoise(x, y, 12, seed + 100) * 0.3;
  value += smoothNoise(x, y, 5, seed + 200) * 0.2;
  return value;
}

// Materials for trees
const trunkMaterial = new THREE.MeshStandardMaterial({
  color: 0x4a3728,
  roughness: 0.9,
  metalness: 0.0,
  flatShading: true
});

const foliageMaterial = new THREE.MeshStandardMaterial({
  color: 0x2d5a27,
  roughness: 0.8,
  metalness: 0.0,
  flatShading: true
});

const foliageMaterialDark = new THREE.MeshStandardMaterial({
  color: 0x1e4a1a,
  roughness: 0.8,
  metalness: 0.0,
  flatShading: true
});

const foliageMaterialLight = new THREE.MeshStandardMaterial({
  color: 0x3d7a35,
  roughness: 0.8,
  metalness: 0.0,
  flatShading: true
});

// Create a stylized low-poly pine tree
function createPineTree() {
  const tree = new THREE.Group();

  // Trunk - tapered cylinder
  const trunkGeometry = new THREE.CylinderGeometry(0.08, 0.15, 1.2, 6);
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.position.y = 0.6;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  tree.add(trunk);

  // Foliage - stacked cones (3 layers)
  const layers = [
    { radius: 0.7, height: 1.0, y: 1.4 },
    { radius: 0.55, height: 0.9, y: 2.1 },
    { radius: 0.4, height: 0.8, y: 2.7 }
  ];

  layers.forEach((layer, i) => {
    const coneGeometry = new THREE.ConeGeometry(layer.radius, layer.height, 6);
    const material = i === 0 ? foliageMaterialDark : (i === 1 ? foliageMaterial : foliageMaterialLight);
    const cone = new THREE.Mesh(coneGeometry, material);
    cone.position.y = layer.y;
    cone.castShadow = true;
    cone.receiveShadow = true;
    tree.add(cone);
  });

  return tree;
}

// Create a stylized low-poly deciduous tree
function createDeciduousTree() {
  const tree = new THREE.Group();

  // Trunk
  const trunkGeometry = new THREE.CylinderGeometry(0.1, 0.18, 1.5, 5);
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.position.y = 0.75;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  tree.add(trunk);

  // Foliage - dodecahedron for organic look
  const foliageGeometry = new THREE.DodecahedronGeometry(1.0, 0);
  const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
  foliage.position.y = 2.2;
  foliage.scale.set(1, 0.85, 1);
  foliage.rotation.y = Math.random() * Math.PI;
  foliage.castShadow = true;
  foliage.receiveShadow = true;
  tree.add(foliage);

  return tree;
}

// Create a small bush/shrub
function createBush() {
  const bush = new THREE.Group();

  // Multiple small spheres clustered
  const bushGeometry = new THREE.DodecahedronGeometry(0.4, 0);

  const positions = [
    { x: 0, y: 0.3, z: 0 },
    { x: 0.25, y: 0.25, z: 0.15 },
    { x: -0.2, y: 0.28, z: 0.2 },
    { x: 0.1, y: 0.22, z: -0.25 }
  ];

  positions.forEach(pos => {
    const sphere = new THREE.Mesh(bushGeometry, foliageMaterialDark);
    sphere.position.set(pos.x, pos.y, pos.z);
    sphere.scale.setScalar(0.6 + Math.random() * 0.4);
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    bush.add(sphere);
  });

  return bush;
}

// Calculate terrain slope at a point
function calculateSlope(heightmap, u, v, worldSize) {
  const epsilon = 1 / heightmap.width;

  const h = heightmap.getHeightInterpolated(u, v);
  const hx = heightmap.getHeightInterpolated(Math.min(1, u + epsilon), v);
  const hz = heightmap.getHeightInterpolated(u, Math.min(1, v + epsilon));

  const dx = (hx - h) / (epsilon * worldSize);
  const dz = (hz - h) / (epsilon * worldSize);

  const slopeAngle = Math.atan(Math.sqrt(dx * dx + dz * dz)) * (180 / Math.PI);
  return slopeAngle;
}

// Create tree instances for the terrain
export function createTrees(heightmap, terrainConfig, treeConfig = {}) {
  const config = { ...TREE_DEFAULTS, ...treeConfig };
  const trees = new THREE.Group();
  trees.name = 'trees';

  const { worldSize, offsetX, offsetZ, offsetY } = terrainConfig;

  // Position the tree container at terrain Y offset so trees move with terrain
  trees.position.y = offsetY;
  const random = seededRandom(config.seed);

  // Grid-based placement with jitter
  const gridSize = 3; // Base grid cell size
  const cellsX = Math.floor(worldSize / gridSize);
  const cellsZ = Math.floor(worldSize / gridSize);

  let treeCount = 0;

  for (let gz = 0; gz < cellsZ; gz++) {
    for (let gx = 0; gx < cellsX; gx++) {
      // Random position within cell
      const cellX = (gx + random()) * gridSize - worldSize / 2 + offsetX;
      const cellZ = (gz + random()) * gridSize - worldSize / 2 + offsetZ;

      // Convert to UV coordinates
      const u = (cellX - offsetX + worldSize / 2) / worldSize;
      const v = (cellZ - offsetZ + worldSize / 2) / worldSize;

      // Skip if outside terrain bounds
      if (u < 0.02 || u > 0.98 || v < 0.02 || v > 0.98) continue;

      // Calculate slope
      const slope = calculateSlope(heightmap, u, v, worldSize);
      if (slope < config.minSlope || slope > config.maxSlope) continue;

      // Forest clustering noise
      const forestValue = forestNoise(cellX, cellZ, config.seed);

      // Sparse clearings using different noise
      const clearingValue = forestNoise(cellX * 1.5, cellZ * 1.5, config.seed + 500);
      if (clearingValue < config.sparseness * 0.5) continue;

      // Density check with clustering
      const localDensity = config.density * (1 + (forestValue - 0.5) * config.clusterStrength * 2);
      if (random() > localDensity) continue;

      // Get terrain height
      const height = heightmap.getHeightInterpolated(u, v);

      // Skip very low areas (water) or very high (snow peaks)
      const normalizedHeight = (height - heightmap.minHeight) / (heightmap.maxHeight - heightmap.minHeight);
      if (normalizedHeight < 0.15 || normalizedHeight > 0.85) continue;

      // Choose tree type based on height and randomness
      let tree;
      const typeRoll = random();
      if (normalizedHeight > 0.6 || typeRoll < 0.7) {
        tree = createPineTree();
      } else if (typeRoll < 0.9) {
        tree = createDeciduousTree();
      } else {
        tree = createBush();
      }

      // Position (Y is relative to container which is at offsetY)
      tree.position.set(cellX, height, cellZ);

      // Random scale
      const scale = config.minScale + random() * (config.maxScale - config.minScale);
      tree.scale.setScalar(scale);

      // Random rotation
      tree.rotation.y = random() * Math.PI * 2;

      // Slight tilt based on slope (trees grow slightly towards light)
      tree.rotation.x = (random() - 0.5) * 0.1;
      tree.rotation.z = (random() - 0.5) * 0.1;

      trees.add(tree);
      treeCount++;
    }
  }

  console.log(`Created ${treeCount} trees`);
  return trees;
}

// Regenerate trees with new config
export function regenerateTrees(scene, heightmap, terrainConfig, treeConfig) {
  // Remove existing trees
  const existingTrees = scene.getObjectByName('trees');
  if (existingTrees) {
    scene.remove(existingTrees);
    existingTrees.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
    });
  }

  // Create new trees
  const trees = createTrees(heightmap, terrainConfig, treeConfig);
  scene.add(trees);

  return trees;
}

// Update trees Y position (call when terrain Y changes)
export function updateTreesY(scene, newY) {
  const trees = scene.getObjectByName('trees');
  if (trees) {
    trees.position.y = newY;
  }
}

// Setup tree control UI
export function setupTreeControls(scene, heightmap, terrainConfig) {
  const config = { ...TREE_DEFAULTS };

  const densityInput = document.getElementById('treeDensity');
  const maxSlopeInput = document.getElementById('treeMaxSlope');
  const clusterInput = document.getElementById('treeCluster');
  const sparsenessInput = document.getElementById('treeSparse');
  const seedInput = document.getElementById('treeSeed');
  const regenBtn = document.getElementById('regenTreesBtn');

  function regenerate() {
    config.density = parseFloat(densityInput.value) || TREE_DEFAULTS.density;
    config.maxSlope = parseFloat(maxSlopeInput.value) || TREE_DEFAULTS.maxSlope;
    config.clusterStrength = parseFloat(clusterInput.value) || TREE_DEFAULTS.clusterStrength;
    config.sparseness = parseFloat(sparsenessInput.value) || TREE_DEFAULTS.sparseness;
    config.seed = parseInt(seedInput.value) || TREE_DEFAULTS.seed;

    regenerateTrees(scene, heightmap, terrainConfig, config);
  }

  regenBtn.addEventListener('click', regenerate);

  return {
    regenerate,
    getConfig: () => ({ ...config }),
    updateHeightmap: (newHeightmap) => {
      heightmap = newHeightmap;
    }
  };
}
