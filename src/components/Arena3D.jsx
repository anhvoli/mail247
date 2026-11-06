import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { ARENA_RINGS, ARENA_SEATS_PER_RING, arenaSeatId } from '../data';
import YouTubePlayer from '../youtube';
import AvatarWalk from './AvatarWalk';

// Đấu trường LoL Park — phòng MỚI, dựng theo ảnh nhà thi đấu LoL Park:
// khán đài 3 vòng dâng cao ôm quanh sân giữa, màn hình khổng lồ ở CHÍNH GIỮA
// (theo quyết định của người dùng: giữa là màn hình, không phải sân thi đấu),
// đèn trần đỏ bên T1 (trái) / xanh dương bên BLG (phải), vòng neon quanh sàn
// giữa, màn tường 2 bên: trái đỏ T1 / phải xanh BLG, đều ghi thông tin trận
// bán kết; thanh header trên cùng màn hình giữa có logo T1 — "T1 vs BLG" —
// logo BLG, video live chạy ngay dưới header.
// Video live trên mặt màn hình dùng đúng kỹ thuật của rạp phim (drei Html
// transform + 1 player duy nhất từ youtube.jsx — không tạo player thứ hai),
// và chịu cùng giới hạn: iframe DOM nằm trên canvas nên ở góc ghế / góc
// ngược thì ẩn iframe, chỉ còn thumbnail (RoomView không render LiveScreen
// ở 2 góc đó, giống rạp phim).
//
// HIỆU NĂNG (tối ưu track 4): phòng này từng giật vì 72 ghế × 2-4 mesh riêng
// + ~30 thẻ tên drei Html (mỗi thẻ 1 node DOM cập nhật mỗi frame) + 6 đèn
// point + 16 thanh đèn trần riêng lẻ. Nay:
//  - ghế: 2 instancedMesh (đế + tựa, 72 instance) thay cho ~144 mesh;
//  - người ngồi: 2 instancedMesh (thân capsule + đầu, tối đa 72) thay cho ~60 mesh;
//  - vòng xanh ghế trống: 1 instancedMesh thay cho ~42 mesh;
//  - bảng tên: THREE.Sprite với canvas texture vẽ 1 lần / tên, thay cho ~30 Html;
//  - đèn trần: 1 instancedMesh thay cho 16 mesh;
//  - đèn point: 6 → 3 (giữ đỏ/xanh 2 bên + ấm ở giữa), không có shadow;
//  - Canvas dpr={[1, 1.5]} để máy yếu / màn hình mật độ cao không render quá khổ.

// 4 góc camera — cùng tên preset với rạp phim để RoomView dùng chung nút bấm,
// chỉ khác vị trí cho hợp với đấu trường (khán đài vòng tròn quanh sân giữa).
export const ARENA_CAMERA_PRESETS = {
  overview: { label: 'Toàn cảnh đấu trường', pos: [0, 15, 25], look: [0, 3.5, 0] },
  // Góc ghế (round 4): trước đây camera ở y=2.6, z=12.8 — ngay giữa vòng B/C,
  // ngang tầm đầu người ngồi nên đầu chắn tầm nhìn và bảng tên phình to.
  // Nay đặt ngoài vòng C (r=15.5, đỉnh đầu ~4.65), cao hơn đầu, nhìn về tâm
  // màn hình — đường ngắm qua vòng C ở y≈5.1, qua vòng B ở y≈5.0, đều trên
  // đầu người ngồi (4.65 / 3.45).
  seat: { label: 'Góc nhìn từ ghế', pos: [0, 5.2, 16.8], look: [0, 4.2, 0] },
  screen: { label: 'Tập trung màn hình', pos: [0, 4.4, 9.5], look: [0, 4.4, 0] },
  reverse: { label: 'Từ màn chiếu về hàng ghế', pos: [0, 5.5, -12], look: [0, 2.5, 12] },
};

