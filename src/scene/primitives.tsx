import { useMemo, type ReactNode } from 'react'
import * as THREE from 'three'
import { MeshReflectorMaterial } from '@react-three/drei'
import { CEILING_HEIGHT, SKIRTING_HEIGHT, WALL_THICKNESS, type Rect } from '../config/layout'
import { FLOOR_TILE_SIZE } from '../config/appearance'
import { getMaterials } from './materials'
import { useSceneSettings } from './SceneSettings'
import { floorTileTextures } from './textures'

type V3 = [number, number, number]

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

export interface Opening {
  /** local X range of the opening */
  from: number
  to: number
  bottom: number
  top: number
}

/**
 * A straight wall in a wall frame (see frames.ts): runs from local x `from`
 * to `to`, its inner face at z = 0 and its body behind it (z < 0).
 * Openings (doors, windows, glazed fronts) are cut out as separate boxes.
 */
export function WallWithOpenings({
  from,
  to,
  openings = [],
  height = CEILING_HEIGHT,
  thickness = WALL_THICKNESS,
  material,
  skirting = true,
}: {
  from: number
  to: number
  openings?: Opening[]
  height?: number
  thickness?: number
  material?: THREE.Material
  skirting?: boolean
}) {
  const m = getMaterials()
  const mat = material ?? m.wall
  const sorted = [...openings].sort((a, b) => a.from - b.from)
  const pieces: { x0: number; x1: number; y0: number; y1: number }[] = []
  let cursor = from
  for (const o of sorted) {
    if (o.from > cursor) pieces.push({ x0: cursor, x1: o.from, y0: 0, y1: height })
    if (o.bottom > 0) pieces.push({ x0: o.from, x1: o.to, y0: 0, y1: o.bottom })
    if (o.top < height) pieces.push({ x0: o.from, x1: o.to, y0: o.top, y1: height })
    cursor = Math.max(cursor, o.to)
  }
  if (cursor < to) pieces.push({ x0: cursor, x1: to, y0: 0, y1: height })

  return (
    <group>
      {pieces.map((p, i) => (
        <BoxFromTo key={i} min={[p.x0, p.y0, -thickness]} max={[p.x1, p.y1, 0]} material={mat} />
      ))}
      {skirting &&
        pieces
          .filter((p) => p.y0 === 0 && p.y1 > SKIRTING_HEIGHT)
          .map((p, i) => (
            <BoxFromTo
              key={`sk${i}`}
              min={[p.x0, 0, 0]}
              max={[p.x1, SKIRTING_HEIGHT, 0.012]}
              material={m.skirting}
              castShadow={false}
            />
          ))}
    </group>
  )
}

/** Plane geometry whose UVs follow world X/Z so tiles line up across patches. */
function useWorldUvPlane(rect: Rect, uvScale: number) {
  return useMemo(() => {
    const w = rect.x1 - rect.x0
    const d = rect.z1 - rect.z0
    // subdivided (≈ one quad per tile) so UVs stay exact on every renderer
    const g = new THREE.PlaneGeometry(w, d, Math.max(1, Math.ceil(w / 0.8)), Math.max(1, Math.ceil(d / 0.8)))
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
  }, [rect.x0, rect.x1, rect.z0, rect.z1, uvScale])
}

/** Tiled floor area given in world coordinates. */
export function FloorPatch({ rect, reflective = false }: { rect: Rect; reflective?: boolean }) {
  const { highQuality } = useSceneSettings()
  const tex = floorTileTextures()
  const geometry = useWorldUvPlane(rect, tex.tilesPerRepeat * FLOOR_TILE_SIZE)
  const m = getMaterials()
  if (reflective && highQuality) {
    return (
      <mesh geometry={geometry} receiveShadow>
        <MeshReflectorMaterial
          map={tex.map}
          roughnessMap={tex.roughnessMap}
          roughness={1}
          metalness={0}
          envMapIntensity={0.6}
          resolution={1024}
          blur={[300, 90]}
          mixBlur={0.9}
          mixStrength={1.3}
          mixContrast={1.15}
          mirror={0.3}
          depthScale={0}
          minDepthThreshold={0.2}
          maxDepthThreshold={1.6}
        />
      </mesh>
    )
  }
  return <mesh geometry={geometry} material={m.floorTiles} receiveShadow />
}

/** Flat ceiling over a world rectangle (hidden in Overview / Plan view). */
export function CeilingPatch({ rect, height = CEILING_HEIGHT }: { rect: Rect; height?: number }) {
  const { showCeiling } = useSceneSettings()
  const m = getMaterials()
  if (!showCeiling) return null
  return (
    <mesh
      position={[(rect.x0 + rect.x1) / 2, height, (rect.z0 + rect.z1) / 2]}
      rotation={[Math.PI / 2, 0, 0]}
      material={m.ceiling}
      receiveShadow
    >
      <planeGeometry args={[rect.x1 - rect.x0, rect.z1 - rect.z0]} />
    </mesh>
  )
}

/** Rotate children about a vertical axis located at (hingeX, *, hingeZ). */
export function Hinged({
  hinge,
  angle,
  children,
}: {
  hinge: [number, number]
  angle: number
  children: ReactNode
}) {
  return (
    <group position={[hinge[0], 0, hinge[1]]} rotation={[0, angle, 0]}>
      <group position={[-hinge[0], 0, -hinge[1]]}>{children}</group>
    </group>
  )
}
