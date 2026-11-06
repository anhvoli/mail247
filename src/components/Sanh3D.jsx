// Sảnh 3D (Sanh3D.jsx) — phòng chờ đi lại tự do, theo khảo sát choigivui.com
// ngày 2026-11-06: sảnh tối, đường phát sáng xanh lá trên sàn, màn hình lớn
// chiếu cùng video với Rạp phim, avatar khối kiểu Roblox, sức chứa 40 người.
// Điều khiển (như bản gốc): WASD / phím mũi tên để đi, Shift chạy, Space
// nhảy, E vào cửa rạp, Enter mở chat, kéo chuột xoay camera, lăn chuột zoom.
//
// File này chỉ TẠO MỚI — không sửa file nào khác. Parent (agent chính) nối
// vào sau theo hướng dẫn trong src/sanh-spec.js.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import YouTubePlayer from '../youtube';

// Kích thước sảnh: x ∈ [-12, 12], z ∈ [-10, 10], tường cao 7.
const BOUNDS = { x: 11, zMin: -8.6, zMax: 9 };

// Màn hình lớn trên tường sau (z = -9.5): 12 × 6.75 (16:9), tâm y = 4.3.
const SCREEN = { w: 12, h: 6.75, y: 4.3, z: -9.5 };

// Cửa vào các phòng trên 2 tường bên (mặt quay vào trong sảnh).
export const SANH_DOORS = [
  { id: 'phim', label: 'Rạp phim', sub: 'PHÒNG 01 · 100 GHẾ', accent: '#b8cd8e', pos: [-11.9, 0, -3], rotY: Math.PI / 2 },
  { id: 'troi', label: 'Rạp Trời', sub: 'NGOÀI TRỜI · 72 GHẾ BÀN', accent: '#8bc6c0', pos: [-11.9, 0, 3], rotY: Math.PI / 2 },
  { id: 'karaoke', label: 'Karaoke', sub: 'GOT TALENT · 19:00–23:00', accent: '#ff7ab8', pos: [11.9, 0, -3], rotY: -Math.PI / 2 },
  { id: 'arena', label: 'Đấu trường', sub: 'LOL PARK · T1 vs BLG', accent: '#ff5252', pos: [11.9, 0, 3], rotY: -Math.PI / 2 },
];

// Khách mẫu khi parent chưa truyền guests (để cảnh không trống lúc xem thử).
export const DEMO_GUESTS = [
  { name: 'Hoàng Nam', color: '#e2574c', x: -4, z: 2 },
  { name: 'Thu Hằng', color: '#4c9be8', x: -3.2, z: 2.6 },
  { name: 'Mèo Mun', color: '#f2c94c', x: 3.5, z: -1 },
  { name: 'NamCưBụ', color: '#9b7ede', x: 4.4, z: -0.4 },
  { name: 'Bi', color: '#58c98a', x: -6.5, z: -3 },
  { name: 'Mr. Sun', color: '#e8863c', x: 6, z: 4 },
];

function makeDoorTexture({ title, sub, accent }) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 768;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 768);
  g.addColorStop(0, '#10131a'); g.addColorStop(1, '#05070a');
  x.fillStyle = g; x.fillRect(0, 0, 512, 768);
  x.strokeStyle = accent; x.lineWidth = 10; x.strokeRect(14, 14, 484, 740);
  x.fillStyle = accent;
  x.beginPath(); x.arc(256, 180, 64, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#05070a';
  x.font = '900 84px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText('➜', 256, 186);
  x.fillStyle = '#ffffff';
  x.font = '900 64px Arial, sans-serif';
  x.fillText(title, 256, 340);
  x.fillStyle = accent; x.font = '700 30px Arial, sans-serif';
  sub.split('·').forEach((line, i) => x.fillText(line.trim(), 256, 440 + i * 44));
  x.fillStyle = '#9aa5b1'; x.font = '600 28px Arial, sans-serif';
  x.fillText('Bấm E để vào', 256, 640);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return tex;
}

function makeSignTexture(text) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 96;
  const x = c.getContext('2d');
  x.fillStyle = '#0d0d0d'; x.fillRect(0, 0, 1024, 96);
  x.strokeStyle = '#b8cd8e'; x.lineWidth = 4; x.strokeRect(6, 6, 1012, 84);
  x.fillStyle = '#b8cd8e'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = '700 44px Arial, sans-serif';
  x.fillText(text, 512, 50);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return tex;
}

