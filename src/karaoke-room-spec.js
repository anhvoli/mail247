// Spec phòng Karaoke / Got Talent — dữ liệu + luật chơi + hướng dẫn nối dây.
// File spec riêng (parent nối vào): data.js thêm `karaoke: KARAOKE_ROOM` vào
// ROOMS; useRoom.js thêm nhánh 'karaoke' vào allSeatIds (dùng
// karaokeAllSeatIds bên dưới); RoomView.jsx render <Karaoke3D> khi
// room.kind === 'karaoke' (camera preset lấy từ KARAOKE_CAMERA_PRESETS);
// SeatMap.jsx thêm nhánh vẽ 3 hàng A/B/C × 10 ghế.
//
// Nguồn: khảo sát choigivui.com ngày 2026-11-06 (phòng /karaoke, mở 19:00–
// 23:00, sân khấu rèm đỏ, 30 ghế đỏ, "Chọn bài" thay "Gửi video", hàng đợi
// theo thứ tự đăng ký, chỉ người đã ngồi ghế mới được chọn bài, hát xong chờ
// 3 người khác mới được hát lại, chấm điểm 1–10 sau mỗi tiết mục, nút "Mời
// xuống" cần 50% người xem, tối thiểu 3 người).
//
// Video ID đã KIỂM CHỨNG qua YouTube oEmbed (2026-11-06):
//  - n9w6eExzFTE: "[KARAOKE] Cạn Tình Như Thế - Dickson x Thành Đạt | TONE NAM"
//    (Nam Việt Karaoke) — đúng bài Bi đã hát trong phòng khảo sát.
//  - SaE_Li98XoA: "(KARAOKE TONE NỮ) ĐỪNG LÀM TRÁI TIM ANH ĐAU - SƠN TÙNG MTP
//    || BEAT COVER || CD PIANO" (CD Piano).
//  - FmL-Up1DfFQ: "CẠN TÌNH NHƯ THẾ - DICKSON X THÀNH ĐẠT X LÊ CHÍ TRUNG |
//    OFFICIAL MV" (NhacPro Tube).
// Thời lượng để '?' — oEmbed không trả duration, trình phát báo giờ thật khi
// chạy nên panel "TRÊN MÀN ẢNH" vẫn hiện đúng sau khi video bắt đầu.

export const KARAOKE_ROWS = ['A', 'B', 'C'];
export const KARAOKE_COLS = 10;
export const KARAOKE_TOTAL_SEATS = 30;

export function karaokeSeatId(row, col) {
  return `${row}${String(col).padStart(2, '0')}`;
}

export function karaokeAllSeatIds() {
  const ids = [];
  KARAOKE_ROWS.forEach((row) => {
    for (let c = 1; c <= KARAOKE_COLS; c++) ids.push(karaokeSeatId(row, c));
  });
  return ids;
}

export const KARAOKE_ROOM = {
  id: 'karaoke',
  name: 'Karaoke / Got Talent',
  sub: 'SÂN KHẤU · 30 GHẾ · 19:00–23:00',
  kind: 'karaoke',
  totalSeats: KARAOKE_TOTAL_SEATS,
  rows: KARAOKE_ROWS,
  cols: KARAOKE_COLS,
  botCount: 20,
  nowPlaying: {
    id: 'n9w6eExzFTE',
    title: '[KARAOKE] Cạn Tình Như Thế - Dickson x Thành Đạt | TONE NAM',
    by: 'Nam Việt Karaoke',
    duration: '?',
  },
  queue: [
    { id: 'n9w6eExzFTE', title: '[KARAOKE] Cạn Tình Như Thế - Dickson x Thành Đạt | TONE NAM', by: 'Nam Việt Karaoke', duration: '?', votes: 0, byGuest: 'Bi' },
    { id: 'SaE_Li98XoA', title: '(KARAOKE TONE NỮ) ĐỪNG LÀM TRÁI TIM ANH ĐAU - SƠN TÙNG MTP', by: 'CD Piano', duration: '?', votes: 0, byGuest: 'Mr. Sun' },
    { id: 'FmL-Up1DfFQ', title: 'CẠN TÌNH NHƯ THẾ - DICKSON X THÀNH ĐẠT X LÊ CHÍ TRUNG | OFFICIAL MV', by: 'NhacPro Tube', duration: '?', votes: 0, byGuest: 'NamCưBụ' },
  ],
};

// Luật phòng (theo bản gốc) — để parent dùng khi nối logic lượt hát/chấm điểm:
export const KARAOKE_RULES = {
  // Giờ mở cửa (giờ VN, theo bản gốc).
  openHours: { open: '19:00', close: '23:00' },
  // Hàng đợi lượt hát theo thứ tự đăng ký (không phải bình chọn như rạp phim).
  queueMode: 'turn-based',
  // Chỉ người đã ngồi ghế mới được chọn bài ("Chọn bài" thay "Gửi video").
  pickRequiresSeat: true,
  // Hát xong phải chờ 3 người khác hát xong mới được đăng ký lại.
  cooldownSingers: 3,
  // Chấm điểm sau mỗi tiết mục: 1–10, hiện điểm trung bình (vd "Bi / 8.5/10").
  scoring: { min: 1, max: 10 },
  // "Mời xuống" cần 50% người xem đồng ý, tối thiểu 3 người.
  inviteDown: { percent: 50, minVoters: 3 },
  // Giọng ca sĩ (volume slider riêng, video nền có độ trễ để đồng bộ giọng).
  singerVolume: { default: 100 },
};

// Những gì parent cần nối (checklist — không làm trong file này vì các file
// đó đang do agent khác giữ):
export const KARAOKE_WIRING = [
  "data.js: thêm `karaoke: KARAOKE_ROOM` vào ROOMS (import từ './karaoke-room-spec').",
  "useRoom.js: thêm nhánh 'karaoke' vào allSeatIds() — dùng karaokeAllSeatIds(); queue karaoke là lượt hát theo thứ tự đăng ký (KARAOKE_RULES.queueMode), không xếp theo vote như rạp phim.",
  'RoomView.jsx: khi room.kind === \'karaoke\' thì render <Karaoke3D> thay <Cinema3D>, preset camera lấy từ KARAOKE_CAMERA_PRESETS; nút "Chọn bài" thay ô "Gửi video"; thêm panel chấm điểm 1–10 + nút "Mời xuống" (50%, tối thiểu 3 người) và slider âm lượng giọng ca sĩ.',
  'SeatMap.jsx: thêm nhánh vẽ sơ đồ 3 hàng A/B/C × 10 ghế đỏ cho kind karaoke.',
  'Lobby.jsx: thêm thẻ phòng Karaoke / Got Talent (30 ghế, 19:00–23:00); ngoài giờ thì hiện "Chưa mở cửa — 19:00–23:00" thay vì cho vào.',
];
