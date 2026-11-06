# PERF AUDIT — LoL Park arena lag (choigivui clone)

- Measured: 2026-11-06 ~16:40–16:55 UTC (23:40–23:55 VN) by track 2 (measure-only).
- Build measured: existing `dist/` built 16:28 UTC (WASD-agent build; includes arena
  refinement + WASD + mobile). **NOT rebuilt** — other agents were editing `src/`
  concurrently. `vite preview` served that dist on http://localhost:4173/ (left running).
- Harness: `/tmp/perf-measure/measure2.mjs` (CDP + headless Chromium
  `chromium_headless_shell-1248` via Node global WebSocket). Raw numbers:
  `/tmp/perf-measure/results2.json` (v2) and `results.json` (v1, superseded —
  v1 had virtual rAF timestamps + a double-counted longtask observer).
- Method: desktop viewport 1280×800, guest seeded via localStorage, room entered by
  clicking the lobby card. FPS = rAF callbacks per wall-clock second
  (performance.now() deltas). Long tasks = PerformanceObserver `longtask` entries.

## Results (headless Chromium, SwiftShader software rendering)

| Scene (20 s unless noted) | FPS | median frame | p95 frame | frames >50 ms | long tasks | long-task total | longest task | DOM nodes | nametags |
|---|---|---|---|---|---|---|---|---|---|
| Lobby (10 s, no 3D) | **60.2** | 16.7 ms | 16.9 ms | 0/602 | 0 | 0 ms | — | 55 | 0 |
| **Arena (Đấu trường LoL Park)** | **8.8** | 58.8 ms | 275.6 ms | 90/176 | 100 | **18,774 ms / 20,000 ms** | 297 ms | 306 | 31 |
| Arena, small view 640×399 (15 s) | 10.3 | 3 ms* | 309.8 ms | 50/153 | 53 | 14,538 ms / 15,000 ms | 372 ms | 313 | 31 |
| Arena, nametags removed from DOM (15 s) | **18.8** | 0.1 ms* | 217.5 ms | 69/280 | 77 | 14,185 ms / 15,000 ms | 275 ms | 291 | 1 |
| Rạp phim (cinema, 100 seats) | 16.4 | 0 ms* | 370.8 ms | 67/320 | 63 | 19,348 ms / 19,500 ms | 603 ms | 380 | 33 |

\* Median frame ≈ 0 ms in headless is an artefact of BeginFrame scheduling (after a
long block, several rAF callbacks fire back-to-back). FPS (wall clock) and long-task
totals are the reliable metrics; ignore the median column.

A v1 run (different harness, same scene) gave arena 6.4 FPS — same ballpark, so the
~7–9 FPS arena figure is stable across runs, not a one-off spike.

## What this means

1. **The page itself is fine (lobby 60 FPS, zero long tasks). The lag is the 3D room.**
   In the arena the main thread is blocked ~94% of the 20 s window (18.8 s of long
   tasks). Practically every frame is a long task (>50 ms). The user-visible
   "giật giật" (jank) is real and measured, not a feeling.
2. **The cinema room is janky too (16.4 FPS)** — the whole 3D-room approach is heavy
   under SwiftShader. The arena is ~2× worse than cinema, but treat that gap as
   approximate: run-to-run variance is large (arena 6.4 vs 8.8 FPS across runs) and
   other agents were building/running jobs on the same machine during measurement.
   The solid, repeatable findings are the ones below, not the exact arena-vs-cinema
   ratio.
3. **Removing the 30 nametag DOM nodes doubled arena FPS (8.8 → 18.8).**
   This is the single biggest measured lever. Each occupied seat renders a
   drei `<Html>` nametag (31 Html nodes in the arena: 30 nametags + 1 live-video
   screen). Drei Html transform recomputes a 3D→screen projection and writes
   `el.style.transform` for every tag **every frame**, and the browser must
   composite 31 transformed DOM layers on top of the WebGL canvas. Caveat: the
   experiment removed the `.nametag` inner divs from the DOM directly, so it
   conflates "transform updates" with "live DOM compositing" — but either way the
   Html nametags are implicated, and the 2× jump is the largest effect measured.
4. **Halving the pixels barely helped (8.8 → 10.3 FPS, +16%).**
   Shrinking `.view3d` to 640×399 (~47% of pixels; the 3D view is only 925×299 CSS
   px to begin with) did almost nothing. The bottleneck is **CPU / main thread**
   (JS + draw-call submission + DOM compositing), **not** fragment shading. Cutting
   light count or pixel ratio alone will not fix this; the fix must cut per-frame
   CPU work.
5. **Long tasks remain huge even without nametags** (14.2 s / 15 s blocked). So
   nametags are ~half the problem; the other half is the frame render itself
   (draw-call submission + shading in SwiftShader).
6. **JS heap is flat (9.5 MB in every snapshot)** — memory is NOT the problem
   (and `performance.memory` in headless shell looks uninformative anyway; do not
   chase memory).
7. **Renderer info could not be read live**: `canvas.__r3f` is absent in the
   production build, so draw calls / triangles below are **source estimates, not
   measurements**. Draw calls were not the differentiator anyway (see §3).

## Static scene inventory (from source, at time of reading)

