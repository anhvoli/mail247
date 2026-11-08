// Vị trí phát gần nhất của từng phòng (giờ + thời lượng + id bài, key =
// room.id) — SỐNG Ở CẤP MODULE để còn qua lần RoomView unmount khi rời
// phòng (ref trong component mất theo unmount). Poll player mỗi giây ghi
// vào đây; vào lại phòng thì khối reset playhead + effect đồng hồ của
// panel đọc lại từ đây để hiện đúng giờ đang chạy thay vì 0:00/0:00.
// Tách ra file riêng (fix-all 2026-11-07) để App.jsx (Sảnh) cũng đọc được
// vị trí phát của Rạp phim (M-06) thay vì playheadCache nằm kẹt trong
// RoomView.jsx.
export const playheadCache = {};

export function getPlayhead(roomId) {
  return playheadCache[roomId] || null;
}

export function setPlayhead(roomId, entry) {
  playheadCache[roomId] = entry;
}
