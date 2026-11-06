import { useEffect, useMemo, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { seatId } from '../data';
import YouTubePlayer from '../youtube';

// 4 góc camera như bản gốc: toàn cảnh, từ ghế, tập trung màn hình, từ màn chiếu về hàng ghế.
// Góc "từ màn chiếu" phải đứng TRƯỚC mặt màn hình (z = -6.2, màn hình ở z = -8) rồi
// nhìn ngược về hàng ghế — đặt camera sau màn hình (z < -8) chỉ thấy khung màn hình đen.
export const CAMERA_PRESETS = {
  overview: { label: 'Toàn cảnh rạp', pos: [0, 9, 15], look: [0, 1, -2] },
  seat: { label: 'Góc nhìn từ ghế', pos: [0, 1.7, 7.5], look: [0, 2.2, -10] },
  screen: { label: 'Tập trung màn hình', pos: [0, 2, -3], look: [0, 2.4, -10] },
  reverse: { label: 'Từ màn chiếu về hàng ghế', pos: [0, 2.6, -6.2], look: [0, 1.0, 10] },
};

// Đổi góc camera: đặt thẳng vị trí + hướng nhìn khi đổi preset (không lerp
// từng frame — đổi góc phải tức thì và xác định, không phụ thuộc trạng thái
// lerp cũ hay số frame đã chạy). Canvas không bao giờ bị unmount/thay thế
// khi đổi góc; chỉ có camera di chuyển.
function Rig({ preset }) {
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    const p = CAMERA_PRESETS[preset];
    camera.position.set(p.pos[0], p.pos[1], p.pos[2]);
    camera.lookAt(p.look[0], p.look[1], p.look[2]);
    camera.updateProjectionMatrix();
  }, [preset, camera]);
  return null;
}

