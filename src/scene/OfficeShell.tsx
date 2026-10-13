import { useMemo } from 'react'
import * as THREE from 'three'
import {
  AREAS,
  CEILING_HEIGHT,
  EXTERIOR_WALL,
  GLASS,
  GRID,
  MAIN_ENTRANCE,
  OFFICE,
  WALLS,
  type Opening,
  type WallSpec,
} from '../config/office'
import { getMaterials } from './materials'
import { BoxFromTo, FloorPatch, WallBody, segmentFrame } from './primitives'
import { DoubleGlassDoor, GlassWall } from './GlassPartition'
import { useSceneSettings } from './SceneSettings'
import { windowViewTexture } from './textures'

/** Body extent across the wall (local z) and which face is inside the office. */
function wallBodyZ(spec: WallSpec) {
  const t = spec.thickness
  if (spec.body === 'left') return { z0: -t, z1: 0, room: 1 as const }
  if (spec.body === 'right') return { z0: 0, z1: t, room: -1 as const }
  return { z0: -t / 2, z1: t / 2, room: 0 as const }
}

/** Window in a wall opening: black frame, glass, interior sill and optional venetian blinds. */
function WindowUnit({ o, z0, z1, room }: { o: Opening; z0: number; z1: number; room: -1 | 0 | 1 }) {
  const m = getMaterials()
  const y0 = o.bottom ?? 0.9
  const y1 = o.top ?? 2.2
  const f = 0.05
  const zm = (z0 + z1) / 2
  const roomFace = room === -1 ? z0 : z1
  const into = room === -1 ? -1 : 1
  const blindsH = (y1 - y0) * 0.55
  return (
    <group>
      <BoxFromTo min={[o.from, y0, z0]} max={[o.from + f, y1, z1]} material={m.frame} />
      <BoxFromTo min={[o.to - f, y0, z0]} max={[o.to, y1, z1]} material={m.frame} />
      <BoxFromTo min={[o.from, y0, z0]} max={[o.to, y0 + f, z1]} material={m.frame} />
      <BoxFromTo min={[o.from, y1 - f, z0]} max={[o.to, y1, z1]} material={m.frame} />
      <BoxFromTo min={[(o.from + o.to) / 2 - 0.02, y0, zm - 0.02]} max={[(o.from + o.to) / 2 + 0.02, y1, zm + 0.02]} material={m.frame} />
      <BoxFromTo
        min={[o.from + f, y0 + f, zm - 0.006]}
        max={[o.to - f, y1 - f, zm + 0.006]}
        material={m.glass}
        castShadow={false}
        receiveShadow={false}
      />
      {/* interior sill */}
      <BoxFromTo
        min={[o.from - 0.04, y0 - 0.03, Math.min(roomFace, roomFace + into * 0.06)]}
        max={[o.to + 0.04, y0, Math.max(roomFace, roomFace + into * 0.06)]}
        material={m.ceiling}
      />
      {o.blinds && (
        <group position={[(o.from + o.to) / 2, y1 - blindsH / 2, roomFace + into * 0.045]}>
          <mesh material={m.blinds} castShadow>
            <boxGeometry args={[o.to - o.from - 0.04, blindsH, 0.01]} />
          </mesh>
          <mesh position={[0, blindsH / 2 + 0.02, 0]} material={m.ceiling}>
            <boxGeometry args={[o.to - o.from, 0.05, 0.06]} />
          </mesh>
          <mesh position={[0, -blindsH / 2, 0]} material={m.whiteLaminate}>
            <boxGeometry args={[o.to - o.from - 0.04, 0.025, 0.04]} />
          </mesh>
        </group>
      )}
    </group>
  )
}

