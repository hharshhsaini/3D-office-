import { useState } from 'react'
import * as THREE from 'three'
import { Environment, Lightformer } from '@react-three/drei'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'
import { CEILING_HEIGHT, OFFICE } from '../config/office'
import { COLORS } from '../config/appearance'
import { getMaterials } from './materials'
import { useSceneSettings } from './SceneSettings'

RectAreaLightUniformsLib.init()

/** Exposure-relative light levels – tune the overall look here. */
export const LIGHT_LEVELS = {
  linearLed: 11,
  downlight: 10,
  pendant: 15,
  featureWallSpot: 7,
  ambientHemisphere: 0.45,
  environment: 0.4,
  /** soft overhead fill over the open workspace */
  workspaceFill: 1.6,
  /** shadow-casting overhead light for the whole floor */
  keyLight: 0.55,
}

/** Spot light with its target kept in the scene graph. */
function Spot({
  position,
  target,
  color,
  intensity,
  angle,
  penumbra = 0.7,
  distance = 0,
  castShadow = false,
}: {
  position: [number, number, number]
  target: [number, number, number]
  color: string
  intensity: number
  angle: number
  penumbra?: number
  distance?: number
  castShadow?: boolean
}) {
  const [targetObject] = useState(() => new THREE.Object3D())
  return (
    <>
      <primitive object={targetObject} position={target} />
      <spotLight
        position={position}
        target={targetObject}
        color={color}
        intensity={intensity}
        angle={angle}
        penumbra={penumbra}
        distance={distance}
        decay={2}
        castShadow={castShadow}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-near={0.1}
        shadow-camera-far={8}
      />
    </>
  )
}

