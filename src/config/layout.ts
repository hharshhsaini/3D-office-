/**
 * ============================================================================
 *  SPACEWIRE TECH – RECEPTION PROTOTYPE · LAYOUT CONFIGURATION
 * ============================================================================
 *  Every position, size and rotation used by the reception scene is defined in
 *  this file, so the layout can be corrected against the real floor plan
 *  without touching the 3D component code.
 *
 *  Units: metres. Angles: degrees.
 *
 *  World axes, as seen by a visitor standing in the main entrance:
 *      +X  visitor's RIGHT                -X  visitor's LEFT
 *      -Z  straight AHEAD (towards the reception desk)
 *      +Z  behind the visitor (out through the main entrance)
 *      +Y  up (y = 0 is the finished floor)
 *  Origin = centre of the reception lobby floor.
 *
 *  Top view (entrance at the bottom, same orientation as the floor plan):
 *
 *                      BACK WALL (logo + window)
 *            ┌──────────────────────────────────────┐
 *            │        [ RECEPTION  DESK ]    [win]  │▐ RED FEATURE
 *            │                                      │▐ WALL + BENCH
 *            │                                      │▐
 *   corridor │                                      │
 *   ◄════════╡ glass door                           ├────┐
 *   to office│                                      │ IC │ INTERVIEW
 *            │ plant                                │    │ CABIN
 *            └────────────[ ENTRANCE ]──────────────┴────┘
 *                              ▲ visitor
 *
 *  Values that are NOT known from the references are marked "ESTIMATE".
 *  Measure the real office and replace them.
 */

export type Vec3 = [number, number, number]
/** The four walls of the reception lobby. */
export type WallName = 'back' | 'front' | 'left' | 'right'

// ---------------------------------------------------------------------------
// Building shell
// ---------------------------------------------------------------------------
/** Finished floor to ceiling. ESTIMATE */
export const CEILING_HEIGHT = 2.85
/** Interior wall thickness. ESTIMATE */
export const WALL_THICKNESS = 0.15
export const SKIRTING_HEIGHT = 0.08

/** Reception lobby clear inner size. ESTIMATE */
export const LOBBY = {
  width: 6.0, // left wall → right wall (x)
  depth: 6.0, // entrance wall → back (window) wall (z)
}

/** Inner faces of the lobby walls (derived – do not edit). */
export const LOBBY_EDGES = {
  left: -LOBBY.width / 2,
  right: LOBBY.width / 2,
  back: -LOBBY.depth / 2,
  front: LOBBY.depth / 2,
}

// ---------------------------------------------------------------------------
// Main entrance  (front wall, the visitor walks in towards -Z)
// ---------------------------------------------------------------------------
export const ENTRANCE = {
  /** Centre of the door opening along the front wall (world x). */
  centerX: -0.4,
  /** Clear opening of the double glass door. ESTIMATE */
  width: 1.8,
  height: 2.4,
  /** Depth of the neutral building landing modelled outside the door. */
  landingDepth: 2.2,
}

// ---------------------------------------------------------------------------
// Reception desk – directly in front of the entrance, facing it
// ---------------------------------------------------------------------------
export const RECEPTION_DESK = {
  /** Kept on the entrance axis so the desk is straight ahead of the visitor. */
  centerX: ENTRANCE.centerX,
  /** Receptionist space between the back of the desk and the window wall. ESTIMATE */
  gapToBackWall: 1.15,
  width: 3.0,
  depth: 0.8,
  /** Visitor-side counter height. */
  height: 1.1,
  /** Receptionist work surface height. */
  workSurfaceHeight: 0.75,
  /** Wooden end blocks (visitor's left / right). */
  leftEndWidth: 0.35,
  rightEndWidth: 0.55,
  /** Recessed plinth under the marble panel (holds the warm LED strip). */
  toeKickHeight: 0.09,
  toeKickRecess: 0.06,
  /** Rotation about Y in degrees. 0 = front faces the entrance. */
  rotationDeg: 0,
}

/** z of the desk's front (visitor-side) face – derived. */
export const DESK_FRONT_Z = LOBBY_EDGES.back + RECEPTION_DESK.gapToBackWall + RECEPTION_DESK.depth
/** z of the desk centre – derived. */
export const DESK_CENTER_Z = LOBBY_EDGES.back + RECEPTION_DESK.gapToBackWall + RECEPTION_DESK.depth / 2

// ---------------------------------------------------------------------------
// Back wall behind the desk: logo panel + window. NO corridor / doorway here.
// ---------------------------------------------------------------------------
export const LOGO_WALL = {
  /** Slightly proud feature cladding behind the desk. */
  centerX: RECEPTION_DESK.centerX,
  width: 3.2,
  thickness: 0.04,
  /** Dark "S" mark. */
  markHeight: 0.58,
  markCenterY: 1.82,
  markDepth: 0.025,
  /** "Spacewire Tech" lettering under the mark. */
  wordmarkText: 'Spacewire Tech',
  wordmarkCapHeight: 0.13,
  wordmarkCenterY: 1.33,
  wordmarkDepth: 0.015,
}

