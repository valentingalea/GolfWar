// Sun and skybox module
import * as THREE from 'three';

// Create gradient skybox sphere
export function createSkybox(config) {
  const geometry = new THREE.SphereGeometry(config.skyRadius, 32, 32);
  geometry.scale(-1, 1, 1);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: new THREE.Color(0x0077ff) },
      bottomColor: { value: new THREE.Color(0x89cff0) },
      horizonColor: { value: new THREE.Color(0xffffff) },
      offset: { value: 20 },
      exponent: { value: 0.6 }
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform vec3 horizonColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + offset).y;
        float t = max(pow(max(h, 0.0), exponent), 0.0);
        vec3 sky = mix(horizonColor, topColor, t);
        if (h < 0.0) {
          sky = mix(horizonColor, bottomColor, min(-h * 2.0, 1.0));
        }
        gl_FragColor = vec4(sky, 1.0);
      }
    `,
    side: THREE.BackSide
  });

  return new THREE.Mesh(geometry, material);
}

// Create sun sprite with glow effect
export function createSun(config) {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  gradient.addColorStop(0, 'rgba(255, 255, 200, 1)');
  gradient.addColorStop(0.2, 'rgba(255, 240, 150, 1)');
  gradient.addColorStop(0.4, 'rgba(255, 200, 100, 0.8)');
  gradient.addColorStop(0.7, 'rgba(255, 150, 50, 0.3)');
  gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const material = new THREE.SpriteMaterial({
    map: texture,
    blending: THREE.AdditiveBlending,
    transparent: true
  });

  const sun = new THREE.Sprite(material);
  sun.scale.set(config.sunSize, config.sunSize, 1);

  return sun;
}

// Calculate sun position based on hour (0-24)
export function calculateSunPosition(hour, config) {
  hour = ((hour % 24) + 24) % 24;

  const sunriseHour = 6;
  const sunsetHour = 18;
  const dayLength = sunsetHour - sunriseHour;

  let sunAngle, sunHeight;

  if (hour >= sunriseHour && hour <= sunsetHour) {
    const dayProgress = (hour - sunriseHour) / dayLength;
    sunAngle = Math.PI * dayProgress;
    sunHeight = Math.sin(sunAngle);
  } else {
    let nightProgress;
    if (hour > sunsetHour) {
      nightProgress = (hour - sunsetHour) / (24 - dayLength);
    } else {
      nightProgress = (hour + (24 - sunsetHour)) / (24 - dayLength);
    }
    sunAngle = Math.PI + Math.PI * nightProgress;
    sunHeight = Math.sin(sunAngle);
  }

  const distance = config.sunDistance;
  const x = Math.cos(sunAngle) * distance;
  const y = sunHeight * distance * 0.7;
  const z = -distance * 0.3;

  return { x, y, z, sunHeight, sunAngle };
}

// Update sun position and optionally lighting
export function updateSunPosition(sun, skybox, scene, lighting, hour, config, lightingLocked) {
  const { x, y, z, sunHeight } = calculateSunPosition(hour, config);

  sun.position.set(x, y, z);

  // Update directional light position
  const lightDir = new THREE.Vector3(x, y, z).normalize();
  lighting.directionalLight.position.copy(lightDir.multiplyScalar(50));

  // Only update lighting if not locked
  if (!lightingLocked) {
    const dayIntensity = Math.max(0, sunHeight);
    const ambientIntensity = 0.2 + dayIntensity * 0.4;
    const directionalIntensity = dayIntensity * 1.2;

    lighting.ambientLight.intensity = ambientIntensity;
    lighting.directionalLight.intensity = directionalIntensity;

    // Sun color based on height
    const sunColor = new THREE.Color();
    if (sunHeight > 0.3) {
      sunColor.setHex(0xffffcc);
    } else if (sunHeight > 0) {
      sunColor.lerpColors(new THREE.Color(0xff6600), new THREE.Color(0xffffcc), sunHeight / 0.3);
    } else {
      sunColor.setHex(0xff4400);
    }
    lighting.directionalLight.color.copy(sunColor);

    // Sky colors based on time
    const skyMaterial = skybox.material;
    if (sunHeight > 0.3) {
      skyMaterial.uniforms.topColor.value.setHex(0x0077ff);
      skyMaterial.uniforms.horizonColor.value.setHex(0x87ceeb);
      skyMaterial.uniforms.bottomColor.value.setHex(0x89cff0);
    } else if (sunHeight > 0) {
      const t = sunHeight / 0.3;
      skyMaterial.uniforms.topColor.value.lerpColors(new THREE.Color(0x1a1a4e), new THREE.Color(0x0077ff), t);
      skyMaterial.uniforms.horizonColor.value.lerpColors(new THREE.Color(0xff7744), new THREE.Color(0x87ceeb), t);
      skyMaterial.uniforms.bottomColor.value.lerpColors(new THREE.Color(0xff5522), new THREE.Color(0x89cff0), t);
    } else {
      skyMaterial.uniforms.topColor.value.setHex(0x0a0a20);
      skyMaterial.uniforms.horizonColor.value.setHex(0x1a1a3e);
      skyMaterial.uniforms.bottomColor.value.setHex(0x0a0a15);
    }

    // Scene background for night
    if (sunHeight < 0) {
      scene.background = new THREE.Color(0x0a0a15);
    } else {
      scene.background = null;
    }
  }

  // Sun visibility
  sun.visible = sunHeight > -0.1;
}

// Setup hour control UI
export function setupHourControl(sun, skybox, scene, lighting, config) {
  const hourInput = document.getElementById('hourInput');
  const hourDisplay = document.getElementById('hourDisplay');
  const lockLightingCheckbox = document.getElementById('lockLighting');

  let lightingLocked = true;

  function formatHour(hour) {
    const h = Math.floor(hour);
    const m = Math.round((hour - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  function update(hour) {
    updateSunPosition(sun, skybox, scene, lighting, hour, config, lightingLocked);
    hourDisplay.textContent = formatHour(hour);
  }

  hourInput.addEventListener('input', () => {
    const hour = parseFloat(hourInput.value) || 12;
    config.hour = hour;
    update(hour);
  });

  lockLightingCheckbox.addEventListener('change', (e) => {
    lightingLocked = e.target.checked;
    if (lightingLocked) {
      lighting.applyDefaultLighting(skybox, scene);
    } else {
      update(config.hour);
    }
  });

  // Initial update
  update(config.hour);

  return {
    update,
    isLightingLocked: () => lightingLocked
  };
}