/** Solid interior door (washroom): dark leaf, frame and lever handle; kept closed. */
function SolidDoor({ o, z0, z1 }: { o: Opening; z0: number; z1: number }) {
  const m = getMaterials()
  const top = o.top ?? 2.1
  const zm = (z0 + z1) / 2
  const f = 0.04
  return (
    <group>
      <BoxFromTo min={[o.from, 0, z0 - 0.01]} max={[o.from + f, top + f, z1 + 0.01]} material={m.frame} />
      <BoxFromTo min={[o.to - f, 0, z0 - 0.01]} max={[o.to, top + f, z1 + 0.01]} material={m.frame} />
      <BoxFromTo min={[o.from, top, z0 - 0.01]} max={[o.to, top + f, z1 + 0.01]} material={m.frame} />
      <BoxFromTo min={[o.from + f, 0.01, zm - 0.022]} max={[o.to - f, top, zm + 0.022]} material={m.washroomDoor} />
      {[-1, 1].map((s) => (
        <mesh key={s} position={[o.to - 0.12, 1.02, zm + s * 0.045]} material={m.handle}>
          <boxGeometry args={[0.13, 0.018, 0.018]} />
        </mesh>
      ))}
    </group>
  )
}

function Wall({ spec }: { spec: WallSpec }) {
  const f = segmentFrame(spec.from, spec.to)
  const { z0, z1, room } = wallBodyZ(spec)
  const openings = spec.openings ?? []
  const holes = openings.map((o) => ({ from: o.from, to: o.to, bottom: o.bottom ?? 0, top: o.top ?? CEILING_HEIGHT }))
  const skirting: ('-' | '+')[] = room === 1 ? ['+'] : room === -1 ? ['-'] : ['-', '+']
  return (
    <group position={f.position} rotation={[0, f.rotationY, 0]}>
      <WallBody length={f.length} holes={holes} z0={z0} z1={z1} skirtingSides={skirting} />
      {openings.map((o, i) => {
        if (o.kind === 'window') return <WindowUnit key={i} o={o} z0={z0} z1={z1} room={room} />
        if (o.kind === 'door' && spec.exterior)
          return <DoubleGlassDoor key={i} from={o.from} to={o.to} height={o.top ?? 2.4} z={(z0 + z1) / 2} depth={z1 - z0} />
        if (o.kind === 'door') return <SolidDoor key={i} o={o} z0={z0} z1={z1} />
        return null
      })}
    </group>
  )
}

/** Floors of every area (the washroom is closed – its interior is not furnished; stairs are not modelled). */
function Floors() {
  return (
    <>
      {AREAS.map((a) => (
        <FloorPatch key={a.id} rect={a.rect} kind={a.floor} />
      ))}
    </>
  )
}

/**
 * Outside world seen only through the windows / entrance glass (walk-through only):
 * a daytime view beyond the west and north facades and a neutral landing outside
 * the main entrance (the stairs themselves are not modelled).
 */
function OutsideBackdrop() {
  const { showSurroundings } = useSceneSettings()
  const m = getMaterials()
  const view = useMemo(() => {
    const t = windowViewTexture().clone()
    t.wrapS = THREE.RepeatWrapping
    t.repeat.set(3, 1)
    t.needsUpdate = true
    return t
  }, [])
  if (!showSurroundings) return null
  const L = OFFICE.length
  const W = OFFICE.width
  return (
    <group>
      <mesh position={[-6, 2.5, L / 2]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[L + 14, 12]} />
        <meshBasicMaterial map={view} toneMapped={false} color="#e6e6e6" />
      </mesh>
      <mesh position={[W / 2, 2.5, -6]}>
        <planeGeometry args={[W + 14, 12]} />
        <meshBasicMaterial map={view} toneMapped={false} color="#e6e6e6" />
      </mesh>
      {/* landing outside the main entrance */}
      <BoxFromTo
        min={[GRID.serviceWest + EXTERIOR_WALL, -0.01, MAIN_ENTRANCE.z0 - 1.2]}
        max={[GRID.serviceWest + 2.4, 0, MAIN_ENTRANCE.z1 + 0.5]}
        material={m.floorTiles}
        castShadow={false}
      />
      <BoxFromTo
        min={[GRID.serviceWest + 2.4, 0, MAIN_ENTRANCE.z0 - 1.2]}
        max={[GRID.serviceWest + 2.5, CEILING_HEIGHT, MAIN_ENTRANCE.z1 + 0.5]}
        material={m.wallGrey}
        castShadow={false}
      />
    </group>
  )
}

export function OfficeShell() {
  return (
    <>
      <Floors />
      {WALLS.map((w) => (
        <Wall key={w.id} spec={w} />
      ))}
      {GLASS.map((g) => (
        <GlassWall key={g.id} spec={g} />
      ))}
      <OutsideBackdrop />
    </>
  )
}

