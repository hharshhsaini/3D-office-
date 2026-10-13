import {
  BENCH,
  BENCHES,
  CABIN_FURNITURE,
  CABINS,
  EATING_AREA,
  GRID,
  INTERIOR_WALL,
  PLANTER_WORKSTATION as P,
  RECEPTION,
  SMALL_CABIN,
  WORKSPACE_PLANTS,
  type Rect,
} from '../config/office'

/**
 * Derived furniture placements (world coordinates). Used by the 3D furniture,
 * the 2D floor plan and the collision map, so they always agree.
 * facingDeg: 0 = faces north, 90 = west, 180 = south, -90 = east.
 */
export interface Placement {
  x: number
  z: number
  facingDeg: number
}

const CHAIR_OFFSET = 0.38 // chair centre from the desk edge (chair tucked in)

// ---------------------------------------------------------------------------
// Bench desks (long axis north-south, chairs on west and east)
// ---------------------------------------------------------------------------
export function benchRect(b: (typeof BENCHES)[number]): Rect {
  const half = (b.seatsPerSide * BENCH.seatWidth) / 2
  return { x0: b.center[0] - BENCH.deskDepth, x1: b.center[0] + BENCH.deskDepth, z0: b.center[1] - half, z1: b.center[1] + half }
}

function benchSeats(b: (typeof BENCHES)[number]) {
  const r = benchRect(b)
  const seats: { chair: Placement; monitor: Placement }[] = []
  for (let i = 0; i < b.seatsPerSide; i++) {
    const z = r.z0 + BENCH.seatWidth * (i + 0.5)
    seats.push({
      chair: { x: r.x0 - CHAIR_OFFSET, z, facingDeg: -90 },
      monitor: { x: b.center[0] - 0.16, z, facingDeg: 90 },
    })
    seats.push({
      chair: { x: r.x1 + CHAIR_OFFSET, z, facingDeg: 90 },
      monitor: { x: b.center[0] + 0.16, z, facingDeg: -90 },
    })
  }
  return seats
}

// ---------------------------------------------------------------------------
// Central planter workstation
// ---------------------------------------------------------------------------
export const PLANTER_TABLES: Rect = {
  x0: P.planter.x0 - P.tables.west,
  x1: P.planter.x1 + P.tables.east,
  z0: P.planter.z0 - P.tables.north,
  z1: P.planter.z1 + P.tables.south,
}

function spread(a: number, b: number, n: number) {
  return Array.from({ length: n }, (_, i) => a + ((b - a) * (i + 0.5)) / n)
}

function planterSeats() {
  const T = PLANTER_TABLES
  const seats: { chair: Placement; monitor: Placement }[] = []
  for (const z of spread(T.z0, T.z1, P.chairs.west))
    seats.push({ chair: { x: T.x0 - CHAIR_OFFSET, z, facingDeg: -90 }, monitor: { x: T.x0 + 0.2, z, facingDeg: 90 } })
  for (const z of spread(T.z0, T.z1, P.chairs.east))
    seats.push({ chair: { x: T.x1 + CHAIR_OFFSET, z, facingDeg: 90 }, monitor: { x: T.x1 - 0.2, z, facingDeg: -90 } })
  for (const x of spread(P.planter.x0, P.planter.x1, P.chairs.north))
    seats.push({ chair: { x, z: T.z0 - CHAIR_OFFSET, facingDeg: 180 }, monitor: { x, z: T.z0 + 0.18, facingDeg: 0 } })
  for (const x of spread(P.planter.x0, P.planter.x1, P.chairs.south))
    seats.push({ chair: { x, z: T.z1 + CHAIR_OFFSET, facingDeg: 0 }, monitor: { x, z: T.z1 - 0.25, facingDeg: 180 } })
  return seats
}

// ---------------------------------------------------------------------------
// Cabins: one desk, staff on the north side, visitor on the south side
// ---------------------------------------------------------------------------
export function cabinDesk(c: (typeof CABINS)[number]): Rect {
  const d = CABIN_FURNITURE.desk
  const cx = d.offsetX
  const cz = (c.z0 + c.z1) / 2 + d.offsetZ
  return { x0: cx - d.width / 2, x1: cx + d.width / 2, z0: cz - d.depth / 2, z1: cz + d.depth / 2 }
}