function Rig({ preset }) {
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    const p = ARENA_CAMERA_PRESETS[preset];
    camera.position.set(p.pos[0], p.pos[1], p.pos[2]);
    camera.lookAt(p.look[0], p.look[1], p.look[2]);
    camera.updateProjectionMatrix();
  }, [preset, camera]);
  return null;
}

// Thanh header trên cùng của màn hình giữa (như ảnh gốc): nền đen, logo T1 đỏ
// bên trái (3 sọc cánh + chữ T1), "T1 vs BLG" trắng ở giữa, logo BLG bên phải
// (chữ BLG trắng viền xanh). Vẽ bằng canvas — không dùng ảnh logo ngoài.
function makeHeaderTexture() {
  const w = 1200, h = 120;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.fillStyle = '#050505'; x.fillRect(0, 0, w, h);
  x.strokeStyle = '#2a2a2a'; x.lineWidth = 2; x.strokeRect(1, 1, w - 2, h - 2);
  // Cánh T1: 3 sọc đỏ xiên, thu nhỏ dần từ trái sang phải.
  x.fillStyle = '#e2012d';
  for (let i = 0; i < 3; i++) {
    const x0 = 60 + i * 34;
    const y0 = 28 + i * 6;
    const len = 150 - i * 34;
    x.beginPath();
    x.moveTo(x0, y0);
    x.lineTo(x0 + len, y0);
    x.lineTo(x0 + len - 26, y0 + 16);
    x.lineTo(x0 - 26, y0 + 16);
    x.closePath(); x.fill();
  }
  x.fillStyle = '#e2012d';
  x.font = 'italic 900 74px Arial, sans-serif';
  x.textAlign = 'left'; x.textBaseline = 'middle';
  x.fillText('T1', 260, h / 2 + 2);
  // Chữ giữa.
  x.fillStyle = '#ffffff';
  x.font = '900 68px Arial, sans-serif';
  x.textAlign = 'center';
  x.fillText('T1 vs BLG', w / 2, h / 2 + 2);
  // Logo BLG: chữ trắng viền xanh dương.
  x.font = 'italic 900 70px Arial, sans-serif';
  x.textAlign = 'right';
  x.lineWidth = 4; x.strokeStyle = '#00a8ff';
  x.strokeText('BLG', w - 60, h / 2 + 2);
  x.fillStyle = '#ffffff';
  x.fillText('BLG', w - 60, h / 2 + 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return tex;
}

// Chữ/bảng hiệu vẽ bằng canvas (không dùng ảnh ngoài): tiêu đề lớn + dòng phụ.
function makeTextTexture({ lines, bg = '#0d0d0d', fg = '#ffffff', accent = '#ffd75e', w = 1024, h = 256 }) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, w, h);
  x.strokeStyle = accent; x.lineWidth = 6; x.strokeRect(8, 8, w - 16, h - 16);
  x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
  lines.forEach((ln, i) => {
    x.font = `${ln.bold ? '900' : '700'} ${ln.size}px Arial, sans-serif`;
    x.fillStyle = ln.color || fg;
    x.fillText(ln.text, w / 2, ln.y);
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return tex;
}

// Mặt màn hình: thumbnail video đang chiếu làm lớp nền dưới iframe live.
function ScreenFace({ videoId, width, height, position, rotationY = 0 }) {
  const [texture, setTexture] = useState(null);
  useEffect(() => {
    let alive = true;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      (tex) => { if (alive) setTexture(tex); },
      undefined,
      () => { if (alive) setTexture(null); },
    );
    return () => { alive = false; };
  }, [videoId]);
  if (!texture) {
    return (
      <mesh position={position} rotation={[0, rotationY, 0]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color="#0b0b0b" emissive="#9db8ff" emissiveIntensity={0.55} />
      </mesh>
    );
  }
  return (
    <mesh position={position} rotation={[0, rotationY, 0]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

// Video LIVE trên mặt màn hình giữa (mặt trước, hướng +z về phía khán đài
// chính): drei Html transform — div 1200×675px + distanceFactor 4 = đúng
// 12×6.75 đơn vị (16:9), đặt ngay dưới thanh header (tâm y = 4.2).
function ArenaLiveScreen({ videoId, onEnded, onPlayerReady, controls, startSeconds }) {
  return (
    <Html transform distanceFactor={4} position={[0, 4.2, 0.28]} zIndexRange={[10, 0]}>
      <div style={{ width: '1200px', height: '675px' }}>
        <YouTubePlayer videoId={videoId} onEnded={onEnded} onPlayerReady={onPlayerReady}
          controls={controls} startSeconds={startSeconds} />
      </div>
    </Html>
  );
}

// ---------------------------------------------------------------------------
// Ghế khán đài — bố cục tính 1 lần mỗi khi ghế đổi (không tính lại mỗi frame).
// 3 vòng: bán kính 9.5 / 12.5 / 15.5, càng ngoài càng cao; ghế quay mặt về
// sân giữa (angle = atan2(x, z), giống bản cũ).
// ---------------------------------------------------------------------------
const RINGS = [
  { ring: 'A', r: 9.5, y: 0.5 },
  { ring: 'B', r: 12.5, y: 1.7 },
  { ring: 'C', r: 15.5, y: 2.9 },
];

function computeSeatLayout(seats, guest, hideMeSeat) {
  const all = [];       // 72 ghế: vị trí + góc + màu đế/tựa
  const occupants = []; // người đang ngồi (hiện hình): vị trí + màu áo + tên
  const empty = [];     // ghế trống: vị trí để vẽ vòng xanh
  for (const { ring, r, y } of RINGS) {
    for (let n = 1; n <= ARENA_SEATS_PER_RING; n++) {
      const a = ((n - 1) / ARENA_SEATS_PER_RING) * Math.PI * 2;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const id = arenaSeatId(ring, n);
      const occ = seats[id];
      // Khi khách đang đi lại, ẩn hình người ngồi của chính khách trên ghế.
      const me = occ?.kind === 'me';
      const shown = occ && !(me && hideMeSeat);
      const mine = me && !hideMeSeat;
      all.push({
        x, y, z, angle: Math.atan2(x, z),
        base: mine ? '#b8cd8e' : '#232a38',
        back: mine ? '#c6e48b' : '#2c3547',
      });
      if (shown) {
        occupants.push({
          x, y, z, angle: Math.atan2(x, z),
          color: me ? guest.color.hex : '#8bc6c0',
          name: occ.name,
        });
      }
      if (!occ) empty.push({ x, y, z });
    }
  }
  return { all, occupants, empty };
}

// 72 ghế = 2 instancedMesh (đế + tựa lưng), màu từng ghế qua setColorAt.
// Tựa lưng ở local [0, 0.95, 0.28] nên vị trí thế giới phải xoay offset z
// theo góc ghế: (sin(angle)*0.28, cos(angle)*0.28).
function InstancedSeats({ layout }) {
  const baseRef = useRef();
  const backRef = useRef();
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const s = new THREE.Vector3(1, 1, 1);
    const p = new THREE.Vector3();
    const c = new THREE.Color();
    layout.all.forEach((t, i) => {
      e.set(0, t.angle, 0); q.setFromEuler(e);
      p.set(t.x, t.y + 0.35, t.z); m.compose(p, q, s);
      baseRef.current.setMatrixAt(i, m);
      baseRef.current.setColorAt(i, c.set(t.base));
      p.set(t.x + Math.sin(t.angle) * 0.28, t.y + 0.95, t.z + Math.cos(t.angle) * 0.28);
      m.compose(p, q, s);
      backRef.current.setMatrixAt(i, m);
      backRef.current.setColorAt(i, c.set(t.back));
    });
    baseRef.current.instanceMatrix.needsUpdate = true;
    backRef.current.instanceMatrix.needsUpdate = true;
    if (baseRef.current.instanceColor) baseRef.current.instanceColor.needsUpdate = true;
    if (backRef.current.instanceColor) backRef.current.instanceColor.needsUpdate = true;
  }, [layout]);
  return (
    <>
      <instancedMesh ref={baseRef} args={[null, null, 72]} frustumCulled={false}>
        <boxGeometry args={[0.85, 0.7, 0.8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={backRef} args={[null, null, 72]} frustumCulled={false}>
        <boxGeometry args={[0.85, 0.7, 0.18]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </instancedMesh>
    </>
  );
}

// Người ngồi: 2 instancedMesh (thân capsule + đầu tròn). Capsule đối xứng
// quanh trục Y nên không cần xoay theo góc ghế. count = số người đang ngồi.
function InstancedOccupants({ occupants }) {
  const bodyRef = useRef();
  const headRef = useRef();
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3(1, 1, 1);
    const p = new THREE.Vector3();
    const c = new THREE.Color();
    occupants.forEach((o, i) => {
      p.set(o.x, o.y + 1.05, o.z); m.compose(p, q, s);
      bodyRef.current.setMatrixAt(i, m);
      bodyRef.current.setColorAt(i, c.set(o.color));
      p.set(o.x, o.y + 1.55, o.z); m.compose(p, q, s);
      headRef.current.setMatrixAt(i, m);
    });
    bodyRef.current.count = occupants.length;
    headRef.current.count = occupants.length;
    bodyRef.current.instanceMatrix.needsUpdate = true;
    headRef.current.instanceMatrix.needsUpdate = true;
    if (bodyRef.current.instanceColor) bodyRef.current.instanceColor.needsUpdate = true;
  }, [occupants]);
  return (
    <>
      <instancedMesh ref={bodyRef} args={[null, null, 72]} frustumCulled={false}>
        <capsuleGeometry args={[0.22, 0.45, 4, 8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={headRef} args={[null, null, 72]} frustumCulled={false}>
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshStandardMaterial color="#e8c39a" roughness={0.8} />
      </instancedMesh>
    </>
  );
}

// Vòng xanh ở ghế trống: 1 instancedMesh (r 0.72–0.92, y +0.05, polygonOffset
// chống z-fighting — giữ nguyên kích thước round 4 đã phóng to).
function InstancedEmptyRings({ empty }) {
  const ref = useRef();
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
    const s = new THREE.Vector3(1, 1, 1);
    const p = new THREE.Vector3();
    empty.forEach((t, i) => {
      p.set(t.x, t.y + 0.05, t.z); m.compose(p, q, s);
      ref.current.setMatrixAt(i, m);
    });
    ref.current.count = empty.length;
    ref.current.instanceMatrix.needsUpdate = true;
  }, [empty]);
  return (
    <instancedMesh ref={ref} args={[null, null, 72]} frustumCulled={false}>
      <ringGeometry args={[0.72, 0.92, 32]} />
      <meshBasicMaterial color="#b8cd8e" toneMapped={false} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
    </instancedMesh>
  );
}

// Bảng tên: vẽ 1 lần / tên thành canvas texture (pill đen mờ, viền xanh nhạt,
// chữ #e8f5d0 — đúng style .nametag cũ), hiển thị bằng THREE.Sprite (luôn
// quay mặt về camera, không tốn node DOM, không cập nhật mỗi frame như Html).
// Sprite cao 0.45 đơn vị, rộng theo tỉ lệ chữ — tương đương kích thước thẻ
// Html cũ ở góc toàn cảnh.
function makeNameTexture(name) {
  const font = '700 44px Arial, sans-serif';
  const meas = document.createElement('canvas').getContext('2d');
  meas.font = font;
  const tw = Math.ceil(meas.measureText(name).width);
  const padX = 28;
  const h = 72;
  const w = tw + padX * 2;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  const r = h / 2;
  x.beginPath();
  x.moveTo(r, 0);
  x.lineTo(w - r, 0);
  x.arc(w - r, r, r, -Math.PI / 2, Math.PI / 2);
  x.lineTo(r, h);
  x.arc(r, r, r, Math.PI / 2, Math.PI * 1.5);
  x.closePath();
  x.fillStyle = 'rgba(0,0,0,0.7)'; x.fill();
  x.strokeStyle = 'rgba(184,205,142,0.4)'; x.lineWidth = 3; x.stroke();
  x.font = font; x.fillStyle = '#e8f5d0';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(name, w / 2, h / 2 + 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return { tex, aspect: w / h };
}

function NameSprites({ occupants, show }) {
  const sprites = useMemo(() => {
    if (!show) return [];
    return occupants.map((o) => ({ ...o, tag: makeNameTexture(o.name) }));
  }, [occupants, show]);
  // Dọn texture cũ khi danh sách tên đổi / unmount (tránh rò GPU).
  useEffect(() => () => {
    sprites.forEach((s) => s.tag.tex.dispose());
  }, [sprites]);
  if (!show) return null;
  return (
    <group>
      {sprites.map((s, i) => (
        <sprite key={`${s.name}-${i}`} position={[s.x, s.y + 2.05, s.z]} scale={[0.45 * s.tag.aspect, 0.45, 1]}>
          <spriteMaterial map={s.tag.tex} transparent depthWrite={false} />
        </sprite>
      ))}
    </group>
  );
}

// Đèn trần dạng thanh dài: đỏ phía T1 (x < 0), xanh dương phía BLG (x > 0),
// xếp thành vòng trên trần như ảnh LoL Park. 1 instancedMesh thay cho 16 mesh
// riêng — màu từng thanh qua instanceColor, chất basic sáng (toneMapped=false)
// giữ vẻ phát sáng như emissive cũ.
function CeilingBars() {
  const ref = useRef();
  const bars = useMemo(() => {
    const list = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const x = Math.cos(a) * 8.5;
      list.push({ x, z: Math.sin(a) * 8.5, a, red: x < 0 });
    }
    return list;
  }, []);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const s = new THREE.Vector3(1, 1, 1);
    const p = new THREE.Vector3();
    const c = new THREE.Color();
    bars.forEach((b, i) => {
      e.set(0, -b.a, 0.5); q.setFromEuler(e);
      p.set(b.x, 10.2, b.z); m.compose(p, q, s);
      ref.current.setMatrixAt(i, m);
      ref.current.setColorAt(i, c.set(b.red ? '#ff2020' : '#00a8ff'));
    });
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  }, [bars]);
  return (
    <instancedMesh ref={ref} args={[null, null, 16]} frustumCulled={false}>
      <boxGeometry args={[2.4, 0.14, 0.35]} />
      <meshBasicMaterial color="#ffffff" toneMapped={false} />
    </instancedMesh>
  );
}

function Arena({ room, seats, mySeat, guest, videoId, showLive, onEnded, onPlayerReady, controls, startSeconds, hideMeSeat, showNames }) {
  // Thanh header trên cùng màn hình giữa + 2 màn tường trái/phải (như ảnh gốc).
  // useMemo: canvas texture chỉ vẽ 1 lần, không vẽ lại mỗi lần bot đổi ghế.
  // Màn tường trái (T1, đỏ) và phải (BLG, xanh) đều ghi thông tin trận bán kết.
  const headerTex = useMemo(() => makeHeaderTexture(), []);
  const leftPanelTex = useMemo(() => makeTextTexture({
    lines: [
      { text: 'T1', size: 170, bold: true, y: 120, color: '#e2012d' },
      { text: 'BÁN KẾT  •  CKTG 2026', size: 58, y: 270, color: '#ffffff' },
      { text: '05:00  •  THỨ HAI 09.11.2026', size: 50, y: 350, color: '#ffd75e' },
      { text: 'BO5', size: 50, y: 430 },
    ],
    bg: '#140404', accent: '#ff2020', w: 1024, h: 512,
  }), []);
  const rightPanelTex = useMemo(() => makeTextTexture({
    lines: [
      { text: 'BLG', size: 150, bold: true, y: 120, color: '#7ec8ff' },
      { text: 'BÁN KẾT  •  CKTG 2026', size: 58, y: 270, color: '#ffffff' },
      { text: '05:00  •  THỨ HAI 09.11.2026', size: 50, y: 350, color: '#ffd75e' },
      { text: 'BO5', size: 50, y: 430 },
    ],
    bg: '#040a14', accent: '#00a8ff', w: 1024, h: 512,
  }), []);

  // Bố cục ghế tính 1 lần mỗi khi seats / guest / hideMeSeat đổi.
  const layout = useMemo(
    () => computeSeatLayout(seats, guest, hideMeSeat),
    [seats, guest, hideMeSeat],
  );

  // 3 vòng khán đài: bán kính 9.5 / 12.5 / 15.5, càng ngoài càng cao.
  const ringMeshes = RINGS.map(({ ring, r, y }) => (
    <mesh key={`tier-${ring}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]}>
      <ringGeometry args={[r - 1.3, r + 1.3, 64]} />
      <meshStandardMaterial color="#14161c" roughness={0.9} />
    </mesh>
  ));

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[0, 7, 6]} intensity={50} color="#ffe9b0" />
      {/* Ánh sáng đỏ/xanh chia 2 nửa khán đài như ảnh gốc: đỏ bên T1 (trái),
          xanh dương bên BLG (phải). Chỉ còn 3 đèn point (bỏ 2 đèn thấp quét
          vòng ghế + 1 đèn trắng trên đỉnh); 2 đèn bên tăng 60 → 90 để ghế
          2 bên vẫn đỏ/xanh hẳn như cũ. Không có shadow. */}
      <pointLight position={[-8, 5, 0]} intensity={90} color="#ff2020" />
      <pointLight position={[8, 5, 0]} intensity={90} color="#00a8ff" />

      {/* Sàn đấu trường + tường vòm tối */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <circleGeometry args={[19, 64]} />
        <meshStandardMaterial color="#0d0f14" roughness={0.9} />
      </mesh>
      <mesh position={[0, 6, 0]}>
        <cylinderGeometry args={[19, 19, 12, 48, 1, true]} />
        <meshStandardMaterial color="#0a0c10" roughness={1} side={THREE.BackSide} />
      </mesh>
      {/* Trần tối */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 12, 0]}>
        <circleGeometry args={[19, 48]} />
        <meshStandardMaterial color="#07080b" roughness={1} />
      </mesh>

      {/* Bục sân giữa: đĩa tròn nâng dưới màn hình */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[7.4, 7.8, 0.5, 48]} />
        <meshStandardMaterial color="#1a1d24" roughness={0.7} />
      </mesh>
      {/* Vòng neon quanh sàn giữa: nửa đỏ (T1) + nửa xanh (BLG) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.52, 0]}>
        <ringGeometry args={[7.0, 7.35, 64, 1, 0, Math.PI]} />
        <meshBasicMaterial color="#ff2020" toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.52, 0]}>
        <ringGeometry args={[7.0, 7.35, 64, 1, Math.PI, Math.PI]} />
        <meshBasicMaterial color="#00a8ff" toneMapped={false} />
      </mesh>

      {/* Đèn trần: thanh đỏ bên T1 / xanh bên BLG */}
      <CeilingBars />

      {/* Màn hình khổng lồ giữa sân: khung + mặt trước (live) + mặt sau (thumbnail).
          Bố cục như ảnh gốc: thanh header (1.2 cao) trên cùng, video 16:9
          (12×6.75) ngay dưới header — video tâm y=4.2 (0.825–7.575),
          header tâm y=8.175 (7.575–8.775), khung 12.7×8.7 tâm y=4.8. */}
      <mesh position={[0, 4.8, 0]}>
        <boxGeometry args={[12.7, 8.7, 0.35]} />
        <meshStandardMaterial color="#141414" roughness={0.6} />
      </mesh>
      {/* Trụ treo màn hình lên trần */}
      <mesh position={[-4.5, 10.6, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 3.2, 8]} />
        <meshStandardMaterial color="#666666" metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[4.5, 10.6, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 3.2, 8]} />
        <meshStandardMaterial color="#666666" metalness={0.7} roughness={0.4} />
      </mesh>
      <ScreenFace videoId={videoId} width={12} height={6.75} position={[0, 4.2, 0.19]} />
      <ScreenFace videoId={videoId} width={12} height={6.75} position={[0, 4.2, -0.19]} rotationY={Math.PI} />
      {showLive && (
        <ArenaLiveScreen videoId={videoId} onEnded={onEnded} onPlayerReady={onPlayerReady}
          controls={controls} startSeconds={startSeconds} />
      )}

      {/* Thanh header trên cùng màn hình giữa (2 mặt): logo T1 đỏ trái,
          "T1 vs BLG" giữa, logo BLG phải — video live chạy ngay dưới nó. */}
      <mesh position={[0, 8.175, 0.19]}>
        <planeGeometry args={[12, 1.2]} />
        <meshBasicMaterial map={headerTex} toneMapped={false} />
      </mesh>
      <mesh position={[0, 8.175, -0.19]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[12, 1.2]} />
        <meshBasicMaterial map={headerTex} toneMapped={false} />
      </mesh>

      {/* Màn tường 2 bên (như ảnh gốc): trái đỏ T1, phải xanh BLG — đều ghi
          thông tin trận bán kết, thay cho 2 màn WELCOME / thông tin cũ. */}
      <mesh position={[-17.5, 5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[8, 4]} />
        <meshBasicMaterial map={leftPanelTex} toneMapped={false} />
      </mesh>
      <mesh position={[17.5, 5, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[8, 4]} />
        <meshBasicMaterial map={rightPanelTex} toneMapped={false} />
      </mesh>

      {ringMeshes}
      <InstancedSeats layout={layout} />
      <InstancedOccupants occupants={layout.occupants} />
      <InstancedEmptyRings empty={layout.empty} />
      <NameSprites occupants={layout.occupants} show={showNames} />
    </>
  );
}

export default function Arena3D({ room, seats, mySeat, guest, cameraPreset, videoId, showLive, onEnded, onPlayerReady, controls, startSeconds, onPickSeat }) {
  // Đang đi lại thì ẩn hình người ngồi của khách trên ghế (xem Arena).
  const [walking, setWalking] = useState(false);
  // Bảng tên chỉ hiện ở góc toàn cảnh + tập trung màn hình — ở góc ghế/góc
  // ngược camera sát người ngồi nên tên phình to và chồng lên nhau (round 4).
  const showNames = cameraPreset === 'overview' || cameraPreset === 'screen';
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: ARENA_CAMERA_PRESETS[cameraPreset].pos, fov: 55 }}>
      <color attach="background" args={['#05070a']} />
      <Rig preset={cameraPreset} />
      <AvatarWalk room={room} seats={seats} guest={guest} mySeat={mySeat}
        cameraPreset={cameraPreset} onPickSeat={onPickSeat} onWalkChange={setWalking} />
      <Arena room={room} seats={seats} mySeat={mySeat} guest={guest} videoId={videoId}
        showLive={showLive} onEnded={onEnded} onPlayerReady={onPlayerReady}
        controls={controls} startSeconds={startSeconds} hideMeSeat={walking} showNames={showNames} />
    </Canvas>
  );
}
