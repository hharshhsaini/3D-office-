import { Suspense, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Loader } from '@react-three/drei'
import { INITIAL_CAMERA } from './config/layout'
import { Reception } from './scene/Reception'
import { CameraRig } from './scene/CameraRig'
import { Effects } from './scene/Effects'
import { SceneSettings, type ViewMode } from './scene/SceneSettings'
import { PlanLabelLayer, PlanLabelProjector } from './scene/PlanLabels'
import { Overlay } from './ui/Overlay'

function readInitialState() {
  const q = new URLSearchParams(window.location.search)
  const view = q.get('view')
  return {
    mode: (view === 'overview' || view === 'plan' ? view : 'entrance') as ViewMode,
    highQuality: q.get('quality') !== 'low',
    labels: q.get('labels') !== '0',
  }
}

export default function App() {
  const initial = useMemo(readInitialState, [])
  const [mode, setMode] = useState<ViewMode>(initial.mode)
  const [highQuality, setHighQuality] = useState(initial.highQuality)
  const [labels, setLabels] = useState(initial.labels)
  const [resetToken, setResetToken] = useState(0)

  const selectView = (m: ViewMode) => {
    setMode(m)
    setResetToken((t) => t + 1)
  }

  return (
    <>
      <Canvas
        shadows="percentage"
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        camera={{ fov: INITIAL_CAMERA.fov, near: 0.05, far: 80, position: INITIAL_CAMERA.position }}
      >
        <color attach="background" args={['#1c1b1a']} />
        <SceneSettings.Provider value={{ showCeiling: mode === 'entrance', showSurroundings: mode === 'entrance', highQuality }}>
          <Suspense fallback={null}>
            <Reception />
          </Suspense>
        </SceneSettings.Provider>
        <CameraRig mode={mode} resetToken={resetToken} />
        <PlanLabelProjector enabled={labels && mode !== 'entrance'} />
        {highQuality && <Effects />}
      </Canvas>
      <PlanLabelLayer />
      <Overlay
        mode={mode}
        onSelectView={selectView}
        highQuality={highQuality}
        onHighQuality={setHighQuality}
        labels={labels}
        onLabels={setLabels}
      />
      <Loader />
    </>
  )
}
