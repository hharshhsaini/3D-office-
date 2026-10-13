import { Suspense } from 'react'
import { CEILING_HEIGHT, RECEPTION, SMALL_CABIN } from '../config/office'
import { getMaterials } from './materials'
import { BoxFromTo, facingToRotationY } from './primitives'
import { LogoMark, Wordmark } from './SpacewireLogo'
import { Pendant } from './Lights'
import { ReceptionDesk } from './ReceptionDesk'
import { RedFeatureWall } from './RedFeatureWall'
import { InterviewChair, SmallRoundTable } from './Furniture'

/**
 * Logo feature panel on the west wall behind the reception desk
 * (wall frame: local +Z = east into the reception, local +X = north).
 */
function LogoWall() {
  const m = getMaterials()
  const L = RECEPTION.logoPanel
  const panelT = 0.04
  return (
    <group position={[0, 0, L.centerZ]} rotation={[0, Math.PI / 2, 0]}>
      <BoxFromTo min={[-L.width / 2, 0, 0]} max={[L.width / 2, CEILING_HEIGHT, panelT]} material={m.logoPanel} />
      <Suspense fallback={null}>
        <group position={[0, L.markY, panelT]}>
          <LogoMark height={L.markHeight} depth={0.025} material={m.logoDark} />
        </group>
        <group position={[0, L.wordmarkY, panelT]}>
          <Wordmark text="Spacewire Tech" capHeight={L.wordmarkCapHeight} depth={0.015} material={m.logoDark} />
        </group>
      </Suspense>
    </group>
  )
}

/** Reception: desk facing the main entrance, logo wall with window, pendants, red feature wall, small cabin. */
export function ReceptionArea() {
  const P = RECEPTION.pendants
  const cz = RECEPTION.logoPanel.centerZ
  const sc = SMALL_CABIN
  return (
    <group>
      <ReceptionDesk />
      <LogoWall />
      {Array.from({ length: P.count }, (_, i) => (
        <Pendant
          key={i}
          x={P.distanceFromWall}
          z={cz + (i - (P.count - 1) / 2) * P.spacing}
          bottomY={P.bottomY}
          castShadow={i === Math.floor(P.count / 2)}
        />
      ))}
      <RedFeatureWall />
      {/* small interview cabin: one small table, one chair */}
      <SmallRoundTable position={[sc.table.x, 0, sc.table.z]} diameter={sc.table.diameter} height={0.72} />
      <InterviewChair position={[sc.chair.x, 0, sc.chair.z]} rotationY={facingToRotationY(sc.chair.facingDeg)} />
    </group>
  )
}
