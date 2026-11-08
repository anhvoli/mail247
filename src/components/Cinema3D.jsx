import { useEffect, useMemo, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { seatId } from '../data';
import YouTubePlayer from '../youtube';
import AvatarWalk from './AvatarWalk';
import { PleatedCurtain, Rig, ScreenFace } from './shared3d';

// 4 góc camera như bản gốc: toàn cảnh, từ ghế, tập trung màn hình, từ màn chiếu về hàng ghế.
// Góc "từ màn chiếu" phải đứng TRƯỚC mặt màn hình (z = -6.2, màn hình ở z = -8) rồi
// nhìn ngược về hàng ghế — đặt camera sau màn hình (z < -8) chỉ thấy khung màn hình đen.
export const CAMERA_PRESETS = {
  overview: { label: 'Toàn cảnh rạp', pos: [0, 9, 15], look: [0, 1, -2] },
  // Góc ghế (round 4): trước đây camera ở y=1.7, z=7.5 — NGAY GIỮA hàng ghế,
  // ngang tầm đầu người ngồi nên đầu avatar chắn tầm nhìn, còn bảng tên
  // (drei Html distanceFactor) phình to ~200px khi ở sát camera. Nay đặt
  // sau hàng ghế cuối (hàng J ở z≈12.35), cao hơn đầu người (đỉnh đầu ~1.75),
  // nhìn về tâm màn hình — màn hình hiện rõ phía trên các hàng ghế trước mặt.
  seat: { label: 'Góc nhìn từ ghế', pos: [0, 2.7, 13.2], look: [0, 2.4, -8] },
  screen: { label: 'Tập trung màn hình', pos: [0, 2, -3], look: [0, 2.4, -10] },
  reverse: { label: 'Từ màn chiếu về hàng ghế', pos: [0, 2.6, -6.2], look: [0, 1.0, 10] },
};

// Rig / ScreenFace / PleatedCurtain dùng chung ở ./shared3d (N-09 —
// trước đây mỗi file 3D một bản trùng nhau, chỉ khác bảng preset camera
// của Rig và vị trí/kích thước màn hình của ScreenFace).

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
      <ScreenFace videoId={videoId} width={width} height={height} position={[0, 2.6, -8]} />
    </group>
  );
}

// (PleatedCurtain dùng chung ở ./shared3d — N-09.)

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
  // N-02: CanvasTexture tạo bằng useMemo thì dispose khi unmount, nếu
  // không mỗi lần vào lại Rạp phim rò 4 texture banner.
  useEffect(() => () => {
    t1Tex.dispose(); blgTex.dispose(); topTex.dispose(); timeTex.dispose();
  }, [t1Tex, blgTex, topTex, timeTex]);
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
// vòng tròn xanh trên sàn). Round 4: vòng cũ (r 0.5–0.64, y=0.02) nằm LỌT
// dưới đế ghế (đế 0.85×0.8, nửa đường chéo ~0.58) nên từ góc toàn cảnh chỉ
// thấy ghế đen — vòng mới r 0.72–0.92 ôm TRỌN ngoài đế ghế, nâng lên y=0.05
// + polygonOffset để không bị z-fighting với sàn, nhìn rõ từ trên cao.
function EmptySeatRing({ position }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[position[0], 0.05, position[2]]}>
      <ringGeometry args={[0.72, 0.92, 32]} />
      <meshBasicMaterial color="#b8cd8e" toneMapped={false} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
    </mesh>
  );
}

// Sao trên trời cho Rạp Trời (vị trí cố định, không random mỗi lần render).
const STARS = Array.from({ length: 40 }, (_, i) => {
  const a = (i * 2.39996) % (Math.PI * 2);
  const r = 8 + (i % 7);
  return [Math.cos(a) * r, 7 + (i % 5), -6 - (i % 9) * 0.8];
});

function Auditorium({ room, seats, mySeat, guest, videoId, showLive, onEnded, onPlayerReady, controls, startSeconds, hideMeSeat, showNames }) {
  const isSky = room.kind === 'sky';
  // frameloop="demand" (M-03, pattern Arena3D): R3F không tự vẽ khi props
  // đổi; các thứ làm đổi cảnh (bot đổi ghế, đổi bài, bật/tắt tên/live, ẩn
  // hình người ngồi khi đi lại) phải gọi invalidate() để vẽ lại 1 frame.
  // Rig lo invalidate khi đổi góc, ScreenFace lo khi thumbnail về,
  // AvatarWalk tự invalidate trong useFrame khi đang đi lại.
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => { invalidate(); }, [seats, videoId, showLive, showNames, hideMeSeat, invalidate]);
  const seatMeshes = [];
  const tableMeshes = [];
  if (room.kind === 'cinema') {
    room.rows.forEach((row, ri) => {
      for (let c = 1; c <= room.cols; c++) {
        const id = seatId(row, c);
        const occ = seats[id];
        // Khi khách đang đi lại (avatar đi bộ hiện ra), ẩn hình người ngồi
        // của chính khách trên ghế để không có 2 "mình" cùng lúc.
        const me = occ?.kind === 'me';
        const shown = occ && !(me && hideMeSeat);
        const pos = [(c - 5.5) * 1.05, 0, 2 + ri * 1.15];
        seatMeshes.push(
          <Seat key={id} position={pos}
            color={shown ? (me ? guest.color.hex : '#8bc6c0') : null}
            mine={me && !hideMeSeat}
            name={showNames && shown ? occ.name : null} />,
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
        const me = occ?.kind === 'me';
        const shown = occ && !(me && hideMeSeat);
        const pos = [cx + Math.cos(a) * 1.5, 0, cz + Math.sin(a) * 1.5];
        seatMeshes.push(
          <Seat key={id} position={pos}
            color={shown ? (me ? guest.color.hex : '#d7bc75') : null}
            mine={me && !hideMeSeat}
            name={showNames && shown ? occ.name : null}
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

export default function Cinema3D({ room, seats, mySeat, guest, cameraPreset, videoId, showLive, onEnded, onPlayerReady, controls, startSeconds, onPickSeat, reAim }) {
  // Đang đi lại thì ẩn hình người ngồi của khách trên ghế (xem Auditorium).
  const [walking, setWalking] = useState(false);
  // Bảng tên (drei Html distanceFactor) chỉ hiện ở góc toàn cảnh + tập trung
  // màn hình: ở góc ghế/góc ngược camera sát người ngồi nên tên phình to
  // ~200px và chồng lên nhau, che cả màn hình (round 4).
  const showNames = cameraPreset === 'overview' || cameraPreset === 'screen';
  return (
    <Canvas frameloop="demand" camera={{ position: CAMERA_PRESETS[cameraPreset].pos, fov: 55 }}>
      <color attach="background" args={[room.kind === 'sky' ? '#0a1220' : '#05070a']} />
      <Rig presets={CAMERA_PRESETS} preset={cameraPreset} reAim={reAim} />
      <AvatarWalk room={room} seats={seats} guest={guest} mySeat={mySeat}
        cameraPreset={cameraPreset} onPickSeat={onPickSeat} onWalkChange={setWalking} />
      <Auditorium room={room} seats={seats} mySeat={mySeat} guest={guest} videoId={videoId}
        showLive={showLive} onEnded={onEnded} onPlayerReady={onPlayerReady}
        controls={controls} startSeconds={startSeconds} hideMeSeat={walking} showNames={showNames} />
    </Canvas>
  );
}
