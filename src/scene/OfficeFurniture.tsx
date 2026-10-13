import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { BENCH, BENCHES, CABINS, CABIN_FURNITURE, EATING_AREA, PLANTER_WORKSTATION as P } from '../config/office'
import { getMaterials } from './materials'
import { BoxFromTo, facingToRotationY } from './primitives'
import { EATING, MONITORS, OFFICE_CHAIRS, PLANTER_TABLES, benchRect, cabinDesk, type Placement } from './placements'
import { getLeafGeometry } from './Plant'

// ---------------------------------------------------------------------------
// Instancing helper
// ---------------------------------------------------------------------------
type Part = { geometry: THREE.BufferGeometry; material: THREE.Material }

function InstancedParts({ parts, items, y = 0 }: { parts: Part[]; items: Placement[]; y?: number }) {
  return (
    <>
      {parts.map((p, i) => (
        <InstancedPart key={i} part={p} items={items} y={y} />
      ))}
    </>
  )
}

function InstancedPart({ part, items, y }: { part: Part; items: Placement[]; y: number }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const o = new THREE.Object3D()
    items.forEach((it, i) => {
      o.position.set(it.x, y, it.z)
      o.rotation.set(0, facingToRotationY(it.facingDeg), 0)
      o.updateMatrix()
      mesh.setMatrixAt(i, o.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [items, y])
  return (
    <instancedMesh
      ref={ref}
      args={[part.geometry, part.material, items.length]}
      castShadow
      receiveShadow
      frustumCulled={false}
    />
  )
}

const placed = (g: THREE.BufferGeometry, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0) => {
  g.rotateX(rx)
  g.rotateY(ry)
  g.rotateZ(rz)
  g.translate(x, y, z)
  return g
}

// ---------------------------------------------------------------------------
// Light-coloured mesh office chair (front faces +Z)
// ---------------------------------------------------------------------------
let chairParts: Part[] | null = null
function getChairParts(): Part[] {
  if (chairParts) return chairParts
  const m = getMaterials()
  const fabric = mergeGeometries([
    placed(new RoundedBoxGeometry(0.48, 0.08, 0.46, 3, 0.03), 0, 0.47, 0.02),
    placed(new RoundedBoxGeometry(0.45, 0.5, 0.05, 3, 0.02), 0, 0.84, -0.23, -0.12),
  ])!
  const legs: THREE.BufferGeometry[] = []
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2
    const leg = new THREE.BoxGeometry(0.3, 0.025, 0.04)
    leg.translate(0.15, 0.075, 0)
    leg.rotateY(a)
    legs.push(leg)
    const wheel = new THREE.SphereGeometry(0.025, 8, 6)
    wheel.translate(Math.cos(a) * 0.29, 0.03, -Math.sin(a) * 0.29)
    legs.push(wheel)
  }
  const frame = mergeGeometries([
    ...legs,
    placed(new THREE.CylinderGeometry(0.025, 0.03, 0.34, 10), 0, 0.26, 0),
    placed(new THREE.BoxGeometry(0.04, 0.32, 0.03), 0, 0.62, -0.215, -0.12),
    // armrests
    placed(new THREE.BoxGeometry(0.03, 0.2, 0.03), -0.26, 0.6, 0.0),
    placed(new THREE.BoxGeometry(0.03, 0.2, 0.03), 0.26, 0.6, 0.0),
    placed(new THREE.BoxGeometry(0.05, 0.025, 0.26), -0.26, 0.71, 0.0),
    placed(new THREE.BoxGeometry(0.05, 0.025, 0.26), 0.26, 0.71, 0.0),
  ])!
  chairParts = [
    { geometry: fabric, material: m.officeChair },
    { geometry: frame, material: m.officeChairFrame },
  ]
  return chairParts
}

// ---------------------------------------------------------------------------
// Monitor (screen faces +Z), placed on a desk top
// ---------------------------------------------------------------------------
let monitorParts: Part[] | null = null
function getMonitorParts(): Part[] {
  if (monitorParts) return monitorParts
  const m = getMaterials()
  const body = mergeGeometries([
    placed(new THREE.BoxGeometry(0.56, 0.34, 0.03), 0, 0.33, 0),
    placed(new THREE.BoxGeometry(0.05, 0.2, 0.025), 0, 0.12, -0.035),
    placed(new THREE.BoxGeometry(0.22, 0.012, 0.17), 0, 0.006, -0.02),
  ])!
  const screen = placed(new THREE.PlaneGeometry(0.53, 0.31), 0, 0.335, 0.0155)
  monitorParts = [
    { geometry: body, material: m.monitor },
    { geometry: screen, material: m.screen },
  ]
  return monitorParts
}

export function OfficeChairs() {
  return <InstancedParts parts={getChairParts()} items={OFFICE_CHAIRS} />
}

export function Monitors() {
  return <InstancedParts parts={getMonitorParts()} items={MONITORS} y={BENCH.height} />
}

// ---------------------------------------------------------------------------
// Double-sided bench desk (green tops, white frame, fabric divider)
// ---------------------------------------------------------------------------
function BenchDesk({ bench }: { bench: (typeof BENCHES)[number] }) {
  const m = getMaterials()
  const r = benchRect(bench)
  const cx = bench.center[0]
  const h = BENCH.height
  const t = 0.03
  return (
    <group>
      <BoxFromTo min={[r.x0, h - t, r.z0]} max={[cx - 0.01, h, r.z1]} material={m.greenTable} />
      <BoxFromTo min={[cx + 0.01, h - t, r.z0]} max={[r.x1, h, r.z1]} material={m.greenTable} />
      {/* fabric divider between facing desks */}
      <BoxFromTo min={[cx - 0.015, h, r.z0 + 0.02]} max={[cx + 0.015, h + 0.38, r.z1 - 0.02]} material={m.fabricDivider} />
      {/* white end and middle supports */}
      {[r.z0 + 0.02, (r.z0 + r.z1) / 2, r.z1 - 0.05].map((z) => (
        <BoxFromTo key={z} min={[r.x0 + 0.05, 0, z]} max={[r.x1 - 0.05, h - t, z + 0.03]} material={m.whiteLaminate} />
      ))}
      {/* cable spine */}
      <BoxFromTo min={[cx - 0.06, 0.55, r.z0]} max={[cx + 0.06, 0.62, r.z1]} material={m.whiteLaminate} />
    </group>
  )
}

export function Benches() {
  return (
    <>
      {BENCHES.map((b) => (
        <BenchDesk key={b.id} bench={b} />
      ))}
    </>
  )
}

// ---------------------------------------------------------------------------
// Central planter workstation
// ---------------------------------------------------------------------------
function Greenery({ x0, x1, z0, z1, y0, seed = 7 }: { x0: number; x1: number; z0: number; z1: number; y0: number; seed?: number }) {
  const leafRef = useRef<THREE.InstancedMesh>(null)
  const fruitRef = useRef<THREE.InstancedMesh>(null)
  const leafCount = Math.round((x1 - x0) * (z1 - z0) * 700)
  const fruitCount = Math.round(leafCount / 70)
  const mats = useMemo(
    () => ({
      leaf: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.55, side: THREE.DoubleSide }),
      fruit: new THREE.MeshStandardMaterial({ color: '#e0a23a', roughness: 0.5 }),
    }),
    [],
  )
  const fruitGeo = useMemo(() => new THREE.SphereGeometry(0.016, 8, 6), [])
  useLayoutEffect(() => {
    let s = seed
    const rnd = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
    const o = new THREE.Object3D()
    const color = new THREE.Color()
    // leaves are grouped into rounded bushes planted across the bed
    const bushes = Array.from({ length: Math.max(6, Math.round((x1 - x0) * (z1 - z0) * 4)) }, () => ({
      x: x0 + 0.15 + rnd() * (x1 - x0 - 0.3),
      z: z0 + 0.15 + rnd() * (z1 - z0 - 0.3),
      h: 0.6 + rnd() * 0.55,
      r: 0.26 + rnd() * 0.16,
    }))
    const leaf = leafRef.current
    if (leaf) {
      for (let i = 0; i < leafCount; i++) {
        const b = bushes[i % bushes.length]
        const a = rnd() * Math.PI * 2
        const t = Math.sqrt(rnd())
        const hy = rnd()
        // dome-shaped bush: wider in the middle, narrower at the top
        const rr = b.r * t * (1 - 0.55 * hy * hy)
        const x = Math.min(x1 - 0.03, Math.max(x0 + 0.03, b.x + Math.cos(a) * rr))
        const z = Math.min(z1 - 0.03, Math.max(z0 + 0.03, b.z + Math.sin(a) * rr))
        const y = y0 + 0.04 + hy * b.h
        o.position.set(x, y, z)
        // leaves point outwards and upwards from the bush centre
        o.rotation.set(0.5 + rnd() * 0.9, -a + Math.PI / 2 + (rnd() - 0.5) * 0.8, (rnd() - 0.5) * 0.5, 'YXZ')
        const sz = 0.09 + rnd() * 0.08
        o.scale.set(sz * 0.6, sz, sz)
        o.updateMatrix()
        leaf.setMatrixAt(i, o.matrix)
        leaf.setColorAt(i, color.setHSL(0.27 + rnd() * 0.06, 0.5 + rnd() * 0.2, 0.15 + rnd() * 0.1))
      }
      leaf.instanceMatrix.needsUpdate = true
      if (leaf.instanceColor) leaf.instanceColor.needsUpdate = true
    }
    const fruit = fruitRef.current
    if (fruit) {
      for (let i = 0; i < fruitCount; i++) {
        const fb = bushes[i % bushes.length]
        o.position.set(fb.x + (rnd() - 0.5) * fb.r * 1.4, y0 + 0.25 + rnd() * fb.h * 0.85, fb.z + (rnd() - 0.5) * fb.r * 1.4)
        o.rotation.set(0, 0, 0)
        o.scale.setScalar(0.8 + rnd() * 0.6)
        o.updateMatrix()
        fruit.setMatrixAt(i, o.matrix)
      }
      fruit.instanceMatrix.needsUpdate = true
    }
  }, [x0, x1, z0, z1, y0, seed, leafCount, fruitCount])
  return (
    <>
      <instancedMesh ref={leafRef} args={[getLeafGeometry(), mats.leaf, leafCount]} castShadow frustumCulled={false} />
      <instancedMesh ref={fruitRef} args={[fruitGeo, mats.fruit, fruitCount]} frustumCulled={false} />
    </>
  )
}