export const BACK_WINDOW = {
  /** Window in the wall behind the desk, to the right of the logo (as in the reference). */
  centerX: 1.8,
  width: 0.95,
  sillHeight: 0.8,
  height: 1.1,
  /** How far behind the wall the outside view backdrop is placed. */
  viewDistance: 5,
}

export const PENDANTS = {
  /** Pendant lights over the desk (as in the latest reception reference). */
  count: 3,
  spacing: 0.8,
  centerX: RECEPTION_DESK.centerX,
  /** Distance in front of the back wall. */
  distanceFromBackWall: 0.55,
  bottomY: 2.22,
}

// ---------------------------------------------------------------------------
// Spacewire Tech red feature wall – RIGHT side of the entrance / reception
// ---------------------------------------------------------------------------
export const RED_FEATURE_WALL = {
  wall: 'right' as WallName,
  /** Extent along the right wall (world z). Back end → front end. */
  fromZ: -2.7,
  toZ: 0.5,
  /** The wooden box frame sits off the floor; the bench is its bottom shelf. */
  bottomY: 0.3,
  topY: 2.5,
  /** How far the wooden frame projects from the wall into the lobby. */
  depth: 0.5,
  frameThickness: 0.07,
  /** White S logo on the red panel. */
  logoHeight: 1.15,
  logoCenterY: 1.58,
  logoDepth: 0.03,
  /** Red cushions on the bench. */
  benchCushions: 3,
  cushionThickness: 0.1,
  /** Warm downlights in the top of the frame. */
  downlights: 3,
  /** Size of one repeat of the chevron pattern (m). */
  chevronRepeat: 1.0,
}

// ---------------------------------------------------------------------------
// Small interview cabin – next to the entrance, opening off the right side.
// Only one chair and one small table.
// ---------------------------------------------------------------------------
export const INTERVIEW_CABIN = {
  wall: 'right' as WallName,
  /** Glass front along the right wall (world z). */
  fromZ: 1.15,
  toZ: LOBBY_EDGES.front,
  /** Clear depth of the cabin beyond the lobby wall. ESTIMATE */
  depth: 1.5,
  /** Glass door in the cabin front (world z of its two edges). */
  door: { fromZ: 1.3, toZ: 2.15, hingeAt: 'toZ' as 'fromZ' | 'toZ', openDeg: 0 },
  /** Furniture, world coordinates (x, z). */
  table: { x: 3.55, z: 2.45, diameter: 0.6, height: 0.72 },
  /** rotationDeg 0 = seat faces +Z (towards the entrance wall). */
  chair: { x: 4.1, z: 2.0, rotationDeg: -50 },
}

// ---------------------------------------------------------------------------
// Office corridor – starts beyond the reception area, leads to the main office
// and the cabins. It leaves through the LEFT wall (never behind the desk).
// ---------------------------------------------------------------------------
export const CORRIDOR = {
  wall: 'left' as WallName,
  /** Corridor opening along the left wall (world z). Width = toZ - fromZ. */
  fromZ: 0.1,
  toZ: 1.7,
  /** Length of the corridor stub modelled in this phase. */
  length: 5.0,
  /** Glass door between lobby and corridor (world z of its edges). */
  door: { fromZ: 0.62, toZ: 1.6, hingeAt: 'toZ' as 'fromZ' | 'toZ', openDeg: -80 },
  /**
   * The rooms behind the corridor glass are not modelled yet, so the glass
   * is frosted for now. Set to false once the cabins are built.
   */
  frostedSideGlass: true,
  /** Red manifestation band on the right-hand glass (from the corridor photo). */
  redBand: { side: 'right' as 'left' | 'right', bottomY: 1.0, height: 0.16 },
}

// ---------------------------------------------------------------------------
// Lighting fixtures (world coordinates)
// ---------------------------------------------------------------------------
export const LINEAR_LEDS: { from: [number, number]; to: [number, number] }[] = [
  // lobby – runs from the entrance towards the desk, over the walkway
  { from: [0.95, 2.4], to: [0.95, -1.3] },
]
/** Warm recessed downlights in the lobby ceiling (x, z). */
export const DOWNLIGHTS: [number, number][] = [
  [-2.0, 1.9],
  [-2.0, -0.3],
]

// ---------------------------------------------------------------------------
// Plants (kept to the ones visible in the references)
// ---------------------------------------------------------------------------
export const FLOOR_PLANTS: { x: number; z: number; scale: number }[] = [
  { x: LOBBY_EDGES.left + 0.4, z: LOBBY_EDGES.front - 0.4, scale: 1 },
]
/** Plants standing on the desk's wooden end blocks. */
export const DESK_PLANTS = { left: true, right: true }

// ---------------------------------------------------------------------------
// Camera
// ---------------------------------------------------------------------------
export const EYE_HEIGHT = 1.6

/** Fixed first view: standing in the main entrance, facing the reception desk. */
export const INITIAL_CAMERA = {
  position: [ENTRANCE.centerX, EYE_HEIGHT, LOBBY_EDGES.front - 0.1] as Vec3,
  lookAt: [RECEPTION_DESK.centerX, 1.25, LOBBY_EDGES.back] as Vec3,
  fov: 62,
}

