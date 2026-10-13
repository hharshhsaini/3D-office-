import { Suspense, useMemo } from 'react'
import * as THREE from 'three'
import { GRID, INTERIOR_WALL, RECEPTION } from '../config/office'
import { getMaterials } from './materials'
import { BoxFromTo } from './primitives'
import { LogoMark } from './SpacewireLogo'
import { Downlight, LIGHT_LEVELS } from './Lights'
import { RoundedBox } from '@react-three/drei'

/**
 * Spacewire Tech red feature wall: natural wood box frame projecting from the
 * wall, red chevron-patterned upholstered back panel with the large white "S",
 * built-in red cushioned bench, warm downlights in the top of the frame.
 * Mounted on the south face of the Actors cabin wall, facing the reception
 * (local X = world X, local +Z = south, into the reception).
 */
const R = {
  ...RECEPTION.redWall,
  frameThickness: 0.07,
  logoDepth: 0.03,
  cushionThickness: 0.1,
  downlights: 3,
}

export function RedFeatureWall() {
  const m = getMaterials()
  const position: [number, number, number] = [0, 0, GRID.receptionNorth + INTERIOR_WALL / 2]
  const rotationY = 0
  const x0 = R.x0
  const x1 = R.x1
  const t = R.frameThickness
  const ix0 = x0 + t
  const ix1 = x1 - t
  const iy0 = R.bottomY + t
  const iy1 = R.topY - t
  const innerW = ix1 - ix0
  const innerH = iy1 - iy0
  const cx = (x0 + x1) / 2

  // back panel with UVs in metres so the chevron keeps its real size
  const panel = useMemo(() => {
    const g = new THREE.PlaneGeometry(innerW, innerH)
    const uv = g.attributes.uv
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * innerW, uv.getY(i) * innerH)
    return g
  }, [innerW, innerH])

  const cushionGap = 0.012
  const cushionW = (innerW - cushionGap * (R.cushions + 1)) / R.cushions
  const cushionD = R.depth - 0.05

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* wooden frame */}
      <BoxFromTo min={[x0, R.topY - t, 0]} max={[x1, R.topY, R.depth]} material={m.woodAcross} />
      <BoxFromTo min={[x0, R.bottomY, 0]} max={[x1, R.bottomY + t, R.depth]} material={m.woodAcross} />
      <BoxFromTo min={[x0, R.bottomY, 0]} max={[ix0, R.topY, R.depth]} material={m.wood} />
      <BoxFromTo min={[ix1, R.bottomY, 0]} max={[x1, R.topY, R.depth]} material={m.wood} />

      {/* red chevron upholstered panel */}
      <mesh geometry={panel} material={m.redPanel} position={[cx, (iy0 + iy1) / 2, 0.025]} receiveShadow />
      <BoxFromTo min={[ix0, iy0, 0]} max={[ix1, iy1, 0.02]} material={m.redCushion} castShadow={false} />

      {/* large white S */}
      <Suspense fallback={null}>
        <group position={[cx, R.logoY, 0.025]}>
          <LogoMark height={R.logoHeight} depth={R.logoDepth} material={m.logoWhite} />
        </group>
      </Suspense>

      {/* red cushioned bench seat */}
      {Array.from({ length: R.cushions }, (_, i) => {
        const a = ix0 + cushionGap + i * (cushionW + cushionGap)
        return (
          <RoundedBox
            key={i}
            args={[cushionW, R.cushionThickness, cushionD]}
            radius={0.03}
            smoothness={3}
            position={[a + cushionW / 2, iy0 + R.cushionThickness / 2, 0.02 + cushionD / 2]}
            material={m.redCushion}
            castShadow
            receiveShadow
          />
        )
      })}

      {/* warm downlights in the top of the frame, washing the red panel */}
      {Array.from({ length: R.downlights }, (_, i) => {
        const x = ix0 + ((i + 0.5) / R.downlights) * innerW
        return (
          <Downlight
            key={i}
            x={x}
            z={R.depth * 0.42}
            y={iy1}
            radius={0.025}
            angle={0.7}
            intensity={LIGHT_LEVELS.featureWallSpot}
            aim={[x, iy0, 0.05]}
            inCeiling={false}
            castShadow={i === Math.floor(R.downlights / 2)}
            light={i === Math.floor(R.downlights / 2)}
          />
        )
      })}
    </group>
  )
}
