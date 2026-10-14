/**
 * ============================================================================
 *  SPACEWIRE TECH – OFFICE LAYOUT (single source of truth)
 * ============================================================================
 *  Every room, wall, opening, piece of furniture, light and camera position of
 *  the 3D office is defined here. The 3D scene, the 2D floor plan, the
 *  collision map and the area hotspots are all generated from this file.
 *
 *  Units: metres. Angles: degrees.
 *  Axes follow the annotated floor plan image:
 *      +X = east  (right on the plan)       -X = west (left, exterior windows)
 *      +Z = south (down on the plan)        -Z = north (top, Video Editors)
 *      +Y = up    (y = 0 is the finished floor)
 *  Origin = north-west inner corner of the office.
 *
 *          x=0          3.7  4.3        6.85          10.0
 *     z=0  ┌────────────┬────┬───────────────────────────┐
 *          │ HR&Finance │ c  │  Video Editors  (2 benches)│
 *      3.5 ├────────────┤ o  │                            │
 *          │ Founders   │ r  │   [ central planter        │
 *      7.0 ├────────────┤ r  │     workstation ]          │
 *          │ Tech       │ i  │                            │
 *     10.5 ├────────────┤ d  │  AI Video Makers/Marketing │
 *          │ Actors     │ o  ├──────────┬─────────────────┤
 *          │            │ r  │ Eating   │ Washroom        │
 *     14.0 ├▓▓red wall▓▓┘    ├──────────┼─────────────────┤
 *          │            office│ small    │                 │
 *          │ reception  entr. │ cabin    │  STAIRS         │
 *          │  [desk]           ─────────┤  (not modelled) │
 *          │                         ◄── main entrance    │
 *     19.4 └──────────────────────────────┘
 *
 *  Values marked ESTIMATE are proportions read from the annotated image;
 *  replace them with measured sizes when available.
 */

export type XZ = [number, number]
export type Rect = { x0: number; z0: number; x1: number; z1: number }
export type Vec3 = [number, number, number]

// ---------------------------------------------------------------------------
// Building shell
// ---------------------------------------------------------------------------
export const CEILING_HEIGHT = 2.85
export const EXTERIOR_WALL = 0.25
export const INTERIOR_WALL = 0.12

/** Modelled office, inner size. ESTIMATE */
export const OFFICE = { width: 10.0, length: 19.4 }

/** Key grid lines (ESTIMATE, proportional to the annotated image). */
export const GRID = {
  cabinsEast: 3.7, // cabin glass fronts
  corridorEast: 4.3, // tiled corridor strip ends, wooden workspace floor begins
  eatingWest: 5.2, // west edge of eating area / small cabin
  serviceWest: 6.85, // washroom / stairs / reception east wall
  serviceNorth: 10.5, // north edge of eating area + washroom
  receptionNorth: 14.0, // red wall line / reception north edge
  smallCabinSouth: 15.75,
}

// ---------------------------------------------------------------------------
// Areas (used for floors, labels, hotspots and "you are here")
// ---------------------------------------------------------------------------
export type FloorKind = 'tile' | 'wood'
export interface Area {
  id: string
  name: string
  rect: Rect
  floor: FloorKind
  /** Shown on the plan / as a hotspot. */
  label?: boolean
  /** First-person viewpoint used when the hotspot is clicked: x, z, yaw (0 = facing north). */
  view?: { x: number; z: number; yawDeg: number }
}

export const CABINS = [
  { id: 'hr', name: 'HR & Finance', z0: 0, z1: 3.5, monitors: 2 },
  { id: 'founders', name: 'Founders', z0: 3.5, z1: 7.0, monitors: 3 },
  { id: 'tech', name: 'Tech', z0: 7.0, z1: 10.5, monitors: 2 },
  { id: 'actors', name: 'Actors', z0: 10.5, z1: GRID.receptionNorth, monitors: 2 },
] as const

/** Cabin door in the glass front: distance from the cabin's south edge. */
export const CABIN_DOOR = { width: 0.95, fromSouth: 0.2 }

