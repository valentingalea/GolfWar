// Terrain Heightmap Module - Tessellated vertex grid terrain from binary heightmap data
import * as THREE from 'three';

/**
 * Load terrain configuration from JSON file
 * @param {string} jsonPath - Path to the terrain JSON config file
 * @returns {Promise<Object>} Terrain configuration object
 */
async function loadTerrainConfig(jsonPath) {
  const response = await fetch(jsonPath);
  if (!response.ok) {
    throw new Error(`Failed to load terrain config: ${jsonPath} (${response.status})`);
  }
  return response.json();
}

/**
 * Load binary heightmap data
 * @param {string} binaryPath - Path to the raw binary file
 * @param {string} exportType - "float32" or "uint16"
 * @param {number} vertexCount - Total number of vertices to read
 * @returns {Promise<Float32Array>} Normalized height values (0-1)
 */
async function loadHeightmapBinary(binaryPath, exportType, vertexCount) {
  const response = await fetch(binaryPath);
  if (!response.ok) {
    throw new Error(`Failed to load heightmap binary: ${binaryPath} (${response.status})`);
  }

  const arrayBuffer = await response.arrayBuffer();
  let rawData;
  let maxValue;

  if (exportType === 'float32') {
    rawData = new Float32Array(arrayBuffer);
    // Float32 data is assumed to be already normalized or in world units
    // Find actual max for normalization
    maxValue = 1.0;
    for (let i = 0; i < rawData.length; i++) {
      if (rawData[i] > maxValue) maxValue = rawData[i];
    }
  } else if (exportType === 'uint16') {
    rawData = new Uint16Array(arrayBuffer);
    maxValue = 65535; // 16-bit max
  } else {
    throw new Error(`Unknown exportType: ${exportType}. Expected "float32" or "uint16"`);
  }

  // Validate data size
  if (rawData.length < vertexCount) {
    throw new Error(`Heightmap data too small: expected ${vertexCount} vertices, got ${rawData.length}`);
  }

  // Normalize to 0-1 range
  const normalized = new Float32Array(vertexCount);
  for (let i = 0; i < vertexCount; i++) {
    normalized[i] = rawData[i] / maxValue;
  }

  return normalized;
}

/**
 * Create terrain mesh from heightmap data
 * @param {Object} terrainConfig - Configuration from JSON file
 * @param {Float32Array} heightData - Normalized height values (0-1)
 * @returns {THREE.Mesh} The terrain mesh
 */
