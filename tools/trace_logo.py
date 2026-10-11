"""Trace the Spacewire Tech "S" mark from the reception reference image into an SVG.

Usage:
    python3 tools/trace_logo.py <reception-reference.webp> public/assets/spacewire-s-mark.svg preview.png

Needs Pillow + NumPy. The crop box below matches the 1448x1086 reception concept
image supplied for phase 1. The dark S on the wall behind the reception desk in
that image is front-facing, so it is the cleanest source for the logo outline.
This is a stop-gap: replace the SVG with the official vector logo when available.
Steps:
  1. crop + upscale + blur
  2. average with its 180-degree rotation (the mark is point-symmetric) to cancel
     the spotlight highlight on top and the drop shadow at the bottom-right
  3. marching squares at a mid threshold -> closed contours
  4. Ramer-Douglas-Peucker simplification -> SVG path
"""
import sys
import numpy as np
from PIL import Image, ImageFilter

SRC, OUT_SVG, OUT_PREVIEW = sys.argv[1], sys.argv[2], sys.argv[3]
SCALE = 8
THRESH = 92.0

img = Image.open(SRC).convert("L").crop((318, 326, 424, 452))
img = img.resize((img.width * SCALE, img.height * SCALE), Image.LANCZOS)
img = img.filter(ImageFilter.GaussianBlur(SCALE * 0.9))
f = np.asarray(img).astype(np.float64)

# Bounding box of the dark mark -> symmetry centre
dark = f < THRESH
ys, xs = np.nonzero(dark)
cy = (ys.min() + ys.max()) / 2.0
cx = (xs.min() + xs.max()) / 2.0
h = int(min(cy, f.shape[0] - 1 - cy, cx, f.shape[1] - 1 - cx))
sub = f[int(round(cy)) - h:int(round(cy)) + h + 1, int(round(cx)) - h:int(round(cx)) + h + 1]
sym = (sub + sub[::-1, ::-1]) / 2.0
# pad with background so every contour closes
f = np.pad(sym, 4, constant_values=255.0)

inside = f < THRESH
H, W = f.shape
c = (inside[:-1, :-1].astype(int) * 8 + inside[:-1, 1:].astype(int) * 4
     + inside[1:, 1:].astype(int) * 2 + inside[1:, :-1].astype(int) * 1)
cells = np.argwhere((c != 0) & (c != 15))


def interp(p1, p2, v1, v2):
    t = (THRESH - v1) / (v2 - v1) if v2 != v1 else 0.5
    return (p1[0] + t * (p2[0] - p1[0]), p1[1] + t * (p2[1] - p1[1]))


# edges: T(top) R(right) B(bottom) L(left) of cell (y, x); keyed globally
def ekey(y, x, e):
    if e == "T":
        return ("h", y, x)
    if e == "B":
        return ("h", y + 1, x)
    if e == "L":
        return ("v", y, x)
    return ("v", y, x + 1)


def epoint(y, x, e):
    if e == "T":
        return interp((x, y), (x + 1, y), f[y, x], f[y, x + 1])
    if e == "B":
        return interp((x, y + 1), (x + 1, y + 1), f[y + 1, x], f[y + 1, x + 1])
    if e == "L":
        return interp((x, y), (x, y + 1), f[y, x], f[y + 1, x])
    return interp((x + 1, y), (x + 1, y + 1), f[y, x + 1], f[y + 1, x + 1])


TABLE = {
    1: [("L", "B")], 2: [("B", "R")], 3: [("L", "R")], 4: [("T", "R")],
    6: [("T", "B")], 7: [("L", "T")], 8: [("L", "T")], 9: [("T", "B")],
    11: [("T", "R")], 12: [("L", "R")], 13: [("B", "R")], 14: [("L", "B")],
}