export const AREAS: Area[] = [
  ...CABINS.map((c) => ({
    id: c.id,
    name: c.name,
    rect: { x0: 0, x1: GRID.cabinsEast, z0: c.z0, z1: c.z1 },
    floor: 'tile' as FloorKind,
    label: true,
    view: { x: GRID.cabinsEast + 0.4, z: c.z1 - 0.7, yawDeg: 90 },
  })),
  {
    id: 'corridor',
    name: 'Cabin corridor',
    rect: { x0: GRID.cabinsEast, x1: GRID.corridorEast, z0: 0, z1: GRID.receptionNorth },
    floor: 'tile',
  },
  {
    id: 'workspace',
    name: 'Open workspace',
    rect: { x0: GRID.corridorEast, x1: OFFICE.width, z0: 0, z1: GRID.serviceNorth },
    floor: 'wood',
    view: { x: 4.2, z: 10.2, yawDeg: -25 },
  },
  {
    id: 'workspace-south',
    name: 'Open workspace',
    rect: { x0: GRID.corridorEast, x1: GRID.eatingWest, z0: GRID.serviceNorth, z1: GRID.receptionNorth },
    floor: 'wood',
  },
  {
    id: 'eating',
    name: 'Eating area',
    rect: { x0: GRID.eatingWest, x1: GRID.serviceWest, z0: GRID.serviceNorth, z1: GRID.receptionNorth },
    floor: 'tile',
    label: true,
    view: { x: 5.0, z: 11.0, yawDeg: -120 },
  },
  {
    id: 'washroom',
    name: 'Washroom',
    rect: { x0: GRID.serviceWest, x1: OFFICE.width, z0: GRID.serviceNorth, z1: GRID.receptionNorth },
    floor: 'tile',
    label: true,
  },
  {
    id: 'reception',
    name: 'Reception',
    rect: { x0: 0, x1: GRID.serviceWest, z0: GRID.receptionNorth, z1: OFFICE.length },
    floor: 'tile',
    label: true,
    view: { x: 6.3, z: 18.3, yawDeg: 90 },
  },
  {
    id: 'small-cabin',
    name: 'Small cabin',
    rect: { x0: GRID.eatingWest, x1: GRID.serviceWest, z0: GRID.receptionNorth, z1: GRID.smallCabinSouth },
    floor: 'tile',
    label: true,
    view: { x: 5.75, z: 16.5, yawDeg: 20 },
  },
]

/** Not part of the modelled office (kept empty on purpose). */
export const EXCLUDED_STAIRS: Rect = {
  x0: GRID.serviceWest,
  x1: OFFICE.width,
  z0: GRID.receptionNorth,
  z1: OFFICE.length,
}

// ---------------------------------------------------------------------------
// Walls. Each wall is an axis-aligned segment; openings are measured along the
// segment from `from`. `inner` = side the room is on ('+' = +x/+z side, '-' = other,
// 'both' for interior walls) – used for skirting and exterior wall offset.
// ---------------------------------------------------------------------------
export interface Opening {
  from: number
  to: number
  /** sill height (0 = door / passage) */
  bottom?: number
  top?: number
  kind: 'door' | 'window' | 'passage'
  /** venetian blinds on a window */
  blinds?: boolean
}
export interface WallSpec {
  id: string
  from: XZ
  to: XZ
  thickness: number
  exterior?: boolean
  /** which side of the line the wall body sits on: 'center' for interior walls */
  body: 'center' | 'left' | 'right'
  openings?: Opening[]
}

const W = OFFICE.width
const L = OFFICE.length
const G = GRID
const EXT = EXTERIOR_WALL

/** Windows with blinds (exterior). ESTIMATE – confirm against photos. */
const westWindows: Opening[] = [
  ...CABINS.map((c) => ({ from: (c.z0 + c.z1) / 2 - 0.8, to: (c.z0 + c.z1) / 2 + 0.8, bottom: 0.9, top: 2.3, kind: 'window' as const, blinds: true })),
  // reception window, behind the desk to the north of the logo panel
  { from: 15.15, to: 15.95, bottom: 0.8, top: 1.85, kind: 'window' },
]

/** Main entrance (double glass door) in the reception's east wall. */
export const MAIN_ENTRANCE = { z0: 17.55, z1: 19.05, height: 2.4 }

/** Washroom door, entered from the eating area. */
export const WASHROOM_DOOR = { z0: 13.0, z1: 13.85, height: 2.1 }

