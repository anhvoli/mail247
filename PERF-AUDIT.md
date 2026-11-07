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

## Re-measurement 2026-11-07 ~01:00–01:25 (sau tối ưu đợt này)

Harness mới `/tmp/perf-measure/measure3.mjs` (tái dựng từ mô tả measure2:
CDP + chrome-headless-shell, 1280×800, seed guest, bấm thẻ sảnh, rAF FPS +
longtask; thêm phase giữ W 10s). Lưu ý: `/tmp/perf-measure/` gốc đã mất
nên measure2.mjs/results2.json không còn; số baseline dưới đây đo bằng
measure3 trên bản build trước tối ưu, KHÔNG so chéo trực tiếp với bảng
trên (audit cũ đo 8.8/16.4 FPS — chênh lệch có thể do tải VM lúc đo và
phiên bản Chrome/SwiftShader khác; so sánh trước/sau trong đợt này dùng
cùng harness nên hợp lệ).

### Kết quả (2 lần chạy mỗi bên, build gộp 3 agent, KHÔNG push/deploy)

| Scene (20s idle / 10s đi) | Baseline (trước) | Sau tối ưu | Ghi chú |
|---|---|---|---|
| Arena idle — FPS rAF | 7.0 / 7.3 | **60.0 / 59.4** | frameloop="demand": R3F gần như không vẽ frame khi đứng yên |
| Arena idle — long-task total / 20s | 19.8s / 19.8s (~99% chặn) | **0.0s / 0.27s** | main thread rảnh — đây mới là chỉ số thật, không phải FPS rAF |
| Arena đi lại (giữ W) — FPS | 5.3 / 5.0 | 5.7 / 5.4 | chi phí render/frame không đổi (~175ms/frame SwiftShader) |
| Arena đi lại — long-task / 10s | ~10.3s | 10.1s / 10.3s | demand không làm frame đi lại rẻ hơn |
| Rạp phim idle — FPS (đối chứng, không sửa) | 4.9 | 5.0 / 4.6 | không đổi như dự kiến |
| Rạp phim idle — long-task / 20s | ~19.8s | 20.0s / 20.0s | Cinema3D vẫn always-on + 33 Html nametag |

### Fix đã gộp (xem báo cáo coordinator — file chi tiết trong src/)
- `Arena3D.jsx`: `frameloop="demand"` + `invalidate()` (Rig, effect theo
  layout/showLive/videoId/showNames, ScreenFace khi thumbnail về); cache
  texture bảng tên theo tên (hết vẽ lại 30 texture mỗi lần bot đổi ghế);
  cache thumbnail màn hình theo videoId (2 mặt tải 1 lần); 3 vòng khán đài
  + tường + bục → Lambert, trần → Basic (sàn GIỮ Standard vì Lambert làm
  loang vệt đỏ/xanh sai trên CircleGeometry).
- `AvatarWalk.jsx`: `invalidate()` khi đi/kéo/nhảy + mồi 1 frame lúc bắt
  đầu đi; idle-stop (đứng yên thì thoát chế độ đi); Q/E/Space vào chế độ đi
  (fix regression E-ngồi do idle-stop gây ra); key lưới số thay cho chuỗi.
- `youtube.jsx`: dừng upgrade interval sau 3 chu kỳ lỗi (hết tích thẻ
  `<script>` khi YouTube bị chặn).
- `RoomView.jsx`: memo hoá element `<SeatMap>` (gõ chat không reconcile
  lại sơ đồ ghế nữa; kiểm chứng Arena render 1 lần lúc mount, 0 lần khi gõ).
- `useRoom.js`: chat tối đa 200 tin (`appendCapped`).
- ĐÃ ĐO, KHÔNG PHẢI bottleneck nên không sửa: bot đổi ghế → reconcile
  Canvas (8–17ms/lần, ~0.07% main thread); 3 interval 1s (playhead/panel/
  watchdog) không đáng kể so với frame ~140ms.

### Hành vi đổi có chủ ý (nhỏ)
- Chip "Đang đi lại" tắt khi đứng yên (trước dính lại; bắt buộc để demand
  dừng render). Q/E/Space có tác dụng ngay cả trước lần đi WASD đầu tiên.
  Chat mất tin rất cũ sau >200 tin.

### Còn mở
1. Frame đi lại vẫn đắt (~5.5 FPS SwiftShader) — cần giảm chi phí
   render/frame (ít đèn/fragment hơn, canvas nhỏ hơn) và đo trên GPU thật.
2. Rạp phim chưa tối ưu (sprite nametag + demand + vật liệu, như arena).
3. Karaoke/Sảnh chưa đo/tối ưu. Chưa có số đo GPU thật nào.
4. Shell headless không ổn định (chết bất ngờ 3/5 lần chạy đo ở 1 agent,
   1 lần context-lost) — số liệu cần chạy lại mới tin được.

## Files
- Report: `~/workspace/choigivui-clone-source/PERF-AUDIT.md` (this file)
- Harness: `/tmp/perf-measure/measure2.mjs`, raw data `/tmp/perf-measure/results2.json`
- Preview server left running on http://localhost:4173/ (serves the 16:28 `dist/`)
