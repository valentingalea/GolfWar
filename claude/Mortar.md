# Mortar Technical Reference

This document contains technical notes and specifications for the M252-style mortar model used in the "putting" phase of GolfWar.

## Real-World Reference: M252 81mm Medium Mortar

The mortar model is based on the US M252 81mm mortar system, a British-designed smooth bore, muzzle-loading, high-angle-of-fire weapon.

Mortar Design (based on M224/M252 mortar references):

  The mortar consists of:
  - Baseplate: Octagonal plate (0.35m radius) that absorbs recoil, with a ball-socket joint
  - Tube: 0.8m long olive-green barrel, muzzle-loaded from top
  - Bipod: Two legs with spiked feet, collar attachment, elevation adjustment screw and handwheel
  - Details: Carrying handle, muzzle ring, breech cap, sight post with bubble level
  - Game elements: Loaded ball (hidden by default), muzzle flash sprite

  Key characteristics vs Howitzer:
  ┌────────────┬──────────────────┬──────────────────────────┐
  │  Feature   │     Howitzer     │          Mortar          │
  ├────────────┼──────────────────┼──────────────────────────┤
  │ Size       │ ~3m long         │ ~0.8m tube               │
  ├────────────┼──────────────────┼──────────────────────────┤
  │ Mobility   │ Wheeled carriage │ Baseplate + bipod        │
  ├────────────┼──────────────────┼──────────────────────────┤
  │ Fire angle │ Low-medium       │ High angle (60° default) │
  ├────────────┼──────────────────┼──────────────────────────┤
  │ Scale      │ 1.2              │ 1.0                      │
  ├────────────┼──────────────────┼──────────────────────────┤
  │ Color      │ Dark metal       │ Olive drab               │
  └────────────┴──────────────────┴──────────────────────────┘
  Files modified:
  - cannon.js: Added createMortar() function (~200 lines)
  - index.html: Imported createMortar, created instance at origin

  Returns object structure:
  {
    group, traverseGroup, elevatingGroup,
    tube, baseplate, muzzleFlash, loadedBall,
    tubeLength, elevationBase, traverseBase
  }

  Sources:
  - https://en.wikipedia.org/wiki/M252_mortar
  - https://en.wikipedia.org/wiki/M224_mortar
  - https://en.wikipedia.org/wiki/Mortar_(weapon)
  
  New details added:
  - Blast Attenuator Device (BAD) - cone at muzzle
  - Breech ball that sits in baseplate socket
  - Collar clamp bands
  - Leg clamps and proper foot discs
  - Elevation mechanism box between legs
  - Traversing handwheel on side
  - M64A1-style sight with base, post, and head

  M252 specs used:
  ┌───────────┬──────────────────────┐
  │ Component │      Dimension       │
  ├───────────┼──────────────────────┤
  │ Barrel    │ 1.27m (56")          │
  ├───────────┼──────────────────────┤
  │ Bore      │ 81mm                 │
  ├───────────┼──────────────────────┤
  │ Elevation │ 45-85° (default 60°) │
  ├───────────┼──────────────────────┤
  │ Baseplate │ ~30" diameter        │
  └───────────┴──────────────────────┘
  Sources:
  - https://www.inetres.com/gp/military/infantry/mortar/M252.html
  - https://www.globalsecurity.org/military/library/policy/army/fm/23-90/ch4.htm

### M252 System Components

| Component | Model | Weight | Description |
|-----------|-------|--------|-------------|
| Cannon | M253 | 35 lb (16 kg) | Barrel with breech plug and firing pin |
| Bipod Mount | M177 | 27 lb (12 kg) | Elevating/traversing mechanism with legs |
| Baseplate | M3A1 | 29 lb (13 kg) | One-piece construction, absorbs recoil |
| Sight Unit | M64A1 | 2.5 lb (1.1 kg) | Indirect fire sight |
| **Total** | | **91 lb (41 kg)** | |

### M252 Specifications

| Specification | Value |
|---------------|-------|
| Barrel Length | 56 inches (1.42m) |
| Bore Diameter | 81mm |
| Elevation Range | 45° to 85° |
| Maximum Range | 5,700 meters |
| Minimum Range | 80 meters |
| Rate of Fire (Max) | 33 rounds/min |
| Rate of Fire (Sustained) | 16 rounds/min |

### M177 Bipod Dimensions

| Dimension | Value |
|-----------|-------|
| Length | 42 inches (107 cm) |
| Width | 18 inches (46 cm) |
| Height | 9 inches (23 cm) |
| Weight | ~30 lbs |

## Game Model Implementation

### Dimensions Used

| Parameter | Game Value | Real M252 | Notes |
|-----------|------------|-----------|-------|
| Tube Length | 1.27m | 1.42m | Slightly shortened |
| Tube Radius | 0.075m | 0.04m (bore) | Enlarged 87% for visual impact |
| Baseplate Radius | 0.38m | ~0.38m (30") | Accurate |
| Default Elevation | 60° | 45-85° | Mid-range default |

### Model Structure

```
mortar (Group)
├── baseplate (Cylinder)
├── reinforcement ribs (6x Box)
├── socket (Hemisphere)
├── socket collar (Torus)
└── traverseGroup (Group) ─── rotates left/right
    └── elevatingGroup (Group) ─── tilts up/down
        ├── tube (Cylinder)
        ├── muzzle ring (Torus)
        ├── BAD assembly (see below)
        ├── breech plug (Cylinder)
        ├── breech ball (Sphere)
        ├── carrying handle (Torus arc)
        ├── bipod collar + bands
        ├── bipod yoke (Box)
        ├── left leg group
        ├── right leg group
        ├── elevation mechanism (Box)
        ├── elevation handwheel (Torus)
        ├── traverse handwheel (Torus)
        ├── sight assembly
        ├── loaded ball (Sphere, hidden)
        └── muzzle flash (Sprite, hidden)
```

### Blast Attenuator Device (BAD) Assembly

Multi-part muzzle device for noise/flash reduction:

```
[tube]──[collar]──[body]──[chamber]──[cone]──[rim]
         0.04m    0.08m    0.06m     0.07m
```

| Part | Geometry | Radius (× tubeRadius) | Length |
|------|----------|----------------------|--------|
| Base Collar | Cylinder | 1.15 → 1.20 | 0.04m |
| Main Body | Cylinder | 1.15 → 1.25 | 0.08m |
| Expansion Chamber | Cylinder | 1.25 → 1.40 | 0.06m |
| Cone Section | Cylinder | 1.40 → 1.60 | 0.07m |
| Outer Rim | Torus | 1.60 | - |
| Vent Rings | Torus (×3) | 1.2, 1.32, 1.44 | - |

**Total BAD Length:** ~0.25m

### Bipod Leg Calculation

The bipod legs are dynamically calculated to reach the ground at the default elevation:

```javascript
// Bipod attaches at 70% along tube length
const bipodAttachPoint = tubeLength * 0.70;  // 0.889m

// Calculate collar height at 60° elevation
const collarHeight = 0.09 + bipodAttachPoint * Math.sin(60°);  // ≈ 0.86m

// Leg angle (outward splay)
const legAngle = 0.18 radians;  // ~10 degrees

// Leg length needed to reach ground
const bipodLegLength = (collarHeight + 0.05) / Math.cos(legAngle);  // ≈ 0.92m
```

### Materials

| Material | Color | Roughness | Metalness | Usage |
|----------|-------|-----------|-----------|-------|
| mortarOlive | #4a5a3a | 0.7 | 0.3 | Tube, legs |
| mortarDark | #2a3a2a | 0.6 | 0.4 | Baseplate, breech |
| metalMid | #4a4a4a | 0.5 | 0.5 | Socket, collar, yoke |
| metalDark | #2a2a2a | 0.6 | 0.4 | Bands, spikes, BAD parts |

### Comparison: Howitzer vs Mortar

| Feature | Howitzer | Mortar |
|---------|----------|--------|
| Size | ~3m long | ~1.27m tube |
| Mobility | Wheeled carriage | Baseplate + bipod |
| Fire Angle | Low-medium | High angle (45-85°) |
| Default Scale | 1.2 | 1.0 |
| Color Scheme | Dark metal grays | Olive drab green |
| Barrel Type | Rifled, breech-load | Smooth bore, muzzle-load |
| Recoil System | Hydraulic cylinders | Baseplate absorption |
| Intended Use | Long range shots | "Putting" phase |

### Return Object

```javascript
{
  group,           // Main THREE.Group
  traverseGroup,   // Rotation control group
  elevatingGroup,  // Elevation control group
  tube,            // Barrel mesh
  baseplate,       // Baseplate mesh
  muzzleFlash,     // Sprite for firing effect
  loadedBall,      // Ball mesh (hidden until loaded)
  tubeLength,      // 1.27m
  bipodLegLength,  // Calculated leg length
  elevationBase,   // Default elevation rotation.x
  traverseBase     // Default traverse rotation.y (0)
}
```

## References

- [M252 mortar - Wikipedia](https://en.wikipedia.org/wiki/M252_mortar)
- [M224 mortar - Wikipedia](https://en.wikipedia.org/wiki/M224_mortar)
- [Mortar (weapon) - Wikipedia](https://en.wikipedia.org/wiki/Mortar_(weapon))
- [M252 81mm Medium Mortar - inetres.com](https://www.inetres.com/gp/military/infantry/mortar/M252.html)
- [FM 23-90 Chapter 4 - GlobalSecurity.org](https://www.globalsecurity.org/military/library/policy/army/fm/23-90/ch4.htm)

## File Location

The mortar model is implemented in `cannon.js`:
- Function: `createMortar(scene, config)`
- Lines: ~330-620

## Future Considerations

- [ ] Add mortar-specific firing animation (tube recoil into baseplate)
- [ ] Create mortar controls (different elevation/traverse limits)
- [ ] Implement mortar projectile system (higher arc, shorter range)
- [ ] Add sound effects appropriate for mortar fire
- [ ] Consider smaller ball size for mortar shots
