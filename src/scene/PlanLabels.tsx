import { useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { PLAN_LABELS } from '../config/layout'

/**
 * Plan labels for the Overview / Plan views. They are plain DOM elements laid
 * over the canvas (not signage inside the office) and are positioned every
 * frame by projecting their 3D anchor points with the current camera.
 */
const elements: (HTMLDivElement | null)[] = []

/** DOM layer – render outside the <Canvas>. */
export function PlanLabelLayer() {
  return (
    <div className="plan-labels">
      {PLAN_LABELS.map((l, i) => (
        <div key={l.text} ref={(el) => void (elements[i] = el)} className="plan-label" style={{ display: 'none' }}>
          {l.text}
        </div>
      ))}
    </div>
  )
}

/** Projector – render inside the <Canvas>. */
export function PlanLabelProjector({ enabled }: { enabled: boolean }) {
  const v = useMemo(() => new THREE.Vector3(), [])
  useFrame(({ camera, size }) => {
    PLAN_LABELS.forEach((l, i) => {
      const el = elements[i]
      if (!el) return
      v.set(...l.position).project(camera)
      const visible = enabled && v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1
      el.style.display = visible ? 'block' : 'none'
      if (visible) {
        const x = (v.x * 0.5 + 0.5) * size.width
        const y = (-v.y * 0.5 + 0.5) * size.height
        el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`
      }
    })
  })
  return null
}