// Màn hình chiếu: hiển thị ảnh thumbnail của video đang chiếu làm LỚP NỀN
// dưới iframe live (YouTube không cho nhúng iframe làm texture WebGL).
// Khi iframe live bị ẩn (góc ghế / góc ngược — xem LiveScreen), mặt màn hình
// vẫn có thumbnail nên không bao giờ trống. Nạp bằng TextureLoader.load có
// onError (không dùng useLoader, để thumbnail lỗi thì mặt màn hình vẫn là tấm
// phát sáng xanh, không vỡ cả rạp).
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
      <mesh position={[0, 2.6, -8]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color="#0b0b0b" emissive="#9db8ff" emissiveIntensity={0.55} />
      </mesh>
    );
  }
  return (
    <mesh position={[0, 2.6, -8]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

// Màn hình chiếu LIVE (round 3): drei Html transform nhúng đúng iframe trình
// phát YouTube lên mặt phẳng màn hình trong cảnh 3D — video chạy thật, đổi góc
// camera thì màn hình phối cảnh theo như màn hình thật, không phải ảnh tĩnh.
// Tỉ lệ của drei (đọc từ node_modules/@react-three/drei/web/Html.js):
// bề rộng thế giới = px * distanceFactor / 400, nên div 900x500px +
// distanceFactor 4 = đúng 9x5 đơn vị (màn rạp phim); Rạp Trời 1100x600px = 11x6.
// Iframe DOM nằm TRÊN canvas WebGL nên: (a) ở góc "từ màn chiếu về hàng ghế"
// (camera đứng trước mặt màn hình, nhìn ngược lại) màn hình ở sau lưng người
// xem — RoomView không render LiveScreen ở góc đó; (b) ở góc ghế, ghế ngồi có
// thể bị iframe "xuyên qua" (iframe luôn vẽ trên canvas) nên cũng ẩn ở góc
// ghế — lúc đó mặt màn hình chỉ còn thumbnail (ScreenFace) làm nền, không
// bao giờ trống. Player vẫn là 1 instance duy nhất (youtube.jsx): ẩn/hiện
// theo góc thì player unmount/remount và phát tiếp từ startSeconds (giây đã
// xem tới) nhờ RoomView poll getCurrentTime mỗi giây.
function LiveScreen({ videoId, onEnded, onPlayerReady, controls, startSeconds, width, height }) {
  return (
    <Html transform distanceFactor={4} position={[0, 2.6, -7.9]} zIndexRange={[10, 0]}>
      <div style={{ width: `${width * 100}px`, height: `${height * 100}px` }}>
        <YouTubePlayer videoId={videoId} onEnded={onEnded} onPlayerReady={onPlayerReady}
          controls={controls} startSeconds={startSeconds} />
      </div>
    </Html>
  );
}

function Screen({ videoId, isSky }) {
  const width = isSky ? 11 : 9;
  const height = isSky ? 6 : 5;
  return (
    <group>
      {/* Khung màn hình phía sau */}
      <mesh position={[0, 2.6, -8.15]}>
        <boxGeometry args={[width + 0.6, height + 0.6, 0.15]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <ScreenFace videoId={videoId} width={width} height={height} />
    </group>
  );
}

// Rèm nhung đỏ xếp ly: nhiều nếp dọc xen kẽ 2 tông đỏ, hơi lệch z để tạo nếp gấp.
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

// Loa tháp lớn 2 bên màn hình: thùng đen + 3 loa tròn.
function SpeakerTower({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 2.1, 0]}>
        <boxGeometry args={[1.3, 4.2, 0.9]} />
        <meshStandardMaterial color="#0d0d0d" roughness={0.7} />
      </mesh>
      {[3.3, 2.1, 0.9].map((y, i) => (
        <group key={y}>
          <mesh position={[0, y, 0.46]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.48 - i * 0.09, 0.48 - i * 0.09, 0.1, 24]} />
            <meshStandardMaterial color="#2a2a2a" roughness={0.5} />
          </mesh>
          <mesh position={[0, y, 0.52]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.06, 16]} />
            <meshStandardMaterial color="#111111" roughness={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Trang trí sự kiện T1 vs BLG (bán kết CKTG 2026, 05:00 thứ Hai 09.11.2026)
// — CHỈ trang trí phần xung quanh, KHÔNG đụng màn hình: cờ dọc gắn phẳng lên
// 2 tường bên (đúng phối cảnh + ánh sáng 3D, không phải ảnh dán phẳng), banner
// ngang trên tường sau phía trên màn hình, viền vàng mỏng quanh khung màn.
// Tắt nhanh bằng EVENT_DECOR = false. Cặp đấu chỉ chốt khi T1 thắng KC 7/11.
const EVENT_DECOR = true;

function makeVerticalBannerTexture({ bg, title, sub, accent }) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 512;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, bg); g.addColorStop(1, '#0d0d0d');
  x.fillStyle = g; x.fillRect(0, 0, 256, 512);
  x.strokeStyle = accent; x.lineWidth = 6; x.strokeRect(10, 10, 236, 492);
  x.fillStyle = '#ffffff'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = '900 96px Arial, sans-serif';
  const lines = title.split('');
  const startY = 190;
  lines.forEach((ch, i) => x.fillText(ch, 128, startY + i * 92));
  x.fillStyle = accent; x.font = '700 34px Arial, sans-serif';
  x.fillText(sub, 128, 430);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return tex;
}

function makeHorizontalBannerTexture({ text, bg = '#0d0d0d', fg = '#ffd75e' }) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 96;
  const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, 1024, 96);
  x.strokeStyle = fg; x.lineWidth = 4; x.strokeRect(6, 6, 1012, 84);
  x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = '700 44px Arial, sans-serif';
  x.fillText(text, 512, 50);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return tex;
}

function EventDecor() {
  const t1Tex = useMemo(() => makeVerticalBannerTexture({ bg: '#a80000', title: 'T1', sub: 'LCK', accent: '#ffd75e' }), []);
  const blgTex = useMemo(() => makeVerticalBannerTexture({ bg: '#0077b6', title: 'BLG', sub: 'LPL', accent: '#ff7ab8' }), []);
  const topTex = useMemo(() => makeHorizontalBannerTexture({ text: 'BÁN KẾT  •  CKTG 2026  •  T1 vs BLG' }), []);
  const timeTex = useMemo(() => makeHorizontalBannerTexture({ text: '05:00  •  THỨ HAI 09.11.2026  •  BO5' }), []);
  return (
    <group>
      {/* Đèn màu nhẹ 2 bên sân khấu: đỏ bên T1, xanh bên BLG */}
      <pointLight position={[-6, 3, -6]} intensity={12} color="#ff2020" />
      <pointLight position={[6, 3, -6]} intensity={12} color="#00a8ff" />
      {/* Cờ dọc tường trái: T1 — đặt lệch z khỏi đèn tường (-1 / 4) để không che đèn */}
      <mesh position={[-8.05, 3.0, 1.5]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[1.1, 2.6]} />
        <meshBasicMaterial map={t1Tex} toneMapped={false} />
      </mesh>
      <mesh position={[-8.05, 3.0, 6.5]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[1.1, 2.6]} />
        <meshBasicMaterial map={t1Tex} toneMapped={false} />
      </mesh>
      {/* Cờ dọc tường phải: BLG */}
      <mesh position={[8.05, 3.0, 1.5]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[1.1, 2.6]} />
        <meshBasicMaterial map={blgTex} toneMapped={false} />
      </mesh>
      <mesh position={[8.05, 3.0, 6.5]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[1.1, 2.6]} />
        <meshBasicMaterial map={blgTex} toneMapped={false} />
      </mesh>
      {/* Banner ngang trên tường sau, phía trên rèm — không che màn hình */}
      <mesh position={[0, 6.6, -8.6]}>
        <planeGeometry args={[8, 0.75]} />
        <meshBasicMaterial map={topTex} toneMapped={false} />
      </mesh>
      {/* Băng giờ: dải mỏng sát sàn trước sân khấu, dưới tầm màn hình */}
      <mesh position={[0, 0.38, -7.55]} rotation={[-0.35, 0, 0]}>
        <planeGeometry args={[6.5, 0.62]} />
        <meshBasicMaterial map={timeTex} toneMapped={false} />
      </mesh>
      {/* Viền vàng mỏng quanh khung màn hình */}
      <mesh position={[0, 5.32, -8.05]}>
        <boxGeometry args={[9.7, 0.07, 0.06]} />
        <meshBasicMaterial color="#ffd75e" toneMapped={false} />
      </mesh>
      <mesh position={[0, -0.12, -8.05]}>
        <boxGeometry args={[9.7, 0.07, 0.06]} />
        <meshBasicMaterial color="#ffd75e" toneMapped={false} />
      </mesh>
    </group>
  );
}

// Đèn tường ấm 2 bên (đèn + quầng sáng).
function WallLight({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.18, 0.7, 0.3]} />
        <meshStandardMaterial color="#3a2c14" />
      </mesh>
      <mesh position={[0, 0, 0.18]}>
        <boxGeometry args={[0.12, 0.5, 0.06]} />
        <meshStandardMaterial color="#ffd9a0" emissive="#ffbf6e" emissiveIntensity={1.6} />
      </mesh>
    </group>
  );
}

