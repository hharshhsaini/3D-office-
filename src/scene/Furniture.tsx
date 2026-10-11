import { RoundedBox } from '@react-three/drei'
import { getMaterials } from './materials'

/**
 * Upholstered visitor chair with black metal frame and armrests
 * (interview cabin reference). Local origin at the floor, seat faces +Z.
 */
export function InterviewChair(props: { position: [number, number, number]; rotationY?: number }) {
  const m = getMaterials()
  const legs: [number, number][] = [
    [-0.22, 0.2],
    [0.22, 0.2],
    [-0.22, -0.2],
    [0.22, -0.2],
  ]
  return (
    <group position={props.position} rotation={[0, props.rotationY ?? 0, 0]}>
      {legs.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.21, z]} material={m.frame} castShadow>
          <cylinderGeometry args={[0.011, 0.011, 0.42, 10]} />
        </mesh>
      ))}
      <mesh position={[0, 0.425, 0]} material={m.frame} castShadow>
        <boxGeometry args={[0.47, 0.02, 0.43]} />
      </mesh>
      <RoundedBox args={[0.5, 0.07, 0.48]} radius={0.025} smoothness={3} position={[0, 0.47, 0.01]} material={m.chairFabric} castShadow receiveShadow />
      {/* backrest */}
      <group position={[0, 0.5, -0.22]} rotation={[-0.14, 0, 0]}>
        <RoundedBox args={[0.47, 0.42, 0.06]} radius={0.025} smoothness={3} position={[0, 0.27, 0]} material={m.chairFabric} castShadow receiveShadow />
        {[-0.2, 0.2].map((x) => (
          <mesh key={x} position={[x, 0.08, -0.035]} material={m.frame}>
            <boxGeometry args={[0.02, 0.2, 0.015]} />
          </mesh>
        ))}
      </group>
      {/* armrests */}
      {[-0.265, 0.265].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.66, -0.03]} material={m.frame} castShadow>
            <boxGeometry args={[0.035, 0.025, 0.42]} />
          </mesh>
          <mesh position={[x, 0.55, 0.16]} material={m.frame} castShadow>
            <boxGeometry args={[0.02, 0.22, 0.02]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** Small round table: light wood top, black pedestal, cross base. */
export function SmallRoundTable({ position, diameter, height }: { position: [number, number, number]; diameter: number; height: number }) {
  const m = getMaterials()
  const r = diameter / 2
  return (
    <group position={position}>
      <mesh position={[0, height - 0.015, 0]} material={m.tableTop} castShadow receiveShadow>
        <cylinderGeometry args={[r, r, 0.03, 48]} />
      </mesh>
      <mesh position={[0, (height - 0.03) / 2, 0]} material={m.frame} castShadow>
        <cylinderGeometry args={[0.03, 0.03, height - 0.03, 16]} />
      </mesh>
      {[0, Math.PI / 2].map((a) => (
        <mesh key={a} position={[0, 0.015, 0]} rotation={[0, a + Math.PI / 4, 0]} material={m.frame} castShadow receiveShadow>
          <boxGeometry args={[0.5, 0.03, 0.05]} />
        </mesh>
      ))}
    </group>
  )
}

/** Receptionist monitor; screen faces -Z (towards the receptionist). */
export function Monitor({ position }: { position: [number, number, number] }) {
  const m = getMaterials()
  return (
    <group position={position}>
      <mesh position={[0, 0.005, 0]} material={m.plastic} castShadow>
        <boxGeometry args={[0.22, 0.01, 0.16]} />
      </mesh>
      <mesh position={[0, 0.13, 0.03]} material={m.plastic} castShadow>
        <boxGeometry args={[0.05, 0.24, 0.02]} />
      </mesh>
      <mesh position={[0, 0.3, 0.0]} material={m.plastic} castShadow>
        <boxGeometry args={[0.56, 0.33, 0.025]} />
      </mesh>
    </group>
  )
}