export const WALLS: WallSpec[] = [
  // exterior: body outside the office rectangle
  {
    id: 'north',
    from: [-EXT, 0],
    to: [W + EXT, 0],
    thickness: EXT,
    exterior: true,
    body: 'left', // walking east, "left" = north = outside
    openings: [
      { from: 6.3 + EXT, to: 7.4 + EXT, bottom: 0.9, top: 2.3, kind: 'window', blinds: true },
      { from: 8.5 + EXT, to: 9.6 + EXT, bottom: 0.9, top: 2.3, kind: 'window', blinds: true },
    ],
  },
  { id: 'west', from: [0, 0], to: [0, L], thickness: EXT, exterior: true, body: 'right', openings: westWindows },
  { id: 'east', from: [W, 0], to: [W, G.receptionNorth], thickness: EXT, exterior: true, body: 'left' },
  { id: 'south', from: [-EXT, L], to: [G.serviceWest + EXT, L], thickness: EXT, exterior: true, body: 'right' },
  {
    // reception east wall – stairs landing beyond; main entrance in it
    id: 'reception-east',
    from: [G.serviceWest, G.receptionNorth],
    to: [G.serviceWest, L],
    thickness: EXT,
    exterior: true,
    body: 'left',
    openings: [
      { from: MAIN_ENTRANCE.z0 - G.receptionNorth, to: MAIN_ENTRANCE.z1 - G.receptionNorth, top: MAIN_ENTRANCE.height, kind: 'door' },
    ],
  },
  {
    // washroom block south wall (stairs beyond)
    id: 'washroom-south',
    from: [G.serviceWest, G.receptionNorth],
    to: [W, G.receptionNorth],
    thickness: EXT,
    exterior: true,
    body: 'right',
  },
  // interior solid walls
  {
    // Actors cabin ↔ reception; the red feature wall is mounted on its south face
    id: 'actors-reception',
    from: [0, G.receptionNorth],
    to: [G.cabinsEast, G.receptionNorth],
    thickness: INTERIOR_WALL,
    body: 'center',
  },
  {
    // eating area ↔ small cabin
    id: 'eating-smallcabin',
    from: [G.eatingWest, G.receptionNorth],
    to: [G.serviceWest, G.receptionNorth],
    thickness: INTERIOR_WALL,
    body: 'center',
  },
  {
    id: 'washroom-west',
    from: [G.serviceWest, G.serviceNorth],
    to: [G.serviceWest, G.receptionNorth],
    thickness: INTERIOR_WALL,
    body: 'center',
    openings: [
      { from: WASHROOM_DOOR.z0 - G.serviceNorth, to: WASHROOM_DOOR.z1 - G.serviceNorth, top: WASHROOM_DOOR.height, kind: 'door' },
    ],
  },
  { id: 'washroom-north', from: [G.serviceWest, G.serviceNorth], to: [W, G.serviceNorth], thickness: INTERIOR_WALL, body: 'center' },
]

// ---------------------------------------------------------------------------
// Black-framed glass partitions (cabin fronts, cabin dividers, small cabin)
// ---------------------------------------------------------------------------
export interface GlassDoor {
  from: number
  to: number
  hinge: 'from' | 'to'
  /** opens automatically when the visitor walks up to it */
  auto: boolean
}
export interface GlassSpec {
  id: string
  from: XZ
  to: XZ
  /** frosted botanical film on the lower part of the glass */
  botanical?: boolean
  door?: GlassDoor
}

export const GLASS: GlassSpec[] = [
  // cabin fronts on the corridor, each with a door near its south end
  ...CABINS.map((c) => ({
    id: `${c.id}-front`,
    from: [G.cabinsEast, c.z0] as XZ,
    to: [G.cabinsEast, c.z1] as XZ,
    botanical: true,
    door: {
      from: c.z1 - c.z0 - CABIN_DOOR.fromSouth - CABIN_DOOR.width,
      to: c.z1 - c.z0 - CABIN_DOOR.fromSouth,
      hinge: 'to' as const,
      auto: true,
    },
  })),
  // dividers between cabins (frosted botanical film, as in the image)
  ...CABINS.slice(1).map((c) => ({
    id: `${c.id}-divider`,
    from: [0, c.z0] as XZ,
    to: [G.cabinsEast, c.z0] as XZ,
    botanical: true,
  })),
  // small cabin: west and south glass, door facing the reception
  {
    id: 'smallcabin-west',
    from: [G.eatingWest, G.receptionNorth],
    to: [G.eatingWest, G.smallCabinSouth],
  },
  {
    id: 'smallcabin-south',
    from: [G.eatingWest, G.smallCabinSouth],
    to: [G.serviceWest, G.smallCabinSouth],
    door: { from: 0.15, to: 0.95, hinge: 'from', auto: true },
  },
]

