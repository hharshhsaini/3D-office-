import { useMemo, type ReactNode } from 'react'
import * as THREE from 'three'
import { CEILING_HEIGHT, type Rect, type XZ } from '../config/office'
import { getMaterials } from './materials'
import { useSceneSettings } from './SceneSettings'

type V3 = [number, number, number]

export const SKIRTING_HEIGHT = 0.08

/** Box with its centre at `position`. Casts and receives shadows by default. */
export function Box({
  size,
  position,
  rotation,
  material,
  castShadow = true,
  receiveShadow = true,
  children,
}: {
  size: V3
  position: V3
  rotation?: V3
  material: THREE.Material
  castShadow?: boolean
  receiveShadow?: boolean
  children?: ReactNode
}) {
  return (
    <mesh position={position} rotation={rotation} material={material} castShadow={castShadow} receiveShadow={receiveShadow}>
      <boxGeometry args={size} />
      {children}
    </mesh>
  )
}

/** Box defined by min / max corners – convenient for architecture. */
export function BoxFromTo({
  min,
  max,
  material,
  castShadow = true,
  receiveShadow = true,
}: {
  min: V3
  max: V3
  material: THREE.Material
  castShadow?: boolean
  receiveShadow?: boolean
}) {
  const size: V3 = [max[0] - min[0], max[1] - min[1], max[2] - min[2]]
  if (size.some((s) => s <= 1e-4)) return null
  const position: V3 = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2]
  return <Box size={size} position={position} material={material} castShadow={castShadow} receiveShadow={receiveShadow} />
}

/**
 * Local frame of a straight, axis-aligned segment on the plan.
 * Local +X runs from `from` to `to`; local +Z is the RIGHT-hand side when
 * walking from `from` to `to`; y is up.
 */
export function segmentFrame(from: XZ, to: XZ) {
  const dx = to[0] - from[0]
  const dz = to[1] - from[1]
  return {
    position: [from[0], 0, from[1]] as V3,
    rotationY: Math.atan2(-dz, dx),
    length: Math.hypot(dx, dz),
  }
}

/** Children are placed in the local frame of a plan segment. */
export function OnSegment({ from, to, children }: { from: XZ; to: XZ; children: ReactNode }) {
  const f = segmentFrame(from, to)
  return (
    <group position={f.position} rotation={[0, f.rotationY, 0]}>
      {children}
    </group>
  )
}

export interface WallHole {
  from: number
  to: number
  bottom: number
  top: number
}

/** Solid pieces of a wall after cutting out the holes (local X along the wall, Y up). */
export function wallPieces(length: number, height: number, holes: WallHole[]) {
  const sorted = [...holes].sort((a, b) => a.from - b.from)
  const pieces: { x0: number; x1: number; y0: number; y1: number }[] = []
  let cursor = 0
  for (const o of sorted) {
    if (o.from > cursor) pieces.push({ x0: cursor, x1: o.from, y0: 0, y1: height })
    if (o.bottom > 0) pieces.push({ x0: o.from, x1: o.to, y0: 0, y1: o.bottom })
    if (o.top < height) pieces.push({ x0: o.from, x1: o.to, y0: o.top, y1: height })
    cursor = Math.max(cursor, o.to)
  }
  if (cursor < length) pieces.push({ x0: cursor, x1: length, y0: 0, y1: height })
  return pieces
}

/**
 * Wall body in a segment frame, occupying local z in [z0, z1].
 * Skirting is added on the faces listed in `skirtingSides`.
 */
export function WallBody({
  length,
  holes,
  z0,
  z1,
  height = CEILING_HEIGHT,
  material,
  skirtingSides = [],
}: {
  length: number
  holes: WallHole[]
  z0: number
  z1: number
  height?: number
  material?: THREE.Material
  skirtingSides?: ('-' | '+')[]
}) {
  const m = getMaterials()
  const mat = material ?? m.wall
  const pieces = wallPieces(length, height, holes)
  return (
    <group>
      {pieces.map((p, i) => (
        <BoxFromTo key={i} min={[p.x0, p.y0, z0]} max={[p.x1, p.y1, z1]} material={mat} />
      ))}
      {skirtingSides.flatMap((side) =>
        pieces
          .filter((p) => p.y0 === 0 && p.y1 > SKIRTING_HEIGHT)
          .map((p, i) => (
            <BoxFromTo
              key={`${side}${i}`}
              min={[p.x0, 0, side === '+' ? z1 : z0 - 0.012]}
              max={[p.x1, SKIRTING_HEIGHT, side === '+' ? z1 + 0.012 : z0]}
              material={m.skirting}
              castShadow={false}
            />
          )),
      )}
    </group>
  )
}

/** Plane geometry whose UVs follow world X/Z so tiles line up across patches. */
function useWorldUvPlane(rect: Rect, uvScale: number, cell: number) {
  return useMemo(() => {
    const w = rect.x1 - rect.x0
    const d = rect.z1 - rect.z0
    // subdivided so UVs stay exact on every renderer
    const g = new THREE.PlaneGeometry(w, d, Math.max(1, Math.ceil(w / cell)), Math.max(1, Math.ceil(d / cell)))
    g.rotateX(-Math.PI / 2)
    const cx = (rect.x0 + rect.x1) / 2
    const cz = (rect.z0 + rect.z1) / 2
    const pos = g.attributes.position
    const uv = g.attributes.uv
    for (let i = 0; i < pos.count; i++) {
      uv.setXY(i, (pos.getX(i) + cx) / uvScale, -(pos.getZ(i) + cz) / uvScale)
    }
    uv.needsUpdate = true
    g.translate(cx, 0, cz)
    return g
  }, [rect.x0, rect.x1, rect.z0, rect.z1, uvScale, cell])
}

/** Floor area given in world coordinates (tiles or wood). */
export function FloorPatch({ rect, kind }: { rect: Rect; kind: 'tile' | 'wood' }) {
  const m = getMaterials()
  const material = kind === 'wood' ? m.woodFloor : m.floorTiles
  const repeat = kind === 'wood' ? m.woodFloorRepeat : m.floorTileRepeat
  const geometry = useWorldUvPlane(rect, repeat, 1)
  return <mesh geometry={geometry} material={material} receiveShadow />
}

/** Flat ceiling over a world rectangle (hidden in the overview). */
export function CeilingPatch({
  rect,
  height = CEILING_HEIGHT,
  material,
}: {
  rect: Rect
  height?: number
  material?: THREE.Material
}) {
  const { showCeiling } = useSceneSettings()
  const m = getMaterials()
  if (!showCeiling) return null
  return (
    <mesh
      position={[(rect.x0 + rect.x1) / 2, height, (rect.z0 + rect.z1) / 2]}
      rotation={[Math.PI / 2, 0, 0]}
      material={material ?? m.ceiling}
      receiveShadow
    >
      <planeGeometry args={[rect.x1 - rect.x0, rect.z1 - rect.z0]} />
    </mesh>
  )
}

/** Rotate children about a vertical axis located at (hingeX, *, hingeZ). */
export function Hinged({ hinge, angle, children }: { hinge: [number, number]; angle: number; children: ReactNode }) {
  return (
    <group position={[hinge[0], 0, hinge[1]]} rotation={[0, angle, 0]}>
      <group position={[-hinge[0], 0, -hinge[1]]}>{children}</group>
    </group>
  )
}

export const deg = (d: number) => (d * Math.PI) / 180

/** Plan yaw (0 = facing north, 90 = west, -90 = east) for a model whose front faces local +Z. */
export const facingToRotationY = (facingDeg: number) => deg(facingDeg) + Math.PI