Arena (measured build): 72 seats × 2 box meshes = 144, +30 capsules +30 head
spheres for occupants, +42 empty-seat rings, 3 tier rings, floor/wall/ceiling,
stage disc, 2 neon half-rings, 16 emissive ceiling bars, screen frame + 2 screen
faces + header plane + 2 wall panels + 2 hanger rods, AvatarWalk avatar ≈
**~285 draw calls**, 31 drei Html nodes, **6 point lights** + ambient
(intensities 25–60). Live video = one 1200×675 drei Html iframe.
Cinema (for comparison): ~100 seats × 2 = 200 meshes, +32×2 occupant meshes,
68 empty rings, ~43 curtain pleats, 14 speaker parts, disco ball, 8 wall-light
parts, event decor (4 flags, 2 banners, 2 gold trims) ≈ **~420 draw calls**,
33 Html nodes, 6 point lights + ambient. Cinema has MORE draw calls yet ran
faster — so **draw-call count alone does not explain the arena gap**; the
differentiators are the Html layer cost and per-frame CPU work, not raw mesh
count. (Do not "fix" this by only merging meshes.)

⚠️ **Source drift warning:** while this audit ran, another agent edited
`src/components/Arena3D.jsx` — its point lights are now 3 (intensities 90) instead
of the 6 measured here, and the file grew. The numbers above describe the
16:28 `dist/` build, not current `src/`. Re-run the harness after the next
rebuild before claiming any fix worked.

Other environment caveats:
- SwiftShader is CPU rasterisation. Absolute FPS (8.8) is **not** what a real
  laptop/phone GPU gets; use these numbers **relatively** (lobby 60 vs arena ~9,
  nametag removal 2×). Re-measure on a real GPU before/after fixes.
- YouTube is network-blocked in this sandbox, so the live-video iframe never
  actually played during measurement. On a real machine the video decode +
  compositing of a 1200×675 iframe adds further cost — the real-world arena is
  likely *worse* than measured here, not better.

## Top causes (ranked by evidence)

1. **drei Html nametags (30) updated every frame** — 2× FPS when removed. Biggest lever.
2. **Per-frame render cost saturating the main thread** — ~100 long tasks / 20 s,
   longest ~300 ms; every frame is a long task. Driven by draw-call submission
   (~285 calls, no instancing/merging) + 6 point lights evaluated per fragment
   by `meshStandardMaterial` + the 1200×675 Html video layer compositing.
3. **1-second React re-render of the whole room** (`RoomView` playhead poll:
   `setInterval` 1 s → `setPlayhead` → re-renders `RoomView` → reconciles the
   whole `Arena3D`/`Cinema3D` element tree including all Html nodes). 1 Hz sounds
   small, but it re-runs reconciliation over ~300 R3F elements + 31 Html nodes
   every second, on top of an already-saturated main thread.
4. **Oversized live-video Html layer** (1200×675 px div, `distanceFactor={4}`)
   composited every frame; plus a second `ScreenFace` (back of screen) loading
   the same thumbnail.
5. **No frame budgeting**: `frameloop` is always-on, `dpr` uncapped, no instancing,
   no frustum savings (whole arena is always in view from the overview camera).

## Fix list for the next agent (prioritised)

### P0 — do first, re-measure with `/tmp/perf-measure/measure2.mjs`
1. **Nametags: stop updating 30 Html nodes every frame.** Options in order of
   payoff/effort: (a) render nametags only for the nearest ~8 occupants (or only
   the guest + speakers) and hide the rest; (b) replace drei Html nametags with
   canvas-sprite textures on billboards (no DOM, no per-frame style writes);
   (c) keep Html but `transform={false}` + throttle projection updates to ~10 Hz
   and hide tags when the camera preset is `seat`/`reverse` (they balloon and
   overlap there anyway — confirmed by the round-3 live check). Target: <10 Html
   nodes in the arena.
2. **Move the playhead poll out of `RoomView` state.** Keep `playhead` in a ref
   and update only the `NowPlayingPanel` DOM (or a tiny isolated component)
   instead of `setState` on the whole room every second.
3. **Cut lights: 6 point lights → 2–3.** Keep the red/blue split with 1 red + 1
   blue point light + ambient; bake the warm tint into emissive materials.
   (Note: current `src/` already shows 3 point lights — verify, don't duplicate.)

### P1
4. **Instance/merge the seats.** 144 seat boxes → 2 `instancedMesh` (seat base,
   seat back); 42 empty rings → 1 merged geometry. Target: ~285 → <100 draw calls.
5. **Cap pixel ratio and consider demand rendering:** `dpr={[1, 1.5]}` on `<Canvas>` ;
   try `frameloop="demand"` + `invalidate()` on state changes (video is DOM, the
   3D scene is mostly static — only re-render on camera change, seat change,
   walking). Careful: AvatarWalk needs continuous frames while walking.
6. **Cheaper materials for the big flat stuff:** floor/tiers/walls/seats to
   `meshLambertMaterial` or `meshBasicMaterial` where shading detail doesn't
   matter; reserve `meshStandardMaterial` for the screen frame/hero pieces.

### P2
7. **Video layer:** pause/hide the live Html iframe when the document is hidden
   or the camera preset is `seat`/`reverse` (already hidden there — keep it);
   do not mount a second `ScreenFace` for the back of the screen.
8. **Re-measure on a real GPU** (or at least the same harness after rebuild):
   `cd /tmp/perf-measure && node measure2.mjs` — the arena target is ≥30 FPS in
   this SwiftShader harness (lobby is 60), and nametag count ≤10. If SwiftShader
   FPS doesn't move, the fix didn't address the CPU bottleneck.

## Files
- Report: `~/workspace/choigivui-clone-source/PERF-AUDIT.md` (this file)
- Harness: `/tmp/perf-measure/measure2.mjs`, raw data `/tmp/perf-measure/results2.json`
- Preview server left running on http://localhost:4173/ (serves the 16:28 `dist/`)
