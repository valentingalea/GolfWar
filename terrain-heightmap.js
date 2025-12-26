// Terrain Heightmap Generator
// Generates smooth rolling hills using layered noise

// Simple seeded random number generator
function createRNG(seed) {
  let s = seed;
  return function() {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// 2D gradient noise implementation for smooth terrain
function createNoiseGenerator(seed = 12345) {
  const rng = createRNG(seed);
  const permutation = [];
  const gradients = [];

  // Generate permutation table
  for (let i = 0; i < 256; i++) {
    permutation[i] = i;
  }

  // Fisher-Yates shuffle
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [permutation[i], permutation[j]] = [permutation[j], permutation[i]];
  }

  // Duplicate for overflow handling
  for (let i = 0; i < 256; i++) {
    permutation[256 + i] = permutation[i];
  }

  // Generate random gradient vectors
  for (let i = 0; i < 256; i++) {
    const angle = rng() * Math.PI * 2;
    gradients[i] = { x: Math.cos(angle), y: Math.sin(angle) };
  }

  // Smoothstep function for interpolation
  function fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  // Linear interpolation
  function lerp(a, b, t) {
    return a + t * (b - a);
  }

  // Dot product of gradient and distance vector
  function dotGradient(ix, iy, x, y) {
    const idx = permutation[permutation[ix & 255] + (iy & 255)] & 255;
    const gradient = gradients[idx];
    const dx = x - ix;
    const dy = y - iy;
    return dx * gradient.x + dy * gradient.y;
  }

  // Perlin noise function
  return function noise(x, y) {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = x0 + 1;
    const y1 = y0 + 1;

    const sx = fade(x - x0);
    const sy = fade(y - y0);

    const n00 = dotGradient(x0, y0, x, y);
    const n10 = dotGradient(x1, y0, x, y);
    const n01 = dotGradient(x0, y1, x, y);
    const n11 = dotGradient(x1, y1, x, y);

    const nx0 = lerp(n00, n10, sx);
    const nx1 = lerp(n01, n11, sx);

    return lerp(nx0, nx1, sy);
  };
}

// Fractal Brownian Motion - layered noise for natural terrain
function fbm(noise, x, y, octaves = 4, lacunarity = 2.0, persistence = 0.5) {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    value += noise(x * frequency, y * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }

  return value / maxValue;
}

// Generate heightmap data
export function generateHeightmap(config = {}) {
  const {
    width = 128,          // Heightmap resolution
    height = 128,
    scale = 0.02,         // Noise scale (smaller = larger features)
    octaves = 4,          // Detail layers
    persistence = 0.4,    // How much each octave contributes (lower = smoother)
    lacunarity = 2.0,     // Frequency multiplier between octaves
    heightMultiplier = 15, // Max terrain height in world units
    seed = 42,
    // Rolling hills specific parameters
    baseHeight = 0,       // Minimum terrain height
    ridgeFrequency = 0.5, // Additional ridge features
  } = config;

  const noise = createNoiseGenerator(seed);
  const data = new Float32Array(width * height);

  let minHeight = Infinity;
  let maxHeight = -Infinity;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const nx = x * scale;
      const ny = y * scale;

      // Base rolling hills using fbm
      let h = fbm(noise, nx, ny, octaves, lacunarity, persistence);

      // Add gentle ridge variation
      const ridgeNoise = fbm(noise, nx * ridgeFrequency + 100, ny * ridgeFrequency + 100, 2, 2.0, 0.5);
      h += ridgeNoise * 0.3;

      // Normalize to 0-1 range (noise returns roughly -1 to 1)
      h = (h + 1) * 0.5;

      // Apply height multiplier
      h = baseHeight + h * heightMultiplier;

      data[y * width + x] = h;

      minHeight = Math.min(minHeight, h);
      maxHeight = Math.max(maxHeight, h);
    }
  }

  return {
    data,
    width,
    height,
    minHeight,
    maxHeight,
    // Helper to get height at normalized coordinates (0-1)
    getHeight(u, v) {
      const x = Math.floor(u * (width - 1));
      const y = Math.floor(v * (height - 1));
      const clampedX = Math.max(0, Math.min(width - 1, x));
      const clampedY = Math.max(0, Math.min(height - 1, y));
      return data[clampedY * width + clampedX];
    },
    // Bilinear interpolation for smoother height queries
    getHeightInterpolated(u, v) {
      const fx = u * (width - 1);
      const fy = v * (height - 1);
      const x0 = Math.floor(fx);
      const y0 = Math.floor(fy);
      const x1 = Math.min(x0 + 1, width - 1);
      const y1 = Math.min(y0 + 1, height - 1);
      const tx = fx - x0;
      const ty = fy - y0;

      const h00 = data[y0 * width + x0];
      const h10 = data[y0 * width + x1];
      const h01 = data[y1 * width + x0];
      const h11 = data[y1 * width + x1];

      const h0 = h00 + tx * (h10 - h00);
      const h1 = h01 + tx * (h11 - h01);

      return h0 + ty * (h1 - h0);
    }
  };
}