// Mặt màn hình: thumbnail video làm lớp nền dưới iframe live (giống
// Cinema3D.ScreenFace — YouTube không cho nhúng iframe làm texture WebGL).
function ScreenFace({ videoId }) {
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
      <mesh position={[0, SCREEN.y, SCREEN.z]}>
        <planeGeometry args={[SCREEN.w, SCREEN.h]} />
        <meshStandardMaterial color="#0b0b0b" emissive="#9db8ff" emissiveIntensity={0.55} />
      </mesh>
    );
  }
  return (
    <mesh position={[0, SCREEN.y, SCREEN.z]}>
      <planeGeometry args={[SCREEN.w, SCREEN.h]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

// Video LIVE trên mặt màn hình sảnh (cùng kỹ thuật drei Html transform như
// Cinema3D.LiveScreen: div 1200×675px + distanceFactor 4 = đúng 12×6.75).
// Dùng chung 1 player YouTube duy nhất từ ../youtube — không tạo player mới.
function LiveScreen({ videoId, onEnded, onPlayerReady, controls, startSeconds }) {
  return (
    <Html transform distanceFactor={4} position={[0, SCREEN.y, SCREEN.z + 0.1]} zIndexRange={[10, 0]}>
      <div style={{ width: '1200px', height: '675px' }}>
        <YouTubePlayer videoId={videoId} onEnded={onEnded} onPlayerReady={onPlayerReady}
          controls={controls} startSeconds={startSeconds} />
      </div>
    </Html>
  );
}

// Avatar khối kiểu Roblox: đầu + thân + tay + chân đều là hộp, áo màu riêng.
function BlockAvatar({ position, color, name, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      {/* Chân */}
      <mesh position={[-0.14, 0.25, 0]}>
        <boxGeometry args={[0.24, 0.5, 0.24]} />
        <meshStandardMaterial color="#2c3547" />
      </mesh>
      <mesh position={[0.14, 0.25, 0]}>
        <boxGeometry args={[0.24, 0.5, 0.24]} />
        <meshStandardMaterial color="#2c3547" />
      </mesh>
      {/* Thân (áo màu riêng) */}
      <mesh position={[0, 0.85, 0]}>
        <boxGeometry args={[0.62, 0.7, 0.34]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* Tay */}
      <mesh position={[-0.44, 0.85, 0]}>
        <boxGeometry args={[0.2, 0.62, 0.2]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[0.44, 0.85, 0]}>
        <boxGeometry args={[0.2, 0.62, 0.2]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* Đầu */}
      <mesh position={[0, 1.45, 0]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#e8c39a" roughness={0.7} />
      </mesh>
      {/* Mắt */}
      <mesh position={[-0.11, 1.47, 0.26]}>
        <boxGeometry args={[0.07, 0.1, 0.02]} />
        <meshBasicMaterial color="#111111" />
      </mesh>
      <mesh position={[0.11, 1.47, 0.26]}>
        <boxGeometry args={[0.07, 0.1, 0.02]} />
        <meshBasicMaterial color="#111111" />
      </mesh>
      {name && (
        <Html position={[0, 2.05, 0]} center distanceFactor={10} zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }}>
          <div className="nametag">{name}</div>
        </Html>
      )}
    </group>
  );
}

// Khách đi lại chậm trong sảnh (qua lại giữa 2 điểm, nhún nhẹ khi bước).
function Wanderer({ color, name, from, to, speed = 0.5, phase = 0 }) {
  const ref = useRef();
  const t = useRef(phase);
  useFrame((_, dt) => {
    t.current += dt * speed;
    const k = (Math.sin(t.current) + 1) / 2; // 0..1 ping-pong
    const x = from[0] + (to[0] - from[0]) * k;
    const z = from[1] + (to[1] - from[1]) * k;
    const dir = to[0] > from[0] ? 1 : -1;
    const moving = Math.cos(t.current) > 0;
    if (ref.current) {
      ref.current.position.set(x, Math.abs(Math.sin(t.current * 6)) * 0.06, z);
      ref.current.rotation.y = moving ? (dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (dir > 0 ? -Math.PI / 2 : Math.PI / 2);
    }
  });
  return (
    <group ref={ref} position={[from[0], 0, from[1]]}>
      <BlockAvatar position={[0, 0, 0]} color={color} name={name} />
    </group>
  );
}

// Cửa vào phòng: khung + mặt cửa phát sáng có tên phòng, vòng xanh trên sàn.
function Door({ door, near }) {
  const tex = useMemo(() => makeDoorTexture({ title: door.label, sub: door.sub, accent: door.accent }), [door]);
  return (
    <group position={door.pos} rotation={[0, door.rotY, 0]}>
      {/* Khung cửa */}
      <mesh position={[0, 1.8, -0.08]}>
        <boxGeometry args={[2.8, 3.9, 0.18]} />
        <meshStandardMaterial color="#1a1d24" />
      </mesh>
      {/* Mặt cửa phát sáng */}
      <mesh position={[0, 1.75, 0.02]}>
        <planeGeometry args={[2.3, 3.4]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      {/* Vòng xanh trên sàn trước cửa */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 1.6]}>
        <ringGeometry args={[0.7, 0.86, 28]} />
        <meshBasicMaterial color={near ? '#d7f5a0' : '#b8cd8e'} toneMapped={false} />
      </mesh>
      {near && (
        <Html position={[0, 4.2, 0.6]} center distanceFactor={10} zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }}>
          <div className="nametag">Bấm E để vào {door.label}</div>
        </Html>
      )}
    </group>
  );
}

