import { useMemo, type SVGProps } from 'react'
import {
  AREAS,
  BENCHES,
  CABINS,
  EXCLUDED_STAIRS,
  GLASS,
  GRID,
  HOTSPOTS,
  MAIN_ENTRANCE,
  OFFICE,
  PLANTER_WORKSTATION as P,
  WALLS,
  WASHROOM_DOOR,
  type Hotspot,
  type Rect,
  type XZ,
} from '../config/office'
import {
  EATING,
  OFFICE_CHAIRS,
  PLANTER_TABLES,
  POTTED_PLANTS,
  RECEPTION_DESK_RECT,
  RED_WALL_RECT,
  SMALL_CABIN,
  benchRect,
  cabinDesk,
} from '../scene/placements'
import { segmentRect, solidIntervals, wallZ } from '../nav/colliders'
import { hud } from '../nav/hud'

/**
 * Top-down 2D floor plan, drawn from the same config as the 3D office
 * (units: metres, north at the top, like the annotated image).
 */
const R = ({ rect: r, ...props }: { rect: Rect } & Omit<SVGProps<SVGRectElement>, 'r'>) => (
  <rect x={r.x0} y={r.z0} width={r.x1 - r.x0} height={r.z1 - r.z0} {...props} />
)

function Arrow({ from, to, color = '#111' }: { from: XZ; to: XZ; color?: string }) {
  const dx = to[0] - from[0]
  const dz = to[1] - from[1]
  const len = Math.hypot(dx, dz)
  const ux = dx / len
  const uz = dz / len
  const h = 0.28
  const tip = to
  const l: XZ = [tip[0] - ux * h - uz * h * 0.6, tip[1] - uz * h + ux * h * 0.6]
  const r: XZ = [tip[0] - ux * h + uz * h * 0.6, tip[1] - uz * h - ux * h * 0.6]
  return (
    <g stroke={color} fill={color} strokeWidth={0.07}>
      <line x1={from[0]} y1={from[1]} x2={tip[0] - ux * 0.1} y2={tip[1] - uz * 0.1} />
      <polygon points={`${tip[0]},${tip[1]} ${l[0]},${l[1]} ${r[0]},${r[1]}`} stroke="none" />
    </g>
  )
}

/** Door swing arc for a door spanning [a, b] along a segment, hinged at `hingeAtB ? b : a`. */
function Swing({ from, to, a, b, hingeAtB }: { from: XZ; to: XZ; a: number; b: number; hingeAtB: boolean }) {
  const len = Math.hypot(to[0] - from[0], to[1] - from[1])
  const ux = (to[0] - from[0]) / len
  const uz = (to[1] - from[1]) / len
  const w = b - a
  const hs = hingeAtB ? b : a
  const hinge: XZ = [from[0] + ux * hs, from[1] + uz * hs]
  const dir = hingeAtB ? -1 : 1
  const free: XZ = [hinge[0] + ux * w * dir, hinge[1] + uz * w * dir]
  // open leaf points along the right-hand normal
  const open: XZ = [hinge[0] - uz * w, hinge[1] + ux * w]
  const sweep = hingeAtB ? 0 : 1
  return (
    <g fill="none" stroke="#5b6b78" strokeWidth={0.025}>
      <line x1={hinge[0]} y1={hinge[1]} x2={open[0]} y2={open[1]} />
      <path d={`M ${free[0]} ${free[1]} A ${w} ${w} 0 0 ${sweep} ${open[0]} ${open[1]}`} strokeDasharray="0.08 0.06" />
    </g>
  )
}