// Terrain material/color based on elevation
export const TERRAIN_ZONES = {
  WATER: { maxHeight: 0.05, color: 0x3498db, name: 'water' },
  SAND: { maxHeight: 0.15, color: 0xf4d03f, name: 'sand' },
  FAIRWAY: { maxHeight: 0.35, color: 0x27ae60, name: 'fairway' },
  ROUGH: { maxHeight: 0.6, color: 0x229954, name: 'rough' },
  HILLS: { maxHeight: 0.85, color: 0x1e8449, name: 'hills' },
  PEAK: { maxHeight: 1.0, color: 0x145a32, name: 'peak' }
};

// Get terrain zone for a normalized height (0-1)
export function getTerrainZone(normalizedHeight) {
  for (const [key, zone] of Object.entries(TERRAIN_ZONES)) {
    if (normalizedHeight <= zone.maxHeight) {
      return zone;
    }
  }
  return TERRAIN_ZONES.PEAK;
}

// Get interpolated color for smooth gradient
export function getTerrainColor(normalizedHeight) {
  const zones = Object.values(TERRAIN_ZONES);

  // Find the two zones we're between
  let lowerZone = zones[0];
  let upperZone = zones[0];
  let prevMax = 0;

  for (const zone of zones) {
    if (normalizedHeight <= zone.maxHeight) {
      upperZone = zone;
      break;
    }
    lowerZone = zone;
    prevMax = zone.maxHeight;
  }

  // If same zone, return its color
  if (lowerZone === upperZone) {
    return upperZone.color;
  }

  // Interpolate between zones
  const t = (normalizedHeight - prevMax) / (upperZone.maxHeight - prevMax);

  // Extract RGB components
  const r1 = (lowerZone.color >> 16) & 0xff;
  const g1 = (lowerZone.color >> 8) & 0xff;
  const b1 = lowerZone.color & 0xff;

  const r2 = (upperZone.color >> 16) & 0xff;
  const g2 = (upperZone.color >> 8) & 0xff;
  const b2 = upperZone.color & 0xff;

  // Lerp colors
  const r = Math.round(r1 + t * (r2 - r1));
  const g = Math.round(g1 + t * (g2 - g1));
  const b = Math.round(b1 + t * (b2 - b1));

  return (r << 16) | (g << 8) | b;
}

// Default terrain configuration for golf course
export const GOLF_TERRAIN_CONFIG = {
  width: 128,
  height: 128,
  scale: 0.025,
  octaves: 4,
  persistence: 0.35,     // Lower for smoother rolling hills
  lacunarity: 2.0,
  heightMultiplier: 12,  // Gentle height variation
  baseHeight: 0,
  seed: 42,
  ridgeFrequency: 0.4
};