/** White linear LED strip recessed in the ceiling (+ an area light for realistic falloff). */
export function LinearLed({
  from,
  to,
  y = CEILING_HEIGHT,
  intensity = LIGHT_LEVELS.linearLed,
  width = 0.05,
  light = true,
}: {
  from: [number, number]
  to: [number, number]
  y?: number
  intensity?: number
  width?: number
  /** false = visible fixture only (keeps the light count down) */
  light?: boolean
}) {
  const m = getMaterials()
  const { showCeiling } = useSceneSettings()
  const dx = to[0] - from[0]
  const dz = to[1] - from[1]
  const length = Math.hypot(dx, dz)
  const angle = Math.atan2(-dz, dx)
  const cx = (from[0] + to[0]) / 2
  const cz = (from[1] + to[1]) / 2
  return (
    <group position={[cx, y, cz]} rotation={[0, angle, 0]}>
      {/* aluminium channel + diffuser */}
      <group visible={showCeiling}>
        <mesh position={[0, -0.004, 0]} material={m.frame}>
          <boxGeometry args={[length + 0.02, 0.008, width + 0.02]} />
        </mesh>
        <mesh position={[0, -0.009, 0]} material={m.ledWhite}>
          <boxGeometry args={[length, 0.004, width]} />
        </mesh>
      </group>
      {light && (
        <rectAreaLight
          position={[0, -0.02, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          width={length}
          height={0.12}
          color={COLORS.neutralLight}
          intensity={intensity}
        />
      )}
    </group>
  )
}

/** Warm recessed ceiling downlight. */
export function Downlight({
  x,
  z,
  y = CEILING_HEIGHT,
  intensity = LIGHT_LEVELS.downlight,
  angle = 0.75,
  aim,
  castShadow = false,
  radius = 0.05,
  inCeiling = true,
  light = true,
}: {
  x: number
  z: number
  y?: number
  intensity?: number
  angle?: number
  /** world point the spot is aimed at (defaults to straight down) */
  aim?: [number, number, number]
  castShadow?: boolean
  radius?: number
  /** fixtures recessed in furniture (e.g. the feature-wall frame) stay visible in plan view */
  inCeiling?: boolean
  /** false = visible fixture only (keeps the light count down) */
  light?: boolean
}) {
  const m = getMaterials()
  const { showCeiling } = useSceneSettings()
  return (
    <group>
      <group visible={showCeiling || !inCeiling}>
        <mesh position={[x, y - 0.003, z]} rotation={[Math.PI / 2, 0, 0]} material={m.downlightTrim}>
          <ringGeometry args={[radius, radius + 0.02, 32]} />
        </mesh>
        <mesh position={[x, y - 0.004, z]} rotation={[Math.PI / 2, 0, 0]} material={m.ledWarm}>
          <circleGeometry args={[radius, 32]} />
        </mesh>
      </group>
      {light && (
        <Spot
          position={[x, y - 0.03, z]}
          target={aim ?? [x, 0, z]}
          color={COLORS.warmLight}
          intensity={intensity}
          angle={angle}
          castShadow={castShadow}
        />
      )}
    </group>
  )
}

/** Black cylindrical pendant light hanging over the reception desk. */
export function Pendant({
  x,
  z,
  bottomY,
  castShadow = false,
  intensity = LIGHT_LEVELS.pendant,
}: {
  x: number
  z: number
  bottomY: number
  castShadow?: boolean
  intensity?: number
}) {
  const m = getMaterials()
  const shadeH = 0.24
  const cableTop = CEILING_HEIGHT
  const cableBottom = bottomY + shadeH
  return (
    <group>
      <mesh position={[x, (cableTop + cableBottom) / 2, z]} material={m.plastic}>
        <cylinderGeometry args={[0.003, 0.003, cableTop - cableBottom, 6]} />
      </mesh>
      <mesh position={[x, cableTop - 0.01, z]} material={m.frame}>
        <cylinderGeometry args={[0.045, 0.045, 0.02, 24]} />
      </mesh>
      <mesh position={[x, bottomY + shadeH / 2, z]} material={m.frame} castShadow>
        <cylinderGeometry args={[0.045, 0.045, shadeH, 32, 1, true]} />
      </mesh>
      <mesh position={[x, bottomY + shadeH - 0.005, z]} material={m.frame}>
        <cylinderGeometry args={[0.045, 0.045, 0.01, 32]} />
      </mesh>
      <mesh position={[x, bottomY + 0.012, z]} rotation={[Math.PI / 2, 0, 0]} material={m.ledWarm}>
        <circleGeometry args={[0.035, 32]} />
      </mesh>
      <Spot
        position={[x, bottomY, z]}
        target={[x, 0, z]}
        color={COLORS.warmLight}
        intensity={intensity}
        angle={0.62}
        penumbra={0.8}
        castShadow={castShadow}
      />
    </group>
  )
}

/** White spherical pendant (open workspace), emissive only. */
export function SpherePendant({ x, z, bottomY, radius = 0.13 }: { x: number; z: number; bottomY: number; radius?: number }) {
  const m = getMaterials()
  const { showCeiling } = useSceneSettings()
  const cy = bottomY + radius
  return (
    <group>
      {showCeiling && (
        <mesh position={[x, (CEILING_HEIGHT + cy + radius) / 2, z]} material={m.plastic}>
          <cylinderGeometry args={[0.003, 0.003, CEILING_HEIGHT - cy - radius, 6]} />
        </mesh>
      )}
      <mesh position={[x, cy, z]} material={m.sphereLamp}>
        <sphereGeometry args={[radius, 24, 16]} />
      </mesh>
    </group>
  )
}

/** 4-way ceiling cassette air conditioner (600 x 600 mm). */
export function AcCassette({ x, z }: { x: number; z: number }) {
  const m = getMaterials()
  const { showCeiling } = useSceneSettings()
  if (!showCeiling) return null
  const y = CEILING_HEIGHT
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, -0.012, 0]} material={m.acUnit}>
        <boxGeometry args={[0.68, 0.024, 0.68]} />
      </mesh>
      <mesh position={[0, -0.026, 0]} material={m.acGrille}>
        <boxGeometry args={[0.36, 0.006, 0.36]} />
      </mesh>
      {/* four air outlets */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[Math.sin((i * Math.PI) / 2) * 0.27, -0.026, Math.cos((i * Math.PI) / 2) * 0.27]} rotation={[0, (i * Math.PI) / 2, 0]} material={m.plastic}>
          <boxGeometry args={[0.5, 0.004, 0.05]} />
        </mesh>
      ))}
    </group>
  )
}

