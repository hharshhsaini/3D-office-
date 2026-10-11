import { CEILING_HEIGHT, INTERVIEW_CABIN as C, WALL_THICKNESS } from '../config/layout'
import { alongToLocal, deg, localRectToWorld, rangeToLocal, wallTransform } from './frames'
import { CeilingPatch, FloorPatch, WallWithOpenings } from './primitives'
import { GlassPartition } from './GlassPartition'
import { Downlight } from './Lights'
import { InterviewChair, SmallRoundTable } from './Furniture'

/**
 * Very small enclosed interview cabin next to the entrance: black-framed glass
 * front with a glass door towards the lobby, solid walls on the other sides,
 * ONE chair and ONE small round table.
 * Built in the wall frame of C.wall; the cabin lies beyond that wall (local Z < 0).
 */
export function InterviewCabin() {
  const { position, rotationY } = wallTransform(C.wall)
  const [x0, x1] = rangeToLocal(C.wall, C.fromZ, C.toZ)
  const [d0, d1] = rangeToLocal(C.wall, C.door.fromZ, C.door.toZ)
  const hingeLocal = alongToLocal(C.wall, C.door[C.door.hingeAt])
  const t = WALL_THICKNESS
  const depth = C.depth
  const floorRect = localRectToWorld(C.wall, x0, x1, -depth, 0)

  return (
    <>
      <group position={position} rotation={[0, rotationY, 0]}>
        {/* far wall */}
        <group position={[0, 0, -depth]}>
          <WallWithOpenings from={x0 - t} to={x1 + t} />
        </group>
        {/* side walls (inner faces towards the cabin) */}
        <group position={[x0, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <WallWithOpenings from={0} to={depth + t} />
        </group>
        <group position={[x1, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <WallWithOpenings from={-depth - t} to={0} />
        </group>
        {/* glass front + door, in the plane of the lobby wall */}
        <GlassPartition
          from={x0}
          to={x1}
          height={CEILING_HEIGHT}
          door={{
            from: d0,
            to: d1,
            hinge: Math.abs(hingeLocal - d0) < 1e-6 ? 'from' : 'to',
            openDeg: C.door.openDeg,
            handle: 'lever',
          }}
        />
        <Downlight x={(x0 + x1) / 2} z={-depth / 2} intensity={4} angle={0.9} />
      </group>
      <FloorPatch rect={floorRect} />
      <CeilingPatch rect={floorRect} />
      <SmallRoundTable position={[C.table.x, 0, C.table.z]} diameter={C.table.diameter} height={C.table.height} />
      <InterviewChair position={[C.chair.x, 0, C.chair.z]} rotationY={deg(C.chair.rotationDeg)} />
    </>
  )
}
