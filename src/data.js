// Dữ liệu mẫu Phase 1 — lấy từ khảo sát choigivui.com ngày 2026-11-06.
// Phòng Karaoke lấy từ src/karaoke-room-spec.js (đã kiểm chứng video qua oEmbed).
import { KARAOKE_ROOM } from './karaoke-room-spec';
// Video ID đã kiểm chứng:
//  - abPmZCZZrFA: SƠN TÙNG M-TP | ĐỪNG LÀM TRÁI TIM ANH ĐAU | OFFICIAL MUSIC VIDEO (5:26)
//    — đã phát thật nhiều lần trong kiểm tra live (Rạp phim).
//  - 2WAXXlK3tAA: Thêm Một Lần Đau (Remake Version) - NDMT | Nhạc Hoa Lời Việt
//    — đã phát thật trong kiểm tra live (Rạp Trời).
//  - 32sYGCOYJUM: CHẠY NGAY ĐI | RUN NOW | SƠN TÙNG M-TP | Official Music Video (4:34)
//    — kênh Sơn Tùng M-TP Official, cùng kênh chính chủ với abPmZCZZrFA đã
//    phát được; ID xác nhận qua nhiều nguồn (VnExpress, download.vn,
//    thuthuat.taimienphi.vn đều nhúng đúng embed/32sYGCOYJUM) + oEmbed trả
//    đúng tiêu đề/kênh và thời lượng 274s. Thay cho OKjhlW1MveM (Quang Đăng
//    Trần, kênh re-upload "Suyers Official") bị YouTube báo "Video không có
//    sẵn" khi nhúng (lỗi 101/150: cấm nhúng) ở kiểm tra live round 3.
//    Lưu ý thật: từ máy này KHÔNG kiểm chứng được tính nhúng của từng video
//    — mọi cách kiểm tra phía máy chủ đều trả kết quả suy giảm ngay cả với
//    abPmZCZZrFA đã phát được (trang watch bị đẩy về google.com/sorry, API
//    Innertube trả UNPLAYABLE cho cả video tốt, yt-dlp bị bắt đăng nhập,
//    Chromium headless không qua được proxy). Bằng chứng ở đây là mức kênh:
//    cùng kênh chính chủ với video đã phát được. Lưới an toàn: youtube.jsx
//    nay tự bỏ qua sang bài tiếp khi player báo lỗi (onError) nên nếu video
//    này cũng cấm nhúng thì màn hình không kẹt đen ở 0:00 nữa.
export const SHIRT_COLORS = [
  { id: 'xanh-nhat', name: 'Xanh nhạt', hex: '#b8cd8e' },
  { id: 'cam-dat', name: 'Cam đất', hex: '#cf9a80' },
  { id: 'xanh-duong', name: 'Xanh dương', hex: '#9aaed2' },
  { id: 'tim-nhat', name: 'Tím nhạt', hex: '#c7a0ca' },
  { id: 'vang', name: 'Vàng', hex: '#d7bc75' },
  { id: 'xanh-ngoc', name: 'Xanh ngọc', hex: '#8bc6c0' },
];

export const BOT_NAMES = [
  'Hoàng Nam', 'Minh Anh', 'Thu Hằng', 'Quốc Bảo', 'Lan Chi', 'Đức Anh',
  'Phương Linh', 'Tuấn Kiệt', 'Ngọc Trâm', 'Hải Yến', 'Khánh Linh', 'Thanh Huyền',
  'Minh Châu', 'Thu Hà', 'Kim Chi', 'Ngọc Diệp', 'Mr. Sun', 'NamCưBụ', 'Bi',
  'Chủ Tịch Mai', 'Giám Đốc Hà', 'Ligma', 'NoHope', 'Loser', 'Chị Rebuild',
  'Anh Tám', 'Cô Ba', 'Bé Bảy', 'Tí Hon', 'Mèo Mun', 'Gấu Trúc', 'Sói Xám',
];

