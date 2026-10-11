import * as THREE from 'three'
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise.js'
import { COLORS } from '../config/appearance'

/**
 * Procedural textures, generated once on a canvas at start-up so the
 * prototype has no binary texture dependencies. Swap any of these for
 * photographed textures later if needed.
 */

const noise = new ImprovedNoise()

function canvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  return { c, ctx }
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function toTexture(c: HTMLCanvasElement, srgb: boolean) {
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.anisotropy = 8
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  t.needsUpdate = true
  return t
}

const cache = new Map<string, unknown>()
function cached<T>(key: string, make: () => T): T {
  if (!cache.has(key)) cache.set(key, make())
  return cache.get(key) as T
}

/**
 * Large square porcelain floor tiles. One texture = 4 × 4 tiles.
 * Returns colour + roughness maps (grout is rougher than the polished tile).
 */
export function floorTileTextures() {
  return cached('floor', () => {
    const N = 4
    const S = 1024
    const tile = S / N
    const grout = 3
    const color = canvas(S, S)
    const rough = canvas(S, S)
    const rand = mulberry32(7)
    const base = hexToRgb(COLORS.floorTile)

    color.ctx.fillStyle = COLORS.floorGrout
    color.ctx.fillRect(0, 0, S, S)
    rough.ctx.fillStyle = '#e6e6e6'
    rough.ctx.fillRect(0, 0, S, S)

    const img = color.ctx.getImageData(0, 0, S, S)
    const px = img.data
    for (let ty = 0; ty < N; ty++) {
      for (let tx = 0; tx < N; tx++) {
        const shade = 1 + (rand() - 0.5) * 0.045
        const ox = rand() * 100
        const oy = rand() * 100
        for (let y = ty * tile + grout / 2; y < (ty + 1) * tile - grout / 2; y++) {
          for (let x = tx * tile + grout / 2; x < (tx + 1) * tile - grout / 2; x++) {
            // soft cloudy porcelain variation + fine speckle
            const n =
              noise.noise((x / S) * 6 + ox, (y / S) * 6 + oy, 0.5) * 0.035 +
              noise.noise((x / S) * 40 + ox, (y / S) * 40 + oy, 1.5) * 0.015 +
              (rand() - 0.5) * 0.02
            const k = shade + n
            const i = (Math.floor(y) * S + Math.floor(x)) * 4
            px[i] = Math.min(255, base[0] * k)
            px[i + 1] = Math.min(255, base[1] * k)
            px[i + 2] = Math.min(255, base[2] * k)
            px[i + 3] = 255
          }
        }
        rough.ctx.fillStyle = '#4c4c4c'
        rough.ctx.fillRect(tx * tile + grout / 2, ty * tile + grout / 2, tile - grout, tile - grout)
      }
    }
    color.ctx.putImageData(img, 0, 0)
    return {
      map: toTexture(color.c, true),
      roughnessMap: toTexture(rough.c, false),
      /** number of tiles along one edge of the texture */
      tilesPerRepeat: N,
    }
  })
}

/** White marble with soft grey veining (desk front panel and top). */
export function marbleTexture() {
  return cached('marble', () => {
    const W = 1024
    const H = 512
    const { c, ctx } = canvas(W, H)
    const img = ctx.createImageData(W, H)
    const base = hexToRgb(COLORS.marbleBase)
    const vein = hexToRgb(COLORS.marbleVein)
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const u = x / W
        const v = y / H
        let turb = 0
        let amp = 1
        let f = 3
        for (let o = 0; o < 5; o++) {
          turb += Math.abs(noise.noise(u * f * 2, v * f, 3.7)) * amp
          amp *= 0.5
          f *= 2
        }
        const s = Math.sin((u * 3.2 + v * 1.4 + turb * 1.6) * Math.PI)
        const main = Math.pow(1 - Math.min(1, Math.abs(s) * 6), 3)
        const fine = Math.pow(1 - Math.min(1, Math.abs(Math.sin((u * 9 - v * 4 + turb * 3) * Math.PI)) * 14), 4)
        const cloud = noise.noise(u * 4, v * 4, 9.1) * 0.03
        const t = Math.min(1, main * 0.55 + fine * 0.22)
        const i = (y * W + x) * 4
        for (let k = 0; k < 3; k++) img.data[i + k] = (base[k] * (1 + cloud)) * (1 - t) + vein[k] * t
        img.data[i + 3] = 255
      }
    }
    ctx.putImageData(img, 0, 0)
    const tex = toTexture(c, true)
    return tex
  })
}

