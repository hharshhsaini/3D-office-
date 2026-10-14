# Spacewire Tech Virtual Office: Project Context (handoff)

Give this file to Claude at the start of a new session, for example in a Blender + Blender MCP project. Keep **`office-layout.json`** (same folder) next to it: it holds every wall, door, window, desk, chair and light position in metres.

---

## 1. Goal

A **realistic, smooth (60 fps), game-like 3D replica** of the Spacewire Tech office:

- A **founder avatar** walks through the office, third-person and game style, with idle/walk/run animations.
- Optional first-person mode and a high-angle overview.
- Accuracy over decoration: **do not redesign the office**. Reproduce it from the floor plan, the photos and the walkthrough video.

New pipeline: **build and light the office in Blender**, bake the lighting, export a light **GLB**, and play it in the web app (React + Three.js + React Three Fiber). The current web prototype lags because it uses about 15 real-time lights, real-time shadows and ambient occlusion on top of thousands of separate meshes. Baked lighting fixes both the look and the speed.

## 2. Existing web prototype (reference implementation)

Repo: `github.com/hharshhsaini/3D-office-`, branch `claude/spacewire-reception-3d-052lo4`.

- `src/config/office.ts`: the layout, the single source of truth. `office-layout.json` is exported from it.
- `src/scene/*`: procedural 3D of every area (useful as a visual and geometry reference).
- `src/nav/*`: first-person controller, collision map, overview, camera flights.
- `src/ui/FloorPlan2D.tsx` and `docs/floor-plan.svg`: the 2D floor plan.
- `public/assets/spacewire-s-mark.svg`: the Spacewire "S" logo, traced from a reference. **Use the official vector if the client provides one.**
- `public/fonts/inter-medium-spacewire.typeface.json`: "Spacewire Tech" lettering (Inter Medium, OFL).
- Run it: `npm install && npm run dev` → http://localhost:5173

## 3. Coordinates (same everywhere)

- Units: **metres**.
- Plan: **x = east** (right on the plan), **z = south** (down on the plan), **y = up**. The origin is the **north-west inner corner**.
- **Blender (Z-up): `X = x`, `Y = −z`, `Z = y`.** The office spans X 0…10 and Y 0…−19.4. Exporting glTF from Blender (+Y up) gives back exactly the web app's coordinates, so nothing needs re-positioning.
- `facingDeg`: 0 = faces north, 90 = west, 180 = south, −90 = east.

## 4. Layout (confirmed by the client – do not change without asking)

```
          x=0          3.7  4.3        6.85          10.0
     z=0  ┌────────────┬────┬───────────────────────────┐
          │ HR&Finance │ c  │  Video Editors (2 benches) │   ← north wall: 2 windows
      3.5 ├────────────┤ o  │                            │
          │ Founders   │ r  │   [ central planter        │
      7.0 ├────────────┤ r  │     workstation ]          │
          │ Tech       │ i  │                            │
     10.5 ├────────────┤ d  │  AI Video Makers/Marketing │
          │ Actors     │ o  ├──────────┬─────────────────┤
          │            │ r  │ Eating   │ Washroom        │
     14.0 ├▓▓red wall▓▓┘    ├──────────┼─────────────────┤
          │           office│ small    │                 │
          │ reception  entr.│ cabin    │  STAIRS         │
          │  [desk]          ─────────┤  (NOT modelled) │
          │                       ◄── main entrance     │
     19.4 └─────────────────────────────┘
```

Overall: about **10.0 m × 19.4 m** inside. Ceiling height **2.85 m**. These are estimates; the client's measurements replace them.

### Confirmed decisions (from client feedback)