export function PlanterWorkstation() {
  const m = getMaterials()
  const pl = P.planter
  const T = PLANTER_TABLES
  const h = BENCH.height
  const t = 0.03
  const rw = pl.rimWidth
  const legs: [number, number][] = [
    [T.x0 + 0.08, T.z0 + 0.08],
    [T.x1 - 0.08, T.z0 + 0.08],
    [T.x0 + 0.08, T.z1 - 0.08],
    [T.x1 - 0.08, T.z1 - 0.08],
    [(T.x0 + T.x1) / 2 - 0.9, T.z1 - 0.08],
    [(T.x0 + T.x1) / 2 + 0.9, T.z1 - 0.08],
  ]
  return (
    <group>
      {/* green tables on all four sides */}
      <BoxFromTo min={[T.x0, h - t, T.z0]} max={[T.x1, h, pl.z0]} material={m.greenTable} />
      <BoxFromTo min={[T.x0, h - t, pl.z1]} max={[T.x1, h, T.z1]} material={m.greenTable} />
      <BoxFromTo min={[T.x0, h - t, pl.z0]} max={[pl.x0, h, pl.z1]} material={m.greenTable} />
      <BoxFromTo min={[pl.x1, h - t, pl.z0]} max={[T.x1, h, pl.z1]} material={m.greenTable} />
      {legs.map(([x, z], i) => (
        <mesh key={i} position={[x, (h - t) / 2, z]} material={m.whiteLaminate} castShadow>
          <cylinderGeometry args={[0.03, 0.03, h - t, 12]} />
        </mesh>
      ))}
      {/* white-bordered planter */}
      <BoxFromTo min={[pl.x0, 0, pl.z0]} max={[pl.x1, pl.rimHeight, pl.z0 + rw]} material={m.planterRim} />
      <BoxFromTo min={[pl.x0, 0, pl.z1 - rw]} max={[pl.x1, pl.rimHeight, pl.z1]} material={m.planterRim} />
      <BoxFromTo min={[pl.x0, 0, pl.z0]} max={[pl.x0 + rw, pl.rimHeight, pl.z1]} material={m.planterRim} />
      <BoxFromTo min={[pl.x1 - rw, 0, pl.z0]} max={[pl.x1, pl.rimHeight, pl.z1]} material={m.planterRim} />
      <BoxFromTo min={[pl.x0 + rw, 0, pl.z0 + rw]} max={[pl.x1 - rw, pl.rimHeight - 0.08, pl.z1 - rw]} material={m.soil} castShadow={false} />
      <Greenery x0={pl.x0 + rw} x1={pl.x1 - rw} z0={pl.z0 + rw} z1={pl.z1 - rw} y0={pl.rimHeight - 0.08} />
    </group>
  )
}

