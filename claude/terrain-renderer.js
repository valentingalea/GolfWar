// Terrain Renderer Module - Renders heightmap terrain with vertex coloring
import * as THREE from 'three';
import { loadTerrain, createFlatTerrain } from './terrain-heightmap.js';
import * as CONFIG from './config.js';

// Default color gradient for terrain (by normalized height 0-1)
const DEFAULT_COLOR_STOPS = [
  { height: 0.00, color: new THREE.Color(0x2d5016) },  // Deep green (low valleys)
  { height: 0.15, color: new THREE.Color(0x3d7a1c) },  // Medium green
  { height: 0.30, color: new THREE.Color(0x5a9a2a) },  // Light green (grass)
  { height: 0.50, color: new THREE.Color(0x8ab84a) },  // Yellow-green (hills)
  { height: 0.70, color: new THREE.Color(0xa08060) },  // Brown (rocky)
  { height: 0.85, color: new THREE.Color(0x9a9a9a) },  // Gray (mountain)
  { height: 1.00, color: new THREE.Color(0xffffff) }   // White (snow peaks)
];

/**
 * Interpolate color based on height using color stops
 * @param {number} normalizedHeight - Height value 0-1
 * @param {Array} colorStops - Array of { height, color } objects
 * @returns {THREE.Color} Interpolated color
 */
function getColorForHeight(normalizedHeight, colorStops = DEFAULT_COLOR_STOPS) {
  // Clamp height
  const h = Math.max(0, Math.min(1, normalizedHeight));

  // Find surrounding color stops
  let lower = colorStops[0];
  let upper = colorStops[colorStops.length - 1];

  for (let i = 0; i < colorStops.length - 1; i++) {
    if (h >= colorStops[i].height && h <= colorStops[i + 1].height) {
      lower = colorStops[i];
      upper = colorStops[i + 1];
      break;
    }
  }

  // Interpolate between stops
  const range = upper.height - lower.height;
  const t = range > 0 ? (h - lower.height) / range : 0;

  const color = new THREE.Color();
  color.lerpColors(lower.color, upper.color, t);

  return color;
}

/**
 * Apply vertex colors to terrain mesh based on height
 * @param {THREE.Mesh} mesh - Terrain mesh
 * @param {Object} heightmap - Heightmap object with height data
 * @param {Array} colorStops - Optional custom color gradient
 */
function applyVertexColors(mesh, heightmap, colorStops = DEFAULT_COLOR_STOPS) {
  const geometry = mesh.geometry;
  const positions = geometry.attributes.position;
  const vertexCount = positions.count;

  // Create color attribute
  const colors = new Float32Array(vertexCount * 3);

  // Get height range for normalization
  const maxHeight = heightmap.maxHeight || 1;
  const minHeight = heightmap.minHeight || 0;
  const heightRange = maxHeight - minHeight;

  for (let i = 0; i < vertexCount; i++) {
    // Get vertex Y position (height)
    const y = positions.getY(i);

    // Normalize height to 0-1
    const normalizedHeight = heightRange > 0 ? (y - minHeight) / heightRange : 0;

    // Get color for this height
    const color = getColorForHeight(normalizedHeight, colorStops);

    // Set vertex color
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  // Add color attribute to geometry
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  // Update material to use vertex colors
  mesh.material.vertexColors = true;
  mesh.material.needsUpdate = true;
}

/**
 * Create terrain material with vertex colors support
 * @param {Object} options - Material options
 * @returns {THREE.MeshStandardMaterial}
 */
function createTerrainMaterial(options = {}) {
  return new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: options.roughness !== undefined ? options.roughness : 0.85,
    metalness: options.metalness !== undefined ? options.metalness : 0.0,
    flatShading: options.flatShading !== undefined ? options.flatShading : false,
    side: THREE.FrontSide,
    ...options
  });
}

/**
 * Create and initialize terrain with vertex coloring
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Object with mesh, heightmap, and helper methods
 */