1. **Main entrance**: a black-framed double glass door in the reception's **east** wall, near its south end (z 17.55–19.05). The visitor walks in **facing west**.
2. **Reception desk** is **straight ahead of the entrance** and faces it. The wall behind it (the west wall) is **closed**. It carries the logo feature panel ("S" mark + "Spacewire Tech") and a **window to the right of the logo** (north of it). **No corridor or doorway behind the desk.**
3. **Red Spacewire feature wall** is on the visitor's **right**, on the south face of the Actors cabin wall (z = 14.0, x ≈ 0.1–3.55). It has a natural wood box frame projecting about 0.45 m, a deep-red chevron/herringbone upholstered panel, a large white "S" logo, a built-in red cushioned bench and warm downlights in the frame top.
4. **Small interview cabin**: **very small** (about 1.65 × 1.75 m) in the reception's north-east corner, next to the entrance. It has black-framed glass on its west and south sides with the door on the south, and **only one chair and one small round table**.
5. **Office entrance**: an **open passage with no door or gate** between the end of the red wall and the small cabin (x 3.7–5.2 at z = 14.0). It leads north.
6. **Four cabins** on the west side, north → south: **HR & Finance, Founders, Tech, Actors**. Each has a black-framed glass front onto the corridor (x = 3.7) with a door near its south end, and frosted botanical film on the lower glass. The dividers between cabins are the same glass. Each has a window with blinds on the west exterior wall.
7. **Cabin corridor**: a tiled strip along the cabin fronts, **open to the workspace**. There is no wall between them.
8. **Open workspace**: wooden floor. **Every bench seats 4: 2 chairs per side** (the client corrected this from 6).
   - Video Editors: 2 benches at the north end.
   - **Central planter workstation**: a large white-bordered rectangular planter full of greenery, with green tables on all four sides and chairs all round (4 west, 4 east, 2 north, 2 south). Never replace it with a pot.
   - AI Video Makers / Marketing Team: 2 benches south of the planter.
9. **Eating area** (x 5.2–6.85, z 10.5–14.0): a lunch counter with stools and a fridge along the washroom wall.
10. **Washroom** (x 6.85–10, z 10.5–14.0): the door is on its **west** wall, entered **from the eating area**. Build only the closed exterior and door, no interior.
11. **Stairs** (south-east, x 6.85–10, z 14–19.4): **excluded**. Leave the area empty.
12. The client prefers **compact** proportions over large, empty rooms.

### Bench design (from the client's photo)

Deep green top (about `#2f5443`), white tapered corner legs, and **one cream divider panel per facing seat pair** (about 0.68 m wide × 0.36 m tall) standing on small wooden feet. Seats are 0.78 m wide and each side is 0.6 m deep.

## 5. Look and materials

From the real photo (open workspace):

- **Ceiling**: painted **dark green**, with **exposed cable trays / perforated trays** and conduits. White 4-way **cassette AC** units. White **sphere pendants hanging at different heights**. A white **linear LED**.
- **Chairs**: **grey mesh office chairs with headrests**.
- **Floor**: warm wood.
- **Walls**: off-white. One side wall has a **green botanical mural**, with **wooden cubby shelves** beside it. *Which wall is still unconfirmed; check the video.*
- **Windows**: roller/vertical blinds that glow orange in sunlight.

From the reception concept (approved in the prototype):

- Large light-grey square floor tiles (reception, corridor).
- White marble-style desk front with natural wood end blocks and a warm LED glow at the plinth.
- The logo wall is warm off-white with three black cylinder pendants over the desk.
- Black aluminium frames on all glass.

**Still unconfirmed, so verify from the video and ask before guessing:**

- **Cabin interiors**. The plan image shows one green desk with 2 staff chairs and 1 visitor chair. An earlier concept showed Actors with a sofa and shooting lights and Founders with a meeting table.
- Exact ceiling layout (green sections, AC, cable tray and pendant positions).
- Real dimensions.

## 6. Blender MCP setup (client's Mac)

Uses **blender-mcp** (github.com/ahujasid/blender-mcp); check its README for the current steps.

