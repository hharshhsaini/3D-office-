import { useMemo } from 'react'
import * as THREE from 'three'
import { RECEPTION_DESK as D, DESK_CENTER_Z, DESK_PLANTS } from '../config/layout'
import { COLORS } from '../config/appearance'
import { getMaterials } from './materials'
import { BoxFromTo } from './primitives'
import { Monitor } from './Furniture'
import { Plant } from './Plant'
import { deg } from './frames'

/**
 * Reception desk: white marble-style front panel between two natural wood end
 * blocks, recessed plinth with a warm LED glow, marble transaction ledge and a
 * lower receptionist work surface behind it.
 * Local origin = desk centre on the floor; the front (visitor side) faces +Z.
 */
export function ReceptionDesk() {
  const m = getMaterials()
  const W = D.width
  const H = D.height
  const halfD = D.depth / 2
  const xL = -W / 2
  const xR = W / 2
  const xMarbleL = xL + D.leftEndWidth
  const xMarbleR = xR - D.rightEndWidth
  const frontZ = halfD - 0.015 // marble face sits slightly behind the wooden ends
  const ledgeDepth = 0.36
  const ledgeT = 0.035
  const panelT = 0.04

  // Marble front: plane-like box with UVs scaled so the veins are not stretched
  const marbleFront = useMemo(() => {
    const w = xMarbleR - xMarbleL
    const h = H - ledgeT - D.toeKickHeight
    const g = new THREE.BoxGeometry(w, h, panelT)
    const uv = g.attributes.uv
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (w / 2.2), uv.getY(i) * (h / 1.1))
    return { g, w, h }
  }, [W, H, xMarbleL, xMarbleR])

  return (
    <group position={[D.centerX, 0, DESK_CENTER_Z]} rotation={[0, deg(D.rotationDeg), 0]}>
      {/* wooden end blocks */}
      <BoxFromTo min={[xL, 0, -halfD]} max={[xMarbleL, H, halfD]} material={m.wood} />
      <BoxFromTo min={[xMarbleR, 0, -halfD]} max={[xR, H, halfD + 0.02]} material={m.wood} />

      {/* marble front panel */}
      <mesh
        geometry={marbleFront.g}
        material={m.marble}
        position={[(xMarbleL + xMarbleR) / 2, D.toeKickHeight + marbleFront.h / 2, frontZ - panelT / 2]}
        castShadow
        receiveShadow
      />
      {/* marble transaction ledge */}
      <BoxFromTo min={[xMarbleL, H - ledgeT, frontZ - ledgeDepth]} max={[xMarbleR, H, frontZ + 0.012]} material={m.marble} />
      {/* inner upstand under the ledge (receptionist side) */}
      <BoxFromTo
        min={[xMarbleL, D.workSurfaceHeight, frontZ - ledgeDepth]}
        max={[xMarbleR, H - ledgeT, frontZ - ledgeDepth + 0.025]}
        material={m.deskInner}
      />

      {/* recessed plinth + warm LED glow */}
      <BoxFromTo
        min={[xMarbleL, 0, frontZ - panelT - 0.3]}
        max={[xMarbleR, D.toeKickHeight, frontZ - D.toeKickRecess]}
        material={m.frame}
      />
      <mesh position={[(xMarbleL + xMarbleR) / 2, D.toeKickHeight - 0.006, frontZ - 0.025]} material={m.ledWarm}>
        <boxGeometry args={[xMarbleR - xMarbleL - 0.02, 0.008, 0.012]} />
      </mesh>
      <rectAreaLight
        position={[(xMarbleL + xMarbleR) / 2, D.toeKickHeight - 0.012, frontZ - 0.02]}
        rotation={[-Math.PI / 2, 0, 0]}
        width={xMarbleR - xMarbleL - 0.05}
        height={0.03}
        color={COLORS.warmLight}
        intensity={40}
      />

      {/* receptionist work surface + modesty structure */}
      <BoxFromTo
        min={[xMarbleL, D.workSurfaceHeight - 0.03, -halfD]}
        max={[xMarbleR, D.workSurfaceHeight, frontZ - panelT]}
        material={m.deskInner}
      />
      <BoxFromTo
        min={[xMarbleL, D.toeKickHeight, frontZ - panelT - 0.02]}
        max={[xMarbleR, D.workSurfaceHeight - 0.03, frontZ - panelT]}
        material={m.deskInner}
      />
      <Monitor position={[xMarbleL + 0.75, D.workSurfaceHeight, -0.08]} />

      {/* plants on the wooden end blocks, as in the reference */}
      {DESK_PLANTS.left && <Plant kind="desk" position={[(xL + xMarbleL) / 2, H, 0]} seed={3} />}
      {DESK_PLANTS.right && <Plant kind="deskSmall" position={[(xMarbleR + xR) / 2, H, 0.05]} seed={5} />}
    </group>
  )
}
