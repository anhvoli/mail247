// Định nghĩa phòng riêng (Phòng riêng) — lấy từ khảo sát choigivui.com 2026-11-06.
//
// Bản gốc: tab danh sách + tab tạo phòng; ngoài sảnh ghi "từ 1.000đ/giờ" nhưng
// màn tạo phòng ghi "Tạm thời miễn phí" — bản clone giữ nhãn miễn phí.
// Tạo phòng: loại Rạp chiếu (miễn phí), Rạp Trời (miễn phí), Karaoke (khóa,
// chỉ dành cho người đã ủng hộ); tên phòng bắt buộc, mật khẩu tùy chọn.
// Phòng tự đóng sau 1 giờ, khi chủ phòng rời quá 2 phút, hoặc khi không còn
// đủ lượt gia hạn. Clone không có tài khoản nên phòng riêng là link-only,
// không có chủ sở hữu cố định — ai có link cũng vào được.

export const PRIVATE_ROOM_LIFETIME_MINUTES = 60;
export const PRIVATE_ROOM_HOST_GRACE_MINUTES = 2;

// Loại phòng riêng. roomKind trỏ về loại rạp đã có trong clone để tái dùng
// RoomView / cảnh 3D sẵn có (phim -> cinema, troi -> sky).
export const PRIVATE_ROOM_TYPES = [
  {
    id: 'phim',
    label: 'Rạp chiếu',
    desc: 'Rạp 3D tối, rèm đỏ, màn hình lớn — xem MV cùng hội bạn.',
    price: 'Tạm thời miễn phí',
    locked: false,
    roomKind: 'cinema',
  },
  {
    id: 'troi',
    label: 'Rạp Trời',
    desc: 'Rạp ngoài trời ban đêm: trăng, đồi, bàn tròn, màn LED.',
    price: 'Tạm thời miễn phí',
    locked: false,
    roomKind: 'sky',
  },
  {
    id: 'karaoke',
    label: 'Karaoke',
    desc: 'Sân khấu hát karaoke, chấm điểm 1–10 (19:00–23:00 như bản gốc).',
    price: 'Chỉ dành cho người đã ủng hộ',
    locked: true,
    roomKind: 'karaoke',
  },
];

// 1 phòng mẫu đang mở lúc vào trang (bản gốc lúc khảo sát cũng có 1 phòng
// công khai đang mở). expiresAt tính theo giờ tạo + 60 phút.
const now = Date.now();
export const SEED_PRIVATE_ROOMS = [
  {
    id: 'phong-rieng-01',
    name: 'Phòng xem MV tối nay',
    type: 'phim',
    host: 'Khách 1',
    password: '',
    createdAt: now - 15 * 60 * 1000,
    expiresAt: now + 45 * 60 * 1000,
    people: 4,
  },
];

export function makeInviteLink(roomId) {
  if (typeof window === 'undefined') return `?phong=${roomId}`;
  return `${window.location.origin}${window.location.pathname}?phong=${roomId}`;
}

export function makePrivateRoom({ name, type, password }) {
  const createdAt = Date.now();
  return {
    id: `phong-rieng-${createdAt.toString(36)}`,
    name: name.trim(),
    type,
    host: 'Bạn',
    password: password || '',
    createdAt,
    expiresAt: createdAt + PRIVATE_ROOM_LIFETIME_MINUTES * 60 * 1000,
    people: 1,
  };
}

// Ghi chú đấu nối cho parent (App.jsx / Lobby.jsx) — component
// PrivateRooms.jsx chỉ là UI + state cục bộ, chưa tự đấu vào App.
export const PRIVATE_ROOMS_WIRING = `
Đấu nối (parent làm, không nằm trong 2 file này):
1. Lobby.jsx: thay thẻ "Phòng riêng — Sắp có" bằng nút mở <PrivateRooms />
   (giữ lại thẻ Got Talent / Sảnh 3D). Truyền guest + onEnterRoom + onBack.
2. App.jsx: giữ state rooms riêng ở App (nâng state từ PrivateRooms lên) nếu
   muốn phòng riêng tồn tại khi quay lại sảnh; hiện tại rooms chỉ sống trong
   component, rời khỏi là mất.
3. Vào phòng riêng: gọi onEnterRoom(room) với room = { id, name, kind:
   roomKind của loại đã chọn, totalSeats, rows/cols hoặc tables theo kind,
   botCount: 0, nowPlaying + queue lấy từ ROOMS[type] } rồi render RoomView
   như phòng thường — RoomView không cần sửa, vì phòng riêng chỉ khác ở
   nguồn state (roomState của useRoom). Muốn đồng bộ nhiều người thật thì
   phòng riêng cần state phía server (như bản artifact), không làm ở
   local-only này.
4. Link mời: mở app với ?phong=<id> thì App đọc query, tìm phòng theo id
   trong danh sách phòng riêng và vào thẳng phòng đó (hỏi mật khẩu nếu có).
5. Đếm ngược: PrivateRooms tự tick mỗi giây; hết 60 phút thì phòng biến
   khỏi danh sách và hiện "Phòng đã đóng". Chủ phòng rời quá 2 phút cũng
   đóng phòng (hiện chỉ ghi chú trong UI, chưa có theo dõi chủ phòng thật).
`;