/** Soft rectangular fill light pointing down (stands in for many ceiling fixtures). */
export function CeilingFill({ x0, x1, z0, z1, intensity = LIGHT_LEVELS.workspaceFill }: { x0: number; x1: number; z0: number; z1: number; intensity?: number }) {
  return (
    <rectAreaLight
      position={[(x0 + x1) / 2, CEILING_HEIGHT - 0.05, (z0 + z1) / 2]}
      rotation={[-Math.PI / 2, 0, 0]}
      width={x1 - x0}
      height={z1 - z0}
      color={COLORS.neutralLight}
      intensity={intensity}
    />
  )
}

/** Overhead shadow-casting light covering the whole office floor. */
function KeyLight() {
  const [target] = useState(() => new THREE.Object3D())
  const cx = OFFICE.width / 2
  const cz = OFFICE.length / 2
  return (
    <>
      <primitive object={target} position={[cx, 0, cz]} />
      <directionalLight
        position={[cx - 2, 14, cz + 3]}
        target={target}
        intensity={LIGHT_LEVELS.keyLight}
        color="#fff4e6"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-camera-near={1}
        shadow-camera-far={30}
      />
    </>
  )
}

/** Ambient fill + image-based lighting built from local light formers (no downloads). */
export function GlobalLighting() {
  const { highQuality } = useSceneSettings()
  return (
    <>
      <KeyLight />
      {/* sky = light from the ceiling fixtures, ground = warm bounce from the floor (lights the ceiling) */}
      <hemisphereLight args={['#fffaf2', '#e6dccd', LIGHT_LEVELS.ambientHemisphere]} />
      <Environment resolution={highQuality ? 256 : 128} frames={1} environmentIntensity={LIGHT_LEVELS.environment}>
        <mesh scale={30}>
          <sphereGeometry args={[1, 32, 16]} />
          <meshBasicMaterial color="#8d867c" side={THREE.BackSide} />
        </mesh>
        {/* light bounced off the floor – keeps the ceiling from going grey */}
        <Lightformer form="rect" intensity={1.1} color="#efe4d4" position={[0, -4, 0]} rotation-x={-Math.PI / 2} scale={[20, 20, 1]} />
        {/* ceiling light strips */}
        <Lightformer form="rect" intensity={6} color="#fff7ec" position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[0.4, 10, 1]} />
        <Lightformer form="rect" intensity={4} color="#fff7ec" position={[3, 6, 0]} rotation-x={Math.PI / 2} scale={[0.4, 10, 1]} />
        <Lightformer form="rect" intensity={4} color="#fff7ec" position={[-3, 6, 0]} rotation-x={Math.PI / 2} scale={[0.4, 10, 1]} />
        {/* warm walls / window */}
        <Lightformer form="rect" intensity={1.2} color="#ffe2bd" position={[0, 2, -9]} scale={[14, 4, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#ffe9cf" position={[9, 2, 0]} rotation-y={-Math.PI / 2} scale={[14, 4, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#ffe9cf" position={[-9, 2, 0]} rotation-y={Math.PI / 2} scale={[14, 4, 1]} />
        <Lightformer form="rect" intensity={1.6} color="#e4eefc" position={[2, 2, 9]} rotation-y={Math.PI} scale={[3, 2, 1]} />
      </Environment>
    </>
  )
}

export { Spot }
