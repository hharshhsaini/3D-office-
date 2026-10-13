/**
 * Tiny bridge between the 3D loop and the DOM HUD: the walk controller pushes
 * position / area every frame, the HUD elements register themselves here and
 * are updated directly (no React re-render per frame).
 */
const markers = new Set<SVGGElement>()
let areaEl: HTMLElement | null = null
let lockHintEl: HTMLElement | null = null
let lastArea = ''
let lastTransform = ''

export const hud = {
  /** Player marker on a 2D plan (minimap and full plan can both show one). Returns a cleanup for React refs. */
  addMarker(el: SVGGElement | null) {
    if (!el) return
    markers.add(el)
    if (lastTransform) el.setAttribute('transform', lastTransform)
    return () => {
      markers.delete(el)
    }
  },
  setAreaElement(el: HTMLElement | null) {
    areaEl = el
    if (el) el.textContent = lastArea
  },
  setLockHintElement(el: HTMLElement | null) {
    lockHintEl = el
  },
  update(x: number, z: number, yaw: number, area: string) {
    lastTransform = `translate(${x.toFixed(3)} ${z.toFixed(3)}) rotate(${((-yaw * 180) / Math.PI).toFixed(1)})`
    for (const m of markers) m.setAttribute('transform', lastTransform)
    if (area !== lastArea) {
      lastArea = area
      if (areaEl) areaEl.textContent = area
    }
  },
  setLocked(locked: boolean) {
    if (lockHintEl) lockHintEl.style.display = locked ? 'none' : ''
  },
}