function createTerrainMesh(terrainConfig, heightData) {
  const { terrainSize, resolution, maxHeight } = terrainConfig;
  const verticesPerSide = resolution + 1;

  // Create plane geometry with correct subdivision
  const geometry = new THREE.PlaneGeometry(
    terrainSize,
    terrainSize,
    resolution,
    resolution
  );

  // Rotate to be horizontal (XZ plane)
  geometry.rotateX(-Math.PI / 2);

  // Get position attribute
  const positions = geometry.attributes.position;

  // Apply heightmap to Y coordinates
  for (let i = 0; i < positions.count; i++) {
    // PlaneGeometry vertices are in row-major order after rotation
    // Map vertex index to heightmap index
    const normalizedHeight = heightData[i] || 0;
    const y = normalizedHeight * maxHeight;
    positions.setY(i, y);
  }

  // Update geometry
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  // Create material
  const material = new THREE.MeshStandardMaterial({
    color: 0x3d8c40,
    roughness: 0.9,
    metalness: 0.0,
    flatShading: false,
    side: THREE.FrontSide
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  mesh.name = 'terrain';

  return mesh;
}

/**
 * Create a heightmap object with interpolation methods
 * @param {Float32Array} heightData - Normalized height values (0-1)
 * @param {Object} terrainConfig - Terrain configuration
 * @returns {Object} Heightmap object with query methods
 */
function createHeightmapObject(heightData, terrainConfig) {
  const { terrainSize, resolution, maxHeight } = terrainConfig;
  const verticesPerSide = resolution + 1;
  const halfSize = terrainSize / 2;

  return {
    width: verticesPerSide,
    height: verticesPerSide,
    terrainSize,
    maxHeight,
    minHeight: 0,
    data: heightData,

    /**
     * Get raw height value at grid coordinates
     * @param {number} gridX - Grid X coordinate (0 to resolution)
     * @param {number} gridZ - Grid Z coordinate (0 to resolution)
     * @returns {number} Height value in world units
     */
    getHeightAt(gridX, gridZ) {
      const x = Math.max(0, Math.min(resolution, Math.floor(gridX)));
      const z = Math.max(0, Math.min(resolution, Math.floor(gridZ)));
      const index = z * verticesPerSide + x;
      return (heightData[index] || 0) * maxHeight;
    },

    /**
     * Get interpolated height at UV coordinates (0-1)
     * @param {number} u - U coordinate (0-1)
     * @param {number} v - V coordinate (0-1)
     * @returns {number} Interpolated height in world units
     */
    getHeightInterpolated(u, v) {
      // Clamp UV to valid range
      u = Math.max(0, Math.min(1, u));
      v = Math.max(0, Math.min(1, v));

      // Convert to grid coordinates
      const gx = u * resolution;
      const gz = v * resolution;

      // Get grid cell
      const x0 = Math.floor(gx);
      const z0 = Math.floor(gz);
      const x1 = Math.min(x0 + 1, resolution);
      const z1 = Math.min(z0 + 1, resolution);

      // Get fractional part for interpolation
      const fx = gx - x0;
      const fz = gz - z0;

      // Get heights at four corners
      const h00 = heightData[z0 * verticesPerSide + x0] || 0;
      const h10 = heightData[z0 * verticesPerSide + x1] || 0;
      const h01 = heightData[z1 * verticesPerSide + x0] || 0;
      const h11 = heightData[z1 * verticesPerSide + x1] || 0;

      // Bilinear interpolation
      const h0 = h00 * (1 - fx) + h10 * fx;
      const h1 = h01 * (1 - fx) + h11 * fx;
      const h = h0 * (1 - fz) + h1 * fz;

      return h * maxHeight;
    },

    /**
     * Get height at world coordinates
     * @param {number} worldX - World X position
     * @param {number} worldZ - World Z position
     * @returns {number} Height in world units
     */
    getHeightAtWorld(worldX, worldZ) {
      // Convert world coords to UV (terrain centered at origin)
      const u = (worldX + halfSize) / terrainSize;
      const v = (worldZ + halfSize) / terrainSize;
      return this.getHeightInterpolated(u, v);
    },

    /**
     * Get terrain normal at world coordinates
     * @param {number} worldX - World X position
     * @param {number} worldZ - World Z position
     * @returns {THREE.Vector3} Normal vector
     */
    getNormalAtWorld(worldX, worldZ) {
      const epsilon = terrainSize / resolution;
      const h = this.getHeightAtWorld(worldX, worldZ);
      const hx = this.getHeightAtWorld(worldX + epsilon, worldZ);
      const hz = this.getHeightAtWorld(worldX, worldZ + epsilon);

      const normal = new THREE.Vector3(
        h - hx,
        epsilon,
        h - hz
      ).normalize();

      return normal;
    }
  };
}

/**
 * Load and create terrain from configuration file
 * @param {string} configPath - Path to terrain JSON config
 * @returns {Promise<Object>} Object containing mesh and heightmap
 */
export async function loadTerrain(configPath) {
  console.log(`Loading terrain from: ${configPath}`);

  // Load JSON config
  const terrainConfig = await loadTerrainConfig(configPath);
  console.log('Terrain config:', terrainConfig);

  const { terrainSize, resolution, maxHeight, exportType, binaryFile } = terrainConfig;
  const verticesPerSide = resolution + 1;
  const vertexCount = verticesPerSide * verticesPerSide;

  console.log(`Terrain: ${terrainSize}x${terrainSize} units, ${resolution}x${resolution} segments, ${vertexCount} vertices`);

  // Resolve binary file path relative to config file
  const configDir = configPath.substring(0, configPath.lastIndexOf('/') + 1);
  const binaryPath = binaryFile.startsWith('./')
    ? configDir + binaryFile.substring(2)
    : binaryFile.startsWith('/')
      ? binaryFile
      : configDir + binaryFile;

  console.log(`Loading heightmap binary: ${binaryPath} (${exportType})`);

  // Load binary heightmap data
  const heightData = await loadHeightmapBinary(binaryPath, exportType, vertexCount);

  // Create heightmap object for queries
  const heightmap = createHeightmapObject(heightData, terrainConfig);

  // Create terrain mesh
  const mesh = createTerrainMesh(terrainConfig, heightData);

  console.log(`Terrain loaded successfully. Max height: ${maxHeight}`);

  return {
    mesh,
    heightmap,
    config: terrainConfig
  };
}

/**
 * Create a flat terrain fallback (when no heightmap available)
 * @param {number} size - Terrain size
 * @param {number} resolution - Number of segments
 * @returns {Object} Object containing mesh and heightmap
 */
export function createFlatTerrain(size = 4000, resolution = 64) {
  const verticesPerSide = resolution + 1;
  const vertexCount = verticesPerSide * verticesPerSide;

  // Create flat height data
  const heightData = new Float32Array(vertexCount).fill(0);

  const terrainConfig = {
    terrainSize: size,
    resolution: resolution,
    maxHeight: 0,
    exportType: 'float32',
    binaryFile: null
  };

  const heightmap = createHeightmapObject(heightData, terrainConfig);
  const mesh = createTerrainMesh(terrainConfig, heightData);

  return {
    mesh,
    heightmap,
    config: terrainConfig
  };
}

/**
 * Apply texture to terrain mesh
 * @param {THREE.Mesh} terrainMesh - The terrain mesh
 * @param {string} texturePath - Path to texture image
 * @param {THREE.TextureLoader} textureLoader - Optional texture loader
 */
export function applyTerrainTexture(terrainMesh, texturePath, textureLoader = null) {
  const loader = textureLoader || new THREE.TextureLoader();

  loader.load(texturePath, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    terrainMesh.material.map = texture;
    terrainMesh.material.needsUpdate = true;

    console.log(`Applied texture to terrain: ${texturePath}`);
  });
}
