// Phòng Karaoke / Got Talent — cảnh 3D (R3F), theo khảo sát choigivui.com 2026-11-06.
// Sân khấu rèm đỏ, 30 ghế đỏ hướng về sân khấu, màn hình lớn trên sân khấu
// chiếu video bài đang hát LIVE (dùng đúng kỹ thuật drei Html transform như
// Cinema3D — iframe YouTube không làm texture WebGL được).
// File mới, tự chứa: không import gì từ Cinema3D.jsx (chỉ copy đúng shape
// prop của LiveScreen bên đó). Parent nối vào qua karaoke-room-spec.js.
import { useEffect, useMemo, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { seatId } from '../data';
import YouTubePlayer from '../youtube';

// 4 góc camera như các phòng khác: toàn cảnh, từ ghế, tập trung màn hình,
// từ màn chiếu về hàng ghế. Màn hình ở z = -8 nên góc ngược phải đứng TRƯỚC
// mặt màn (z = -5.5) rồi nhìn về hàng ghế — đặt sau màn chỉ thấy khung đen.
export const KARAOKE_CAMERA_PRESETS = {
  overview: { label: 'Toàn cảnh sân khấu', pos: [0, 7, 13], look: [0, 1.5, -2] },
  seat: { label: 'Góc nhìn từ ghế', pos: [0, 1.7, 6], look: [0, 2.8, -10] },
  screen: { label: 'Tập trung màn hình', pos: [0, 2.2, -2.5], look: [0, 3, -10] },
  reverse: { label: 'Từ màn chiếu về hàng ghế', pos: [0, 2.6, -5.5], look: [0, 1.0, 10] },
};

// Đổi góc camera: đặt thẳng vị trí + hướng nhìn khi đổi preset (không lerp),
// canvas không bao giờ bị unmount/thay thế khi đổi góc.
function Rig({ preset, reAim }) {
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    const p = KARAOKE_CAMERA_PRESETS[preset];
    camera.position.set(p.pos[0], p.pos[1], p.pos[2]);
    camera.lookAt(p.look[0], p.look[1], p.look[2]);
    camera.updateProjectionMatrix();
    // reAim đổi mỗi lần bấm nút góc (kể cả bấm lại góc đang chọn) hoặc ngồi
    // xuống ghế sau khi đi lại (fix 07/11 ~00:30 — xem Cinema3D.jsx).
  }, [preset, camera, reAim]);
  return null;
}

// Vẽ chữ lên canvas để dán làm biển/bảng (không fetch ảnh ngoài).
function makeTextTexture({ w = 1024, h = 128, text, sub = '', bg = '#1a0505', fg = '#ffd75e', font = 64 }) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, w, h);
  x.strokeStyle = fg; x.lineWidth = 4; x.strokeRect(6, 6, w - 12, h - 12);
  x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = `900 ${font}px Arial, sans-serif`;
  x.fillText(text, w / 2, sub ? h / 2 - 18 : h / 2);
  if (sub) {
    x.font = '700 34px Arial, sans-serif';
    x.fillStyle = '#ffffff';
    x.fillText(sub, w / 2, h / 2 + 34);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return tex;
}

// Màn hình: thumbnail bài đang hát làm lớp nền dưới iframe live.
function ScreenFace({ videoId, width, height }) {
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
      <mesh position={[0, 3, -8]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color="#0b0b0b" emissive="#9db8ff" emissiveIntensity={0.55} />
      </mesh>
    );
  }
  return (
    <mesh position={[0, 3, -8]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

// Màn hình LIVE: cùng shape prop với LiveScreen trong Cinema3D.jsx —
// videoId, onEnded, onPlayerReady, controls, startSeconds, width, height.
// Iframe DOM nằm TRÊN canvas nên chỉ hiện ở góc toàn cảnh + tập trung màn
// hình; góc ghế / góc ngược thì ẩn (chỉ còn thumbnail nền).
function LiveScreen({ videoId, onEnded, onPlayerReady, controls, startSeconds, width, height }) {
  return (
    <Html transform distanceFactor={4} position={[0, 3, -7.9]} zIndexRange={[10, 0]}>
      <div style={{ width: `${width * 100}px`, height: `${height * 100}px` }}>
        <YouTubePlayer videoId={videoId} onEnded={onEnded} onPlayerReady={onPlayerReady}
          controls={controls} startSeconds={startSeconds} />
      </div>
    </Html>
  );
}

// Rèm nhung đỏ xếp ly (2 tông đỏ xen kẽ), như rạp phim.
function PleatedCurtain({ position, width, height, vertical = true }) {
  const pleats = [];
  const count = vertical ? Math.max(3, Math.round(width / 0.35)) : Math.max(3, Math.round(height / 0.35));
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : i / (count - 1);
    const shade = i % 2 === 0 ? '#a01f1f' : '#701414';
    const offset = (i % 2 === 0 ? 0.09 : -0.09);
    pleats.push(
      <mesh key={i} position={vertical ? [(t - 0.5) * width, 0, offset] : [0, (t - 0.5) * height, offset]} rotation={[0, (i % 2 === 0 ? 0.18 : -0.18), 0]}>
        <boxGeometry args={vertical ? [0.32, height, 0.22] : [width, 0.32, 0.22]} />
        <meshStandardMaterial color={shade} roughness={0.9} />
      </mesh>
    );
  }
  return <group position={position}>{pleats}</group>;
}

// Chân mic + mic trên sân khấu (ca sĩ đứng hát ở đây).
function MicStand({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.3, 0.35, 0.08, 16]} />
        <meshStandardMaterial color="#111111" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 1.5, 8]} />
        <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.65, 0]} rotation={[0.5, 0, 0]}>
        <sphereGeometry args={[0.14, 12, 12]} />
        <meshStandardMaterial color="#222222" roughness={0.5} />
      </mesh>
    </group>
  );
}