1. Install Blender (4.x) and `uv` (`brew install uv`).
2. Download `addon.py` from the repo. In Blender: *Edit → Preferences → Add-ons → Install…* → choose `addon.py` → enable "Interface: Blender MCP".
3. In Blender's 3D view, press **N** → **BlenderMCP** tab → **Connect to Claude**.
4. Connect Claude:
   - Claude Desktop: in `claude_desktop_config.json` add `{"mcpServers": {"blender": {"command": "uvx", "args": ["blender-mcp"]}}}`, then restart.
   - Claude Code: `claude mcp add blender uvx blender-mcp`.
5. Only one MCP client should talk to Blender at a time.

## 7. How to build it in Blender (recommended)

1. **Script, don't hand-place.** Use the MCP "execute Blender code" tool to run a `bpy` script that reads **`office-layout.json`** and creates every wall (with openings), glass, floor, ceiling, desk and chair at the exact coordinates. It's repeatable, and corrections are just new numbers in the JSON.
2. **Collections** per area: `Shell`, `Reception`, `Cabins`, `Workspace`, `Planter`, `Eating`, `Washroom_Exterior`, `Ceiling`, `Lights`, `Colliders`.
3. **Naming**: `Wall_West`, `Glass_Founders_Front`, `Bench_VE1`, `Chair_###`, `Col_*` (invisible collision boxes, exported separately or as metadata).
4. **Repeated furniture** (chairs, monitors, benches): model once and use **linked duplicates**, then export with glTF **GPU instancing** (`EXT_mesh_gpu_instancing`).
5. **Textures**: CC0 PBR textures from **Poly Haven** (supported by blender-mcp) for wood floor, tiles, fabric and plaster. Keep them at 1K–2K.
6. **Lighting**: use real fixtures as emissive meshes plus area lights, and render in **Cycles**. Then **bake** to a lightmap: add a second UV map ("Lightmap", Smart UV Project, margin ≥ 0.01), bake *Combined* or *Diffuse* lighting into 1–2 atlases at 2048–4096 px, and assign them as the lightmap / emissive in the export.
7. **Export**: glTF binary (`.glb`), +Y up, apply modifiers, compression (**Draco or Meshopt**), textures as **WebP or KTX2**. Target **≤ 150 draw calls, ≤ 500k triangles, ≤ 25 MB**.

## 8. Web app: avatar and game feel

- **Load** the baked office with `useGLTF` (`@react-three/drei`). Use **no real-time lights** for the room (the baked light does it), plus a soft ambient and one light only for the avatar.
- **Founder avatar**:
  - Make a rigged human from the founder's photo, or model one in Blender.
  - Auto-rig it and add **idle / walk / run / turn** animations with **Mixamo**.
  - Export as GLB with its animations and play them with `useAnimations`.
- **Character controller**: **`@react-three/rapier`** physics plus **`ecctrl`**, or a custom third-person controller. The camera follows behind the avatar with smoothing and collides with walls.
- **Collisions**: use simple **box colliders** from `office-layout.json → derived.colliders` (89 boxes covering walls, glass, closed doors and furniture), not mesh colliders. Doors that open automatically are gaps in this list.
- **Keep from the prototype**: the minimap / 2D plan, area labels (`HOTSPOTS`), auto-opening cabin doors, and the overview ↔ walk camera flights.

## 9. Using the walkthrough video

1. Extract frames: `ffmpeg -i office.mp4 -vf fps=1 frames/f_%04d.jpg` (1 per second; use 2 in detailed spots).
2. Tag each frame with its area (reception, each cabin, corridor, workspace, planter, eating area, washroom door).
3. Read off materials, colours, furniture types and counts, ceiling details and window positions. Estimate sizes from known objects (door ≈ 2.1 m tall, desk ≈ 0.75 m, office chair seat ≈ 0.47 m).
4. **Report differences against section 4 before changing them.** The confirmed layout only changes with the client's OK.

## 10. Working with the client

- They write in Hinglish; keep replies short and clear.
- They want results, not long explanations. Show screenshots (Blender viewport renders) after each step.
- They are on macOS. Desktop folder: **"3D office"** (the prototype repo is cloned there).
