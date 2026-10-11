import { CEILING_HEIGHT, WALL_THICKNESS } from '../config/layout'
import { getMaterials } from './materials'
import { BoxFromTo, Hinged } from './primitives'
import { deg } from './frames'

/** Black aluminium profile sizes (m). */
const PROFILE = 0.05
const PROFILE_DEPTH = 0.07
const GLASS_T = 0.012

export interface DoorSpec {
  /** local X range of the door leaf */
  from: number
  to: number
  hinge: 'from' | 'to'
  /** Opening angle in degrees; positive swings towards local +Z (into the lobby). */
  openDeg: number
  height?: number
  handle?: 'lever' | 'bar'
}

/** Glass pane, optionally frosted and with a coloured manifestation band. */
function Pane({
  x0,
  x1,
  y0,
  y1,
  z,
  frosted,
  band,
}: {
  x0: number
  x1: number
  y0: number
  y1: number
  z: number
  frosted?: boolean
  band?: { bottom: number; height: number }
}) {
  const m = getMaterials()
  const glass = frosted ? m.frostedGlass : m.glass
  return (
    <group>
      <BoxFromTo
        min={[x0, y0, z - GLASS_T / 2]}
        max={[x1, y1, z + GLASS_T / 2]}
        material={glass}
        castShadow={false}
        receiveShadow={false}
      />
      {band && band.bottom > y0 && band.bottom + band.height < y1 && (
        <BoxFromTo
          min={[x0, band.bottom, z - GLASS_T / 2 - 0.001]}
          max={[x1, band.bottom + band.height, z + GLASS_T / 2 + 0.001]}
          material={m.redBand}
          castShadow={false}
        />
      )}
    </group>
  )
}

