import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import './style.css'

const canvas = document.querySelector('#terrain-canvas')
const statusEl = document.querySelector('#status')
const sizeInput = document.querySelector('#brush-size')
const strengthInput = document.querySelector('#brush-strength')
const falloffInput = document.querySelector('#brush-falloff')
const sizeValue = document.querySelector('#brush-size-value')
const strengthValue = document.querySelector('#brush-strength-value')
const falloffValue = document.querySelector('#brush-falloff-value')
const toolButtons = document.querySelectorAll('.tool-button')
const wireframeToggle = document.querySelector('#wireframe-toggle')
const resetButton = document.querySelector('#reset-terrain')
const resolutionSelect = document.querySelector('#terrain-resolution')

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x0b0c12)
scene.fog = new THREE.Fog(0x0b0c12, 120, 420)

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(110, 120, 160)

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.enablePan = true
controls.screenSpacePanning = true
controls.mouseButtons = {
  LEFT: THREE.MOUSE.PAN,
  MIDDLE: THREE.MOUSE.DOLLY,
  RIGHT: THREE.MOUSE.ROTATE
}

const hemiLight = new THREE.HemisphereLight(0xfaf5e6, 0x2a3140, 0.8)
scene.add(hemiLight)

const dirLight = new THREE.DirectionalLight(0xffffff, 0.9)
dirLight.position.set(120, 160, 80)
scene.add(dirLight)

const gridHelper = new THREE.GridHelper(240, 24, 0xffffff, 0xffffff)
gridHelper.material.opacity = 0.08
gridHelper.material.transparent = true
scene.add(gridHelper)

const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()

const state = {
  tool: 'sculpt',
  brushSize: Number(sizeInput.value),
  brushStrength: Number(strengthInput.value),
  brushFalloff: Number(falloffInput.value),
  isPointerDown: false,
  lower: false,
  hasHit: false,
  hitPoint: new THREE.Vector3(),
  flattenHeight: 0,
  segments: Number(resolutionSelect.value)
}

let terrain = null

const brushRing = createBrushRing()
scene.add(brushRing)

function createBrushRing() {
  const ringSegments = 64
  const points = []
  for (let i = 0; i <= ringSegments; i += 1) {
    const angle = (i / ringSegments) * Math.PI * 2
    points.push(new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)))
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points)
  const material = new THREE.LineBasicMaterial({ color: 0xff8a34, transparent: true, opacity: 0.8 })
  const line = new THREE.LineLoop(geometry, material)
  line.scale.setScalar(state.brushSize)
  line.visible = false
  return line
}

function buildTerrain(segments) {
  if (terrain) {
    scene.remove(terrain.mesh)
    terrain.mesh.geometry.dispose()
    terrain.mesh.material.dispose()
  }

  const geometry = new THREE.PlaneGeometry(220, 220, segments, segments)
  geometry.rotateX(-Math.PI / 2)
  geometry.computeVertexNormals()

  const material = new THREE.MeshStandardMaterial({
    color: 0x4f7c71,
    roughness: 0.85,
    metalness: 0.05,
    wireframe: wireframeToggle.checked
  })

  const mesh = new THREE.Mesh(geometry, material)
  mesh.receiveShadow = true
  scene.add(mesh)

  terrain = {
    mesh,
    geometry,
    positions: geometry.attributes.position,
    segments,
    grid: segments + 1
  }
}

buildTerrain(state.segments)

function updatePointer(event) {
  const rect = canvas.getBoundingClientRect()
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
}

