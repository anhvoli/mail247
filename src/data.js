// Dữ liệu mẫu Phase 1 — lấy từ khảo sát choigivui.com ngày 2026-11-06.
// Video ID đã kiểm chứng qua tìm kiếm YouTube:
//  - abPmZCZZrFA: SƠN TÙNG M-TP | ĐỪNG LÀM TRÁI TIM ANH ĐAU | OFFICIAL MUSIC VIDEO (5:26)
//  - 2WAXXlK3tAA: Thêm Một Lần Đau (Remake Version) - NDMT | Nhạc Hoa Lời Việt
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
      { id: 'OKjhlW1MveM', title: 'QUANG ĐĂNG TRẦN – ANH ĐÃ KHÔNG BIẾT CÁCH YÊU EM', by: 'Quang Đăng Trần', duration: '4:06', votes: 4, byGuest: 'Mr. Sun' },
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
};

export const MISSIONS = [
  { id: 'checkin', label: 'Điểm danh hằng ngày', exp: 20, hint: 'Bấm Nhận 1 lần mỗi ngày' },
  { id: 'chat', label: 'Chat 1 lần', exp: 15, hint: 'Gửi 1 tin nhắn cho cả rạp' },
  { id: 'watch', label: 'Ngồi xem trong rạp', exp: 50, hint: '+1 EXP / 3 phút, tối đa 50 EXP/ngày' },
];

export const LV_EXP = 300; // LV1 cần 300 EXP để lên LV2
