import { useMemo } from 'react'
import * as THREE from 'three'
import { getMaterials } from './materials'

/** Simple procedural potted plant (long-leaved, like the ones in the references). */

let leafGeometry: THREE.BufferGeometry | null = null
export function getLeafGeometry() {
  if (leafGeometry) return leafGeometry
  const g = new THREE.PlaneGeometry(1, 1, 2, 12)
  g.translate(0, 0.5, 0)
  const pos = g.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const t = pos.getY(i) // 0 at the stem, 1 at the tip
    const x = pos.getX(i)
    const width = Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.05)), 0.75) * (1 - t * 0.25)
    pos.setX(i, x * width)
    // arch outwards + a shallow V along the midrib
    pos.setZ(i, 0.45 * t * t + Math.abs(x * width) * 0.25)
  }
  g.computeVertexNormals()
  leafGeometry = g
  return g
}

const leafMaterials = ['#2f6a2c', '#3a7a32', '#285c26', '#447f37'].map(
  (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, side: THREE.DoubleSide }),
)

function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

export type PlantKind = 'floor' | 'desk' | 'deskSmall'

const PRESETS: Record<
  PlantKind,
  { potR: number; potH: number; leaves: number; len: [number, number]; wid: [number, number]; tilt: [number, number] }
> = {
  floor: { potR: 0.19, potH: 0.42, leaves: 22, len: [0.5, 0.95], wid: [0.09, 0.15], tilt: [8, 55] },
  desk: { potR: 0.085, potH: 0.15, leaves: 14, len: [0.24, 0.42], wid: [0.05, 0.085], tilt: [10, 60] },
  deskSmall: { potR: 0.065, potH: 0.11, leaves: 10, len: [0.15, 0.27], wid: [0.04, 0.065], tilt: [10, 60] },
}

export function Plant({
  kind,
  position,
  scale = 1,
  seed = 1,
}: {
  kind: PlantKind
  position: [number, number, number]
  scale?: number
  seed?: number
}) {
  const m = getMaterials()
  const p = PRESETS[kind]
  const leaves = useMemo(() => {
    const r = rng(seed * 9973 + 17)
    const lerp = (a: [number, number], t: number) => a[0] + (a[1] - a[0]) * t
    return Array.from({ length: p.leaves }, (_, i) => ({
      yaw: (i / p.leaves) * Math.PI * 2 * 2.618 + r() * 0.6,
      tilt: THREE.MathUtils.degToRad(lerp(p.tilt, r())),
      len: lerp(p.len, r()),
      wid: lerp(p.wid, r()),
      mat: leafMaterials[Math.floor(r() * leafMaterials.length)],
    }))
  }, [seed, p])
  const leaf = getLeafGeometry()
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, p.potH / 2, 0]} material={m.pot} castShadow receiveShadow>
        <cylinderGeometry args={[p.potR, p.potR * 0.8, p.potH, 32]} />
      </mesh>
      <mesh position={[0, p.potH - 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} material={m.soil}>
        <circleGeometry args={[p.potR * 0.94, 24]} />
      </mesh>
      <group position={[0, p.potH - 0.03, 0]}>
        {leaves.map((l, i) => (
          <group key={i} rotation={[0, l.yaw, 0]}>
            <mesh
              geometry={leaf}
              material={l.mat}
              rotation={[l.tilt, 0, 0]}
              scale={[l.wid, l.len, l.len]}
              castShadow
            />
          </group>
        ))}
      </group>
    </group>
  )
}
