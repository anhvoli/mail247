import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { seatId } from '../data';

// 4 góc camera như bản gốc: toàn cảnh, từ ghế, tập trung màn hình, từ màn chiếu về hàng ghế.
export const CAMERA_PRESETS = {
  overview: { label: 'Toàn cảnh rạp', pos: [0, 9, 15], look: [0, 1, -2] },
  seat: { label: 'Góc nhìn từ ghế', pos: [0, 1.7, 7.5], look: [0, 2.2, -10] },
  screen: { label: 'Tập trung màn hình', pos: [0, 2, -3], look: [0, 2.4, -10] },
  reverse: { label: 'Từ màn chiếu về hàng ghế', pos: [0, 3, -9], look: [0, 1, 10] },
};

function Rig({ preset }) {
  const target = useRef(new THREE.Vector3(...CAMERA_PRESETS[preset].pos));
  const look = useRef(new THREE.Vector3(...CAMERA_PRESETS[preset].look));
  useFrame((state, dt) => {
    const p = CAMERA_PRESETS[preset];
    target.current.lerp(new THREE.Vector3(...p.pos), 1 - Math.pow(0.001, dt));
    look.current.lerp(new THREE.Vector3(...p.look), 1 - Math.pow(0.001, dt));
    state.camera.position.copy(target.current);
    state.camera.lookAt(look.current);
  });
  return null;
}

function Seat({ position, color, mine }) {
  return (
    <group position={position}>
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
    </group>
  );
}

function Auditorium({ room, seats, mySeat, guest }) {
  const isSky = room.kind === 'sky';
  const seatMeshes = [];
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
      for (let s = 0; s < room.seatsPerTable; s++) {
        const a = (s / room.seatsPerTable) * Math.PI * 2;
        const id = `B${String(t + 1).padStart(2, '0')}-${s + 1}`;
        const occ = seats[id];
        seatMeshes.push(
          <Seat key={id} position={[cx + Math.cos(a) * 0.9, 0, cz + Math.sin(a) * 0.9]}
            color={occ ? (occ.kind === 'me' ? guest.color.hex : '#d7bc75') : null}
            mine={occ?.kind === 'me'} />,
        );
      }
    }
  }
  return (
    <>
      <ambientLight intensity={0.55} />
      <pointLight position={[0, 6, 4]} intensity={60} color="#ffe9b0" />
      <pointLight position={[-6, 4, -6]} intensity={25} color="#b8cd8e" />
      {/* Sàn */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 2]}>
        <planeGeometry args={[16, 18]} />
        <meshStandardMaterial color={isSky ? '#2a2118' : '#14161c'} />
      </mesh>
      {/* Màn hình */}
      <mesh position={[0, 2.6, -8]}>
        <planeGeometry args={[9, 5]} />
        <meshStandardMaterial color="#0b0b0b" emissive="#9db8ff" emissiveIntensity={0.55} />
      </mesh>
      <mesh position={[0, 2.6, -8.1]}>
        <boxGeometry args={[9.6, 5.6, 0.15]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Rèm đỏ hai bên (rạp phim) */}
      {!isSky && (
        <>
          <mesh position={[-5.2, 2.6, -7.8]}><boxGeometry args={[0.8, 5.6, 0.4]} /><meshStandardMaterial color="#8e1f1f" /></mesh>
          <mesh position={[5.2, 2.6, -7.8]}><boxGeometry args={[0.8, 5.6, 0.4]} /><meshStandardMaterial color="#8e1f1f" /></mesh>
          <mesh position={[0, 5.6, -7.8]}><boxGeometry args={[11, 0.6, 0.4]} /><meshStandardMaterial color="#8e1f1f" /></mesh>
        </>
      )}
      {/* Quả cầu disco */}
      <mesh position={[0, 5.2, 0]}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color="#cfd6e4" metalness={0.9} roughness={0.15} />
      </mesh>
      {seatMeshes}
    </>
  );
}

export default function Cinema3D({ room, seats, mySeat, guest, cameraPreset }) {
  return (
    <Canvas camera={{ position: CAMERA_PRESETS[cameraPreset].pos, fov: 55 }}>
      <Rig preset={cameraPreset} />
      <Auditorium room={room} seats={seats} mySeat={mySeat} guest={guest} />
    </Canvas>
  );
}