// ---------------------------------------------------------------------------
// Cabin desks
// ---------------------------------------------------------------------------
export function CabinDesks() {
  const m = getMaterials()
  const h = CABIN_FURNITURE.desk.height
  return (
    <>
      {CABINS.map((c) => {
        const r = cabinDesk(c)
        return (
          <group key={c.id}>
            <BoxFromTo min={[r.x0, h - 0.03, r.z0]} max={[r.x1, h, r.z1]} material={m.greenTable} />
            <BoxFromTo min={[r.x0 + 0.03, 0, r.z0 + 0.04]} max={[r.x0 + 0.06, h - 0.03, r.z1 - 0.04]} material={m.whiteLaminate} />
            <BoxFromTo min={[r.x1 - 0.06, 0, r.z0 + 0.04]} max={[r.x1 - 0.03, h - 0.03, r.z1 - 0.04]} material={m.whiteLaminate} />
            {/* modesty panel on the visitor side + drawer pedestal */}
            <BoxFromTo min={[r.x0 + 0.06, 0.25, r.z1 - 0.06]} max={[r.x1 - 0.06, h - 0.03, r.z1 - 0.04]} material={m.whiteLaminate} />
            <BoxFromTo min={[r.x1 - 0.5, 0, r.z0 + 0.06]} max={[r.x1 - 0.08, 0.6, r.z0 + 0.5]} material={m.whiteLaminate} />
          </group>
        )
      })}
    </>
  )
}

