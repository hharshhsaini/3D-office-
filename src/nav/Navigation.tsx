import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EYE_HEIGHT, OVERVIEW_CAMERA, WALK_SPEED } from '../config/office'
import { moveWithCollision } from './colliders'
import { areaNameAt, player } from './player'
import { hud } from './hud'

export type NavMode = 'walk' | 'overview'

const WALK_FOV = 70
const MIN_FOV = 30
const MAX_FOV = 80
const LOOK_SENSITIVITY = 0.0022
const TRANSITION_MS = 1300

type Pose = { position: THREE.Vector3; quaternion: THREE.Quaternion; fov: number }

function walkPose(): Pose {
  return {
    position: new THREE.Vector3(player.x, EYE_HEIGHT, player.z),
    quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(player.pitch, player.yaw, 0, 'YXZ')),
    fov: WALK_FOV,
  }
}

function overviewPose(): Pose {
  const m = new THREE.Matrix4().lookAt(
    new THREE.Vector3(...OVERVIEW_CAMERA.position),
    new THREE.Vector3(...OVERVIEW_CAMERA.target),
    new THREE.Vector3(0, 1, 0),
  )
  return {
    position: new THREE.Vector3(...OVERVIEW_CAMERA.position),
    quaternion: new THREE.Quaternion().setFromRotationMatrix(m),
    fov: OVERVIEW_CAMERA.fov,
  }
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/**
 * Camera director: flies smoothly between the overview and the first-person
 * view whenever `mode` or `token` changes, then hands over to the controls.
 */
export function Navigation({ mode, token, intro }: { mode: NavMode; token: number; intro: boolean }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const [ready, setReady] = useState(false)
  const tween = useRef<{ from: Pose; to: Pose; start: number; dur: number } | null>(null)
  const first = useRef(true)

  useLayoutEffect(() => {
    let from: Pose = { position: camera.position.clone(), quaternion: camera.quaternion.clone(), fov: camera.fov }
    if (first.current) {
      first.current = false
      // opening shot: start above the office and fly in, unless the overview was asked for directly
      from = overviewPose()
      camera.position.copy(from.position)
      camera.quaternion.copy(from.quaternion)
      camera.fov = from.fov
      camera.updateProjectionMatrix()
    }
    const to = mode === 'walk' ? walkPose() : overviewPose()
    const skip = !intro && token === 0
    tween.current = { from, to, start: performance.now(), dur: skip ? 0 : TRANSITION_MS }
    setReady(false)
  }, [mode, token, camera, intro])

  useFrame(() => {
    const tw = tween.current
    if (!tw) return
    const t = tw.dur === 0 ? 1 : Math.min(1, (performance.now() - tw.start) / tw.dur)
    const e = ease(t)
    camera.position.lerpVectors(tw.from.position, tw.to.position, e)
    camera.quaternion.slerpQuaternions(tw.from.quaternion, tw.to.quaternion, e)
    camera.fov = THREE.MathUtils.lerp(tw.from.fov, tw.to.fov, e)
    camera.updateProjectionMatrix()
    if (t >= 1) {
      tween.current = null
      setReady(true)
    }
  })

  if (!ready) return null
  return mode === 'walk' ? <WalkController /> : <OverviewOrbit />
}

function OverviewOrbit() {
  return (
    <OrbitControls
      makeDefault
      target={OVERVIEW_CAMERA.target}
      enableDamping
      dampingFactor={0.08}
      minDistance={4}
      maxDistance={45}
      maxPolarAngle={Math.PI / 2.1}
    />
  )
}

/**
 * First-person visitor controls.
 *  - click the view to capture the mouse (pointer lock), Esc releases it;
 *    without pointer lock, drag to look
 *  - W A S D / arrow keys to walk, Shift to walk faster, mouse wheel to zoom
 *  - collision with walls, glass, closed doors and furniture
 */
function WalkController() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const gl = useThree((s) => s.gl)
  const keys = useRef(new Set<string>())
  const vel = useRef(new THREE.Vector2())
  const bob = useRef(0)

  useEffect(() => {
    camera.rotation.order = 'YXZ'
    const el = gl.domElement
    let dragging = false
    let lx = 0
    let ly = 0
    const locked = () => document.pointerLockElement === el
    const look = (dx: number, dy: number) => {
      const k = (LOOK_SENSITIVITY * camera.fov) / WALK_FOV
      player.yaw -= dx * k
      player.pitch = THREE.MathUtils.clamp(player.pitch - dy * k, -1.35, 1.35)
    }
    const onDown = (e: PointerEvent) => {
      if (locked()) return
      dragging = true
      lx = e.clientX
      ly = e.clientY
      if (e.pointerType === 'mouse') {
        try {
          const p = el.requestPointerLock() as unknown as Promise<void> | undefined
          p?.catch?.(() => undefined)
        } catch {
          /* pointer lock unavailable: drag-to-look still works */
        }
      }
    }
    const onMove = (e: PointerEvent) => {
      if (locked()) look(e.movementX, e.movementY)
      else if (dragging) {
        look(e.clientX - lx, e.clientY - ly)
        lx = e.clientX
        ly = e.clientY
      }
    }
    const onUp = () => (dragging = false)
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      camera.fov = THREE.MathUtils.clamp(camera.fov + e.deltaY * 0.03, MIN_FOV, MAX_FOV)
      camera.updateProjectionMatrix()
    }
    const typing = () => document.activeElement instanceof HTMLInputElement
    const kd = (e: KeyboardEvent) => {
      if (typing()) return
      keys.current.add(e.code)
      if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault()
    }
    const ku = (e: KeyboardEvent) => keys.current.delete(e.code)
    const blur = () => keys.current.clear()
    const lockChange = () => hud.setLocked(locked())
    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    el.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', kd)
    window.addEventListener('keyup', ku)
    window.addEventListener('blur', blur)
    document.addEventListener('pointerlockchange', lockChange)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      el.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', kd)
      window.removeEventListener('keyup', ku)
      window.removeEventListener('blur', blur)
      document.removeEventListener('pointerlockchange', lockChange)
      if (locked()) document.exitPointerLock()
      hud.setLocked(false)
    }
  }, [camera, gl])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1)
    const k = keys.current
    const fwd = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0)
    const strafe = (k.has('KeyD') ? 1 : 0) - (k.has('KeyA') ? 1 : 0)
    const turn = (k.has('ArrowLeft') ? 1 : 0) - (k.has('ArrowRight') ? 1 : 0)
    player.yaw += turn * 1.6 * dt

    // desired velocity in world space, smoothed for a natural start / stop
    const speed = WALK_SPEED * (k.has('ShiftLeft') || k.has('ShiftRight') ? 1.8 : 1)
    const sin = Math.sin(player.yaw)
    const cos = Math.cos(player.yaw)
    let tx = -sin * fwd + cos * strafe
    let tz = -cos * fwd - sin * strafe
    const len = Math.hypot(tx, tz)
    if (len > 1) {
      tx /= len
      tz /= len
    }
    const a = 1 - Math.exp(-dt * 10)
    vel.current.x += (tx * speed - vel.current.x) * a
    vel.current.y += (tz * speed - vel.current.y) * a
    const [nx, nz] = moveWithCollision(player.x, player.z, vel.current.x * dt, vel.current.y * dt)
    const moved = Math.hypot(nx - player.x, nz - player.z)
    player.x = nx
    player.z = nz

    // subtle head bob while walking
    bob.current += moved * 7
    const bobY = moved > 0.0005 ? Math.sin(bob.current) * 0.015 : 0
    camera.position.set(player.x, EYE_HEIGHT + bobY, player.z)
    camera.rotation.set(player.pitch, player.yaw, 0, 'YXZ')
    hud.update(player.x, player.z, player.yaw, areaNameAt(player.x, player.z))
  })
  return null
}
