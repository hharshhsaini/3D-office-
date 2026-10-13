import { Suspense, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Loader } from '@react-three/drei'
import { type Hotspot } from './config/office'
import { Office } from './scene/Office'
import { Effects } from './scene/Effects'
import { SceneSettings } from './scene/SceneSettings'
import { Navigation, type NavMode } from './nav/Navigation'
import { applyUrlPose, setPlayerPose } from './nav/player'
import { SPAWN } from './config/office'
import { HotspotLayer, HotspotProjector } from './ui/Hotspots'
import { Overlay } from './ui/Overlay'

function readInitialState() {
  const q = new URLSearchParams(window.location.search)
  applyUrlPose()
  const mode: NavMode = q.get('view') === 'overview' ? 'overview' : 'walk'
  return {
    mode,
    // fly in from above on first load, unless a specific view was requested
    intro: mode === 'walk' && !q.get('cam') && q.get('intro') !== '0',
    highQuality: q.get('quality') !== 'low',
    labels: q.get('labels') !== '0',
    plan: q.get('plan') === '1',
  }
}

export default function App() {
  const initial = useMemo(readInitialState, [])
  const [mode, setMode] = useState<NavMode>(initial.mode)
  const [token, setToken] = useState(0)
  const [highQuality, setHighQuality] = useState(initial.highQuality)
  const [labels, setLabels] = useState(initial.labels)
  const [planOpen, setPlanOpen] = useState(initial.plan)

  const go = (m: NavMode) => {
    setMode(m)
    setToken((t) => t + 1)
  }
  const walkTo = (h: Hotspot) => {
    if (!h.view) return
    setPlayerPose(h.view)
    setPlanOpen(false)
    go('walk')
  }

  const walk = mode === 'walk'
  return (
    <>
      <Canvas shadows="percentage" dpr={[1, 2]} gl={{ antialias: true, powerPreference: 'high-performance' }} camera={{ fov: 70, near: 0.05, far: 120 }}>
        <color attach="background" args={['#1c1b1a']} />
        <SceneSettings.Provider value={{ showCeiling: walk, showSurroundings: walk, highQuality }}>
          <Suspense fallback={null}>
            <Office />
          </Suspense>
        </SceneSettings.Provider>
        <Navigation mode={mode} token={token} intro={initial.intro} />
        <HotspotProjector enabled={labels && !walk} />
        {highQuality && <Effects />}
      </Canvas>
      <HotspotLayer onSelect={walkTo} />
      <Overlay
        mode={mode}
        onMode={go}
        onEntrance={() => walkTo({ label: 'Main entrance', at: [0, 0], view: SPAWN })}
        highQuality={highQuality}
        onHighQuality={setHighQuality}
        labels={labels}
        onLabels={setLabels}
        planOpen={planOpen}
        onPlan={setPlanOpen}
        onSelect={walkTo}
      />
      <Loader />
    </>
  )
}
