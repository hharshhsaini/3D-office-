import { ENTRANCE as E, WALL_THICKNESS } from '../config/layout'
import { localRectToWorld, rangeToLocal, wallTransform } from './frames'
import { CeilingPatch, FloorPatch, WallWithOpenings } from './primitives'
import { DoubleGlassDoor } from './GlassPartition'
import { Downlight } from './Lights'
import { getMaterials } from './materials'
import { useSceneSettings } from './SceneSettings'

/**
 * Main entrance: black-framed double glass door in the front wall, plus a plain
 * neutral landing outside it (only so the view back through the glass is not empty).
 */
export function Entrance() {
  const m = getMaterials()
  const { showSurroundings } = useSceneSettings()
  const { position, rotationY } = wallTransform('front')
  const [x0, x1] = rangeToLocal('front', E.centerX - E.width / 2, E.centerX + E.width / 2)
  const t = WALL_THICKNESS
  const landing = { x0: x0 - 1.6, x1: x1 + 1.6, z0: -t - E.landingDepth, z1: -t }
  const rect = localRectToWorld('front', landing.x0, landing.x1, landing.z0, landing.z1)
  const cx = (x0 + x1) / 2

  return (
    <>
      <group position={position} rotation={[0, rotationY, 0]}>
        <DoubleGlassDoor from={x0} to={x1} height={E.height} />
        {showSurroundings && (
          <>
            {/* landing walls (facing the door) */}
            <group position={[0, 0, landing.z0]}>
              <WallWithOpenings from={landing.x0} to={landing.x1} material={m.wallGrey} />
            </group>
            <group position={[landing.x0, 0, -t]} rotation={[0, Math.PI / 2, 0]}>
              <WallWithOpenings from={0} to={E.landingDepth} material={m.wallGrey} />
            </group>
            <group position={[landing.x1, 0, -t]} rotation={[0, -Math.PI / 2, 0]}>
              <WallWithOpenings from={-E.landingDepth} to={0} material={m.wallGrey} />
            </group>
            <Downlight x={cx} z={-t - E.landingDepth / 2} intensity={3} angle={1} />
          </>
        )}
      </group>
      {showSurroundings && <FloorPatch rect={rect} />}
      <CeilingPatch rect={rect} />
    </>
  )
}
