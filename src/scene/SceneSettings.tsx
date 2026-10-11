import { createContext, useContext } from 'react'

export type ViewMode = 'entrance' | 'overview' | 'plan'

export interface SceneSettingsValue {
  /** Ceilings (and ceiling fixtures) are hidden in Overview / Plan view so the layout can be seen from above. */
  showCeiling: boolean
  /**
   * The landing outside the entrance door and the view outside the window are
   * only backdrops for the walk-through; they are hidden in Overview / Plan view
   * so they are not mistaken for extra rooms.
   */
  showSurroundings: boolean
  /** High quality = floor reflections, ambient occlusion and bloom. */
  highQuality: boolean
}

export const SceneSettings = createContext<SceneSettingsValue>({ showCeiling: true, showSurroundings: true, highQuality: true })
export const useSceneSettings = () => useContext(SceneSettings)