function Seat({ position, color, mine, name, baseColor = '#232a38', baseBack = '#2c3547' }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.85, 0.7, 0.8]} />
        <meshStandardMaterial color={mine ? '#b8cd8e' : baseColor} />
      </mesh>
      <mesh position={[0, 0.95, 0.28]}>
        <boxGeometry args={[0.85, 0.7, 0.18]} />
        <meshStandardMaterial color={mine ? '#c6e48b' : baseBack} />
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
      {/* Bảng tên lơ lửng trên đầu người ngồi (như bản gốc) */}
      {name && (
        <Html position={[0, 2.05, 0]} center distanceFactor={10} zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }}>
          <div className="nametag">{name}</div>
        </Html>
      )}
    </group>
  );
}

// Vòng xanh lá trên sàn quanh ghế trống (như bản gốc: ghế trống đánh dấu bằng
// vòng tròn xanh trên sàn).
function EmptySeatRing({ position }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[position[0], 0.02, position[2]]}>
      <ringGeometry args={[0.5, 0.64, 28]} />
      <meshBasicMaterial color="#b8cd8e" toneMapped={false} />
    </mesh>
  );
}

// Sao trên trời cho Rạp Trời (vị trí cố định, không random mỗi lần render).
const STARS = Array.from({ length: 40 }, (_, i) => {
  const a = (i * 2.39996) % (Math.PI * 2);
  const r = 8 + (i % 7);
  return [Math.cos(a) * r, 7 + (i % 5), -6 - (i % 9) * 0.8];
});

