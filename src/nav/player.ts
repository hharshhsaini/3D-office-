import { AREAS, SPAWN } from '../config/office'

const deg = (d: number) => (d * Math.PI) / 180

/**
 * Shared, mutable visitor state (position on the plan + view direction).
 * Kept outside React so the camera can update it every frame without
 * re-rendering; the HUD and minimap read it in their own animation loop.
 * yaw: 0 = facing north (-Z), positive = turning left (towards west).
 */
export const player = {
  x: SPAWN.x,
  z: SPAWN.z,
  yaw: deg(SPAWN.yawDeg),
  pitch: -0.06,
}

export function setPlayerPose(p: { x: number; z: number; yawDeg: number }) {
  player.x = p.x
  player.z = p.z
  player.yaw = deg(p.yawDeg)
  player.pitch = -0.06
}

/** Optional start pose from the URL: ?cam=x,z,yawDeg */
export function applyUrlPose() {
  const raw = new URLSearchParams(window.location.search).get('cam')
  if (!raw) return
  const [x, z, yawDeg = 0] = raw.split(',').map(Number)
  if ([x, z, yawDeg].every(Number.isFinite)) setPlayerPose({ x, z, yawDeg })
}

const priority = ['small-cabin', 'eating', 'washroom', 'hr', 'founders', 'tech', 'actors', 'corridor', 'reception', 'workspace', 'workspace-south']

/** Name of the area the visitor is standing in. */
export function areaNameAt(x: number, z: number) {
  const hits = AREAS.filter((a) => x >= a.rect.x0 && x <= a.rect.x1 && z >= a.rect.z0 && z <= a.rect.z1)
  hits.sort((a, b) => priority.indexOf(a.id) - priority.indexOf(b.id))
  return hits[0]?.name ?? ''
}

// Dev-only handle for automated browser tests (stripped from production builds).
if (import.meta.env.DEV) (window as unknown as { __spacewirePlayer: typeof player }).__spacewirePlayer = player