function LeverHandle({ x, y, z, side }: { x: number; y: number; z: number; side: 1 | -1 }) {
  const m = getMaterials()
  // rose + lever on both faces of the door
  return (
    <group position={[x, y, z]}>
      {[1, -1].map((face) => (
        <group key={face} position={[0, 0, face * 0.03]}>
          <mesh material={m.handle} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.022, 0.022, 0.015, 20]} />
          </mesh>
          <mesh material={m.handle} position={[side * 0.06, 0, face * 0.035]} castShadow>
            <boxGeometry args={[0.13, 0.018, 0.018]} />
          </mesh>
          <mesh material={m.handle} position={[0, 0, face * 0.02]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.04, 10]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function BarHandle({ x, z }: { x: number; z: number }) {
  const m = getMaterials()
  return (
    <group position={[x, 1.05, z]}>
      {[1, -1].map((face) => (
        <group key={face}>
          <mesh material={m.handle} position={[0, 0, face * 0.07]} castShadow>
            <cylinderGeometry args={[0.014, 0.014, 0.9, 16]} />
          </mesh>
          {[-0.38, 0.38].map((dy) => (
            <mesh key={dy} material={m.handle} position={[0, dy, face * 0.04]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.008, 0.008, 0.06, 8]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

/** One framed glass door leaf, drawn closed; rotated about its hinge. */
export function DoorLeaf({ spec, z, frosted, band }: { spec: DoorSpec; z: number; frosted?: boolean; band?: { bottom: number; height: number } }) {
  const m = getMaterials()
  const h = spec.height ?? 2.25
  const x0 = spec.from + 0.004
  const x1 = spec.to - 0.004
  const s = 0.045
  const hingeX = spec.hinge === 'to' ? spec.to : spec.from
  const open = deg(spec.openDeg)
  const angle = spec.hinge === 'to' ? open : -open
  const handleX = spec.hinge === 'to' ? x0 + 0.09 : x1 - 0.09
  const zMin = z - PROFILE_DEPTH / 2 + 0.01
  const zMax = z + PROFILE_DEPTH / 2 - 0.01
  return (
    <Hinged hinge={[hingeX, z]} angle={angle}>
      <BoxFromTo min={[x0, 0.005, zMin]} max={[x0 + s, h, zMax]} material={m.frame} />
      <BoxFromTo min={[x1 - s, 0.005, zMin]} max={[x1, h, zMax]} material={m.frame} />
      <BoxFromTo min={[x0, 0.005, zMin]} max={[x1, 0.09, zMax]} material={m.frame} />
      <BoxFromTo min={[x0, h - s, zMin]} max={[x1, h, zMax]} material={m.frame} />
      <Pane x0={x0 + s} x1={x1 - s} y0={0.09} y1={h - s} z={z} frosted={frosted} band={band} />
      {spec.handle === 'bar' ? (
        <BarHandle x={handleX} z={z} />
      ) : (
        <LeverHandle x={handleX} y={1.05} z={z} side={spec.hinge === 'to' ? 1 : -1} />
      )}
    </Hinged>
  )
}

/**
 * Floor-to-ceiling black-framed glass partition in a wall frame
 * (local X along the wall, glass centred in the wall thickness by default).
 */
export function GlassPartition({
  from,
  to,
  height = CEILING_HEIGHT,
  z = -WALL_THICKNESS / 2,
  door,
  frosted = false,
  band,
  maxPanel = 1.2,
}: {
  from: number
  to: number
  height?: number
  z?: number
  door?: DoorSpec
  frosted?: boolean
  band?: { bottom: number; height: number }
  maxPanel?: number
}) {
  const m = getMaterials()
  const zMin = z - PROFILE_DEPTH / 2
  const zMax = z + PROFILE_DEPTH / 2
  const doorH = door?.height ?? 2.25

  // Vertical posts: both ends, both door jambs, and mullions so no pane exceeds maxPanel
  const segments: { x0: number; x1: number; isDoor: boolean }[] = []
  if (door) {
    if (door.from > from) segments.push({ x0: from, x1: door.from, isDoor: false })
    segments.push({ x0: door.from, x1: door.to, isDoor: true })
    if (door.to < to) segments.push({ x0: door.to, x1: to, isDoor: false })
  } else {
    segments.push({ x0: from, x1: to, isDoor: false })
  }
  const posts = new Set<number>([from, to])
  const panes: { x0: number; x1: number }[] = []
  for (const seg of segments) {
    posts.add(seg.x0)
    posts.add(seg.x1)
    if (seg.isDoor) continue
    const n = Math.max(1, Math.ceil((seg.x1 - seg.x0) / maxPanel))
    const w = (seg.x1 - seg.x0) / n
    for (let i = 0; i < n; i++) {
      const a = seg.x0 + i * w
      if (i > 0) posts.add(a)
      panes.push({ x0: a, x1: a + w })
    }
  }

  return (
    <group>
      {/* head and floor channels */}
      <BoxFromTo min={[from, height - PROFILE, zMin]} max={[to, height, zMax]} material={m.frame} />
      {segments
        .filter((s) => !s.isDoor)
        .map((s, i) => (
          <BoxFromTo key={i} min={[s.x0, 0, zMin]} max={[s.x1, PROFILE, zMax]} material={m.frame} />
        ))}
      {[...posts].map((x) => (
        <BoxFromTo
          key={x}
          min={[Math.max(from, x - PROFILE / 2), 0, zMin]}
          max={[Math.min(to, x + PROFILE / 2), height, zMax]}
          material={m.frame}
        />
      ))}
      {panes.map((p, i) => (
        <Pane
          key={i}
          x0={p.x0 + PROFILE / 2}
          x1={p.x1 - PROFILE / 2}
          y0={PROFILE}
          y1={height - PROFILE}
          z={z}
          frosted={frosted}
          band={band}
        />
      ))}
      {door && (
        <>
          {/* transom bar and glass above the door */}
          <BoxFromTo min={[door.from, doorH, zMin]} max={[door.to, doorH + PROFILE, zMax]} material={m.frame} />
          <Pane x0={door.from + PROFILE / 2} x1={door.to - PROFILE / 2} y0={doorH + PROFILE} y1={height - PROFILE} z={z} frosted={frosted} />
          <DoorLeaf
            spec={{ ...door, from: door.from + PROFILE / 2, to: door.to - PROFILE / 2, height: doorH }}
            z={z}
            frosted={frosted}
            band={band}
          />
        </>
      )}
    </group>
  )
}

/** Double glass entrance door filling a wall opening (local X range, given height). */
export function DoubleGlassDoor({ from, to, height, z = -WALL_THICKNESS / 2 }: { from: number; to: number; height: number; z?: number }) {
  const m = getMaterials()
  const zMin = z - (WALL_THICKNESS + 0.02) / 2
  const zMax = z + (WALL_THICKNESS + 0.02) / 2
  const mid = (from + to) / 2
  const f = 0.06
  return (
    <group>
      {/* frame lining the wall opening */}
      <BoxFromTo min={[from, 0, zMin]} max={[from + f, height, zMax]} material={m.frame} />
      <BoxFromTo min={[to - f, 0, zMin]} max={[to, height, zMax]} material={m.frame} />
      <BoxFromTo min={[from, height - f, zMin]} max={[to, height, zMax]} material={m.frame} />
      <DoorLeaf spec={{ from: from + f, to: mid, hinge: 'from', openDeg: 0, height: height - f, handle: 'bar' }} z={z} />
      <DoorLeaf spec={{ from: mid, to: to - f, hinge: 'to', openDeg: 0, height: height - f, handle: 'bar' }} z={z} />
      {/* threshold */}
      <BoxFromTo min={[from, 0, zMin]} max={[to, 0.006, zMax]} material={m.frame} castShadow={false} />
    </group>
  )
}
