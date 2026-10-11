import { Bloom, EffectComposer, N8AO, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'

/** High-quality post-processing: ambient occlusion, LED bloom, filmic tone mapping. */
export function Effects() {
  return (
    <EffectComposer multisampling={4}>
      <N8AO aoRadius={0.55} distanceFalloff={0.9} intensity={2.2} quality="medium" halfRes />
      <Bloom mipmapBlur luminanceThreshold={1.1} luminanceSmoothing={0.2} intensity={0.45} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}
