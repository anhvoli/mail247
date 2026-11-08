// shared3d.jsx — các mảnh 3D dùng chung giữa Rạp phim (Cinema3D),
// Karaoke (Karaoke3D) và Sảnh (Sanh3D). Tách từ 3 bản trùng nhau (N-09):
// ScreenFace gần như giống hệt ở 3 file, PleatedCurtain giống hệt ở
// Cinema + Karaoke, Rig lặp ở mỗi file chỉ khác bảng preset camera.
// Arena3D KHÔNG dùng file này (bản của Arena khác: ScreenFace có cache
// refcount riêng + mặt trước/sau, Rig riêng) — giữ nguyên Arena.
//
// Lưu ý dùng chung cho cả 3 phòng:
// - ScreenFace dispose texture cũ khi đổi video/unmount (N-02) và gọi
//   invalidate() khi texture về để frameloop="demand" vẽ lại 1 frame
//   (M-03). Ở Sảnh (frameloop="always") 2 lệnh này thừa nhưng vô hại.
// - Rig gọi invalidate() sau khi đặt camera để góc mới hiện ngay ở chế
//   độ demand (theo đúng pattern Arena3D).
import { useEffect, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Mặt màn hình: thumbnail video làm lớp nền dưới iframe live (YouTube
// không cho nhúng iframe làm texture WebGL). Vị trí/kích thước truyền qua
// prop vì mỗi phòng đặt màn hình một chỗ khác nhau.
export function ScreenFace({ videoId, width, height, position }) {
  const [texture, setTexture] = useState(null);
  const texRef = useRef(null);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    let alive = true;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      (tex) => {
        if (!alive) { tex.dispose(); return; }
        if (texRef.current && texRef.current !== tex) texRef.current.dispose();
        texRef.current = tex;
        setTexture(tex);
      },
      undefined,
      () => { if (alive) setTexture(null); },
    );
    return () => {
      // Đổi video/unmount: dispose texture cũ thay vì chỉ đặt alive=false
      // (N-02 — trước đây mỗi lần đổi bài rò 1 texture thumbnail).
      alive = false;
      if (texRef.current) { texRef.current.dispose(); texRef.current = null; }
      setTexture(null);
    };
  }, [videoId]);
  // frameloop="demand": thumbnail về sau mount thì vẽ lại 1 frame để hiện.
  useEffect(() => { if (texture) invalidate(); }, [texture, invalidate]);
  if (!texture) {
    return (
      <mesh position={position}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color="#0b0b0b" emissive="#9db8ff" emissiveIntensity={0.55} />
      </mesh>
    );
  }
  return (
    <mesh position={position}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

// Rèm nhung đỏ xếp ly: nhiều nếp dọc xen kẽ 2 tông đỏ, hơi lệch z để tạo
// nếp gấp. (Bản gốc y hệt nhau ở Cinema3D + Karaoke3D.)
export function PleatedCurtain({ position, width, height, vertical = true }) {
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

// Đổi góc camera: đặt thẳng vị trí + hướng nhìn khi đổi preset (không lerp
// từng frame — đổi góc phải tức thì và xác định). Bảng preset truyền qua
// prop vì mỗi phòng một bộ góc riêng. reAim đổi mỗi lần bấm nút góc (kể
// cả bấm lại góc đang chọn) hoặc ngồi xuống ghế sau khi đi lại — vì
// AvatarWalk chỉnh camera trực tiếp nên chỉ đổi preset mới ngắm lại được,
// bấm lại góc cũ là state no-op và camera kẹt ở vị trí đi lại
// (fix 07/11 ~00:30, xem Cinema3D.jsx).
export function Rig({ presets, preset, reAim }) {
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const p = presets[preset];
    camera.position.set(p.pos[0], p.pos[1], p.pos[2]);
    camera.lookAt(p.look[0], p.look[1], p.look[2]);
    camera.updateProjectionMatrix();
    // frameloop="demand": camera đổi thì phải vẽ lại 1 frame ngay, nếu
    // không góc mới chỉ hiện khi có invalidate khác (pattern Arena3D).
    invalidate();
  }, [presets, preset, camera, reAim, invalidate]);
  return null;
}
