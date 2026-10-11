import { useMemo } from 'react'
import * as THREE from 'three'
import { useLoader } from '@react-three/fiber'
import { Center, Text3D } from '@react-three/drei'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'

/**
 * Branding assets.
 *  - The "S" mark is loaded from /public/assets/spacewire-s-mark.svg. It was
 *    traced from the supplied reception reference; drop the official vector
 *    logo in its place (same file name) and the 3D logos update automatically.
 *  - The wordmark uses a subset of the Inter Medium typeface (OFL licence).
 */
export const LOGO_MARK_URL = `${import.meta.env.BASE_URL}assets/spacewire-s-mark.svg`
export const WORDMARK_FONT_URL = `${import.meta.env.BASE_URL}fonts/inter-medium-spacewire.typeface.json`

/** Inter's cap height as a fraction of the font size. */
const INTER_CAP_HEIGHT = 0.727

/**
 * Extruded Spacewire "S" mark, centred on X/Y, back face at z = 0 (sits on a
 * wall that faces +Z).
 */
export function LogoMark({ height, depth, material }: { height: number; depth: number; material: THREE.Material }) {
  const svg = useLoader(SVGLoader, LOGO_MARK_URL)
  const geometry = useMemo(() => {
    const shapes: THREE.Shape[] = []
    for (const path of svg.paths) {
      for (const shape of path.toShapes()) {
        // SVG is y-down; flip to y-up by rebuilding the outline (keeps face winding valid)
        const flip = (pts: THREE.Vector2[]) => pts.map((p) => new THREE.Vector2(p.x, -p.y))
        const s = new THREE.Shape(flip(shape.getPoints()))
        s.holes = shape.holes.map((h) => new THREE.Path(flip(h.getPoints())))
        shapes.push(s)
      }
    }
    const g = new THREE.ExtrudeGeometry(shapes, {
      depth: 1,
      bevelEnabled: true,
      bevelThickness: 0.6,
      bevelSize: 0.35,
      bevelSegments: 2,
      curveSegments: 4,
    })
    g.computeBoundingBox()
    const bb = g.boundingBox!
    const h = bb.max.y - bb.min.y
    const s = height / h
    g.translate(-(bb.min.x + bb.max.x) / 2, -(bb.min.y + bb.max.y) / 2, -bb.min.z)
    g.scale(s, s, depth / (bb.max.z - bb.min.z))
    g.computeVertexNormals()
    return g
  }, [svg, height, depth])
  return <mesh geometry={geometry} material={material} castShadow receiveShadow />
}

/** "Spacewire Tech" 3D lettering, centred on X/Y, back face at z = 0. */
export function Wordmark({
  text,
  capHeight,
  depth,
  material,
}: {
  text: string
  capHeight: number
  depth: number
  material: THREE.Material
}) {
  return (
    <Center disableZ>
      <Text3D
        font={WORDMARK_FONT_URL}
        size={capHeight / INTER_CAP_HEIGHT}
        height={depth}
        curveSegments={6}
        bevelEnabled={false}
        material={material}
        castShadow
        receiveShadow
      >
        {text}
      </Text3D>
    </Center>
  )
}
