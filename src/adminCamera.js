// Góc quay từng phòng — do ADMIN chỉnh, web client chỉ xem (quy tắc 07/11).
// Lưu theo từng phòng vào localStorage; RoomView đọc preset lúc mở phòng và
// nghe live khi admin đổi (CustomEvent trên window) để đổi góc ngay mà khách
// không cần tải lại trang.

export const CAMERA_STORAGE_KEY = 'rapchieu-admin-camera';
export const CAMERA_EVENT = 'rapchieu:camera-change';

// Key preset dùng chung cho mọi phòng (khớp key của CAMERA_PRESETS /
// ARENA_CAMERA_PRESETS / KARAOKE_CAMERA_PRESETS trong các cảnh 3D).
export const CAMERA_PRESET_KEYS = ['overview', 'seat', 'screen', 'reverse'];
export const DEFAULT_CAMERA_PRESET = 'overview';

// Phòng có góc quay điều khiển được. Sảnh 3D chưa có preset riêng trong cảnh
// 3D (SanhView dùng camera đi theo người), nhưng vẫn giữ 1 slot để sau này
// SanhView nối vào cùng cơ chế này.
export const CAMERA_ROOMS = [
  { id: 'phim', name: 'Rạp phim' },
  { id: 'troi', name: 'Rạp Trời' },
  { id: 'arena', name: 'Đấu trường LoL Park' },
  { id: 'karaoke', name: 'Karaoke · Got Talent' },
  { id: 'sanh', name: 'Sảnh 3D' },
];

// Nhãn nút góc quay theo từng phòng (khớp nhãn trong các file *3D.jsx).
export const CAMERA_PRESET_LABELS = {
  phim: { overview: 'Toàn cảnh rạp', seat: 'Góc nhìn từ ghế', screen: 'Tập trung màn hình', reverse: 'Từ màn chiếu về hàng ghế' },
  troi: { overview: 'Toàn cảnh Rạp Trời', seat: 'Góc nhìn từ ghế', screen: 'Tập trung màn hình', reverse: 'Từ màn chiếu về hàng ghế' },
  arena: { overview: 'Toàn cảnh đấu trường', seat: 'Góc nhìn từ ghế', screen: 'Tập trung màn hình', reverse: 'Từ màn chiếu về hàng ghế' },
  karaoke: { overview: 'Toàn cảnh sân khấu', seat: 'Góc nhìn từ ghế', screen: 'Tập trung màn hình', reverse: 'Từ màn chiếu về hàng ghế' },
  sanh: { overview: 'Toàn cảnh sảnh', seat: 'Góc nhìn từ ghế', screen: 'Tập trung màn hình', reverse: 'Từ màn chiếu về hàng ghế' },
};

function isValidPreset(p) {
  return CAMERA_PRESET_KEYS.includes(p);
}

export function loadCameraPresets() {
  try {
    const raw = JSON.parse(localStorage.getItem(CAMERA_STORAGE_KEY) || 'null');
    if (raw && typeof raw === 'object') {
      const out = {};
      for (const r of CAMERA_ROOMS) out[r.id] = isValidPreset(raw[r.id]) ? raw[r.id] : DEFAULT_CAMERA_PRESET;
      return out;
    }
  } catch { /* localStorage hỏng / không có — dùng mặc định */ }
  const out = {};
  for (const r of CAMERA_ROOMS) out[r.id] = DEFAULT_CAMERA_PRESET;
  return out;
}

export function getCameraPreset(roomId) {
  const all = loadCameraPresets();
  return all[roomId] || DEFAULT_CAMERA_PRESET;
}

export function setCameraPreset(roomId, preset) {
  if (!isValidPreset(preset)) return false;
  const all = loadCameraPresets();
  all[roomId] = preset;
  try { localStorage.setItem(CAMERA_STORAGE_KEY, JSON.stringify(all)); } catch { /* ignore */ }
  try {
    window.dispatchEvent(new CustomEvent(CAMERA_EVENT, { detail: { roomId, preset } }));
  } catch { /* ignore */ }
  return true;
}

// Đăng ký nghe đổi góc của 1 phòng; trả về hàm hủy đăng ký.
export function subscribeCameraPreset(roomId, cb) {
  const handler = (e) => {
    if (e && e.detail && e.detail.roomId === roomId) cb(e.detail.preset);
  };
  window.addEventListener(CAMERA_EVENT, handler);
  return () => window.removeEventListener(CAMERA_EVENT, handler);
}