// ---------------------------------------------------------------------------
// Reception (approved prototype, placed in the office: visitor enters facing west)
// ---------------------------------------------------------------------------
export const RECEPTION = {
  desk: {
    /** centre of the desk (x, z); the desk faces east, towards the main entrance */
    center: [1.2, 17.7] as XZ,
    length: 2.8,
    depth: 0.75,
    height: 1.1,
    workSurfaceHeight: 0.75,
    /** wooden end blocks, as seen by the visitor walking in (left = south end) */
    leftEndWidth: 0.32,
    rightEndWidth: 0.48,
    toeKickHeight: 0.09,
    toeKickRecess: 0.06,
  },
  /** Logo feature panel + window on the west wall behind the desk. */
  logoPanel: { centerZ: 17.7, width: 2.6, markHeight: 0.52, markY: 1.8, wordmarkCapHeight: 0.12, wordmarkY: 1.34 },
  pendants: { count: 3, spacing: 0.7, distanceFromWall: 0.5, bottomY: 2.18 },
  /** Red feature wall on the south face of the Actors cabin wall. */
  redWall: { x0: 0.12, x1: 3.55, bottomY: 0.3, topY: 2.45, depth: 0.45, logoHeight: 1.0, logoY: 1.55, cushions: 3 },
  floorPlants: [[6.45, 16.45]] as XZ[],
  linearLed: { from: [6.2, 16.05] as XZ, to: [3.2, 16.05] as XZ },
  downlights: [
    [5.75, 18.35],
    [3.85, 18.35],
  ] as XZ[],
}

export const SMALL_CABIN = {
  table: { x: 6.35, z: 14.6, diameter: 0.55 },
  /** facingDeg uses the camera convention: 0 = faces north, 90 = west, -90 = east */
  chair: { x: 5.8, z: 14.85, facingDeg: -70 },
}

// ---------------------------------------------------------------------------
// Cabin furniture (from the annotated image: one desk, staff on the north side)
// ---------------------------------------------------------------------------
export const CABIN_FURNITURE = {
  desk: { width: 1.8, depth: 0.75, height: 0.75, offsetX: 1.85, offsetZ: 0.0 },
  staffChairs: 2,
  visitorChairs: 1,
  plant: { x: 0.45, fromNorth: 0.45 },
}

// ---------------------------------------------------------------------------
// Open workspace
// ---------------------------------------------------------------------------
/** Double-sided bench desks (long axis north-south): 2 seats per side = 4 chairs, as in the office photo. */
export const BENCHES = [
  { id: 've-1', group: 'Video Editors', center: [5.5, 1.95] as XZ, seatsPerSide: 2 },
  { id: 've-2', group: 'Video Editors', center: [8.5, 1.95] as XZ, seatsPerSide: 2 },
  { id: 'ai-1', group: 'AI Video Makers / Marketing Team', center: [5.7, 9.0] as XZ, seatsPerSide: 2 },
  { id: 'ai-2', group: 'AI Video Makers / Marketing Team', center: [8.55, 9.0] as XZ, seatsPerSide: 2 },
]
export const BENCH = { seatWidth: 0.78, deskDepth: 0.6, height: 0.75 }

/** Central planter workstation: white-bordered planter, green tables on all four sides. */
export const PLANTER_WORKSTATION = {
  planter: { x0: 5.75, x1: 8.25, z0: 4.4, z1: 6.0, rimHeight: 0.8, rimWidth: 0.14 },
  /** table depth on each side of the planter */
  tables: { north: 0.55, south: 0.8, west: 0.6, east: 0.6 },
  /** chairs per side */
  chairs: { north: 2, south: 2, west: 4, east: 4 },
}

