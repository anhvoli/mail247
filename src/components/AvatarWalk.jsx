import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { seatId, ARENA_SEATS_PER_RING, arenaSeatId } from '../data';

// Điều khiển avatar đi lại trong rạp 3D (như bản gốc: W tiến, S lùi, A/D
// né ngang, Q/E xoay góc nhìn, kéo chuột xoay camera, Space nhảy, Shift chạy,
// E ngồi ghế khi đứng gần ghế trống). Chỉ là điều khiển local — không đổi
// state phòng, không đụng màn hình live, camera preset hay decor.
// Avatar chỉ hiện khi khách CHƯA chọn ghế (đã ngồi thì hình người ngồi trên
// ghế là đại diện của khách; bấm E / chọn ghế ở sơ đồ 2D thì avatar đi lại ẩn
// đi, và ngược lại khi đang đi lại thì hình người ngồi của khách được ẩn).

const WALK_SPEED = 3;
const RUN_SPEED = 6;
const JUMP_VELOCITY = 5.2;
const GRAVITY = 14;
const AVATAR_RADIUS = 0.35;
const CAMERA_DIST = 5.5;

// Giới hạn di chuyển + vật cản, tính từ bố cục sẵn có của từng loại phòng.
// Cinema / Rạp Trời: sàn 18x20, tường x = ±8.2; Rạp Trời thêm bục sân khấu
// (z từ -8.6 tới -5.4) nên không cho đi qua bục. Đấu trường: sàn tròn, avatar
// đi được cả 3 vòng khán đài (độ cao mặt sàn theo vòng: 0 / 0.5 / 1.7 / 2.9),
// không đi xuyên màn hình giữa (hộp |x| < 6.6, |z| < 0.95).
function buildNav(room) {
  if (room.kind === 'arena') {
    const colliders = [];
    const seatPos = [];
    const rings = [
      { ring: 'A', r: 9.5 },
      { ring: 'B', r: 12.5 },
      { ring: 'C', r: 15.5 },
    ];
    for (const { ring, r } of rings) {
      for (let n = 1; n <= ARENA_SEATS_PER_RING; n++) {
        const a = ((n - 1) / ARENA_SEATS_PER_RING) * Math.PI * 2;
        const x = Math.cos(a) * r;
        const z = Math.sin(a) * r;
        colliders.push({ x, z, r: 0.55 });
        seatPos.push({ id: arenaSeatId(ring, n), x, z });
      }
    }
    return {
      mode: 'arena', maxR: 16.6, screen: { x: 6.6, z: 0.95 },
      colliders, seatPos, spawn: [0, 0, 5.5],
      groundY: (r) => (r < 8.2 ? 0 : r < 10.8 ? 0.5 : r < 11.2 ? 0.5 : r < 13.8 ? 1.7 : r < 14.2 ? 1.7 : 2.9),
    };
  }
  const colliders = [];
  const seatPos = [];
  if (room.kind === 'cinema') {
    room.rows.forEach((row, ri) => {
      for (let c = 1; c <= room.cols; c++) {
        const x = (c - 5.5) * 1.05;
        const z = 2 + ri * 1.15;
        colliders.push({ x, z, r: 0.55 });
        seatPos.push({ id: seatId(row, c), x, z });
      }
    });
    return {
      mode: 'box', minX: -7.6, maxX: 7.6, minZ: -7.2, maxZ: 11.6,
      colliders, seatPos, spawn: [0, 0, 9], groundY: () => 0,
    };
  }
  // Rạp Trời: bàn tròn (chắn cả bàn) + ghế quanh bàn.
  for (let t = 0; t < room.tables; t++) {
    const a0 = (t / room.tables) * Math.PI * 2;
    const cx = Math.cos(a0) * 4.2;
    const cz = 3 + Math.sin(a0) * 3.2;
    colliders.push({ x: cx, z: cz, r: 1.6 });
    for (let s = 0; s < room.seatsPerTable; s++) {
      const a = (s / room.seatsPerTable) * Math.PI * 2;
      const x = cx + Math.cos(a) * 1.5;
      const z = cz + Math.sin(a) * 1.5;
      colliders.push({ x, z, r: 0.55 });
      seatPos.push({ id: `B${String(t + 1).padStart(2, '0')}-${s + 1}`, x, z });
    }
  }
  return {
    mode: 'box', minX: -7.6, maxX: 7.6, minZ: -5.2, maxZ: 11.6,
    colliders, seatPos, spawn: [0, 0, 9], groundY: () => 0,
  };
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

// Lưới không gian cho va chạm: chia collider thành ô 2x2, mỗi frame chỉ kiểm
// tra 3x3 ô quanh avatar (~2–6 collider) thay vì quét toàn bộ 72–100 cái.
// Ô 2 > khoảng đẩy tối đa (1.6 bàn + 0.35 avatar = 1.95) nên collider nào
// chạm được avatar chắc chắn nằm trong 3x3 ô này.
const GRID_CELL = 2;
function addGrid(nav) {
  const grid = new Map();
  for (const c of nav.colliders) {
    const key = `${Math.floor(c.x / GRID_CELL)},${Math.floor(c.z / GRID_CELL)}`;
    let arr = grid.get(key);
    if (!arr) { arr = []; grid.set(key, arr); }
    arr.push(c);
  }
  nav.grid = grid;
  return nav;
}

function lerpAngle(a, b, t) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

export default function AvatarWalk({ room, seats, guest, mySeat, cameraPreset, onPickSeat, onWalkChange }) {
  const nav = useMemo(() => addGrid(buildNav(room)), [room]);
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const pos = useRef(new THREE.Vector3(nav.spawn[0], 0, nav.spawn[2]));
  const groundY = useRef(0);
  const jumpY = useRef(0);
  const vy = useRef(0);
  const yaw = useRef(0);
  const camHeight = useRef(3.0);
  const facing = useRef(Math.PI);
  const keys = useRef(new Set());
  const seatsRef = useRef(seats);
  const mySeatRef = useRef(mySeat);
  const walkRef = useRef(false);
  const onWalkChangeRef = useRef(onWalkChange);
  const onPickSeatRef = useRef(onPickSeat);
  const dragRef = useRef(null);
  const groupRef = useRef(null);
  const [walking, setWalking] = useState(false);

  useEffect(() => { seatsRef.current = seats; }, [seats]);
  useEffect(() => { mySeatRef.current = mySeat; }, [mySeat]);
  useEffect(() => { onWalkChangeRef.current = onWalkChange; }, [onWalkChange]);
  useEffect(() => { onPickSeatRef.current = onPickSeat; }, [onPickSeat]);

  const setWalk = (v) => {
    if (walkRef.current === v) return;
    walkRef.current = v;
    setWalking(v);
    onWalkChangeRef.current?.(v);
  };

  // Đổi góc camera preset (bấm nút góc) hoặc ngồi xuống ghế thì thoát chế
  // độ đi lại — camera preset lấy lại quyền điều khiển camera (Rig).
  useEffect(() => { setWalk(false); }, [cameraPreset]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (mySeat) setWalk(false); }, [mySeat]); // eslint-disable-line react-hooks/exhaustive-deps

  // Bàn phím: bỏ qua khi đang gõ trong ô input (chat, dán link hàng đợi...)
  // để gõ chữ "w" trong chat không làm avatar chạy.
  useEffect(() => {
    const isTyping = () => {
      const el = document.activeElement;
      return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
    };
    const down = (e) => {
      if (isTyping()) return;
      const k = e.key.toLowerCase();
      if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
      if (k === ' ') keys.current.add('jump');
      else if (k === 'shift') keys.current.add('run');
      else if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'q', 'e'].includes(k)) keys.current.add(k);
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k) && !mySeatRef.current) {
        setWalk(true);
      }
      // E: ưu tiên ngồi ghế trống gần nhất (trong 1.4 đơn vị); nếu không có
      // ghế nào gần thì E xoay góc nhìn sang phải (như Q/E xoay camera).
      if (k === 'e' && !e.repeat && walkRef.current && !mySeatRef.current) {
        // Quét ghế trống gần nhất bằng khoảng cách bình phương (tránh sqrt
        // cho từng ghế) — chỉ chạy khi bấm phím E, không chạy theo frame.
        let best = null;
        let bestD2 = 1.4 * 1.4;
        for (const s of nav.seatPos) {
          if (seatsRef.current[s.id]) continue;
          const dx = s.x - pos.current.x;
          const dz = s.z - pos.current.z;
          const d2 = dx * dx + dz * dz;
          if (d2 < bestD2) { bestD2 = d2; best = s.id; }
        }
        if (best) {
          onPickSeatRef.current?.(best);
          setWalk(false);
        }
      }
    };
    const up = (e) => {
      const k = e.key.toLowerCase();
      if (k === ' ') keys.current.delete('jump');
      else if (k === 'shift') keys.current.delete('run');
      else keys.current.delete(k);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [nav]);

  // Kéo chuột trên canvas để xoay camera quanh avatar (cũng vào chế độ đi lại).
  useEffect(() => {
    const el = gl.domElement;
    const onDown = (e) => { dragRef.current = { x: e.clientX, y: e.clientY }; };
    const onMove = (e) => {
      const d = dragRef.current;
      if (!d) return;
      yaw.current -= (e.clientX - d.x) * 0.005;
      camHeight.current = clamp(camHeight.current + (e.clientY - d.y) * 0.01, 1.8, 6);
      dragRef.current = { x: e.clientX, y: e.clientY };
      if (!mySeatRef.current) setWalk(true);
    };
    const onUp = () => { dragRef.current = null; };
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [gl]);

  useFrame((_, delta) => {
    if (!walkRef.current) return;
    const dt = Math.min(delta, 0.05);
    const k = keys.current;
    // Q/E xoay góc nhìn (E chỉ xoay khi không ngồi ghế gần — xem keydown).
    if (k.has('q')) yaw.current += 1.8 * dt;
    if (k.has('e')) yaw.current -= 1.8 * dt;
    // sin/cos(yaw) chỉ tính 1 lần/frame, dùng chung cho hướng đi, hướng
    // mặt và vị trí camera — không cấp phát object fwd/right mỗi frame.
    const sinY = Math.sin(yaw.current);
    const cosY = Math.cos(yaw.current);
    const fwdX = -sinY;
    const fwdZ = -cosY;
    const rightX = cosY;
    const rightZ = -sinY;
    let mx = 0;
    let mz = 0;
    if (k.has('w') || k.has('arrowup')) { mx += fwdX; mz += fwdZ; }
    if (k.has('s') || k.has('arrowdown')) { mx -= fwdX; mz -= fwdZ; }
    if (k.has('d') || k.has('arrowright')) { mx += rightX; mz += rightZ; }
    if (k.has('a') || k.has('arrowleft')) { mx -= rightX; mz -= rightZ; }
    const len2 = mx * mx + mz * mz;
    if (len2 > 0) {
      const speed = k.has('run') ? RUN_SPEED : WALK_SPEED;
      const inv = 1 / Math.sqrt(len2);
      pos.current.x += mx * inv * speed * dt;
      pos.current.z += mz * inv * speed * dt;
      facing.current = lerpAngle(facing.current, Math.atan2(mx, mz), Math.min(1, dt * 10));
    }
    // Nhảy: vận tốc dọc + trọng lực, đáp về mặt sàn.
    if (k.has('jump') && jumpY.current === 0) vy.current = JUMP_VELOCITY;
    if (jumpY.current > 0 || vy.current !== 0) {
      vy.current -= GRAVITY * dt;
      jumpY.current += vy.current * dt;
      if (jumpY.current <= 0) { jumpY.current = 0; vy.current = 0; }
    }
    // Giới hạn trong sàn + đẩy ra khỏi vật cản (ghế, bàn, màn hình giữa).
    if (nav.mode === 'arena') {
      const r2 = pos.current.x * pos.current.x + pos.current.z * pos.current.z;
      if (r2 > nav.maxR * nav.maxR) {
        const inv = nav.maxR / Math.sqrt(r2);
        pos.current.x *= inv;
        pos.current.z *= inv;
      }
      if (Math.abs(pos.current.x) < nav.screen.x && Math.abs(pos.current.z) < nav.screen.z) {
        pos.current.z = pos.current.z >= 0 ? nav.screen.z : -nav.screen.z;
      }
      const target = nav.groundY(Math.sqrt(pos.current.x * pos.current.x + pos.current.z * pos.current.z));
      groundY.current += (target - groundY.current) * Math.min(1, dt * 6);
    } else {
      pos.current.x = clamp(pos.current.x, nav.minX, nav.maxX);
      pos.current.z = clamp(pos.current.z, nav.minZ, nav.maxZ);
      groundY.current = 0;
    }
    // Va chạm qua lưới không gian: chỉ xét collider trong 3x3 ô quanh
    // avatar, so khoảng cách bình phương (không sqrt từng collider).
    const cellX = Math.floor(pos.current.x / GRID_CELL);
    const cellZ = Math.floor(pos.current.z / GRID_CELL);
    for (let ox = -1; ox <= 1; ox++) {
      for (let oz = -1; oz <= 1; oz++) {
        const arr = nav.grid.get(`${cellX + ox},${cellZ + oz}`);
        if (!arr) continue;
        for (let i = 0; i < arr.length; i++) {
          const c = arr[i];
          const dx = pos.current.x - c.x;
          const dz = pos.current.z - c.z;
          const min = c.r + AVATAR_RADIUS;
          const d2 = dx * dx + dz * dz;
          if (d2 > 0.000001 && d2 < min * min) {
            const inv = min / Math.sqrt(d2);
            pos.current.x = c.x + dx * inv;
            pos.current.z = c.z + dz * inv;
          }
        }
      }
    }
    // Camera thứ ba: sau lưng avatar, nhìn vào đầu avatar. Ghi trực tiếp
    // lên camera, không setState theo frame; không gọi updateProjectionMatrix
    // (FOV/aspect không đổi trong lúc đi lại).
    const p = pos.current;
    const gy = groundY.current + jumpY.current;
    if (groupRef.current) {
      groupRef.current.position.set(p.x, gy, p.z);
      groupRef.current.rotation.y = facing.current;
    }
    camera.position.set(
      p.x + sinY * CAMERA_DIST,
      gy + camHeight.current,
      p.z + cosY * CAMERA_DIST,
    );
    camera.lookAt(p.x, gy + 1.4, p.z);
  });

  // Đã ngồi ghế thì ẩn avatar đi lại (hình người ngồi trên ghế là đại diện).
  if (mySeat) return null;
  const p = pos.current;
  const gy = groundY.current + jumpY.current;
  const shirt = guest?.color?.hex || '#b8cd8e';
  return (
    <group ref={groupRef} position={[p.x, gy, p.z]} rotation={[0, facing.current, 0]}>
      {/* Bóng mờ dưới chân */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.45, 20]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.35} toneMapped={false} />
      </mesh>
      {/* Thân: áo màu áo của khách */}
      <mesh position={[0, 0.75, 0]}>
        <capsuleGeometry args={[0.22, 0.45, 4, 8]} />
        <meshStandardMaterial color={shirt} />
      </mesh>
      {/* Đầu */}
      <mesh position={[0, 1.35, 0]}>
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshStandardMaterial color="#e8c39a" />
      </mesh>
      {/* Mũi giày / mặt trước để thấy hướng nhìn */}
      <mesh position={[0, 1.35, 0.2]}>
        <boxGeometry args={[0.16, 0.05, 0.06]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
      {/* Bảng tên trên đầu — chỉ hiện ở góc toàn cảnh + tập trung màn hình:
          ở góc ghế camera sát người nên tên phình to ~200px che giữa màn
          hình (fix 07/11 ~00:35, giống bảng tên người ngồi). */}
      {(cameraPreset === 'overview' || cameraPreset === 'screen') && (
        <Html position={[0, 1.95, 0]} center distanceFactor={10} zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }}>
          <div className="nametag">{guest?.name || 'Khách'}</div>
        </Html>
      )}
      {/* Chip báo đang đi lại (chỉ khi đã bấm WASD / kéo chuột) */}
      {walking && (
        <Html fullscreen zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.65)', color: '#b8cd8e', fontSize: 12, padding: '6px 12px', borderRadius: 999, whiteSpace: 'nowrap' }}>
            🚶 Đang đi lại — WASD di chuyển · Shift chạy · Space nhảy · Q/E xoay · E ngồi ghế gần
          </div>
        </Html>
      )}
    </group>
  );
}
