import type { ViewMode } from '../scene/SceneSettings'

const VIEWS: { id: ViewMode; label: string }[] = [
  { id: 'entrance', label: 'Entrance view' },
  { id: 'overview', label: 'Overview' },
  { id: 'plan', label: 'Plan view' },
]

export function Overlay({
  mode,
  onSelectView,
  highQuality,
  onHighQuality,
  labels,
  onLabels,
}: {
  mode: ViewMode
  onSelectView: (m: ViewMode) => void
  highQuality: boolean
  onHighQuality: (v: boolean) => void
  labels: boolean
  onLabels: (v: boolean) => void
}) {
  return (
    <>
      <div className="panel">
        <div className="title">Spacewire Tech · Reception</div>
        <div className="subtitle">3D prototype – phase 1 (entrance &amp; reception only)</div>
        <div className="buttons">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              className={mode === v.id ? 'active' : undefined}
              onClick={() => onSelectView(v.id)}
              title={v.id === 'entrance' ? 'Reset to the fixed view from the main entrance' : undefined}
            >
              {v.label}
            </button>
          ))}
        </div>
        <div className="toggles">
          <label>
            <input type="checkbox" checked={highQuality} onChange={(e) => onHighQuality(e.target.checked)} />
            High quality
          </label>
          <label className={mode === 'entrance' ? 'disabled' : undefined}>
            <input type="checkbox" checked={labels} onChange={(e) => onLabels(e.target.checked)} />
            Plan labels
          </label>
        </div>
      </div>
      <div className="help">
        {mode === 'entrance' ? (
          <>
            <b>Drag</b> to look around · <b>Scroll</b> to zoom · <b>W A S D</b> / <b>↑ ↓</b> to walk, <b>← →</b> to turn ·{' '}
            <b>Shift</b> = faster
          </>
        ) : (
          <>
            <b>Drag</b> to rotate · <b>Scroll</b> to zoom · <b>Right-drag</b> to pan
          </>
        )}
      </div>
    </>
  )
}