export const BOT_CHAT_LINES = [
  'Bài này hay quá, cả rạp ơi!',
  'CHÀO MNGUOI, HÔM NAY RẠP TA IM LẶNG THẾ',
  'nói bao nhiêu lần rồi chị cứ rebuild',
  'toàn bot chả thể',
  'Ai đề xuất bài này vậy, hay ghê',
  'Mở loa to lên cả rạp ơi',
  'Bài sau cho xin 1 bài remix đi',
  'Ngồi ghế này view đẹp ghê',
  'Cả rạp cùng hát nào',
  'Video này xem lần thứ 3 rồi mà vẫn hay',
  'Vote bài kia đi mọi người',
  'Tối nay rạp đông vui quá',
];

export const EMOJI_GROUPS = {
  'Cảm xúc': ['😀', '😂', '🤣', '😊', '😍', '🥰', '😘', '😎', '🥳', '😭', '😢', '😅', '😮', '😴', '🤔', '😤', '😡', '🤩', '😏', '🤗', '😵', '🙈', '😱', '🤫'],
  'Trái tim': ['❤️', '🧡', '💛', '💚', '💙', '💜', '💗', '🤍', '🖤', '💔', '💕', '💖'],
  'Cử chỉ': ['👍', '👏', '🙌', '✌️', '🤞', '🙏', '👋', '💪', '🤝', '👌', '🫶', '👀'],
  'Tiệc tùng': ['🎉', '🎊', '🎈', '🎁', '🎂', '🍾', '🥂', '🎶', '🎵', '🎤', '💃', '🕺'],
};

export const GESTURES = [
  { id: 'dance', label: 'Nhún nhảy', icon: '💃' },
  { id: 'wave', label: 'Vẫy tay', icon: '👋' },
  { id: 'clap', label: 'Vỗ tay', icon: '👏' },
];

// Rạp phim: 10 hàng A–J × 10 ghế. Mỗi hàng: ghế 01 và 10 đơn, 02–03 đôi, 04–06 và 07–09 ba.
export function seatType(row, col) {
  if (col === 1 || col === 10) return 'single';
  if (col === 2 || col === 3) return 'double';
  return 'triple';
}
export function seatId(row, col) {
  return `${row}${String(col).padStart(2, '0')}`;
}

// Đấu trường LoL Park: 3 vòng khán đài A/B/C × 24 ghế = 72 ghế.
// Vòng A gần sân nhất (thấp nhất), vòng C cao nhất. Mã ghế: A01…A24, B01…B24, C01…C24.
export const ARENA_RINGS = ['A', 'B', 'C'];
export const ARENA_SEATS_PER_RING = 24;
export function arenaSeatId(ring, n) {
  return `${ring}${String(n).padStart(2, '0')}`;
}

