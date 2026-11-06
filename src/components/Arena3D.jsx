import { useEffect, useMemo, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { ARENA_RINGS, ARENA_SEATS_PER_RING, arenaSeatId } from '../data';
import YouTubePlayer from '../youtube';

// Đấu trường LoL Park — phòng MỚI, dựng theo ảnh nhà thi đấu LoL Park:
// khán đài 3 vòng dâng cao ôm quanh sân giữa, màn hình khổng lồ ở CHÍNH GIỮA
// (theo quyết định của người dùng: giữa là màn hình, không phải sân thi đấu),
// đèn trần đỏ bên T1 (trái) / xanh dương bên BLG (phải), vòng neon quanh sàn
// giữa, màn hình phụ 2 bên ghi WELCOME + thông tin trận bán kết.
// Video live trên mặt màn hình dùng đúng kỹ thuật của rạp phim (drei Html
// transform + 1 player duy nhất từ youtube.jsx — không tạo player thứ hai),
// và chịu cùng giới hạn: iframe DOM nằm trên canvas nên ở góc ghế / góc
// ngược thì ẩn iframe, chỉ còn thumbnail (RoomView không render LiveScreen
// ở 2 góc đó, giống rạp phim).

// 4 góc camera — cùng tên preset với rạp phim để RoomView dùng chung nút bấm,
// chỉ khác vị trí cho hợp với đấu trường (khán đài vòng tròn quanh sân giữa).
export const ARENA_CAMERA_PRESETS = {
  overview: { label: 'Toàn cảnh đấu trường', pos: [0, 15, 25], look: [0, 3.5, 0] },
  seat: { label: 'Góc nhìn từ ghế', pos: [0, 2.6, 12.8], look: [0, 4.6, 0] },
  screen: { label: 'Tập trung màn hình', pos: [0, 4.6, 9.5], look: [0, 4.6, 0] },
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
// chính): drei Html transform, tỉ lệ như rạp phim — div 1200×675px +
// distanceFactor 4 = đúng 12×6.75 đơn vị (16:9).
function ArenaLiveScreen({ videoId, onEnded, onPlayerReady, controls, startSeconds }) {
  return (
    <Html transform distanceFactor={4} position={[0, 4.6, 0.28]} zIndexRange={[10, 0]}>
      <div style={{ width: '1200px', height: '675px' }}>
        <YouTubePlayer videoId={videoId} onEnded={onEnded} onPlayerReady={onPlayerReady}
          controls={controls} startSeconds={startSeconds} />
      </div>
    </Html>
  );
}

// Ghế khán đài: ngồi quay mặt về sân giữa (rotation.y = atan2(x, z) để mặt
// ghế hướng về tâm), có bảng tên trên đầu người ngồi như các phòng khác.
function ArenaSeat({ position, angle, color, mine, name }) {
  return (
    <group position={position} rotation={[0, angle, 0]}>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.85, 0.7, 0.8]} />
        <meshStandardMaterial color={mine ? '#b8cd8e' : '#232a38'} />
      </mesh>
      <mesh position={[0, 0.95, 0.28]}>
        <boxGeometry args={[0.85, 0.7, 0.18]} />
        <meshStandardMaterial color={mine ? '#c6e48b' : '#2c3547'} />
      </mesh>
      {color && (
        <mesh position={[0, 1.05, 0]}>
          <capsuleGeometry args={[0.22, 0.45, 4, 8]} />
          <meshStandardMaterial color={color} />
        </mesh>
      )}
      {color && (
        <mesh position={[0, 1.55, 0]}>
          <sphereGeometry args={[0.2, 12, 12]} />
          <meshStandardMaterial color="#e8c39a" />
        </mesh>
      )}
      {name && (
        <Html position={[0, 2.05, 0]} center distanceFactor={10} zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }}>
          <div className="nametag">{name}</div>
        </Html>
      )}
    </group>
  );
}

function EmptySeatRing({ position }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[position[0], position[1] + 0.02, position[2]]}>
      <ringGeometry args={[0.5, 0.64, 28]} />
      <meshBasicMaterial color="#b8cd8e" toneMapped={false} />
    </mesh>
  );
}

// Đèn trần dạng thanh dài: đỏ phía T1 (x < 0), xanh dương phía BLG (x > 0),
// xếp thành vòng trên trần như ảnh LoL Park.
function CeilingBars() {
  const bars = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const x = Math.cos(a) * 8.5;
    const z = Math.sin(a) * 8.5;
    const red = x < 0;
    bars.push(
      <mesh key={i} position={[x, 10.2, z]} rotation={[0, -a, 0.5]}>
        <boxGeometry args={[2.4, 0.14, 0.35]} />
        <meshStandardMaterial color={red ? '#a80000' : '#0055aa'} emissive={red ? '#ff2020' : '#00a8ff'} emissiveIntensity={2.2} />
      </mesh>,
    );
  }
  return <group>{bars}</group>;
}