// Ghế đỏ khán giả (ngồi hướng về sân khấu, tức nhìn về -z).
function Seat({ position, color, mine, name }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.85, 0.7, 0.8]} />
        <meshStandardMaterial color={mine ? '#b8cd8e' : '#7a1010'} />
      </mesh>
      <mesh position={[0, 0.95, 0.28]}>
        <boxGeometry args={[0.85, 0.7, 0.18]} />
        <meshStandardMaterial color={mine ? '#c6e48b' : '#8f1d1d'} />
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

// Vòng xanh lá trên sàn quanh ghế trống.
function EmptySeatRing({ position }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[position[0], 0.02, position[2]]}>
      <ringGeometry args={[0.5, 0.64, 28]} />
      <meshBasicMaterial color="#b8cd8e" toneMapped={false} />
    </mesh>
  );
}

// Bảng điểm trung bình của ca sĩ đang hát (hiện khi có điểm, prop averageScore).
function ScoreBoard({ singerName, averageScore, scorerCount }) {
  const tex = useMemo(() => {
    if (averageScore == null) return null;
    return makeTextTexture({
      w: 1024, h: 160,
      text: `★ ${Number(averageScore).toFixed(1)} / 10`,
      sub: `${singerName || 'Ca sĩ'}  ·  ${scorerCount || 0} người chấm`,
      bg: '#1a0505', fg: '#ffd75e', font: 64,
    });
  }, [singerName, averageScore, scorerCount]);
  if (!tex) return null;
  return (
    <mesh position={[0, 5.9, -7.9]}>
      <planeGeometry args={[4.2, 0.66]} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  );
}