function Auditorium({ room, seats, mySeat, guest, videoId, showLive, onEnded, onPlayerReady, controls, startSeconds }) {
  const isSky = room.kind === 'sky';
  const seatMeshes = [];
  const tableMeshes = [];
  if (room.kind === 'cinema') {
    room.rows.forEach((row, ri) => {
      for (let c = 1; c <= room.cols; c++) {
        const id = seatId(row, c);
        const occ = seats[id];
        const pos = [(c - 5.5) * 1.05, 0, 2 + ri * 1.15];
        seatMeshes.push(
          <Seat key={id} position={pos}
            color={occ ? (occ.kind === 'me' ? guest.color.hex : '#8bc6c0') : null}
            mine={occ?.kind === 'me'}
            name={occ ? occ.name : null} />,
        );
        if (!occ) seatMeshes.push(<EmptySeatRing key={`ring-${id}`} position={pos} />);
      }
    });
  } else {
    for (let t = 0; t < room.tables; t++) {
      const angle0 = (t / room.tables) * Math.PI * 2;
      const cx = Math.cos(angle0) * 4.2;
      const cz = 3 + Math.sin(angle0) * 3.2;
      // Bàn tròn gỗ sáng màu, nhìn rõ là bàn chứ không phải chấm tối.
      tableMeshes.push(
        <group key={`table-${t}`} position={[cx, 0, cz]}>
          <mesh position={[0, 0.75, 0]}>
            <cylinderGeometry args={[1.15, 1.15, 0.12, 24]} />
            <meshStandardMaterial color="#8a6a3f" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.12, 0.18, 0.7, 12]} />
            <meshStandardMaterial color="#5a4632" roughness={0.7} />
          </mesh>
        </group>,
      );
      for (let s = 0; s < room.seatsPerTable; s++) {
        const a = (s / room.seatsPerTable) * Math.PI * 2;
        const id = `B${String(t + 1).padStart(2, '0')}-${s + 1}`;
        const occ = seats[id];
        const pos = [cx + Math.cos(a) * 1.5, 0, cz + Math.sin(a) * 1.5];
        seatMeshes.push(
          <Seat key={id} position={pos}
            color={occ ? (occ.kind === 'me' ? guest.color.hex : '#d7bc75') : null}
            mine={occ?.kind === 'me'}
            name={occ ? occ.name : null}
            baseColor="#5a4632" baseBack="#6b543a" />,
        );
        if (!occ) seatMeshes.push(<EmptySeatRing key={`ring-${id}`} position={pos} />);
      }
    }
  }
  return (
    <>
      <ambientLight intensity={0.55} />
      <pointLight position={[0, 6, 4]} intensity={60} color="#ffe9b0" />
      <pointLight position={[-6, 4, -6]} intensity={25} color="#b8cd8e" />
      {/* Đèn tường ấm 2 bên */}
      <pointLight position={[-7.4, 3.2, 0]} intensity={14} color="#ffbf6e" />
      <pointLight position={[7.4, 3.2, 0]} intensity={14} color="#ffbf6e" />
      {/* Sàn */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 2]}>
        <planeGeometry args={[18, 20]} />
        <meshStandardMaterial color={isSky ? '#3a2f22' : '#14161c'} />
      </mesh>
      {/* Tường sau + 2 tường bên (rạp phim) */}
      {!isSky && (
        <>
          <mesh position={[0, 4, -8.7]}>
            <planeGeometry args={[18, 9]} />
            <meshStandardMaterial color="#0c0e13" />
          </mesh>
          <mesh position={[-8.2, 4, 2]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[20, 9]} />
            <meshStandardMaterial color="#10131a" />
          </mesh>
          <mesh position={[8.2, 4, 2]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[20, 9]} />
            <meshStandardMaterial color="#10131a" />
          </mesh>
          <WallLight position={[-7.9, 3.2, -1]} />
          <WallLight position={[-7.9, 3.2, 4]} />
          <WallLight position={[7.9, 3.2, -1]} />
          <WallLight position={[7.9, 3.2, 4]} />
        </>
      )}
      {/* Trang trí sự kiện T1 vs BLG — chỉ Rạp phim, chỉ phần xung quanh */}
      {EVENT_DECOR && !isSky && <EventDecor />}
      {/* Sân khấu Rạp Trời: bục gỗ nâng + đèn sân khấu */}
      {isSky && (
        <>
          <mesh position={[0, 0.3, -7]}>
            <boxGeometry args={[13, 0.6, 3.2]} />
            <meshStandardMaterial color="#6b4f2a" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.65, -5.3]}>
            <boxGeometry args={[13, 0.1, 0.5]} />
            <meshStandardMaterial color="#ffd9a0" emissive="#ffbf6e" emissiveIntensity={0.9} />
          </mesh>
          {STARS.map((p, i) => (
            <mesh key={i} position={p}>
              <sphereGeometry args={[0.06, 6, 6]} />
              <meshBasicMaterial color="#ffffff" toneMapped={false} />
            </mesh>
          ))}
          {/* Trăng tròn */}
          <mesh position={[-5.5, 7.5, -9]}>
            <sphereGeometry args={[0.9, 16, 16]} />
            <meshBasicMaterial color="#f5ead0" toneMapped={false} />
          </mesh>
        </>
      )}
      <Screen videoId={videoId} isSky={isSky} />
      {/* Video live trên mặt màn hình (chỉ góc toàn cảnh + tập trung màn hình —
          góc ghế/góc ngược thì ẩn iframe, chỉ còn thumbnail nền, xem LiveScreen). */}
      {showLive && (
        <LiveScreen videoId={videoId} onEnded={onEnded} onPlayerReady={onPlayerReady}
          controls={controls} startSeconds={startSeconds}
          width={isSky ? 11 : 9} height={isSky ? 6 : 5} />
      )}
      {/* Rèm nhung đỏ xếp ly: 2 bên + diềm trên màn hình (rạp phim) */}
      {!isSky && (
        <>
          <PleatedCurtain position={[-5.4, 2.6, -7.7]} width={1.6} height={5.6} />
          <PleatedCurtain position={[5.4, 2.6, -7.7]} width={1.6} height={5.6} />
          <PleatedCurtain position={[0, 5.7, -7.7]} width={11.6} height={0.9} />
          <SpeakerTower position={[-6.6, 0, -7.4]} />
          <SpeakerTower position={[6.6, 0, -7.4]} />
        </>
      )}
      {/* Loa Rạp Trời: 2 tháp nhỏ 2 bên sân khấu */}
      {isSky && (
        <>
          <SpeakerTower position={[-7.2, 0.6, -7]} />
          <SpeakerTower position={[7.2, 0.6, -7]} />
        </>
      )}
      {/* Quả cầu disco: treo cao TRƯỚC màn hình (z = -4.2, màn hình ở z = -8),
          kèm thanh treo lên trần — không che mặt màn hình. */}
      <group position={[0, 5.6, -4.2]}>
        <mesh position={[0, 0.9, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 1.6, 8]} />
          <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshStandardMaterial color="#cfd6e4" metalness={0.9} roughness={0.15} />
        </mesh>
      </group>
      {tableMeshes}
      {seatMeshes}
    </>
  );
}

export default function Cinema3D({ room, seats, mySeat, guest, cameraPreset, videoId, showLive, onEnded, onPlayerReady, controls, startSeconds }) {
  return (
    <Canvas camera={{ position: CAMERA_PRESETS[cameraPreset].pos, fov: 55 }}>
      <color attach="background" args={[room.kind === 'sky' ? '#0a1220' : '#05070a']} />
      <Rig preset={cameraPreset} />
      <Auditorium room={room} seats={seats} mySeat={mySeat} guest={guest} videoId={videoId}
        showLive={showLive} onEnded={onEnded} onPlayerReady={onPlayerReady}
        controls={controls} startSeconds={startSeconds} />
    </Canvas>
  );
}
