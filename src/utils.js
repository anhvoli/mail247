// Helper dùng chung (tách ra từ RoomView.jsx trong đợt fix-all 2026-11-07,
// N-09) để không còn 2 bản karaokeOpenNow / fmtTime ở RoomView và Lobby.
import { KARAOKE_RULES } from './karaoke-room-spec';

// Karaoke mở 19:00–23:00 giờ VN (theo bản gốc). Ngoài giờ vẫn vào xem thử
// được, chỉ hiện ghi chú — không chặn cửa.
export function karaokeOpenNow() {
  try {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const h = now.getHours();
    const open = parseInt(KARAOKE_RULES.openHours.open, 10);
    const close = parseInt(KARAOKE_RULES.openHours.close, 10);
    return h >= open && h < close;
  } catch { return true; }
}

export function fmtTime(d) {
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}