function Stage({ room, seats, mySeat, guest, videoId, showLive, onEnded, onPlayerReady, controls, startSeconds, singerName, averageScore, scorerCount }) {
  const gotTalentTex = useMemo(() => makeTextTexture({
    w: 1024, h: 128, text: '★  GOT TALENT  ★', sub: '',
    bg: '#1a0505', fg: '#ffd75e', font: 72,
  }), []);
  const hoursTex = useMemo(() => makeTextTexture({
    w: 1024, h: 96, text: 'KARAOKE  •  19:00 – 23:00', sub: '',
    bg: '#0d0d0d', fg: '#ffffff', font: 44,
  }), []);
  const seatMeshes = [];
  // 30 ghế đỏ: 3 hàng A/B/C × 10 ghế, hướng về sân khấu (-z).
  room.rows.forEach((row, ri) => {
    for (let c = 1; c <= room.cols; c++) {
      const id = seatId(row, c);
      const occ = seats[id];
      const pos = [(c - 5.5) * 1.05, 0, 1.5 + ri * 1.25];
      seatMeshes.push(
        <Seat key={id} position={pos}
          color={occ ? (occ.kind === 'me' ? guest.color.hex : '#d7bc75') : null}
          mine={occ?.kind === 'me'}
          name={occ ? occ.name : null} />,
      );
      if (!occ) seatMeshes.push(<EmptySeatRing key={`ring-${id}`} position={pos} />);
    }
  });
  return (
    <>
      <ambientLight intensity={0.55} />
      <pointLight position={[0, 6, 4]} intensity={60} color="#ffe9b0" />
      {/* Đèn sân khấu đỏ 2 bên */}
      <pointLight position={[-5, 5, -6]} intensity={35} color="#ff3030" />
      <pointLight position={[5, 5, -6]} intensity={35} color="#ff3030" />
      <pointLight position={[0, 6, -6]} intensity={25} color="#ffffff" />
      {/* Sàn + tường */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 2]}>
        <planeGeometry args={[18, 20]} />
        <meshStandardMaterial color="#17100f" />
      </mesh>
      <mesh position={[0, 4, -8.7]}>
        <planeGeometry args={[18, 9]} />
        <meshStandardMaterial color="#0c0505" />
      </mesh>
      <mesh position={[-8.2, 4, 2]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[20, 9]} />
        <meshStandardMaterial color="#120a0a" />
      </mesh>
      <mesh position={[8.2, 4, 2]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[20, 9]} />
        <meshStandardMaterial color="#120a0a" />
      </mesh>
      {/* Bục sân khấu nâng + thảm đỏ */}
      <mesh position={[0, 0.3, -6.2]}>
        <boxGeometry args={[12, 0.6, 3.4]} />
        <meshStandardMaterial color="#5a2a1a" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.62, -6.2]}>
        <boxGeometry args={[11.4, 0.06, 2.8]} />
        <meshStandardMaterial color="#a01f1f" roughness={0.9} />
      </mesh>
      {/* Viền sáng trước bục sân khấu */}
      <mesh position={[0, 0.65, -4.4]}>
        <boxGeometry args={[12, 0.08, 0.3]} />
        <meshStandardMaterial color="#ffd9a0" emissive="#ffbf6e" emissiveIntensity={1.2} />
      </mesh>
      {/* Biển GOT TALENT trên sân khấu + giờ mở cửa */}
      <mesh position={[0, 6.9, -8.5]}>
        <planeGeometry args={[6.5, 0.82]} />
        <meshBasicMaterial map={gotTalentTex} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.35, -7.4]} rotation={[-0.35, 0, 0]}>
        <planeGeometry args={[5.5, 0.52]} />
        <meshBasicMaterial map={hoursTex} toneMapped={false} />
      </mesh>
      {/* Màn hình trên sân khấu: khung + thumbnail + video live */}
      <mesh position={[0, 3, -8.15]}>
        <boxGeometry args={[8.6, 5.1, 0.15]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <ScreenFace videoId={videoId} width={8} height={4.5} />
      {showLive && (
        <LiveScreen videoId={videoId} onEnded={onEnded} onPlayerReady={onPlayerReady}
          controls={controls} startSeconds={startSeconds} width={8} height={4.5} />
      )}
      {/* Rèm nhung đỏ 2 bên + diềm trên màn hình */}
      <PleatedCurtain position={[-4.9, 3, -7.7]} width={1.4} height={5.2} />
      <PleatedCurtain position={[4.9, 3, -7.7]} width={1.4} height={5.2} />
      <PleatedCurtain position={[0, 5.9, -7.7]} width={10.6} height={0.9} />
      {/* Bảng điểm ca sĩ đang hát */}
      <ScoreBoard singerName={singerName} averageScore={averageScore} scorerCount={scorerCount} />
      {/* Mic đứng giữa sân khấu + chùm sáng sân khấu */}
      <MicStand position={[0, 0.62, -6.2]} />
      <mesh position={[0, 3.4, -6.2]} rotation={[0, 0, 0]}>
        <coneGeometry args={[1.6, 5.5, 24, 1, true]} />
        <meshBasicMaterial color="#ffe9b0" transparent opacity={0.07} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* Quả cầu disco nhỏ trên trần trước sân khấu */}
      <group position={[0, 5.4, -3.5]}>
        <mesh position={[0, 0.8, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 1.4, 8]} />
          <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.42, 16, 16]} />
          <meshStandardMaterial color="#cfd6e4" metalness={0.9} roughness={0.15} />
        </mesh>
      </group>
      {seatMeshes}
    </>
  );
}

export default function Karaoke3D({ room, seats, mySeat, guest, cameraPreset, videoId, showLive, onEnded, onPlayerReady, controls, startSeconds, singerName, averageScore, scorerCount, reAim }) {
  return (
    <Canvas camera={{ position: KARAOKE_CAMERA_PRESETS[cameraPreset].pos, fov: 55 }}>
      <color attach="background" args={['#0a0505']} />
      <Rig preset={cameraPreset} reAim={reAim} />
      <Stage room={room} seats={seats} mySeat={mySeat} guest={guest} videoId={videoId}
        showLive={showLive} onEnded={onEnded} onPlayerReady={onPlayerReady}
        controls={controls} startSeconds={startSeconds}
        singerName={singerName} averageScore={averageScore} scorerCount={scorerCount} />
    </Canvas>
  );
}