export const ROOMS = {
  phim: {
    id: 'phim',
    name: 'Rạp phim',
    sub: 'PHÒNG 01 · 100 CHỖ',
    kind: 'cinema',
    totalSeats: 100,
    rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
    cols: 10,
    botCount: 32,
    nowPlaying: {
      id: 'abPmZCZZrFA',
      title: 'SƠN TÙNG M-TP | ĐỪNG LÀM TRÁI TIM ANH ĐAU',
      by: 'M-TP Entertainment',
      duration: '5:26',
    },
    queue: [
      { id: 'abPmZCZZrFA', title: 'SƠN TÙNG M-TP | ĐỪNG LÀM TRÁI TIM ANH ĐAU', by: 'M-TP Entertainment', duration: '5:26', votes: 0, byGuest: 'Cả rạp' },
      { id: '32sYGCOYJUM', title: 'SƠN TÙNG M-TP | CHẠY NGAY ĐI (RUN NOW)', by: 'Sơn Tùng M-TP', duration: '4:34', votes: 4, byGuest: 'Mr. Sun' },
      { id: '2WAXXlK3tAA', title: 'Thêm Một Lần Đau (Remake Version) – NDMT', by: 'NDMT', duration: '4:37', votes: 2, byGuest: 'NamCưBụ' },
    ],
  },
  troi: {
    id: 'troi',
    name: 'Rạp Trời',
    sub: 'NGOÀI TRỜI · 72 GHẾ BÀN',
    kind: 'sky',
    totalSeats: 72,
    tables: 12,
    seatsPerTable: 6,
    botCount: 21,
    nowPlaying: {
      id: '2WAXXlK3tAA',
      title: 'Thêm Một Lần Đau (Remake Version) – NDMT',
      by: 'NDMT',
      duration: '4:37',
    },
    queue: [
      { id: '2WAXXlK3tAA', title: 'Thêm Một Lần Đau (Remake Version) – NDMT', by: 'NDMT', duration: '4:37', votes: 0, byGuest: 'NamCưBụ' },
      { id: 'nMBjz95ZXEc', title: 'Nhạc Trẻ 8x 9x — Tuyển tập NDMT', by: 'NDMT', duration: '12:26', votes: 0, byGuest: 'Hoàng Nam' },
      { id: 'abPmZCZZrFA', title: 'SƠN TÙNG M-TP | ĐỪNG LÀM TRÁI TIM ANH ĐAU', by: 'M-TP Entertainment', duration: '5:26', votes: 0, byGuest: 'Thu Hằng' },
    ],
  },
  arena: {
    id: 'arena',
    name: 'Đấu trường LoL Park',
    sub: 'BÁN KẾT CKTG 2026 · 72 GHẾ',
    kind: 'arena',
    totalSeats: 72,
    rings: ARENA_RINGS,
    seatsPerRing: ARENA_SEATS_PER_RING,
    botCount: 30,
    // Video mở màn ĐÃ KIỂM CHỨNG qua oEmbed YouTube:
    //  - rZHrffKAc6k: "T1 vs BLG Highlights | T1 vs Bilibili Gaming | Grand Finals | Worlds 2024"
    //    (kênh LoL Esports) — trận chung kết CKTG 2024 T1 thắng BLG 3-2, xem lại trước bán kết.
    //    Thời lượng 22:54 đã kiểm chứng trên ảnh live 2026-11-07 (panel hiện
    //    0:06/22:54 khi chạy thật); panel vẫn dùng getDuration() thật từ
    //    player khi có, nhưng có duration đúng trong data thì vào lại phòng
    //    panel không còn 0:00/0:00 trong lúc chờ player báo.
    nowPlaying: {
      id: 'rZHrffKAc6k',
      title: 'T1 vs BLG Highlights | Grand Finals | Worlds 2024',
      by: 'LoL Esports',
      duration: '22:54',
    },
    queue: [
      { id: 'rZHrffKAc6k', title: 'T1 vs BLG Highlights | Grand Finals | Worlds 2024', by: 'LoL Esports', duration: '22:54', votes: 0, byGuest: 'Cả rạp' },
      { id: 'abPmZCZZrFA', title: 'SƠN TÙNG M-TP | ĐỪNG LÀM TRÁI TIM ANH ĐAU', by: 'M-TP Entertainment', duration: '5:26', votes: 2, byGuest: 'Mr. Sun' },
      { id: '2WAXXlK3tAA', title: 'Thêm Một Lần Đau (Remake Version) – NDMT', by: 'NDMT', duration: '4:37', votes: 1, byGuest: 'NamCưBụ' },
    ],
  },
  karaoke: KARAOKE_ROOM,
};

export const MISSIONS = [
  { id: 'checkin', label: 'Điểm danh hằng ngày', exp: 20, hint: 'Bấm Nhận 1 lần mỗi ngày' },
  { id: 'chat', label: 'Chat 1 lần', exp: 15, hint: 'Gửi 1 tin nhắn cho cả rạp' },
  { id: 'watch', label: 'Ngồi xem trong rạp', exp: 50, hint: '+1 EXP / 3 phút, tối đa 50 EXP/ngày' },
];

export const LV_EXP = 300; // LV1 cần 300 EXP để lên LV2