export function FloorPlan2D({
  showPlayer = false,
  onSelect,
  labels = true,
  className,
}: {
  showPlayer?: boolean
  onSelect?: (h: Hotspot) => void
  labels?: boolean
  className?: string
}) {
  const walls = useMemo(
    () =>
      WALLS.flatMap((w) => {
        const len = Math.hypot(w.to[0] - w.from[0], w.to[1] - w.from[1])
        const [z0, z1] = wallZ(w)
        const gaps = (w.openings ?? []).map((o) => [o.from, o.to] as [number, number])
        const solid = solidIntervals(len, gaps).map(([a, b]) => segmentRect(w.from, w.to, a, b, z0, z1))
        const windows = (w.openings ?? [])
          .filter((o) => o.kind === 'window')
          .map((o) => segmentRect(w.from, w.to, o.from, o.to, z0, z1))
        return [{ solid, windows }]
      }),
    [],
  )
  const glass = useMemo(
    () =>
      GLASS.map((g) => {
        const len = Math.hypot(g.to[0] - g.from[0], g.to[1] - g.from[1])
        const gaps: [number, number][] = g.door ? [[g.door.from, g.door.to]] : []
        return solidIntervals(len, gaps).map(([a, b]) => segmentRect(g.from, g.to, a, b, -0.04, 0.04))
      }),
    [],
  )
  const pad = 0.9
  const vb = `${-pad} ${-pad} ${OFFICE.width + pad * 2} ${OFFICE.length + pad * 2}`
  const pl = P.planter

  return (
    <svg className={className} viewBox={vb} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Office floor plan">
      <defs>
        <pattern id="stairs-hatch" width="0.3" height="0.3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="0.3" stroke="#c9c9c9" strokeWidth="0.06" />
        </pattern>
      </defs>
      {/* areas */}
      {AREAS.map((a) => (
        <R
          key={a.id}
          rect={a.rect}
          fill={a.id === 'washroom' ? '#d5dce2' : a.floor === 'wood' ? '#dcb27f' : '#ebe8e2'}
          onClick={a.view && onSelect ? () => onSelect({ label: a.name, at: [0, 0], view: a.view }) : undefined}
          style={{ cursor: a.view && onSelect ? 'pointer' : undefined }}
        />
      ))}
      <R rect={EXCLUDED_STAIRS} fill="url(#stairs-hatch)" stroke="#bbb" strokeWidth={0.03} />
      <text x={(EXCLUDED_STAIRS.x0 + EXCLUDED_STAIRS.x1) / 2} y={(EXCLUDED_STAIRS.z0 + EXCLUDED_STAIRS.z1) / 2} className="plan-text muted">
        <tspan x={(EXCLUDED_STAIRS.x0 + EXCLUDED_STAIRS.x1) / 2} dy="-0.22">Stairs</tspan>
        <tspan x={(EXCLUDED_STAIRS.x0 + EXCLUDED_STAIRS.x1) / 2} dy="0.44">(not modelled)</tspan>
      </text>

      {/* furniture */}
      <g fill="#4e7864">
        {BENCHES.map((b) => (
          <R key={b.id} rect={benchRect(b)} />
        ))}
        {CABINS.map((c) => (
          <R key={c.id} rect={cabinDesk(c)} />
        ))}
        <R rect={PLANTER_TABLES} />
      </g>
      <R rect={pl} fill="#f4f2ec" />
      <R rect={{ x0: pl.x0 + pl.rimWidth, x1: pl.x1 - pl.rimWidth, z0: pl.z0 + pl.rimWidth, z1: pl.z1 - pl.rimWidth }} fill="#4f8a3d" />
      <R rect={RECEPTION_DESK_RECT} fill="#a5774a" />
      <R rect={RED_WALL_RECT} fill="#c0141f" />
      <R rect={{ ...EATING.counter, x0: EATING.counter.x0 - 0.22 }} fill="#b9895a" />
      <R rect={EATING.fridge} fill="#b8bcc0" />
      <g fill="#cfd3d6" stroke="#9aa0a5" strokeWidth={0.02}>
        {OFFICE_CHAIRS.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.z} r={0.2} />
        ))}
        {EATING.stools.map((s, i) => (
          <circle key={`s${i}`} cx={s.x} cy={s.z} r={0.16} />
        ))}
        <circle cx={SMALL_CABIN.chair.x} cy={SMALL_CABIN.chair.z} r={0.22} />
      </g>
      <circle cx={SMALL_CABIN.table.x} cy={SMALL_CABIN.table.z} r={SMALL_CABIN.table.diameter / 2} fill="#d8b98e" />
      <g fill="#4f8a3d">
        {POTTED_PLANTS.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.z} r={0.2} />
        ))}
      </g>

      {/* walls, windows, glass */}
      {walls.map((w, i) => (
        <g key={i}>
          {w.solid.map((r, k) => (
            <R key={k} rect={r} fill="#222" />
          ))}
          {w.windows.map((r, k) => (
            <R key={`w${k}`} rect={r} fill="#ffffff" stroke="#222" strokeWidth={0.03} />
          ))}
        </g>
      ))}
      <g fill="#2b9fd6">
        {glass.map((rs, i) => rs.map((r, k) => <R key={`${i}-${k}`} rect={r} />))}
      </g>
      {GLASS.filter((g) => g.door).map((g) => (
        <Swing key={g.id} from={g.from} to={g.to} a={g.door!.from} b={g.door!.to} hingeAtB={g.door!.hinge === 'to'} />
      ))}

      {/* entrances (as annotated) */}
      <Arrow from={[GRID.serviceWest + 1.1, (MAIN_ENTRANCE.z0 + MAIN_ENTRANCE.z1) / 2]} to={[GRID.serviceWest - 0.4, (MAIN_ENTRANCE.z0 + MAIN_ENTRANCE.z1) / 2]} />
      <Arrow from={[4.45, GRID.receptionNorth + 0.9]} to={[4.45, GRID.receptionNorth - 0.6]} />
      <Arrow from={[GRID.serviceWest - 0.9, (WASHROOM_DOOR.z0 + WASHROOM_DOOR.z1) / 2]} to={[GRID.serviceWest + 0.6, (WASHROOM_DOOR.z0 + WASHROOM_DOOR.z1) / 2]} />

      {labels &&
        HOTSPOTS.map((h) => (
          <text
            key={h.label}
            x={h.at[0]}
            y={h.at[1]}
            className={`plan-text${h.view && onSelect ? ' clickable' : ''}`}
            onClick={h.view && onSelect ? () => onSelect(h) : undefined}
          >
            {h.label}
          </text>
        ))}

      {showPlayer && (
        <g ref={(el) => hud.addMarker(el)}>
          <circle r={0.32} fill="rgba(192,20,31,0.25)" />
          <polygon points="0,-0.42 0.24,0.22 0,0.08 -0.24,0.22" fill="#c0141f" stroke="#fff" strokeWidth={0.05} />
        </g>
      )}
    </svg>
  )
}
