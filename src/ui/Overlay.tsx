import type { Hotspot } from '../config/office'
import type { NavMode } from '../nav/Navigation'
import { hud } from '../nav/hud'
import { FloorPlan2D } from './FloorPlan2D'

export function Overlay({
  mode,
  onMode,
  onEntrance,
  highQuality,
  onHighQuality,
  labels,
  onLabels,
  planOpen,
  onPlan,
  onSelect,
}: {
  mode: NavMode
  onMode: (m: NavMode) => void
  onEntrance: () => void
  highQuality: boolean
  onHighQuality: (v: boolean) => void
  labels: boolean
  onLabels: (v: boolean) => void
  planOpen: boolean
  onPlan: (v: boolean) => void
  onSelect: (h: Hotspot) => void
}) {
  const walk = mode === 'walk'
  return (
    <>
      <div className="panel">
        <div className="title">Spacewire Tech · Virtual Office</div>
        <div className="subtitle">Walk through the office in first person, or look at it from above</div>
        <div className="buttons">
          <button className={walk ? 'active' : undefined} onClick={() => onMode('walk')}>
            First person
          </button>
          <button className={!walk ? 'active' : undefined} onClick={() => onMode('overview')}>
            Overview
          </button>
          <button className={planOpen ? 'active' : undefined} onClick={() => onPlan(!planOpen)}>
            2D floor plan
          </button>
          <button onClick={onEntrance} title="Back to the main entrance">
            Main entrance
          </button>
        </div>
        <div className="toggles">
          <label>
            <input type="checkbox" checked={highQuality} onChange={(e) => onHighQuality(e.target.checked)} />
            High quality
          </label>
          <label className={walk ? 'disabled' : undefined}>
            <input type="checkbox" checked={labels} onChange={(e) => onLabels(e.target.checked)} />
            Area labels
          </label>
        </div>
      </div>

      {walk && (
        <>
          <div className="crosshair" />
          <div className="area-badge" ref={(el) => hud.setAreaElement(el)} />
          <div className="lock-hint" ref={(el) => hud.setLockHintElement(el)}>
            Click to look around with the mouse · <b>Esc</b> releases it
          </div>
          <button className="minimap" onClick={() => onPlan(true)} title="Open the 2D floor plan">
            <FloorPlan2D showPlayer labels={false} />
          </button>
        </>
      )}

      <div className="help">
        {walk ? (
          <>
            <b>W A S D</b> / <b>arrows</b> walk · <b>mouse</b> look · <b>Shift</b> faster · <b>scroll</b> zoom · doors open as you approach
          </>
        ) : (
          <>
            <b>Drag</b> rotate · <b>scroll</b> zoom · <b>right-drag</b> pan · <b>click a label</b> to walk there
          </>
        )}
      </div>

      {planOpen && (
        <div className="plan-modal" onClick={() => onPlan(false)}>
          <div className="plan-card" onClick={(e) => e.stopPropagation()}>
            <div className="plan-head">
              <span>2D floor plan · north at the top · click an area to walk there</span>
              <button onClick={() => onPlan(false)} aria-label="Close">
                ✕
              </button>
            </div>
            <FloorPlan2D className="plan-svg" showPlayer={walk} onSelect={onSelect} />
          </div>
        </div>
      )}
    </>
  )
}
