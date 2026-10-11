import { LOBBY_EDGES, type Rect, type WallName } from '../config/layout'

/**
 * Every lobby wall has a local "wall frame":
 *   local +X runs along the wall (to the right for someone facing the wall),
 *   local +Z points INTO the lobby, local -Z is beyond the wall,
 *   local z = 0 is the wall's inner face, y = 0 is the floor.
 * Components that sit on / behind a wall are modelled in that frame and then
 * placed with `wallTransform`, so they can be moved to another wall from the
 * layout config.
 */
export function wallTransform(wall: WallName): { position: [number, number, number]; rotationY: number } {
  switch (wall) {
    case 'back':
      return { position: [0, 0, LOBBY_EDGES.back], rotationY: 0 }
    case 'front':
      return { position: [0, 0, LOBBY_EDGES.front], rotationY: Math.PI }
    case 'right':
      return { position: [LOBBY_EDGES.right, 0, 0], rotationY: -Math.PI / 2 }
    case 'left':
      return { position: [LOBBY_EDGES.left, 0, 0], rotationY: Math.PI / 2 }
  }
}

/** +1 if the wall's local X follows the world axis it runs along (x for back/front, z for left/right). */
const ALONG_SIGN: Record<WallName, 1 | -1> = { back: 1, front: -1, right: 1, left: -1 }

/** World coordinate along a wall (x for back/front walls, z for side walls) → local X. */
export function alongToLocal(wall: WallName, world: number) {
  return ALONG_SIGN[wall] * world
}

/** A world range along a wall → sorted local X range. */
export function rangeToLocal(wall: WallName, a: number, b: number): [number, number] {
  const la = alongToLocal(wall, a)
  const lb = alongToLocal(wall, b)
  return la < lb ? [la, lb] : [lb, la]
}

/** Local wall-frame point (x, z) → world (x, z). */
export function localToWorld(wall: WallName, lx: number, lz: number): [number, number] {
  const { position, rotationY } = wallTransform(wall)
  const c = Math.cos(rotationY)
  const s = Math.sin(rotationY)
  return [position[0] + lx * c + lz * s, position[2] - lx * s + lz * c]
}

/** Local wall-frame rectangle → axis-aligned world rectangle. */
export function localRectToWorld(wall: WallName, lx0: number, lx1: number, lz0: number, lz1: number): Rect {
  const a = localToWorld(wall, lx0, lz0)
  const b = localToWorld(wall, lx1, lz1)
  return {
    x0: Math.min(a[0], b[0]),
    x1: Math.max(a[0], b[0]),
    z0: Math.min(a[1], b[1]),
    z1: Math.max(a[1], b[1]),
  }
}

export const deg = (d: number) => (d * Math.PI) / 180
