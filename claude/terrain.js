// Terrain generation and rendering module
import * as THREE from 'three';
import {
  generateHeightmap,
  getTerrainColor,
  GOLF_TERRAIN_CONFIG
} from './terrain-heightmap.js';

// Create terrain mesh from heightmap
export function createTerrain(config) {
  const { worldSize, resolution, offsetX, offsetY, offsetZ } = config;

  const heightmap = generateHeightmap({
    ...GOLF_TERRAIN_CONFIG,
    width: 128,
    height: 128
  });

  const geometry = buildTerrainGeometry(heightmap, config);

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
    roughness: 0.8,
    metalness: 0.1,
    side: THREE.DoubleSide
  });

  const terrain = new THREE.Mesh(geometry, material);
  terrain.position.y = offsetY;
  terrain.receiveShadow = true;

  // Debug wireframe
  const wireframeMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true,
    transparent: true,
    opacity: 0.1
  });
  const wireframe = new THREE.Mesh(geometry, wireframeMaterial);
  terrain.add(wireframe);

  return { mesh: terrain, heightmap };
}

// Build terrain geometry from heightmap
function buildTerrainGeometry(heightmap, config) {
  const { worldSize, resolution, offsetX, offsetZ } = config;

  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const colors = [];
  const indices = [];

  const segmentsX = resolution - 1;
  const segmentsZ = resolution - 1;

  for (let z = 0; z < resolution; z++) {
    for (let x = 0; x < resolution; x++) {
      const u = x / (resolution - 1);
      const v = z / (resolution - 1);
      const worldX = (u - 0.5) * worldSize + offsetX;
      const worldZ = (v - 0.5) * worldSize + offsetZ;
      const height = heightmap.getHeightInterpolated(u, v);

      vertices.push(worldX, height, worldZ);

      const normalizedHeight = (height - heightmap.minHeight) /
        (heightmap.maxHeight - heightmap.minHeight);
      const color = getTerrainColor(normalizedHeight);

      colors.push(
        ((color >> 16) & 0xff) / 255,
        ((color >> 8) & 0xff) / 255,
        (color & 0xff) / 255
      );
    }
  }

  for (let z = 0; z < segmentsZ; z++) {
    for (let x = 0; x < segmentsX; x++) {
      const a = z * resolution + x;
      const b = z * resolution + x + 1;
      const c = (z + 1) * resolution + x;
      const d = (z + 1) * resolution + x + 1;
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  const positionArray = new Float32Array(indices.length * 3);
  const colorArray = new Float32Array(indices.length * 3);

  for (let i = 0; i < indices.length; i++) {
    const idx = indices[i];
    positionArray[i * 3] = vertices[idx * 3];
    positionArray[i * 3 + 1] = vertices[idx * 3 + 1];
    positionArray[i * 3 + 2] = vertices[idx * 3 + 2];

    colorArray[i * 3] = colors[idx * 3];
    colorArray[i * 3 + 1] = colors[idx * 3 + 1];
    colorArray[i * 3 + 2] = colors[idx * 3 + 2];
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
  geometry.computeVertexNormals();

  return geometry;
}

// Render heightmap to debug canvas
export function renderHeightmapDebug(heightmap) {
  const canvas = document.getElementById('heightmap-debug');
  const ctx = canvas.getContext('2d');
  const { width, height, data, minHeight, maxHeight } = heightmap;

  canvas.width = width;
  canvas.height = height;

  const imageData = ctx.createImageData(width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const h = data[y * width + x];
      const normalized = (h - minHeight) / (maxHeight - minHeight);
      const color = getTerrainColor(normalized);

      const idx = (y * width + x) * 4;
      imageData.data[idx] = (color >> 16) & 0xff;
      imageData.data[idx + 1] = (color >> 8) & 0xff;
      imageData.data[idx + 2] = color & 0xff;
      imageData.data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

// Terrain regeneration system
export function createTerrainRegeneration(terrainData, config) {
  const genConfig = {
    scale: 0.03,
    octaves: 5,
    persistence: 0.45,
    lacunarity: 2.0,
    heightMultiplier: 25,
    ridgeFrequency: 0.5,
    seed: 42
  };

  function regenerate() {
    genConfig.scale = parseFloat(document.getElementById('terrainScale').value) || 0.03;
    genConfig.octaves = parseInt(document.getElementById('terrainOctaves').value) || 5;
    genConfig.persistence = parseFloat(document.getElementById('terrainPersistence').value) || 0.45;
    genConfig.lacunarity = parseFloat(document.getElementById('terrainLacunarity').value) || 2.0;
    genConfig.heightMultiplier = parseFloat(document.getElementById('terrainHeightMult').value) || 25;
    genConfig.ridgeFrequency = parseFloat(document.getElementById('terrainRidgeFreq').value) || 0.5;
    genConfig.seed = parseInt(document.getElementById('terrainSeed').value) || 42;

    const newHeightmap = generateHeightmap({
      width: 128,
      height: 128,
      scale: genConfig.scale,
      octaves: genConfig.octaves,
      persistence: genConfig.persistence,
      lacunarity: genConfig.lacunarity,
      heightMultiplier: genConfig.heightMultiplier,
      ridgeFrequency: genConfig.ridgeFrequency,
      seed: genConfig.seed,
      baseHeight: 0
    });

    const geometry = buildTerrainGeometry(newHeightmap, config);

    terrainData.mesh.geometry.dispose();
    terrainData.mesh.geometry = geometry;

    if (terrainData.mesh.children.length > 0) {
      terrainData.mesh.children[0].geometry.dispose();
      terrainData.mesh.children[0].geometry = geometry;
    }

    terrainData.heightmap = newHeightmap;
    renderHeightmapDebug(newHeightmap);

    console.log('Terrain regenerated:', genConfig);
  }

  document.getElementById('regenTerrainBtn').addEventListener('click', regenerate);

  return { regenerate, getConfig: () => genConfig };
}

// Setup terrain Y control
export function setupTerrainYControl(terrainData, config) {
  const terrainYInput = document.getElementById('terrainYInput');

  terrainYInput.addEventListener('input', () => {
    const newY = parseFloat(terrainYInput.value) || 0;
    terrainData.mesh.position.y = newY;
    config.offsetY = newY;
  });
}
