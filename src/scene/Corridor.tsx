import { CEILING_HEIGHT, CORRIDOR as K, INTERVIEW_CABIN as C, WALL_THICKNESS } from '../config/layout'
import { alongToLocal, localRectToWorld, localToWorld, rangeToLocal, wallTransform } from './frames'
import { CeilingPatch, FloorPatch } from './primitives'
import { GlassPartition } from './GlassPartition'
import { LinearLed } from './Lights'

/**
 * Start of the office corridor (towards the main office and the cabins).
 * Narrow, lined with black-framed glass partitions and doors, with a white
 * linear LED down the centre, as in the corridor photograph.
 * It leaves the lobby through K.wall (the right wall) – never behind the desk.
 * Built in that wall's frame; the corridor lies beyond the wall (local Z < 0).
 */
export function Corridor() {
  const { position, rotationY } = wallTransform(K.wall)
  const [x0, x1] = rangeToLocal(K.wall, K.fromZ, K.toZ)
  const [d0, d1] = rangeToLocal(K.wall, K.door.fromZ, K.door.toZ)
  const hingeLocal = alongToLocal(K.wall, K.door[K.door.hingeAt])
  const L = K.length
  const rect = localRectToWorld(K.wall, x0, x1, -L, 0)
  const ledFrom = localToWorld(K.wall, (x0 + x1) / 2, -0.4)
  const ledTo = localToWorld(K.wall, (x0 + x1) / 2, -L + 0.4)
  // walking into the corridor (towards local -Z) the right-hand side is local +X
  const bandRight = K.redBand.side === 'right'
  const band = { bottom: K.redBand.bottomY, height: K.redBand.height }
  const endDoorW = 0.95

  // Where the interview cabin sits right next to the corridor on the same wall,
  // the cabin's solid side wall is the corridor wall, so the glass starts after it.
  const t = WALL_THICKNESS
  const near = (a: number, b: number) => Math.abs(a - b) < 0.05
  const sameWall = C.wall === K.wall
  const cabinAfterTo = sameWall && near(C.fromZ, K.toZ + t)
  const cabinBeforeFrom = sameWall && near(C.toZ, K.fromZ - t)
  const toIsX1 = alongToLocal(K.wall, K.toZ) === x1
  const skip = C.depth + t
  const skipX1 = (toIsX1 ? cabinAfterTo : cabinBeforeFrom) ? skip : 0
  const skipX0 = (toIsX1 ? cabinBeforeFrom : cabinAfterTo) ? skip : 0

  return (
    <>
      <group position={position} rotation={[0, rotationY, 0]}>
        {/* glass partition with door between the lobby and the corridor */}
        <GlassPartition
          from={x0}
          to={x1}
          door={{
            from: d0,
            to: d1,
            hinge: Math.abs(hingeLocal - d0) < 1e-6 ? 'from' : 'to',
            openDeg: K.door.openDeg,
            handle: 'lever',
          }}
        />
        {/* side partitions running along the corridor */}
        <group position={[x0, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <GlassPartition from={skipX0} to={L} z={-0.035} frosted={K.frostedSideGlass} band={bandRight ? undefined : band} />
        </group>
        <group position={[x1, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <GlassPartition from={-L} to={-skipX1} z={-0.035} frosted={K.frostedSideGlass} band={bandRight ? band : undefined} />
        </group>
        {/* end of this phase: glass door on to the main office */}
        <group position={[0, 0, -L]}>
          <GlassPartition
            from={x0}
            to={x1}
            z={-0.035}
            frosted={K.frostedSideGlass}
            door={{ from: (x0 + x1) / 2 - endDoorW / 2, to: (x0 + x1) / 2 + endDoorW / 2, hinge: 'to', openDeg: 0, handle: 'lever' }}
          />
        </group>
      </group>
      <FloorPatch rect={rect} />
      <CeilingPatch rect={rect} height={CEILING_HEIGHT} />
      <LinearLed from={ledFrom} to={ledTo} intensity={7} />
    </>
  )
}
