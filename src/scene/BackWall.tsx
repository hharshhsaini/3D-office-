import { Suspense } from 'react'
import { BACK_WINDOW as WIN, CEILING_HEIGHT, LOBBY_EDGES, LOGO_WALL as LOGO, PENDANTS, WALL_THICKNESS } from '../config/layout'
import { COLORS } from '../config/appearance'
import { getMaterials } from './materials'
import { BoxFromTo } from './primitives'
import { LogoMark, Wordmark } from './SpacewireLogo'
import { Pendant } from './Lights'
import { windowViewTexture } from './textures'
import { useSceneSettings } from './SceneSettings'

/**
 * Everything on the wall BEHIND the reception desk. This wall is closed:
 * a feature panel with the Spacewire Tech logo and a window – no doorway,
 * no corridor.
 * Modelled in the back-wall frame (local X = world X, +Z into the lobby).
 */
export function BackWallFeatures() {
  const m = getMaterials()
  const { showSurroundings } = useSceneSettings()
  const t = WALL_THICKNESS
  const wx0 = WIN.centerX - WIN.width / 2
  const wx1 = WIN.centerX + WIN.width / 2
  const wy0 = WIN.sillHeight
  const wy1 = WIN.sillHeight + WIN.height
  const f = 0.05 // window frame profile
  const viewW = WIN.viewDistance * 3
  const viewH = WIN.viewDistance * 1.6

  return (
    <group position={[0, 0, LOBBY_EDGES.back]}>
      {/* logo feature panel */}
      <BoxFromTo
        min={[LOGO.centerX - LOGO.width / 2, 0, 0]}
        max={[LOGO.centerX + LOGO.width / 2, CEILING_HEIGHT, LOGO.thickness]}
        material={m.logoPanel}
      />
      <Suspense fallback={null}>
        <group position={[LOGO.centerX, LOGO.markCenterY, LOGO.thickness]}>
          <LogoMark height={LOGO.markHeight} depth={LOGO.markDepth} material={m.logoDark} />
        </group>
        <group position={[LOGO.centerX, LOGO.wordmarkCenterY, LOGO.thickness]}>
          <Wordmark text={LOGO.wordmarkText} capHeight={LOGO.wordmarkCapHeight} depth={LOGO.wordmarkDepth} material={m.logoDark} />
        </group>
      </Suspense>

      {/* window: black frame, glass, interior sill */}
      <group>
        <BoxFromTo min={[wx0, wy0, -t]} max={[wx0 + f, wy1, 0]} material={m.frame} />
        <BoxFromTo min={[wx1 - f, wy0, -t]} max={[wx1, wy1, 0]} material={m.frame} />
        <BoxFromTo min={[wx0, wy0, -t]} max={[wx1, wy0 + f, 0]} material={m.frame} />
        <BoxFromTo min={[wx0, wy1 - f, -t]} max={[wx1, wy1, 0]} material={m.frame} />
        <BoxFromTo
          min={[wx0 + f, wy0 + f, -t / 2 - 0.006]}
          max={[wx1 - f, wy1 - f, -t / 2 + 0.006]}
          material={m.glass}
          castShadow={false}
          receiveShadow={false}
        />
        <BoxFromTo min={[wx0 - 0.04, wy0 - 0.03, -0.02]} max={[wx1 + 0.04, wy0, 0.05]} material={m.ceiling} />
        {/* daylight coming in through the window */}
        <rectAreaLight
          position={[WIN.centerX, (wy0 + wy1) / 2, -0.02]}
          rotation={[0, Math.PI, 0]}
          width={WIN.width - 2 * f}
          height={WIN.height - 2 * f}
          color={COLORS.coolDaylight}
          intensity={3}
        />
      </group>

      {/* outside view (a backdrop seen only through the window) */}
      {showSurroundings && (
        <mesh position={[WIN.centerX, (wy0 + wy1) / 2 + 0.4, -WIN.viewDistance]}>
          <planeGeometry args={[viewW, viewH]} />
          <meshBasicMaterial map={windowViewTexture()} toneMapped={false} color="#e8e8e8" />
        </mesh>
      )}

      {/* pendant lights over the desk */}
      {Array.from({ length: PENDANTS.count }, (_, i) => {
        const x = PENDANTS.centerX + (i - (PENDANTS.count - 1) / 2) * PENDANTS.spacing
        return (
          <Pendant
            key={i}
            x={x}
            z={PENDANTS.distanceFromBackWall}
            bottomY={PENDANTS.bottomY}
            castShadow={i === Math.floor(PENDANTS.count / 2)}
          />
        )
      })}
    </group>
  )
}
