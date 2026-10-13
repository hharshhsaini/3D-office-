import { useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { HOTSPOTS, type Hotspot } from '../config/office'

/**
 * Area labels for the overview. DOM buttons laid over the canvas and positioned
 * every frame by projecting their anchor points; clicking one walks you there.
 */
const elements: (HTMLButtonElement | null)[] = []

export function HotspotLayer({ onSelect }: { onSelect: (h: Hotspot) => void }) {
  return (
    <div className="hotspots">
      {HOTSPOTS.map((h, i) => (
        <button
          key={h.label}
          ref={(el) => void (elements[i] = el)}
          className={`hotspot${h.view ? '' : ' static'}`}
          style={{ display: 'none' }}
          onClick={h.view ? () => onSelect(h) : undefined}
          title={h.view ? `Walk to ${h.label}` : undefined}
        >
          {h.label}
        </button>
      ))}
    </div>
  )
}

/** Projector – render inside the <Canvas>. */
export function HotspotProjector({ enabled }: { enabled: boolean }) {
  const v = useMemo(() => new THREE.Vector3(), [])
  useFrame(({ camera, size }) => {
    HOTSPOTS.forEach((h, i) => {
      const el = elements[i]
      if (!el) return
      v.set(h.at[0], 1.6, h.at[1]).project(camera)
      const visible = enabled && v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05
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