function updateBrushRing() {
  if (!state.hasHit) {
    brushRing.visible = false
    return
  }
  brushRing.visible = true
  brushRing.position.copy(state.hitPoint)
  brushRing.position.y += 0.2
  brushRing.scale.setScalar(state.brushSize)
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

function applyBrush() {
  if (!state.hasHit || !terrain) return

  const positions = terrain.positions
  const array = positions.array
  const vertexCount = positions.count
  const radius = state.brushSize
  const radiusSq = radius * radius
  const strength = state.brushStrength * 0.12
  const falloff = state.brushFalloff
  const center = state.hitPoint

  let tempHeights = null
  if (state.tool === 'smooth') {
    tempHeights = new Float32Array(vertexCount)
    for (let i = 0; i < vertexCount; i += 1) {
      tempHeights[i] = array[i * 3 + 1]
    }
  }

  for (let i = 0; i < vertexCount; i += 1) {
    const index = i * 3
    const x = array[index]
    const z = array[index + 2]
    const dx = x - center.x
    const dz = z - center.z
    const distSq = dx * dx + dz * dz
    if (distSq > radiusSq) continue

    const dist = Math.sqrt(distSq)
    const influence = Math.pow(1 - dist / radius, falloff)

    if (state.tool === 'sculpt') {
      const direction = state.lower ? -1 : 1
      array[index + 1] += direction * strength * influence
      continue
    }

    if (state.tool === 'flatten') {
      const currentHeight = array[index + 1]
      array[index + 1] = lerp(currentHeight, state.flattenHeight, strength * influence)
      continue
    }

    if (state.tool === 'smooth') {
      const grid = terrain.grid
      const ix = i % grid
      const iz = Math.floor(i / grid)
      let sum = 0
      let count = 0
      for (let dzOffset = -1; dzOffset <= 1; dzOffset += 1) {
        for (let dxOffset = -1; dxOffset <= 1; dxOffset += 1) {
          if (dxOffset === 0 && dzOffset === 0) continue
          const nx = ix + dxOffset
          const nz = iz + dzOffset
          if (nx < 0 || nz < 0 || nx >= grid || nz >= grid) continue
          const neighborIndex = nz * grid + nx
          sum += tempHeights[neighborIndex]
          count += 1
        }
      }
      if (count > 0) {
        const average = sum / count
        const current = tempHeights[i]
        array[index + 1] = lerp(current, average, strength * influence)
      }
    }
  }

  positions.needsUpdate = true
  terrain.geometry.computeVertexNormals()
  terrain.geometry.attributes.normal.needsUpdate = true
}

function setTool(tool) {
  state.tool = tool
  toolButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.tool === tool)
  })
  statusEl.textContent = `Tool: ${tool.charAt(0).toUpperCase() + tool.slice(1)}`
}

toolButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setTool(button.dataset.tool)
  })
})

sizeInput.addEventListener('input', (event) => {
  state.brushSize = Number(event.target.value)
  sizeValue.textContent = event.target.value
})

strengthInput.addEventListener('input', (event) => {
  state.brushStrength = Number(event.target.value)
  strengthValue.textContent = event.target.value
})

falloffInput.addEventListener('input', (event) => {
  state.brushFalloff = Number(event.target.value)
  falloffValue.textContent = event.target.value
})

wireframeToggle.addEventListener('change', (event) => {
  if (terrain) terrain.mesh.material.wireframe = event.target.checked
})

resolutionSelect.addEventListener('change', (event) => {
  state.segments = Number(event.target.value)
  buildTerrain(state.segments)
})

resetButton.addEventListener('click', () => {
  if (!terrain) return
  const array = terrain.positions.array
  for (let i = 0; i < terrain.positions.count; i += 1) {
    array[i * 3 + 1] = 0
  }
  terrain.positions.needsUpdate = true
  terrain.geometry.computeVertexNormals()
  terrain.geometry.attributes.normal.needsUpdate = true
})

window.addEventListener('pointerdown', (event) => {
  if (event.button !== 0) return
  if (event.target.closest('.panel')) return
  updatePointer(event)
  state.isPointerDown = true
  state.lower = event.shiftKey
  controls.enabled = false
  if (state.tool === 'flatten' && state.hasHit) {
    state.flattenHeight = state.hitPoint.y
  }
})

window.addEventListener('pointermove', (event) => {
  updatePointer(event)
})

window.addEventListener('pointerup', (event) => {
  if (event.button !== 0) return
  state.isPointerDown = false
  controls.enabled = true
})

window.addEventListener('blur', () => {
  state.isPointerDown = false
  controls.enabled = true
})

window.addEventListener('contextmenu', (event) => {
  if (event.target === canvas) event.preventDefault()
})

window.addEventListener('keydown', (event) => {
  if (event.key === '1') setTool('sculpt')
  if (event.key === '2') setTool('smooth')
  if (event.key === '3') setTool('flatten')
  if (event.key.toLowerCase() === 'r') resetButton.click()
})

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

function updateRaycast() {
  if (!terrain) return
  raycaster.setFromCamera(pointer, camera)
  const hits = raycaster.intersectObject(terrain.mesh)
  if (hits.length > 0) {
    state.hitPoint.copy(hits[0].point)
    state.hasHit = true
  } else {
    state.hasHit = false
  }
  updateBrushRing()
}

function animate() {
  requestAnimationFrame(animate)
  updateRaycast()
  if (state.isPointerDown) {
    applyBrush()
  }
  controls.update()
  renderer.render(scene, camera)
}

animate()