function cabinSeats(c: (typeof CABINS)[number]) {
  const r = cabinDesk(c)
  const cx = (r.x0 + r.x1) / 2
  const chairs: Placement[] = []
  const monitors: Placement[] = []
  for (const x of spread(r.x0, r.x1, CABIN_FURNITURE.staffChairs)) chairs.push({ x, z: r.z0 - CHAIR_OFFSET, facingDeg: 180 })
  for (const x of spread(r.x0 + 0.4, r.x1 - 0.4, CABIN_FURNITURE.visitorChairs)) chairs.push({ x, z: r.z1 + CHAIR_OFFSET, facingDeg: 0 })
  const span = 0.6
  for (let i = 0; i < c.monitors; i++) {
    const x = cx + (i - (c.monitors - 1) / 2) * span
    monitors.push({ x, z: (r.z0 + r.z1) / 2 + 0.1, facingDeg: 0 })
  }
  return { chairs, monitors }
}

// ---------------------------------------------------------------------------
// Everything together
// ---------------------------------------------------------------------------
const benchSeatList = BENCHES.flatMap(benchSeats)
const planterSeatList = planterSeats()
const cabinSeatList = CABINS.map(cabinSeats)

export const OFFICE_CHAIRS: Placement[] = [
  ...benchSeatList.map((s) => s.chair),
  ...planterSeatList.map((s) => s.chair),
  ...cabinSeatList.flatMap((s) => s.chairs),
]

export const MONITORS: Placement[] = [
  ...benchSeatList.map((s) => s.monitor),
  ...planterSeatList.map((s) => s.monitor),
  ...cabinSeatList.flatMap((s) => s.monitors),
]

export const CABIN_PLANTS = CABINS.map((c) => ({ x: CABIN_FURNITURE.plant.x, z: c.z0 + CABIN_FURNITURE.plant.fromNorth }))

/** Eating area: counter + fridge along the washroom wall, stools on the west side. */
export const EATING = {
  counter: {
    x0: GRID.serviceWest - EATING_AREA.counter.depth,
    x1: GRID.serviceWest - INTERIOR_WALL / 2,
    z0: EATING_AREA.counter.z0,
    z1: EATING_AREA.counter.z1,
  } as Rect,
  fridge: {
    x0: GRID.serviceWest - EATING_AREA.fridge.depth,
    x1: GRID.serviceWest - INTERIOR_WALL / 2,
    z0: EATING_AREA.fridge.z0,
    z1: EATING_AREA.fridge.z1,
  } as Rect,
  stools: spread(EATING_AREA.counter.z0, EATING_AREA.counter.z1, EATING_AREA.stools).map((z) => ({
    x: GRID.serviceWest - EATING_AREA.counter.depth - 0.32,
    z,
  })),
}

/** Reception desk footprint. */
export const RECEPTION_DESK_RECT: Rect = {
  x0: RECEPTION.desk.center[0] - RECEPTION.desk.depth / 2,
  x1: RECEPTION.desk.center[0] + RECEPTION.desk.depth / 2,
  z0: RECEPTION.desk.center[1] - RECEPTION.desk.length / 2,
  z1: RECEPTION.desk.center[1] + RECEPTION.desk.length / 2,
}

export const RED_WALL_RECT: Rect = {
  x0: RECEPTION.redWall.x0,
  x1: RECEPTION.redWall.x1,
  z0: GRID.receptionNorth,
  z1: GRID.receptionNorth + RECEPTION.redWall.depth,
}

export const POTTED_PLANTS: { x: number; z: number; kind: 'floor' }[] = [
  ...RECEPTION.floorPlants.map(([x, z]) => ({ x, z, kind: 'floor' as const })),
  ...WORKSPACE_PLANTS.map(([x, z]) => ({ x, z, kind: 'floor' as const })),
  ...CABIN_PLANTS.map((p) => ({ ...p, kind: 'floor' as const })),
]

export { SMALL_CABIN }
