import { useEffect, useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import {
  DOORWAYS,
  EYE_HEIGHT,
  INITIAL_CAMERA,
  OBSTACLES,
  OVERVIEW_CAMERA,
  PLAN_CAMERA,
  WALK_SPEED,
  WALKABLE_AREAS,
  type Rect,
} from '../config/layout'
import type { ViewMode } from './SceneSettings'

const BODY_RADIUS = 0.28
const MIN_FOV = 28
const MAX_FOV = 80

/**
 * Optional start pose from the URL, e.g. ?cam=1.2,-0.5,90,0 (x, z, yaw°, pitch°).
 * yaw 0 = facing the reception desk, 90 = facing left, -90 = facing right.
 * Useful for sharing a viewpoint while reviewing the layout.
 */
function readCamParam() {
  const raw = new URLSearchParams(window.location.search).get('cam')
  if (!raw) return null
  const [x, z, yawDeg = 0, pitchDeg = 0] = raw.split(',').map(Number)
  if (![x, z, yawDeg, pitchDeg].every(Number.isFinite)) return null
  return { x, z, yaw: THREE.MathUtils.degToRad(yawDeg), pitch: THREE.MathUtils.degToRad(pitchDeg) }
}

const inside = (r: Rect, x: number, z: number, pad: number) =>
  x >= r.x0 + pad && x <= r.x1 - pad && z >= r.z0 + pad && z <= r.z1 - pad

function canStand(x: number, z: number) {
  const walkable =
    WALKABLE_AREAS.some((r) => inside(r, x, z, BODY_RADIUS)) || DOORWAYS.some((r) => inside(r, x, z, 0))
  const blocked = OBSTACLES.some((r) => inside(r, x, z, -BODY_RADIUS))
  return walkable && !blocked
}

/**
 * First-person "visitor" controls:
 *  - drag to look around (like Street View: drag the view)
 *  - mouse wheel to zoom (changes the field of view)
 *  - W A S D / arrow keys to walk, Shift to walk faster
 * Starts at the fixed entrance position facing the reception desk.
 */
function WalkControls() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const gl = useThree((s) => s.gl)
  const st = useRef({ yaw: 0, pitch: 0, keys: new Set<string>(), drag: false, lx: 0, ly: 0 })

  useLayoutEffect(() => {
    const [px, py, pz] = INITIAL_CAMERA.position
    const [tx, ty, tz] = INITIAL_CAMERA.lookAt
    camera.position.set(px, py, pz)
    const dx = tx - px
    const dy = ty - py
    const dz = tz - pz
    st.current.yaw = Math.atan2(-dx, -dz)
    st.current.pitch = Math.atan2(dy, Math.hypot(dx, dz))
    const fromUrl = readCamParam()
    if (fromUrl) {
      camera.position.set(fromUrl.x, EYE_HEIGHT, fromUrl.z)
      st.current.yaw = fromUrl.yaw
      st.current.pitch = fromUrl.pitch
    }
    camera.rotation.set(st.current.pitch, st.current.yaw, 0, 'YXZ')
    camera.fov = INITIAL_CAMERA.fov
    camera.near = 0.05
    camera.far = 80
    camera.updateProjectionMatrix()
  }, [camera])

  useEffect(() => {
    const el = gl.domElement
    const s = st.current
    const down = (e: PointerEvent) => {
      s.drag = true
      s.lx = e.clientX
      s.ly = e.clientY
      el.setPointerCapture(e.pointerId)
    }
    const move = (e: PointerEvent) => {
      if (!s.drag) return
      const k = (0.0025 * camera.fov) / 60
      s.yaw += (e.clientX - s.lx) * k
      s.pitch = THREE.MathUtils.clamp(s.pitch + (e.clientY - s.ly) * k, -1.35, 1.35)
      s.lx = e.clientX
      s.ly = e.clientY
    }
    const up = (e: PointerEvent) => {
      s.drag = false
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId)
    }
    const wheel = (e: WheelEvent) => {
      e.preventDefault()
      camera.fov = THREE.MathUtils.clamp(camera.fov + e.deltaY * 0.03, MIN_FOV, MAX_FOV)
      camera.updateProjectionMatrix()
    }
    const isTyping = () => document.activeElement instanceof HTMLInputElement
    const kd = (e: KeyboardEvent) => {
      if (!isTyping()) s.keys.add(e.code)
    }
    const ku = (e: KeyboardEvent) => s.keys.delete(e.code)
    const blur = () => s.keys.clear()
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    el.addEventListener('wheel', wheel, { passive: false })
    window.addEventListener('keydown', kd)
    window.addEventListener('keyup', ku)
    window.addEventListener('blur', blur)
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
      el.removeEventListener('wheel', wheel)
      window.removeEventListener('keydown', kd)
      window.removeEventListener('keyup', ku)
      window.removeEventListener('blur', blur)
    }
  }, [gl, camera])

  useFrame((_, dt) => {
    const s = st.current
    const k = s.keys
    const fwd = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0)
    const strafe = (k.has('KeyD') ? 1 : 0) - (k.has('KeyA') ? 1 : 0)
    const turn = (k.has('ArrowLeft') ? 1 : 0) - (k.has('ArrowRight') ? 1 : 0)
    const step = Math.min(dt, 0.1)
    s.yaw += turn * 1.4 * step
    if (fwd || strafe) {
      const speed = WALK_SPEED * (k.has('ShiftLeft') || k.has('ShiftRight') ? 2 : 1) * step
      const sin = Math.sin(s.yaw)
      const cos = Math.cos(s.yaw)
      let mx = (-sin * fwd + cos * strafe) * speed
      let mz = (-cos * fwd - sin * strafe) * speed
      const len = Math.hypot(mx, mz)
      if (len > speed) {
        mx *= speed / len
        mz *= speed / len
      }
      const p = camera.position
      // slide along walls: try the full move, then each axis separately
      if (canStand(p.x + mx, p.z + mz)) {
        p.x += mx
        p.z += mz
      } else if (canStand(p.x + mx, p.z)) {
        p.x += mx
      } else if (canStand(p.x, p.z + mz)) {
        p.z += mz
      }
      p.y = EYE_HEIGHT
    }
    camera.rotation.set(s.pitch, s.yaw, 0, 'YXZ')
  })
  return null
}

/** Orbit camera for the Overview and the top-down Plan view (ceiling hidden). */
function OrbitView({ mode }: { mode: 'overview' | 'plan' }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const preset = mode === 'plan' ? PLAN_CAMERA : OVERVIEW_CAMERA
  useLayoutEffect(() => {
    camera.position.set(...preset.position)
    camera.fov = preset.fov
    camera.near = 0.1
    camera.far = 120
    camera.up.set(0, 1, 0)
    camera.lookAt(...preset.target)
    camera.updateProjectionMatrix()
  }, [camera, preset])
  return (
    <OrbitControls
      makeDefault
      target={preset.target}
      enableDamping
      dampingFactor={0.1}
      minDistance={2}
      maxDistance={30}
      maxPolarAngle={mode === 'plan' ? Math.PI / 2.2 : Math.PI / 2.05}
    />
  )
}

export function CameraRig({ mode, resetToken }: { mode: ViewMode; resetToken: number }) {
  if (mode === 'entrance') return <WalkControls key={`walk-${resetToken}`} />
  return <OrbitView key={`${mode}-${resetToken}`} mode={mode} />
}
