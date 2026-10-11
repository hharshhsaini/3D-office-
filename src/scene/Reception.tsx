import {
  BACK_WINDOW,
  CEILING_HEIGHT,
  CORRIDOR,
  DOWNLIGHTS,
  ENTRANCE,
  FLOOR_PLANTS,
  INTERVIEW_CABIN,
  LINEAR_LEDS,
  LOBBY_EDGES,
  WALL_THICKNESS,
  type WallName,
} from '../config/layout'
import { rangeToLocal, wallTransform } from './frames'
import { CeilingPatch, FloorPatch, WallWithOpenings, type Opening } from './primitives'
import { BackWallFeatures } from './BackWall'
import { ReceptionDesk } from './ReceptionDesk'
import { RedFeatureWall } from './RedFeatureWall'
import { InterviewCabin } from './InterviewCabin'
import { Corridor } from './Corridor'
import { Entrance } from './Entrance'
import { Downlight, GlobalLighting, LinearLed, Spot } from './Lights'
import { Plant } from './Plant'

/** Openings cut into each lobby wall, derived from the layout config. */
function lobbyOpenings(): Record<WallName, Opening[]> {
  const openings: Record<WallName, Opening[]> = { back: [], front: [], left: [], right: [] }
  const add = (wall: WallName, a: number, b: number, bottom: number, top: number) => {
    const [from, to] = rangeToLocal(wall, a, b)
    openings[wall].push({ from, to, bottom, top })
  }
  add('front', ENTRANCE.centerX - ENTRANCE.width / 2, ENTRANCE.centerX + ENTRANCE.width / 2, 0, ENTRANCE.height)
  add('back', BACK_WINDOW.centerX - BACK_WINDOW.width / 2, BACK_WINDOW.centerX + BACK_WINDOW.width / 2, BACK_WINDOW.sillHeight, BACK_WINDOW.sillHeight + BACK_WINDOW.height)
  add(CORRIDOR.wall, CORRIDOR.fromZ, CORRIDOR.toZ, 0, CEILING_HEIGHT)
  add(INTERVIEW_CABIN.wall, INTERVIEW_CABIN.fromZ, INTERVIEW_CABIN.toZ, 0, CEILING_HEIGHT)
  return openings
}

/** Length of each lobby wall in its own frame (extended to close the corners). */
function wallExtent(wall: WallName): [number, number] {
  const t = WALL_THICKNESS
  if (wall === 'back' || wall === 'front') return [LOBBY_EDGES.left - t, LOBBY_EDGES.right + t]
  return [LOBBY_EDGES.back - t, LOBBY_EDGES.front + t]
}

export function Reception() {
  const openings = lobbyOpenings()
  const lobbyRect = { x0: LOBBY_EDGES.left, x1: LOBBY_EDGES.right, z0: LOBBY_EDGES.back, z1: LOBBY_EDGES.front }
  const keyLight = LINEAR_LEDS[0]

  return (
    <group>
      <GlobalLighting />

      {/* lobby shell */}
      <FloorPatch rect={lobbyRect} reflective />
      <CeilingPatch rect={lobbyRect} />
      {(['back', 'front', 'left', 'right'] as WallName[]).map((wall) => {
        const { position, rotationY } = wallTransform(wall)
        const [from, to] = wallExtent(wall)
        return (
          <group key={wall} position={position} rotation={[0, rotationY, 0]}>
            <WallWithOpenings from={from} to={to} openings={openings[wall]} />
          </group>
        )
      })}

      <Entrance />
      <ReceptionDesk />
      <BackWallFeatures />
      <RedFeatureWall />
      <InterviewCabin />
      <Corridor />

      {FLOOR_PLANTS.map((p, i) => (
        <Plant key={i} kind="floor" position={[p.x, 0, p.z]} scale={p.scale} seed={11 + i} />
      ))}

      {/* ceiling lights */}
      {LINEAR_LEDS.map((l, i) => (
        <LinearLed key={i} from={l.from} to={l.to} />
      ))}
      {DOWNLIGHTS.map(([x, z], i) => (
        <Downlight key={i} x={x} z={z} />
      ))}
      {/* invisible soft key light along the LED strip, so furniture casts floor shadows */}
      {keyLight && (
        <Spot
          position={[(keyLight.from[0] + keyLight.to[0]) / 2, CEILING_HEIGHT - 0.05, (keyLight.from[1] + keyLight.to[1]) / 2]}
          target={[(keyLight.from[0] + keyLight.to[0]) / 2 - 0.6, 0, (keyLight.from[1] + keyLight.to[1]) / 2 - 0.6]}
          color="#fff6ea"
          intensity={6}
          angle={1.2}
          penumbra={1}
          castShadow
        />
      )}
    </group>
  )
}