// Avatar của mình: điều khiển bằng bàn phím, camera theo sau.
function MyAvatar({ guest, onNearDoor, onEnterDoor, onOpenChat }) {
  const ref = useRef();
  const keys = useRef({});
  const yaw = useRef(0);
  const dist = useRef(11);
  const pos = useRef(new THREE.Vector3(0, 0, 7));
  const vy = useRef(0);
  const nearDoor = useRef(null);
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);

  useEffect(() => {
    const down = (e) => {
      keys.current[e.code] = true;
      if (e.code === 'Enter' && onOpenChat) onOpenChat();
      if (e.code === 'KeyE' && nearDoor.current && onEnterDoor) onEnterDoor(nearDoor.current);
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    };
    const up = (e) => { keys.current[e.code] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [onEnterDoor, onOpenChat]);

  // Kéo chuột xoay camera, lăn chuột zoom (như bản gốc).
  useEffect(() => {
    const el = gl.domElement;
    let dragging = false;
    let lastX = 0;
    const onDown = (e) => { dragging = true; lastX = e.clientX; };
    const onMove = (e) => {
      if (!dragging) return;
      yaw.current -= (e.clientX - lastX) * 0.005;
      lastX = e.clientX;
    };
    const onUp = () => { dragging = false; };
    const onWheel = (e) => {
      dist.current = Math.min(16, Math.max(6, dist.current + e.deltaY * 0.01));
    };
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    el.addEventListener('wheel', onWheel, { passive: true });
    return () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      el.removeEventListener('wheel', onWheel);
    };
  }, [gl]);

  useFrame((_, dt) => {
    const k = keys.current;
    const run = k.ShiftLeft || k.ShiftRight ? 1.8 : 1;
    const speed = 4 * run * Math.min(dt * 3, 1);
    let mx = 0;
    let mz = 0;
    if (k.KeyW || k.ArrowUp) mz -= 1;
    if (k.KeyS || k.ArrowDown) mz += 1;
    if (k.KeyA || k.ArrowLeft) mx -= 1;
    if (k.KeyD || k.ArrowRight) mx += 1;
    // Hướng di chuyển theo góc camera (yaw) thay vì theo trục cố định.
    const sin = Math.sin(yaw.current);
    const cos = Math.cos(yaw.current);
    const dx = (mx * cos - mz * sin) * speed;
    const dz = (mx * sin + mz * cos) * speed;
    pos.current.x = THREE.MathUtils.clamp(pos.current.x + dx, -BOUNDS.x, BOUNDS.x);
    pos.current.z = THREE.MathUtils.clamp(pos.current.z + dz, BOUNDS.zMin, BOUNDS.zMax);
    // Nhảy (Space): vận tốc dọc + trọng lực đơn giản.
    if ((k.Space) && pos.current.y === 0) vy.current = 4.2;
    vy.current -= 12 * dt;
    pos.current.y = Math.max(0, pos.current.y + vy.current * dt);
    if (pos.current.y === 0) vy.current = 0;
    if (ref.current) {
      ref.current.position.copy(pos.current);
      if (mx !== 0 || mz !== 0) ref.current.rotation.y = Math.atan2(dx, dz);
    }
    // Cửa gần nhất (trong 2m) để bấm E.
    let nearest = null;
    let best = 2.2;
    for (const d of SANH_DOORS) {
      const dd = Math.hypot(pos.current.x - d.pos[0], pos.current.z - d.pos[2]);
      if (dd < best) { best = dd; nearest = d.id; }
    }
    if (nearest !== nearDoor.current) {
      nearDoor.current = nearest;
      onNearDoor?.(nearest);
    }
    // Camera theo sau avatar.
    const cx = pos.current.x + Math.sin(yaw.current) * dist.current;
    const cz = pos.current.z + Math.cos(yaw.current) * dist.current;
    camera.position.set(cx, 3.2 + dist.current * 0.18, cz);
    camera.lookAt(pos.current.x, 1.4, pos.current.z);
  });

  return (
    <group ref={ref} position={[0, 0, 7]}>
      <BlockAvatar position={[0, 0, 0]} color={guest?.color?.hex || '#b8cd8e'} name={guest?.name || 'Bạn'} />
    </group>
  );
}