export async function createTerrain(options = {}) {
  const configFile = options.configFile || CONFIG.TERRAIN.configFile;
  const colorStops = options.colorStops || DEFAULT_COLOR_STOPS;
  const fallbackSize = options.fallbackSize || CONFIG.TERRAIN.fallbackSize;
  const fallbackResolution = options.fallbackResolution || CONFIG.TERRAIN.fallbackResolution;

  let terrainData;
  let loadedFromFile = false;

  try {
    // Try to load terrain from config file
    console.log(`Attempting to load terrain from: ${configFile}`);
    terrainData = await loadTerrain(configFile);
    loadedFromFile = true;
    console.log('Terrain loaded successfully from heightmap');
  } catch (error) {
    // Fall back to flat terrain
    console.warn(`Failed to load terrain heightmap: ${error.message}`);
    console.log(`Creating flat terrain fallback (${fallbackSize}x${fallbackSize}, ${fallbackResolution} segments)`);
    terrainData = createFlatTerrain(fallbackSize, fallbackResolution);
  }

  const { mesh, heightmap, config } = terrainData;

  // Replace material with vertex-color-enabled material
  mesh.material.dispose();
  mesh.material = createTerrainMaterial({
    flatShading: options.flatShading
  });

  // Apply vertex colors based on height
  applyVertexColors(mesh, heightmap, colorStops);

  // Configure mesh properties
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  mesh.name = 'terrain';

  console.log(`Terrain ready: ${config.terrainSize}x${config.terrainSize} units, max height: ${config.maxHeight}`);

  return {
    mesh,
    heightmap,
    config,
    loadedFromFile,

    /**
     * Update vertex colors with new color stops
     * @param {Array} newColorStops - New color gradient
     */
    updateColors(newColorStops) {
      applyVertexColors(mesh, heightmap, newColorStops);
    },

    /**
     * Get terrain height at world position
     * @param {number} x - World X
     * @param {number} z - World Z
     * @returns {number} Height at position
     */
    getHeightAt(x, z) {
      return heightmap.getHeightAtWorld(x, z);
    },

    /**
     * Get terrain normal at world position
     * @param {number} x - World X
     * @param {number} z - World Z
     * @returns {THREE.Vector3} Normal vector
     */
    getNormalAt(x, z) {
      return heightmap.getNormalAtWorld(x, z);
    },

    /**
     * Check if a world position is within terrain bounds
     * @param {number} x - World X
     * @param {number} z - World Z
     * @returns {boolean}
     */
    isInBounds(x, z) {
      const halfSize = config.terrainSize / 2;
      return x >= -halfSize && x <= halfSize && z >= -halfSize && z <= halfSize;
    }
  };
}

/**
 * Create a simple flat colored terrain (synchronous fallback)
 * @param {Object} options - Configuration options
 * @returns {Object} Object with mesh and heightmap
 */
export function createFlatColoredTerrain(options = {}) {
  const size = options.size || CONFIG.TERRAIN.fallbackSize;
  const resolution = options.resolution || CONFIG.TERRAIN.fallbackResolution;
  const color = options.color || 0x4a7c30;

  const geometry = new THREE.PlaneGeometry(size, size, resolution, resolution);
  geometry.rotateX(-Math.PI / 2);

  const material = new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.9,
    metalness: 0.0,
    side: THREE.FrontSide
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  mesh.name = 'terrain';

  // Create minimal heightmap interface
  const heightmap = {
    terrainSize: size,
    maxHeight: 0,
    minHeight: 0,
    getHeightAtWorld: () => 0,
    getHeightInterpolated: () => 0,
    getNormalAtWorld: () => new THREE.Vector3(0, 1, 0)
  };

  return {
    mesh,
    heightmap,
    config: { terrainSize: size, resolution, maxHeight: 0 },
    loadedFromFile: false,
    getHeightAt: () => 0,
    getNormalAt: () => new THREE.Vector3(0, 1, 0),
    isInBounds(x, z) {
      const halfSize = size / 2;
      return x >= -halfSize && x <= halfSize && z >= -halfSize && z <= halfSize;
    }
  };
}

// Export color utilities for customization
export { getColorForHeight, DEFAULT_COLOR_STOPS };
