import * as THREE from 'three'
import { CHEVRON_REPEAT, COLORS, FLOOR_TILE_SIZE, WOOD_FLOOR_REPEAT } from '../config/appearance'
import {
  blindsTexture,
  botanicalFilmTexture,
  floorTileTextures,
  herringboneWoodTextures,
  marbleTexture,
  redChevronTextures,
  woodTexture,
} from './textures'

/**
 * Shared materials. Created lazily once and reused by every component so the
 * scene stays cheap to render.
 */
function make() {
  const floor = floorTileTextures()
  const chevron = redChevronTextures()

  const redMap = chevron.map.clone()
  const redBump = chevron.bumpMap.clone()
  for (const t of [redMap, redBump]) {
    t.repeat.set(1 / CHEVRON_REPEAT, 1 / CHEVRON_REPEAT)
    t.needsUpdate = true
  }

  const wood = woodTexture()
  const woodAcross = wood.clone()
  woodAcross.rotation = Math.PI / 2
  woodAcross.needsUpdate = true

  const herring = herringboneWoodTextures()

  const emissive = (color: string, intensity: number) =>
    new THREE.MeshStandardMaterial({
      color: '#ffffff',
      emissive: new THREE.Color(color),
      emissiveIntensity: intensity,
      toneMapped: false,
    })

  return {
    floorTiles: new THREE.MeshStandardMaterial({
      map: floor.map,
      roughnessMap: floor.roughnessMap,
      roughness: 0.9,
      metalness: 0,
      envMapIntensity: 0.7,
    }),
    /** metres covered by one repeat of the tile texture */
    floorTileRepeat: floor.tilesPerRepeat * FLOOR_TILE_SIZE,
    woodFloor: new THREE.MeshStandardMaterial({
      map: herring.map,
      roughnessMap: herring.roughnessMap,
      roughness: 0.85,
      envMapIntensity: 0.6,
    }),
    woodFloorRepeat: WOOD_FLOOR_REPEAT,
    wall: new THREE.MeshStandardMaterial({ color: COLORS.wall, roughness: 0.92 }),
    wallGrey: new THREE.MeshStandardMaterial({ color: COLORS.wallLightGrey, roughness: 0.9 }),
    logoPanel: new THREE.MeshStandardMaterial({ color: COLORS.logoPanel, roughness: 0.85 }),
    skirting: new THREE.MeshStandardMaterial({ color: COLORS.skirting, roughness: 0.6 }),
    ceiling: new THREE.MeshStandardMaterial({ color: COLORS.ceiling, roughness: 0.95 }),

    // Black aluminium-style frames
    frame: new THREE.MeshStandardMaterial({ color: COLORS.frame, metalness: 0.55, roughness: 0.38 }),
    handle: new THREE.MeshStandardMaterial({ color: '#c9c9c9', metalness: 1, roughness: 0.22 }),

    // Transparent glass
    glass: new THREE.MeshPhysicalMaterial({
      color: '#e9f2f0',
      metalness: 0,
      roughness: 0.04,
      transparent: true,
      opacity: 0.16,
      envMapIntensity: 1.4,
      specularIntensity: 1,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    frostedGlass: new THREE.MeshPhysicalMaterial({
      color: '#f2f4f4',
      metalness: 0,
      roughness: 0.55,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    botanicalFilm: new THREE.MeshStandardMaterial({
      map: botanicalFilmTexture(),
      transparent: true,
      roughness: 0.7,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    blinds: new THREE.MeshStandardMaterial({ map: blindsTexture(), roughness: 0.8, side: THREE.DoubleSide }),
    redBand: new THREE.MeshStandardMaterial({
      color: COLORS.red,
      roughness: 0.5,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
    }),

    // Reception desk
    marble: new THREE.MeshPhysicalMaterial({
      map: marbleTexture(),
      roughness: 0.18,
      clearcoat: 0.5,
      clearcoatRoughness: 0.15,
      envMapIntensity: 0.8,
    }),
    wood: new THREE.MeshStandardMaterial({ map: wood, roughness: 0.55, envMapIntensity: 0.6 }),
    woodAcross: new THREE.MeshStandardMaterial({ map: woodAcross, roughness: 0.55, envMapIntensity: 0.6 }),
    deskInner: new THREE.MeshStandardMaterial({ color: '#efece6', roughness: 0.6 }),

    // Red feature wall
    redPanel: new THREE.MeshStandardMaterial({
      map: redMap,
      bumpMap: redBump,
      bumpScale: 2.5,
      roughness: 0.82,
    }),
    redCushion: new THREE.MeshStandardMaterial({ color: COLORS.redCushion, roughness: 0.7 }),

    // Branding
    logoDark: new THREE.MeshStandardMaterial({ color: COLORS.logoDark, roughness: 0.45, metalness: 0.2 }),
    logoWhite: new THREE.MeshStandardMaterial({ color: COLORS.logoWhite, roughness: 0.35 }),

    // Furniture / props
    pot: new THREE.MeshStandardMaterial({ color: COLORS.potCharcoal, roughness: 0.55 }),
    soil: new THREE.MeshStandardMaterial({ color: '#3a2c22', roughness: 1 }),
    chairFabric: new THREE.MeshStandardMaterial({ color: COLORS.chairFabric, roughness: 0.85 }),
    tableTop: new THREE.MeshStandardMaterial({ color: COLORS.tableTop, map: wood, roughness: 0.5 }),
    plastic: new THREE.MeshStandardMaterial({ color: '#1b1b1d', roughness: 0.4, metalness: 0.1 }),

    // Open workspace furniture
    greenTable: new THREE.MeshStandardMaterial({ color: COLORS.greenTable, roughness: 0.55 }),
    whiteLaminate: new THREE.MeshStandardMaterial({ color: COLORS.whiteLaminate, roughness: 0.5 }),
    officeChair: new THREE.MeshStandardMaterial({ color: COLORS.officeChair, roughness: 0.85 }),
    officeChairFrame: new THREE.MeshStandardMaterial({ color: COLORS.officeChairFrame, roughness: 0.4, metalness: 0.6 }),
    monitor: new THREE.MeshStandardMaterial({ color: COLORS.monitor, roughness: 0.35, metalness: 0.2 }),
    screen: new THREE.MeshStandardMaterial({
      color: '#0b0d12',
      emissive: new THREE.Color('#1b2a44'),
      emissiveIntensity: 0.6,
      roughness: 0.2,
    }),
    planterRim: new THREE.MeshStandardMaterial({ color: COLORS.planterRim, roughness: 0.5 }),
    fabricDivider: new THREE.MeshStandardMaterial({ color: '#e7e4dc', roughness: 0.9 }),
    fridge: new THREE.MeshStandardMaterial({ color: COLORS.fridge, roughness: 0.3, metalness: 0.5 }),
    washroomDoor: new THREE.MeshStandardMaterial({ color: COLORS.washroomDoor, roughness: 0.45 }),

    // Ceiling
    ceilingGreen: new THREE.MeshStandardMaterial({ color: COLORS.ceilingGreen, roughness: 0.9 }),
    acUnit: new THREE.MeshStandardMaterial({ color: COLORS.acUnit, roughness: 0.6 }),
    acGrille: new THREE.MeshStandardMaterial({ color: '#c9cbcc', roughness: 0.8 }),
    sphereLamp: emissive('#fff1dc', 2.2),

    // Light emitters (visible fixtures)
    ledWhite: emissive(COLORS.neutralLight, 6),
    ledWarm: emissive(COLORS.warmLight, 4),
    downlightTrim: new THREE.MeshStandardMaterial({ color: '#e8e8e8', roughness: 0.4, metalness: 0.3 }),
  }
}

export type Materials = ReturnType<typeof make>
let instance: Materials | null = null

export function getMaterials(): Materials {
  if (!instance) instance = make()
  return instance
}