function Hall({ videoId, showLive, screenOff, onEnded, onPlayerReady, controls, startSeconds, guests, myGuest, onNearDoor, onEnterDoor, onOpenChat }) {
  const signTex = useMemo(() => makeSignTexture('SẢNH 3D  •  ĐI LẠI TỰ DO  •  TỐI ĐA 40 NGƯỜI'), []);
  const [nearDoor, setNearDoor] = useState(null);
  const handleNearDoor = (id) => { setNearDoor(id); onNearDoor?.(id); };
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[0, 6, 0]} intensity={50} color="#e8ffd0" />
      <pointLight position={[-8, 4, -6]} intensity={20} color="#b8cd8e" />
      <pointLight position={[8, 4, -6]} intensity={20} color="#b8cd8e" />
      {/* Sàn tối */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[24, 20]} />
        <meshStandardMaterial color="#0d0f14" roughness={0.9} />
      </mesh>
      {/* Lưới đường phát sáng xanh lá trên sàn (như bản gốc) */}
      <gridHelper args={[24, 12, '#b8cd8e', '#2e4a1f']} position={[0, 0.02, 0]} />
      {/* Viền sàn phát sáng */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -9.8]}>
        <planeGeometry args={[24, 0.18]} />
        <meshBasicMaterial color="#b8cd8e" toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 9.8]}>
        <planeGeometry args={[24, 0.18]} />
        <meshBasicMaterial color="#b8cd8e" toneMapped={false} />
      </mesh>
      {/* Tường sau + 2 tường bên + trần tối */}
      <mesh position={[0, 3.5, -10]}>
        <planeGeometry args={[24, 7]} />
        <meshStandardMaterial color="#0a0c10" />
      </mesh>
      <mesh position={[-12, 3.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[20, 7]} />
        <meshStandardMaterial color="#0d1016" />
      </mesh>
      <mesh position={[12, 3.5, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[20, 7]} />
        <meshStandardMaterial color="#0d1016" />
      </mesh>
      <mesh position={[0, 3.5, 10]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[24, 7]} />
        <meshStandardMaterial color="#0a0c10" />
      </mesh>
      {/* Biển tên sảnh trên màn hình */}
      <mesh position={[0, 8.1, -9.7]}>
        <planeGeometry args={[10, 0.9]} />
        <meshBasicMaterial map={signTex} toneMapped={false} />
      </mesh>
      {/* Khung màn hình + mặt màn hình */}
      <mesh position={[0, SCREEN.y, SCREEN.z - 0.15]}>
        <boxGeometry args={[SCREEN.w + 0.6, SCREEN.h + 0.6, 0.15]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {screenOff ? (
        <mesh position={[0, SCREEN.y, SCREEN.z]}>
          <planeGeometry args={[SCREEN.w, SCREEN.h]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
      ) : (
        <>
          <ScreenFace videoId={videoId} />
          {showLive && (
            <LiveScreen videoId={videoId} onEnded={onEnded} onPlayerReady={onPlayerReady}
              controls={controls} startSeconds={startSeconds} />
          )}
        </>
      )}
      {/* Cửa vào các phòng */}
      {SANH_DOORS.map((d) => (
        <Door key={d.id} door={d} near={nearDoor === d.id} />
      ))}
      {/* Khách trong sảnh: 2 người đi lại + còn lại đứng thành nhóm */}
      <Wanderer color="#e2574c" name="Hoàng Nam" from={[-6, 4]} to={[5, 4]} speed={0.35} phase={0} />
      <Wanderer color="#4c9be8" name="Thu Hằng" from={[6, -4]} to={[-5, -4]} speed={0.3} phase={2} />
      {guests.filter((g) => !['Hoàng Nam', 'Thu Hằng'].includes(g.name)).map((g) => (
        <group key={g.name} position={[g.x, 0, g.z]}>
          <BlockAvatar position={[0, 0, 0]} color={g.color} name={g.name} />
        </group>
      ))}
      <MyAvatar guest={myGuest} onNearDoor={handleNearDoor} onEnterDoor={onEnterDoor} onOpenChat={onOpenChat} />
    </>
  );
}

export default function Sanh3D({
  videoId = 'abPmZCZZrFA', // cùng video với Rạp phim (parent nên truyền video đang chiếu của Rạp phim)
  showLive = true,
  screenOff = false,
  onEnded,
  onPlayerReady,
  controls = true,
  startSeconds = 0,
  guests = DEMO_GUESTS,
  myGuest = null,
  onNearDoor,
  onEnterDoor,
  onOpenChat,
}) {
  return (
    <Canvas camera={{ position: [0, 6, 18], fov: 55 }}>
      <color attach="background" args={['#05070a']} />
      <Hall videoId={videoId} showLive={showLive} screenOff={screenOff}
        onEnded={onEnded} onPlayerReady={onPlayerReady} controls={controls}
        startSeconds={startSeconds} guests={guests} myGuest={myGuest}
        onNearDoor={onNearDoor} onEnterDoor={onEnterDoor} onOpenChat={onOpenChat} />
    </Canvas>
  );
}