/** Natural oak-like wood grain, grain running along the texture's V axis. */
export function woodTexture() {
  return cached('wood', () => {
    const W = 512
    const H = 1024
    const { c, ctx } = canvas(W, H)
    const img = ctx.createImageData(W, H)
    const a = hexToRgb(COLORS.woodLight)
    const b = hexToRgb(COLORS.woodDark)
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const u = x / W
        const v = y / H
        const warp = noise.noise(u * 3, v * 0.6, 2.2) * 0.9 + noise.noise(u * 12, v * 1.5, 5.1) * 0.15
        const rings = Math.sin((u * 42 + warp * 6) * Math.PI)
        const g = Math.pow((rings + 1) / 2, 3)
        const fleck = noise.noise(u * 120, v * 8, 1.3) * 0.12
        const t = Math.min(1, Math.max(0, g * 0.55 + fleck + 0.15))
        const i = (y * W + x) * 4
        for (let k = 0; k < 3; k++) img.data[i + k] = a[k] * (1 - t) + b[k] * t
        img.data[i + 3] = 255
      }
    }
    ctx.putImageData(img, 0, 0)
    return toTexture(c, true)
  })
}

/**
 * Deep red upholstered panel with a chevron / herringbone groove pattern.
 * Returns colour + bump maps. One repeat = RED_FEATURE_WALL.chevronRepeat metres.
 */
export function redChevronTextures() {
  return cached('chevron', () => {
    const S = 1024
    const cols = 4
    const colW = S / cols
    const step = S / 8
    const color = canvas(S, S)
    const bump = canvas(S, S)
    const red = hexToRgb(COLORS.red)

    // fabric base with subtle mottling
    const img = color.ctx.createImageData(S, S)
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const n = noise.noise(x / 60, y / 60, 4.4) * 0.05 + noise.noise(x / 3, y / 3, 8.8) * 0.04
        const i = (y * S + x) * 4
        img.data[i] = red[0] * (1 + n)
        img.data[i + 1] = red[1] * (1 + n)
        img.data[i + 2] = red[2] * (1 + n)
        img.data[i + 3] = 255
      }
    }
    color.ctx.putImageData(img, 0, 0)
    bump.ctx.fillStyle = '#9a9a9a'
    bump.ctx.fillRect(0, 0, S, S)

    const drawGrooves = (ctx: CanvasRenderingContext2D, dark: string, light: string, width: number) => {
      for (let col = 0; col < cols; col++) {
        const x0 = col * colW
        const dir = col % 2 === 0 ? 1 : -1
        ctx.save()
        ctx.beginPath()
        ctx.rect(x0, 0, colW, S)
        ctx.clip()
        for (let k = -cols * 2; k < S / step + cols * 2; k++) {
          const yStart = k * step
          for (const [stroke, off] of [
            [dark, 0],
            [light, width * 0.9],
          ] as const) {
            ctx.strokeStyle = stroke
            ctx.lineWidth = width
            ctx.beginPath()
            ctx.moveTo(x0, yStart + off)
            ctx.lineTo(x0 + colW, yStart + off + dir * colW * 0.75)
            ctx.stroke()
          }
        }
        ctx.restore()
        // vertical seam between chevron columns
        ctx.strokeStyle = dark
        ctx.lineWidth = width * 0.8
        ctx.beginPath()
        ctx.moveTo(x0, 0)
        ctx.lineTo(x0, S)
        ctx.stroke()
      }
    }
    drawGrooves(color.ctx, COLORS.redGroove, '#c42630', 3)
    drawGrooves(bump.ctx, '#000000', '#c8c8c8', 5)
    return { map: toTexture(color.c, true), bumpMap: toTexture(bump.c, false) }
  })
}

/** Daytime view seen through the window: sky, distant buildings and trees. */
export function windowViewTexture() {
  return cached('view', () => {
    const W = 1024
    const H = 768
    const { c, ctx } = canvas(W, H)
    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.7)
    sky.addColorStop(0, '#a9c6e2')
    sky.addColorStop(1, '#e5edf1')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, W, H)
    const rand = mulberry32(21)
    ctx.filter = 'blur(2px)'
    // distant buildings
    for (let i = 0; i < 14; i++) {
      const bw = 50 + rand() * 110
      const bh = 120 + rand() * 260
      const bx = rand() * W
      const shade = 190 + rand() * 30
      ctx.fillStyle = `rgb(${shade - 10},${shade - 2},${shade + 8})`
      ctx.fillRect(bx, H * 0.62 - bh, bw, bh + 40)
      ctx.fillStyle = 'rgba(120,140,160,0.12)'
      for (let wy = H * 0.62 - bh + 14; wy < H * 0.62; wy += 26) {
        for (let wx = bx + 6; wx < bx + bw - 14; wx += 16) ctx.fillRect(wx, wy, 9, 12)
      }
    }
    // tree canopy band
    for (let i = 0; i < 70; i++) {
      const r = 30 + rand() * 60
      const x = rand() * W
      const y = H * 0.62 + rand() * H * 0.3
      const g = 70 + rand() * 50
      ctx.fillStyle = `rgb(${g * 0.55},${g},${g * 0.45})`
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#4a6a3c'
    ctx.fillRect(0, H * 0.85, W, H * 0.15)
    ctx.filter = 'none'
    return toTexture(c, true)
  })
}