// ---------------------------------------------------------------------------
// Eating area: lunch counter, bar stools, fridge
// ---------------------------------------------------------------------------
export function EatingArea() {
  const m = getMaterials()
  const c = EATING.counter
  const f = EATING.fridge
  const top = EATING_AREA.counter.height
  return (
    <group>
      {/* base cabinet + overhanging counter top */}
      <BoxFromTo min={[c.x0 + 0.05, 0, c.z0]} max={[c.x1, top - 0.04, c.z1]} material={m.whiteLaminate} />
      <BoxFromTo min={[c.x0 - 0.22, top - 0.04, c.z0]} max={[c.x1, top, c.z1]} material={m.wood} />
      {/* fridge */}
      <BoxFromTo min={[f.x0, 0, f.z0]} max={[f.x1, EATING_AREA.fridge.height, f.z1 - 0.02]} material={m.fridge} />
      <BoxFromTo min={[f.x0 - 0.004, 1.15, f.z0 + 0.02]} max={[f.x0, 1.152, f.z1 - 0.04]} material={m.plastic} castShadow={false} />
      <BoxFromTo min={[f.x0 - 0.03, 1.25, f.z1 - 0.12]} max={[f.x0 - 0.01, 1.6, f.z1 - 0.1]} material={m.handle} />
      {EATING.stools.map((s, i) => (
        <group key={i} position={[s.x, 0, s.z]}>
          <mesh position={[0, 0.74, 0]} material={m.wood} castShadow>
            <cylinderGeometry args={[0.17, 0.17, 0.04, 24]} />
          </mesh>
          {[0, 1, 2, 3].map((k) => {
            const a = (k / 4) * Math.PI * 2 + Math.PI / 4
            return (
              <mesh key={k} position={[Math.cos(a) * 0.12, 0.36, Math.sin(a) * 0.12]} rotation={[Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12]} material={m.frame} castShadow>
                <cylinderGeometry args={[0.012, 0.012, 0.74, 8]} />
              </mesh>
            )
          })}
          <mesh position={[0, 0.28, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.frame}>
            <torusGeometry args={[0.135, 0.008, 6, 24]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