function Arena({ room, seats, mySeat, guest, videoId, showLive, onEnded, onPlayerReady, controls, startSeconds }) {
  // Băng "T1 vs BLG" phía trên màn hình giữa + màn phụ WELCOME / thông tin trận.
  // useMemo: canvas texture chỉ vẽ 1 lần, không vẽ lại mỗi lần bot đổi ghế.
  const vsTex = useMemo(() => makeTextTexture({
    lines: [
      { text: 'T1  vs  BLG', size: 110, bold: true, y: 80 },
      { text: 'BÁN KẾT  •  CKTG 2026', size: 44, y: 185, color: '#ffd75e' },
    ],
    w: 1024, h: 256,
  }), []);
  const welcomeTex = useMemo(() => makeTextTexture({
    lines: [
      { text: 'WELCOME', size: 120, bold: true, y: 85 },
      { text: 'LoL PARK  •  ĐẤU TRƯỜNG', size: 40, y: 185, color: '#b8cd8e' },
    ],
    w: 1024, h: 256,
  }), []);
  const infoTex = useMemo(() => makeTextTexture({
    lines: [
      { text: 'BÁN KẾT  •  CKTG 2026', size: 64, bold: true, y: 60 },
      { text: '05:00  •  THỨ HAI 09.11.2026', size: 52, y: 140, color: '#ffd75e' },
      { text: 'T1 vs BLG  •  BO5', size: 52, y: 205 },
    ],
    w: 1024, h: 256,
  }), []);

  // 3 vòng khán đài: bán kính 9.5 / 12.5 / 15.5, càng ngoài càng cao.
  const RINGS = [
    { ring: 'A', r: 9.5, y: 0.5 },
    { ring: 'B', r: 12.5, y: 1.7 },
    { ring: 'C', r: 15.5, y: 2.9 },
  ];
  const seatMeshes = [];
  const ringMeshes = RINGS.map(({ ring, r, y }) => (
    <mesh key={`tier-${ring}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]}>
      <ringGeometry args={[r - 1.3, r + 1.3, 64]} />
      <meshStandardMaterial color="#14161c" roughness={0.9} />
    </mesh>
  ));
  for (const { ring, r, y } of RINGS) {
    for (let n = 1; n <= ARENA_SEATS_PER_RING; n++) {
      const a = ((n - 1) / ARENA_SEATS_PER_RING) * Math.PI * 2;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const id = arenaSeatId(ring, n);
      const occ = seats[id];
      seatMeshes.push(
        <ArenaSeat key={id} position={[x, y, z]} angle={Math.atan2(x, z)}
          color={occ ? (occ.kind === 'me' ? guest.color.hex : '#8bc6c0') : null}
          mine={occ?.kind === 'me'}
          name={occ ? occ.name : null} />,
      );
      if (!occ) seatMeshes.push(<EmptySeatRing key={`ring-${id}`} position={[x, y, z]} />);
    }
  }

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[0, 7, 6]} intensity={50} color="#ffe9b0" />
      {/* Đèn màu 2 phía sân giữa: đỏ bên T1 (trái), xanh dương bên BLG (phải) */}
      <pointLight position={[-8, 5, 0]} intensity={30} color="#ff2020" />
      <pointLight position={[8, 5, 0]} intensity={30} color="#00a8ff" />
      <pointLight position={[0, 9, 0]} intensity={25} color="#ffffff" />

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

      {/* Màn hình khổng lồ giữa sân: khung + mặt trước (live) + mặt sau (thumbnail) */}
      <mesh position={[0, 4.6, 0]}>
        <boxGeometry args={[12.7, 7.4, 0.35]} />
        <meshStandardMaterial color="#141414" roughness={0.6} />
      </mesh>
      {/* Trụ treo màn hình lên trần */}
      <mesh position={[-4.5, 9.6, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 4.4, 8]} />
        <meshStandardMaterial color="#666666" metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[4.5, 9.6, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 4.4, 8]} />
        <meshStandardMaterial color="#666666" metalness={0.7} roughness={0.4} />
      </mesh>
      <ScreenFace videoId={videoId} width={12} height={6.75} position={[0, 4.6, 0.19]} />
      <ScreenFace videoId={videoId} width={12} height={6.75} position={[0, 4.6, -0.19]} rotationY={Math.PI} />
      {showLive && (
        <ArenaLiveScreen videoId={videoId} onEnded={onEnded} onPlayerReady={onPlayerReady}
          controls={controls} startSeconds={startSeconds} />
      )}

      {/* Băng "T1 vs BLG" phía trên màn hình giữa (2 mặt) */}
      <mesh position={[0, 8.9, 0.22]}>
        <planeGeometry args={[10, 2.5]} />
        <meshBasicMaterial map={vsTex} toneMapped={false} />
      </mesh>
      <mesh position={[0, 8.9, -0.22]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[10, 2.5]} />
        <meshBasicMaterial map={vsTex} toneMapped={false} />
      </mesh>

      {/* Màn phụ 2 bên tường: trái WELCOME, phải thông tin trận */}
      <mesh position={[-17.5, 5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[7, 1.75]} />
        <meshBasicMaterial map={welcomeTex} toneMapped={false} />
      </mesh>
      <mesh position={[17.5, 5, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[7, 1.75]} />
        <meshBasicMaterial map={infoTex} toneMapped={false} />
      </mesh>

      {ringMeshes}
      {seatMeshes}
    </>
  );
}

export default function Arena3D({ room, seats, mySeat, guest, cameraPreset, videoId, showLive, onEnded, onPlayerReady, controls, startSeconds }) {
  return (
    <Canvas camera={{ position: ARENA_CAMERA_PRESETS[cameraPreset].pos, fov: 55 }}>
      <color attach="background" args={['#05070a']} />
      <Rig preset={cameraPreset} />
      <Arena room={room} seats={seats} mySeat={mySeat} guest={guest} videoId={videoId}
        showLive={showLive} onEnded={onEnded} onPlayerReady={onPlayerReady}
        controls={controls} startSeconds={startSeconds} />
    </Canvas>
  );
}