adj = {}
pts = {}
for y, x in cells:
    case = c[y, x]
    if case in (5, 10):
        centre = (f[y, x] + f[y, x + 1] + f[y + 1, x] + f[y + 1, x + 1]) / 4.0 < THRESH
        if case == 5:
            segs = [("L", "T"), ("B", "R")] if centre else [("T", "R"), ("L", "B")]
        else:
            segs = [("T", "R"), ("L", "B")] if centre else [("L", "T"), ("B", "R")]
    else:
        segs = TABLE[case]
    for a, b in segs:
        ka, kb = ekey(y, x, a), ekey(y, x, b)
        pts[ka] = epoint(y, x, a)
        pts[kb] = epoint(y, x, b)
        adj.setdefault(ka, []).append(kb)
        adj.setdefault(kb, []).append(ka)

# link into loops
seen = set()
loops = []
for start in adj:
    if start in seen:
        continue
    loop = [start]
    seen.add(start)
    prev, cur = None, start
    while True:
        nxt = [n for n in adj[cur] if n != prev and n not in seen]
        if not nxt:
            break
        prev, cur = cur, nxt[0]
        seen.add(cur)
        loop.append(cur)
    if len(loop) > 20:
        loops.append(np.array([pts[k] for k in loop]))


def rdp(points, eps):
    if len(points) < 3:
        return points
    a, b = points[0], points[-1]
    ab = b - a
    n = np.hypot(*ab)
    if n == 0:
        d = np.hypot(*(points - a).T)
    else:
        d = np.abs(ab[0] * (points[:, 1] - a[1]) - ab[1] * (points[:, 0] - a[0])) / n
    i = int(np.argmax(d))
    if d[i] > eps:
        left = rdp(points[: i + 1], eps)
        right = rdp(points[i:], eps)
        return np.vstack([left[:-1], right])
    return np.vstack([a, b])


def smooth_keep_corners(lp, k=10, win=7, corner_deg=38.0, passes=3):
    n = len(lp)
    idx = np.arange(n)
    v1 = lp - lp[(idx - k) % n]
    v2 = lp[(idx + k) % n] - lp
    cosang = (v1 * v2).sum(1) / (np.hypot(*v1.T) * np.hypot(*v2.T) + 1e-9)
    ang = np.degrees(np.arccos(np.clip(cosang, -1, 1)))
    corner = ang > corner_deg
    # keep a neighbourhood around each corner fixed
    fixed = corner.copy()
    for s in range(1, k // 2):
        fixed |= np.roll(corner, s) | np.roll(corner, -s)
    out = lp.copy()
    for _ in range(passes):
        acc = np.zeros_like(out)
        for s in range(-win, win + 1):
            acc += np.roll(out, s, axis=0)
        avg = acc / (2 * win + 1)
        out = np.where(fixed[:, None], out, avg)
    return out


loops = [smooth_keep_corners(lp) for lp in loops]

simplified = []
for lp in loops:
    # split closed loop in two halves so RDP keeps it closed
    k = len(lp) // 2
    s = np.vstack([rdp(lp[: k + 1], 0.9), rdp(np.vstack([lp[k:], lp[:1]]), 0.9)[1:-1]])
    simplified.append(s)

allp = np.vstack(simplified)
minx, miny = allp.min(axis=0)
maxx, maxy = allp.max(axis=0)
height = maxy - miny
norm = [((s - [minx, miny]) / height * 100.0) for s in simplified]
vbw = (maxx - minx) / height * 100.0

paths = []
for s in norm:
    d = "M" + " L".join(f"{p[0]:.2f},{p[1]:.2f}" for p in s) + " Z"
    paths.append(d)

svg = (
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {vbw:.2f} 100">\n'
    "  <!-- Spacewire Tech 'S' mark, traced from the supplied reception reference image.\n"
    "       Replace this file with the official vector logo when available. -->\n"
    + "".join(f'  <path fill="#000" fill-rule="nonzero" d="{d}"/>\n' for d in paths)
    + "</svg>\n"
)
open(OUT_SVG, "w").write(svg)
print("loops", len(loops), "points", [len(s) for s in simplified], "aspect", vbw / 100)

# raster preview
prev = Image.new("L", (int(vbw * 4) + 20, 420), 230)
from PIL import ImageDraw

dr = ImageDraw.Draw(prev)
for s in norm:
    dr.polygon([(p[0] * 4 + 10, p[1] * 4 + 10) for p in s], fill=20)
prev.save(OUT_PREVIEW)
