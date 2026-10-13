import {
  CABINS,
  GLASS,
  PLAYER_RADIUS,
  WALLS,
  type Rect,
  type WallSpec,
  type XZ,
} from '../config/office'
import {
  EATING,
  OFFICE_CHAIRS,
  PLANTER_TABLES,
  POTTED_PLANTS,
  RECEPTION_DESK_RECT,
  RED_WALL_RECT,
  SMALL_CABIN,
  benchRect,
  cabinDesk,
} from '../scene/placements'
import { BENCHES } from '../config/office'

/**
 * Collision map: axis-aligned rectangles on the floor plan that the visitor
 * cannot walk through. Built from the same config as the 3D scene, so walls,
 * glass, closed doors and furniture always match what is drawn.
 * Openings that are walkable: the office entrance passage (no wall at all)
 * and the automatic glass doors of the cabins and the small cabin.
 */

/** Rectangle covering local [a..b] along a segment and [z0..z1] across it. */
export function segmentRect(from: XZ, to: XZ, a: number, b: number, z0: number, z1: number): Rect {
  const dx = to[0] - from[0]
  const dz = to[1] - from[1]
  const len = Math.hypot(dx, dz)
  const ux = dx / len
  const uz = dz / len
  // local +z = right-hand normal
  const nx = -uz
  const nz = ux
  const pts = [
    [a, z0],
    [b, z0],
    [a, z1],
    [b, z1],
  ].map(([s, t]) => [from[0] + ux * s + nx * t, from[1] + uz * s + nz * t])
  return {
    x0: Math.min(...pts.map((p) => p[0])),
    x1: Math.max(...pts.map((p) => p[0])),
    z0: Math.min(...pts.map((p) => p[1])),
    z1: Math.max(...pts.map((p) => p[1])),
  }
}

/** Solid intervals of [0, len] after removing the walkable gaps. */
export function solidIntervals(len: number, gaps: [number, number][]) {
  const out: [number, number][] = []
  let c = 0
  for (const [a, b] of [...gaps].sort((p, q) => p[0] - q[0])) {
    if (a > c) out.push([c, a])
    c = Math.max(c, b)
  }
  if (c < len) out.push([c, len])
  return out
}

export function wallZ(w: WallSpec): [number, number] {
  const t = w.thickness
  return w.body === 'left' ? [-t, 0] : w.body === 'right' ? [0, t] : [-t / 2, t / 2]
}

const box = (x: number, z: number, half: number): Rect => ({ x0: x - half, x1: x + half, z0: z - half, z1: z + half })

function build(): Rect[] {
  const rects: Rect[] = []
  for (const w of WALLS) {
    const len = Math.hypot(w.to[0] - w.from[0], w.to[1] - w.from[1])
    const gaps = (w.openings ?? []).filter((o) => o.kind === 'passage').map((o) => [o.from, o.to] as [number, number])
    const [z0, z1] = wallZ(w)
    for (const [a, b] of solidIntervals(len, gaps)) rects.push(segmentRect(w.from, w.to, a, b, z0, z1))
  }
  for (const g of GLASS) {
    const len = Math.hypot(g.to[0] - g.from[0], g.to[1] - g.from[1])
    const gaps: [number, number][] = g.door ? [[g.door.from + 0.05, g.door.to - 0.05]] : []
    for (const [a, b] of solidIntervals(len, gaps)) rects.push(segmentRect(g.from, g.to, a, b, -0.04, 0.04))
  }
  // furniture
  rects.push(RECEPTION_DESK_RECT, RED_WALL_RECT, PLANTER_TABLES)
  for (const b of BENCHES) rects.push(benchRect(b))
  for (const c of CABINS) rects.push(cabinDesk(c))
  for (const ch of OFFICE_CHAIRS) rects.push(box(ch.x, ch.z, 0.19))
  for (const p of POTTED_PLANTS) rects.push(box(p.x, p.z, 0.2))
  rects.push({ ...EATING.counter, x0: EATING.counter.x0 - 0.22 }, EATING.fridge)
  for (const s of EATING.stools) rects.push(box(s.x, s.z, 0.17))
  rects.push(box(SMALL_CABIN.table.x, SMALL_CABIN.table.z, SMALL_CABIN.table.diameter / 2))
  rects.push(box(SMALL_CABIN.chair.x, SMALL_CABIN.chair.z, 0.25))
  return rects
}

export const COLLIDERS: Rect[] = build()

/** True if a visitor (circle of PLAYER_RADIUS) standing at (x, z) overlaps something solid. */
export function isBlocked(x: number, z: number, r = PLAYER_RADIUS) {
  for (const c of COLLIDERS) {
    const px = Math.max(c.x0, Math.min(x, c.x1))
    const pz = Math.max(c.z0, Math.min(z, c.z1))
    const dx = x - px
    const dz = z - pz
    if (dx * dx + dz * dz < r * r) return true
  }
  return false
}

/** Move with wall sliding: try the full step, then each axis on its own. */
export function moveWithCollision(x: number, z: number, dx: number, dz: number): [number, number] {
  // sub-step long moves so thin glass can never be tunnelled through
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.05))
  for (let i = 0; i < steps; i++) {
    const sx = dx / steps
    const sz = dz / steps
    if (!isBlocked(x + sx, z + sz)) {
      x += sx
      z += sz
    } else if (!isBlocked(x + sx, z)) {
      x += sx
    } else if (!isBlocked(x, z + sz)) {
      z += sz
    }
  }
  return [x, z]
}
