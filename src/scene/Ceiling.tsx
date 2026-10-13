import { AREAS, CABINS, CEILING, CEILING_HEIGHT, GRID, OFFICE, RECEPTION } from '../config/office'
import { getMaterials } from './materials'
import { CeilingPatch } from './primitives'
import { AcCassette, CeilingFill, Downlight, LinearLed, SpherePendant } from './Lights'
import { useSceneSettings } from './SceneSettings'

/**
 * Ceiling: white ceiling over every area, green painted sections over the open
 * workspace, cassette air conditioners, white linear LEDs, white sphere pendants.
 * Fixture positions come from CEILING in the office config.
 */
export function Ceiling() {
  const m = getMaterials()
  const { showCeiling } = useSceneSettings()
  return (
    <group>
      {AREAS.filter((a) => a.id !== 'washroom').map((a) => (
        <CeilingPatch key={a.id} rect={a.rect} />
      ))}
      {CEILING.greenSections.map((r, i) => (
        <CeilingPatch key={i} rect={r} height={CEILING_HEIGHT - 0.004} material={m.ceilingGreen} />
      ))}
      {CEILING.acCassettes.map(([x, z], i) => (
        <AcCassette key={i} x={x} z={z} />
      ))}
      {/* corridor + cabins: real area lights; eating area: fixture only */}
      {CEILING.linearLeds.map((l, i) => (
        <LinearLed key={i} from={l.from} to={l.to} intensity={i === 0 ? 7 : 6} light={i <= CABINS.length} />
      ))}
      {CEILING.spherePendants.map(([x, z], i) => (
        <SpherePendant key={i} x={x} z={z} bottomY={CEILING.sphereBottomY} />
      ))}
      {/* soft overall light over the open workspace (stands in for the many ceiling fixtures) */}
      <CeilingFill x0={GRID.corridorEast} x1={OFFICE.width} z0={0} z1={5.2} />
      <CeilingFill x0={GRID.corridorEast} x1={OFFICE.width} z0={5.2} z1={GRID.serviceNorth} />
      {/* reception */}
      <LinearLed from={RECEPTION.linearLed.from} to={RECEPTION.linearLed.to} />
      {showCeiling &&
        RECEPTION.downlights.map(([x, z], i) => <Downlight key={i} x={x} z={z} light={false} />)}
    </group>
  )
}
