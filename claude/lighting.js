// Lighting and shadows module
import * as THREE from 'three';

// Create lighting setup with shadows
export function createLighting(scene) {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
  directionalLight.position.set(10, 20, 10);
  directionalLight.castShadow = true;

  // Shadow camera setup
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 1;
  directionalLight.shadow.camera.far = 200;
  directionalLight.shadow.camera.left = -50;
  directionalLight.shadow.camera.right = 50;
  directionalLight.shadow.camera.top = 50;
  directionalLight.shadow.camera.bottom = -50;
  directionalLight.shadow.bias = -0.001;

  scene.add(directionalLight);

  // Apply default/locked lighting
  function applyDefaultLighting(skybox, scene) {
    ambientLight.intensity = 0.6;
    directionalLight.intensity = 0.8;
    directionalLight.color.setHex(0xffffff);
    directionalLight.position.set(30, 50, 30);

    if (skybox) {
      const skyMaterial = skybox.material;
      skyMaterial.uniforms.topColor.value.setHex(0x0077ff);
      skyMaterial.uniforms.horizonColor.value.setHex(0x87ceeb);
      skyMaterial.uniforms.bottomColor.value.setHex(0x89cff0);
    }
    scene.background = null;
  }

  return {
    ambientLight,
    directionalLight,
    applyDefaultLighting
  };
}

// Setup renderer with shadow support
export function setupRenderer() {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  return renderer;
}
