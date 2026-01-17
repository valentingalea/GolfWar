export const TERRAIN_SIZE = 220
export const BRUSH_SIZE_RANGE = { min: 2, max: 40 }
export const BRUSH_STRENGTH_SCALE = 0.12
export const BRUSH_STRENGTH_STEP = 0.1
export const BRUSH_FALLOFF_STEP = 0.1
export const BRUSH_PREVIEW_HEIGHT = 8
export const STRENGTH_RING_MIN_FACTOR = 0.2
export const FALLOFF_ARC_DEGREES = 60
export const FALLOFF_RADIUS_FACTOR = 0.6
export const HEIGHT_EXPORT_EPSILON = 0.0001
export const UNDO_MAX_HISTORY = 10
export const MATERIAL_TYPES = [
  { id: 0, name: 'fairway', color: 0x4f7c71 },
  { id: 1, name: 'green', color: 0x69b05b },
  { id: 2, name: 'rough', color: 0x7a6f4b },
  { id: 3, name: 'bunker', color: 0xd8c38a },
  { id: 4, name: 'tee', color: 0xe2d68d },
  { id: 5, name: 'water', color: 0x4a6ea9 }
]
export const DEFAULT_MATERIAL_ID = 2