export const OVERVIEW_CAMERA = {
  position: [-6.0, 10.5, 8.5] as Vec3,
  target: [0.6, 0.3, -0.4] as Vec3,
  fov: 45,
}

export const PLAN_CAMERA = {
  position: [-1.2, 17, 0.6] as Vec3,
  target: [-1.2, 0, 0.5] as Vec3,
  fov: 40,
}

/** Walking speed in m/s (hold Shift to double). */
export const WALK_SPEED = 1.5

// ---------------------------------------------------------------------------
// Derived helpers
// ---------------------------------------------------------------------------
export type Rect = { x0: number; x1: number; z0: number; z1: number }

const corridorX0 = LOBBY_EDGES.left - CORRIDOR.length
const cabinX1 = LOBBY_EDGES.right + INTERVIEW_CABIN.depth

/** Areas a visitor may walk in (shrunk by the body radius at runtime). */
export const WALKABLE_AREAS: Rect[] = [
  { x0: LOBBY_EDGES.left, x1: LOBBY_EDGES.right, z0: LOBBY_EDGES.back, z1: LOBBY_EDGES.front },
  { x0: corridorX0, x1: LOBBY_EDGES.left, z0: CORRIDOR.fromZ, z1: CORRIDOR.toZ },
  { x0: LOBBY_EDGES.right, x1: cabinX1, z0: INTERVIEW_CABIN.fromZ, z1: INTERVIEW_CABIN.toZ },
]

/** Door openings that connect the walkable areas (not shrunk). */
export const DOORWAYS: Rect[] = [
  // standing in the main entrance threshold (the initial camera position)
  {
    x0: ENTRANCE.centerX - ENTRANCE.width / 2 + 0.25,
    x1: ENTRANCE.centerX + ENTRANCE.width / 2 - 0.25,
    z0: LOBBY_EDGES.front - 0.6,
    z1: LOBBY_EDGES.front - 0.05,
  },
  {
    x0: LOBBY_EDGES.left - 0.45,
    x1: LOBBY_EDGES.left + 0.45,
    z0: CORRIDOR.door.fromZ + 0.25,
    z1: CORRIDOR.door.toZ - 0.25,
  },
  {
    x0: LOBBY_EDGES.right - 0.45,
    x1: LOBBY_EDGES.right + 0.45,
    z0: INTERVIEW_CABIN.door.fromZ + 0.25,
    z1: INTERVIEW_CABIN.door.toZ - 0.25,
  },
]

/** Furniture footprints the visitor cannot walk through. */
export const OBSTACLES: Rect[] = [
  {
    x0: RECEPTION_DESK.centerX - RECEPTION_DESK.width / 2,
    x1: RECEPTION_DESK.centerX + RECEPTION_DESK.width / 2,
    z0: DESK_CENTER_Z - RECEPTION_DESK.depth / 2,
    z1: DESK_CENTER_Z + RECEPTION_DESK.depth / 2,
  },
  {
    x0: LOBBY_EDGES.right - RED_FEATURE_WALL.depth,
    x1: LOBBY_EDGES.right,
    z0: RED_FEATURE_WALL.fromZ,
    z1: RED_FEATURE_WALL.toZ,
  },
  ...FLOOR_PLANTS.map((p) => ({ x0: p.x - 0.25, x1: p.x + 0.25, z0: p.z - 0.25, z1: p.z + 0.25 })),
  {
    x0: INTERVIEW_CABIN.table.x - INTERVIEW_CABIN.table.diameter / 2,
    x1: INTERVIEW_CABIN.table.x + INTERVIEW_CABIN.table.diameter / 2,
    z0: INTERVIEW_CABIN.table.z - INTERVIEW_CABIN.table.diameter / 2,
    z1: INTERVIEW_CABIN.table.z + INTERVIEW_CABIN.table.diameter / 2,
  },
]

/** Plan labels (shown in Overview / Plan view only – not signage in the room). */
export const PLAN_LABELS: { text: string; position: Vec3 }[] = [
  { text: 'Main entrance', position: [ENTRANCE.centerX, 0.1, LOBBY_EDGES.front + 0.9] },
  { text: 'Reception desk', position: [RECEPTION_DESK.centerX, 1.3, DESK_CENTER_Z] },
  { text: 'Window (wall behind desk)', position: [BACK_WINDOW.centerX, 2.2, LOBBY_EDGES.back - 0.3] },
  {
    text: 'Red feature wall + bench',
    position: [LOBBY_EDGES.right - 0.3, 2.6, (RED_FEATURE_WALL.fromZ + RED_FEATURE_WALL.toZ) / 2],
  },
  {
    text: 'Interview cabin (1 chair)',
    position: [LOBBY_EDGES.right + INTERVIEW_CABIN.depth / 2, 1.4, (INTERVIEW_CABIN.fromZ + INTERVIEW_CABIN.toZ) / 2],
  },
  {
    text: 'Corridor → main office & cabins',
    position: [LOBBY_EDGES.left - CORRIDOR.length / 2, 1.4, (CORRIDOR.fromZ + CORRIDOR.toZ) / 2],
  },
]