export const EATING_AREA = {
  /** lunch counter along the washroom wall, before the washroom door */
  counter: { z0: 11.3, z1: 12.85, depth: 0.6, height: 1.0 },
  stools: 3,
  fridge: { z0: 10.6, z1: 11.25, depth: 0.68, height: 1.8 },
}

export const WORKSPACE_PLANTS: XZ[] = [
  [9.55, 0.5],
  [9.7, 3.4],
]

// ---------------------------------------------------------------------------
// Ceiling (confirm against ceiling photos)
// ---------------------------------------------------------------------------
export const CEILING = {
  /** Green painted ceiling sections over the open workspace. ESTIMATE */
  greenSections: [
    { x0: 4.75, x1: 9.85, z0: 0.35, z1: 3.4 },
    { x0: 5.0, x1: 9.0, z0: 3.7, z1: 7.2 },
    { x0: 4.75, x1: 9.85, z0: 7.6, z1: 10.3 },
  ] as Rect[],
  /** White spherical pendants (positions read from the image). */
  spherePendants: [
    [5.6, 0.9],
    [8.0, 0.7],
    [9.5, 1.7],
    [4.9, 3.4],
    [5.65, 4.25],
    [8.35, 3.45],
    [8.25, 4.3],
    [9.75, 10.1],
  ] as XZ[],
  sphereBottomY: 2.25,
  /** 4-way cassette air conditioners. ESTIMATE */
  acCassettes: [
    [7.15, 2.0],
    [7.0, 7.45],
    [9.4, 6.4],
    [1.85, 1.75],
    [1.85, 5.25],
    [1.85, 8.75],
    [1.85, 12.25],
    [3.6, 17.2],
  ] as XZ[],
  /** White linear LED strips. */
  linearLeds: [
    { from: [4.15, 0.4] as XZ, to: [4.15, 13.6] as XZ },
    ...CABINS.map((c) => ({ from: [0.7, (c.z0 + c.z1) / 2 + 0.6] as XZ, to: [3.0, (c.z0 + c.z1) / 2 + 0.6] as XZ })),
    { from: [5.6, 10.8] as XZ, to: [5.6, 13.7] as XZ },
  ],
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------
export const EYE_HEIGHT = 1.6
export const PLAYER_RADIUS = 0.22
export const WALK_SPEED = 1.6

/** First view: just inside the main entrance, facing west towards the reception desk. */
export const SPAWN = { x: 6.25, z: 18.3, yawDeg: 90 }

export const OVERVIEW_CAMERA = {
  position: [5.0, 21.0, 27.5] as Vec3,
  target: [5.0, 0, 9.0] as Vec3,
  fov: 45,
}

/** Helpers --------------------------------------------------------------- */
export const rectCenter = (r: Rect): XZ => [(r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2]

// ---------------------------------------------------------------------------
// Hotspots: labels in the overview / 2D plan; clicking one walks you there.
// view: first-person spot (x, z) and yaw (0 = facing north, 90 = west, -90 = east, 180 = south)
// ---------------------------------------------------------------------------
export interface Hotspot {
  label: string
  at: XZ
  view?: { x: number; z: number; yawDeg: number }
}

export const HOTSPOTS: Hotspot[] = [
  ...AREAS.filter((a) => a.label).map((a) => ({ label: a.name, at: rectCenter(a.rect), view: a.view })),
  { label: 'Video Editors', at: [7.0, 1.95], view: { x: 7.0, z: 3.1, yawDeg: 0 } },
  { label: 'Central planter workstation', at: [7.0, 5.2], view: { x: 4.0, z: 5.5, yawDeg: -90 } },
  { label: 'AI Video Makers / Marketing Team', at: [7.25, 9.0], view: { x: 7.1, z: 7.62, yawDeg: 180 } },
  { label: 'Office entrance', at: [4.45, 14.0], view: { x: 4.45, z: 15.2, yawDeg: 0 } },
  { label: 'Main entrance', at: [GRID.serviceWest - 1.25, (MAIN_ENTRANCE.z0 + MAIN_ENTRANCE.z1) / 2 + 0.55], view: SPAWN },
]
