import { useEffect, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { seatId } from '../data';

// 4 góc camera như bản gốc: toàn cảnh, từ ghế, tập trung màn hình, từ màn chiếu về hàng ghế.
// Góc "từ màn chiếu" phải đứng TRƯỚC mặt màn hình (z = -6.2, màn hình ở z = -8) rồi
// nhìn ngược về hàng ghế — đặt camera sau màn hình (z < -8) chỉ thấy khung màn hình đen.
export const CAMERA_PRESETS = {
  overview: { label: 'Toàn cảnh rạp', pos: [0, 9, 15], look: [0, 1, -2] },
  seat: { label: 'Góc nhìn từ ghế', pos: [0, 1.7, 7.5], look: [0, 2.2, -10] },
  screen: { label: 'Tập trung màn hình', pos: [0, 2, -3], look: [0, 2.4, -10] },
  reverse: { label: 'Từ màn chiếu về hàng ghế', pos: [0, 2.6, -6.2], look: [0, 1.0, 10] },
};

function Rig({ preset }) {
  const target = useMemo(() => new THREE.Vector3(...CAMERA_PRESETS[preset].pos), [preset]);
  const look = useMemo(() => new THREE.Vector3(...CAMERA_PRESETS[preset].look), [preset]);
  useFrame((state, dt) => {
    const p = CAMERA_PRESETS[preset];
    target.lerp(new THREE.Vector3(...p.pos), 1 - Math.pow(0.001, dt));
    look.lerp(new THREE.Vector3(...p.look), 1 - Math.pow(0.001, dt));
    state.camera.position.copy(target);
    state.camera.lookAt(look);
  });
  return null;
}

// Màn hình chiếu: hiển thị ảnh thumbnail của video đang chiếu (YouTube không cho
// nhúng iframe làm texture WebGL, nên mặt màn hình dùng thumbnail; video thật chạy
// ở iframe overlay khi chọn góc "Tập trung màn hình" — xem RoomView + README).
// Nạp texture bằng TextureLoader.load có onError (không dùng useLoader, để thumbnail
// lỗi thì mặt màn hình vẫn là tấm phát sáng xanh, không vỡ cả rạp).
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

function Seat({ position, color, mine, baseColor = '#232a38', baseBack = '#2c3547' }) {
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
    </group>
  );
}

// Sao trên trời cho Rạp Trời (vị trí cố định, không random mỗi lần render).
const STARS = Array.from({ length: 40 }, (_, i) => {
  const a = (i * 2.39996) % (Math.PI * 2);
  const r = 8 + (i % 7);
  return [Math.cos(a) * r, 7 + (i % 5), -6 - (i % 9) * 0.8];
});

function Auditorium({ room, seats, mySeat, guest, videoId }) {
  const isSky = room.kind === 'sky';
  const seatMeshes = [];
  const tableMeshes = [];
  if (room.kind === 'cinema') {
    room.rows.forEach((row, ri) => {
      for (let c = 1; c <= room.cols; c++) {
        const id = seatId(row, c);
        const occ = seats[id];
        seatMeshes.push(
          <Seat key={id} position={[(c - 5.5) * 1.05, 0, 2 + ri * 1.15]}
            color={occ ? (occ.kind === 'me' ? guest.color.hex : '#8bc6c0') : null}
            mine={occ?.kind === 'me'} />,
        );
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
        seatMeshes.push(
          <Seat key={id} position={[cx + Math.cos(a) * 1.5, 0, cz + Math.sin(a) * 1.5]}
            color={occ ? (occ.kind === 'me' ? guest.color.hex : '#d7bc75') : null}
            mine={occ?.kind === 'me'}
            baseColor="#5a4632" baseBack="#6b543a" />,
        );
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

export default function Cinema3D({ room, seats, mySeat, guest, cameraPreset, videoId }) {
  return (
    <Canvas camera={{ position: CAMERA_PRESETS[cameraPreset].pos, fov: 55 }}>
      <color attach="background" args={[room.kind === 'sky' ? '#0a1220' : '#05070a']} />
      <Rig preset={cameraPreset} />
      <Auditorium room={room} seats={seats} mySeat={mySeat} guest={guest} videoId={videoId} />
    </Canvas>
  );
}
