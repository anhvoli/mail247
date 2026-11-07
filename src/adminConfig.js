// Cấu hình + dữ liệu cho bảng Quản trị Live (mail247).
// Viết lại theo cấu trúc của repo chùa (StreamerDeck / wishResponder /
// bannedWords) — KHÔNG sao chép code hay dữ liệu của repo đó: quẻ, lời
// chúc và từ cấm dưới đây đều do clone này tự soạn.

export const ADMIN_CONFIG_KEY = 'rapchieu-admin-config';

export const DEFAULT_ADMIN_CONFIG = {
  channelName: 'Trà Đá Vỉa Hè',
  keyword: 'adidaphat',
  boardTitle: 'TOP THÀNH TÂM',
  showTopBoard: true,
  ttsEnabled: true,
  ttsTemplate: 'blessing', // blessing | thanks | short
  ttsGapSec: 3,
  ttsMaxChars: 80,
  ttsMinChars: 2,
  ttsRate: 1.2,
  ttsVoiceURI: '',
  musicTrack: 'lofi',
  musicVolume: 0.6,
};

export function loadAdminConfig() {
  try {
    const raw = JSON.parse(localStorage.getItem(ADMIN_CONFIG_KEY) || 'null');
    if (raw && typeof raw === 'object') return { ...DEFAULT_ADMIN_CONFIG, ...raw };
  } catch { /* ignore */ }
  return { ...DEFAULT_ADMIN_CONFIG };
}

export function saveAdminConfig(cfg) {
  try { localStorage.setItem(ADMIN_CONFIG_KEY, JSON.stringify(cfg)); } catch { /* ignore */ }
}

// Menu quà "Đại Gia Phố Cổ" — món + giá xu do người dùng đưa (ảnh admin).
export const GIFT_MENU = [
  { id: 'tra-da', name: 'Ly Trà Đá', coins: 1, icon: '🥤' },
  { id: 'tra-tac', name: 'Trà Tắc Không Lồ', coins: 5, icon: '🍋' },
  { id: 'tra-dao', name: 'Trà Đào Cam Sả', coins: 10, icon: '🍑' },
  { id: 'ca-phe', name: 'Cà Phê Sữa Đá', coins: 15, icon: '☕' },
  { id: 'tra-bi-dao', name: 'Trà Bí Đao', coins: 15, icon: '🧋' },
  { id: 'coca', name: 'Coca-Cola', coins: 20, icon: '🥤' },
  { id: 'bo-huc-xanh', name: 'Bò Húc Xanh', coins: 25, icon: '⚡' },
  { id: 'bo-huc-vang', name: 'Bò Húc Vàng', coins: 30, icon: '🐂' },
  { id: 'huong-duong', name: 'Hạt Hướng Dương', coins: 10, icon: '🌻' },
  { id: 'kho-ga', name: 'Khô Gà Lá Chanh', coins: 20, icon: '🍗' },
];

// Sự kiện đặc biệt (banner đỏ trong ảnh admin).
export const GANG_EVENT = {
  id: 'giang-ho',
  name: 'GỌI GIANG HỒ XĂM TRỔ ĐI EXCITER NẸT PÔ TỚI PHÁ',
  coins: 4,
  note: 'Chạy hết 8 bản lại từ đầu!',
};

// Từ khóa giả lập bình luận (ảnh admin).
export const FAKE_KEYWORDS = [
  'trà đá', 'trà tắc', 'trà đào', 'cà phê', 'bò húc', 'coca', 'bí đao',
  'hướng dương', 'khô gà', 'giang hồ', 'báo đời', 'exciter', 'nét pô',
  'phá quán', 'chạy tán loạn',
];

export const FAKE_COMMENT_TEMPLATES = [
  'Cho 1 ly {kw} đi chủ quán ơi!',
  '{kw} ở đây ngon thiệt, mai ghé nữa',
  'Ai uống {kw} chưa, cho xin review',
  'Quán này {kw} là nhất khu rồi',
  'Vừa gọi {kw}, ngồi chờ mát rượi',
  '{kw} + hướng dương là combo chuẩn bài',
];

// 36 quẻ — tự soạn, toàn lời khuyên tích cực, không đoán tiền bạc/tương lai.
export const FORTUNES = [
  'Quẻ 1 — Thượng cát: Việc đang lo rồi sẽ thuận, cứ bình tĩnh mà làm từng bước.',
  'Quẻ 2 — Cát: Hôm nay hợp làm việc đã ấp ủ lâu, đừng chần chừ nữa.',
  'Quẻ 3 — Cát: Gặp người tốt đúng lúc, nhớ cảm ơn họ một câu.',
  'Quẻ 4 — Trung cát: Chậm mà chắc, đi từng bước vẫn tới nơi cần tới.',
  'Quẻ 5 — Cát: Tin vui nhỏ sắp tới, cứ mở lòng đón nhận.',
  'Quẻ 6 — Thượng cát: Sức khỏe đang tốt dần, giữ nhịp sinh hoạt đều đặn nhé.',
  'Quẻ 7 — Cát: Học hành thi cử thuận lợi nếu ôn lại phần còn yếu.',
  'Quẻ 8 — Trung cát: Chuyện tiền nong nên tính kỹ, tránh vội vàng.',
  'Quẻ 9 — Cát: Gia đình êm ấm, có dịp thì gọi về hỏi thăm người thân.',
  'Quẻ 10 — Thượng cát: Bạn bè sẽ giúp một tay, đừng ngại mở lời nhờ.',
  'Quẻ 11 — Cát: Ra ngoài hít thở, đầu óc sẽ nhẹ nhõm hơn nhiều.',
  'Quẻ 12 — Trung cát: Việc khó đừng làm một mình, chia nhỏ ra sẽ xong.',
  'Quẻ 13 — Cát: Hôm nay hợp bắt đầu thói quen tốt mới.',
  'Quẻ 14 — Thượng cát: Duyên lành đang tới, cứ sống tử tế như mọi ngày.',
  'Quẻ 15 — Cát: Một lời xin lỗi đúng lúc gỡ được nút thắt lớn.',
  'Quẻ 16 — Trung cát: Đừng so mình với người khác, mỗi người một nhịp.',
  'Quẻ 17 — Cát: Cơ hội nhỏ hôm nay có thể mở ra việc lớn sau này.',
  'Quẻ 18 — Thượng cát: Tâm an thì việc gì cũng nhẹ, ngủ sớm tối nay nhé.',
  'Quẻ 19 — Cát: Người thương đang nghĩ tới bạn, nhắn một câu hỏi thăm đi.',
  'Quẻ 20 — Trung cát: Tiền bạc đủ dùng là vui rồi, đừng tham việc quá sức.',
  'Quẻ 21 — Cát: Làm việc thiện nhỏ hôm nay, lòng sẽ vui cả ngày.',
  'Quẻ 22 — Thượng cát: Sắp có tin tốt từ người quen cũ.',
  'Quẻ 23 — Cát: Kiên nhẫn thêm một chút, kết quả đang tới gần.',
  'Quẻ 24 — Trung cát: Nghỉ ngơi cũng là một phần của làm việc.',
  'Quẻ 25 — Cát: Nói lời cảm ơn nhiều hơn, quan hệ sẽ ấm lên.',
  'Quẻ 26 — Thượng cát: Đi xa gần đều thuận, nhớ mang đủ đồ cần thiết.',
  'Quẻ 27 — Cát: Học thêm một kỹ năng mới, sau này dùng được ngay.',
  'Quẻ 28 — Trung cát: Chuyện buồn rồi cũng qua, đừng giữ trong lòng mãi.',
  'Quẻ 29 — Cát: Hôm nay hợp dọn dẹp, sắp xếp lại góc làm việc.',
  'Quẻ 30 — Thượng cát: Ai đó đang thầm cảm ơn bạn, cứ sống tốt nhé.',
  'Quẻ 31 — Cát: Ăn uống điều độ, cơ thể sẽ cảm ơn bạn.',
  'Quẻ 32 — Trung cát: Việc chưa xong thì chia ca làm, đừng ôm hết một lúc.',
  'Quẻ 33 — Cát: Cười nhiều hơn, mọi chuyện tự nhiên nhẹ đi.',
  'Quẻ 34 — Thượng cát: May mắn đang mỉm cười, cứ tiến lên.',
  'Quẻ 35 — Cát: Giữ lời hứa, dù là lời hứa nhỏ nhất.',
  'Quẻ 36 — Đại cát: Mọi việc hanh thông, tâm an, nhà an, vạn sự an.',
];

// ---- Nguyện ước: phát hiện chủ đề rồi đáp bằng lời chúc soạn sẵn ----
// Bình luận KHÔNG BAO GIỜ được đọc nguyên văn (chống troll).

// Bỏ dấu, thường hoá: "Cầu Bình An" -> " cau binh an "
export function plain(text) {
  return ` ${String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()} `;
}

const WISH_WORDS = [' mong ', ' cau ', ' xin ', ' nguyen ', ' uoc ', ' muon ', ' phu ho ', ' gia ho '];

const TOPIC_WORDS = [
  ['thi', [' thi ', ' diem ', ' dau dai hoc ', ' do dai hoc ', ' tot nghiep ', ' kiem tra ', ' hoc gioi ', ' ielts ', ' bang lai ']],
  ['suc-khoe', [' suc khoe ', ' khoe ', ' khoi benh ', ' benh ', ' om ', ' het dau ', ' binh phuc ', ' nam vien ']],
  ['tinh-duyen', [' nguoi yeu ', ' tinh duyen ', ' ny ', ' crush ', ' lay chong ', ' lay vo ', ' cuoi ', ' quay lai ', ' duyen ']],
  ['gia-dinh', [' gia dinh ', ' bo me ', ' cha me ', ' con cai ', ' em be ', ' sinh con ', ' vo chong ', ' gia dao ']],
  ['viec', [' viec ', ' phong van ', ' thang chuc ', ' tang luong ', ' di lam ', ' xin viec ']],
  ['tien', [' tien ', ' tai loc ', ' lam an ', ' buon ban ', ' kinh doanh ', ' tra no ', ' het no ', ' don hang ']],
  ['binh-an', [' binh an ', ' an lanh ', ' tai qua ', ' may man ', ' thuan loi ', ' giai han ']],
];

export function detectWish(comment) {
  const t = plain(comment);
  if (!WISH_WORDS.some((w) => t.includes(w))) return null;
  for (const [topic, words] of TOPIC_WORDS) {
    if (words.some((w) => t.includes(w))) return topic;
  }
  return null;
}

const BLESSINGS = {
  thi: [
    'Chúc {name} ôn bài suôn sẻ, vào phòng thi thật bình tĩnh, đạt kết quả như mong muốn.',
    'Chúc {name} học đâu nhớ đó, thi cử đỗ đạt, cả nhà cùng vui.',
  ],
  'suc-khoe': [
    'Chúc {name} và người thân luôn khỏe mạnh, ăn ngon ngủ yên.',
    'Chúc {name} ai đang mệt thì sớm bình phục, tinh thần thoải mái.',
  ],
  'tinh-duyen': [
    'Chúc {name} sớm gặp người thương hết lòng, duyên lành bền lâu.',
    'Chúc {name} chuyện tình cảm êm đẹp, thương ai cũng được đáp lại.',
  ],
  'gia-dinh': [
    'Chúc gia đình {name} trên thuận dưới hòa, cha mẹ khỏe mạnh, con cháu ngoan hiền.',
    'Chúc nhà {name} luôn êm ấm, mọi người thương yêu nhau.',
  ],
  viec: [
    'Chúc {name} công việc hanh thông, gặp sếp tốt đồng nghiệp hiền.',
    'Chúc {name} tìm được việc ưng ý, làm đâu thuận đó.',
  ],
  tien: [
    'Chúc {name} làm ăn phát đạt, buôn may bán đắt, tiền vào đều tay.',
    'Chúc {name} tài lộc dồi dào, nợ nần sớm xong, của cải đủ đầy.',
  ],
  'binh-an': [
    'Chúc {name} mọi việc bình an, thuận lợi.',
    'Chúc {name} đi đâu cũng được che chở, gặp nhiều may mắn.',
  ],
};

export function blessingFor(topic, name, channelName) {
  const options = BLESSINGS[topic] || BLESSINGS['binh-an'];
  const line = options[Math.floor(Math.random() * options.length)];
  return line.replace('{name}', name).replace('{channel}', channelName || 'quán');
}

// Lời chúc ngắn theo chủ đề (template "short").
const SHORT_BLESSINGS = {
  thi: 'Chúc {name} thi tốt, đỗ đạt nhé.',
  'suc-khoe': 'Chúc {name} luôn khỏe mạnh nhé.',
  'tinh-duyen': 'Chúc {name} sớm gặp duyên lành nhé.',
  'gia-dinh': 'Chúc gia đình {name} luôn êm ấm nhé.',
  viec: 'Chúc {name} công việc thuận lợi nhé.',
  tien: 'Chúc {name} làm ăn phát đạt nhé.',
  'binh-an': 'Chúc {name} mọi việc bình an nhé.',
};

// Áp template đọc TTS: blessing = lời chúc đầy đủ; thanks = cảm ơn + lời
// chúc; short = chỉ một câu chúc ngắn. Không bao giờ đọc nguyên văn comment.
export function replyLine(topic, name, channelName, template = 'blessing') {
  if (template === 'short') {
    return (SHORT_BLESSINGS[topic] || SHORT_BLESSINGS['binh-an']).replace('{name}', name);
  }
  const line = blessingFor(topic, name, channelName);
  if (template === 'thanks') return `Cảm ơn ${name} đã ghé live ạ. ${line}`;
  return line;
}

// Giới hạn chống spam: 1 đáp/người/10 phút, tối đa 1 đáp/20 giây toàn phòng.
const PER_USER_MS = 10 * 60 * 1000;
const GLOBAL_MS = 20 * 1000;
const lastByUser = new Map();
let lastAny = 0;

export function shouldAnswer(username, now = Date.now()) {
  const key = String(username || '').toLowerCase();
  if (now - lastAny < GLOBAL_MS) return false;
  if (now - (lastByUser.get(key) ?? 0) < PER_USER_MS) return false;
  lastAny = now;
  lastByUser.set(key, now);
  return true;
}

// ---- Từ cấm: danh sách nhỏ tự soạn, che bằng *** ----
const BANNED = [
  'địt', 'đụ', 'lồn', 'cặc', 'buồi', 'đéo', 'dcm', 'vcl', 'vãi lồn',
  'fuck', 'shit', 'bitch', 'casino', 'cá độ', 'lô đề', 'cờ bạc',
  'lừa đảo', 'scam', 'ma túy', 'thuốc lắc', 'cần sa', 'giết', 'chém',
];

export function containsBanned(text) {
  const t = ` ${String(text || '').toLowerCase()} `;
  return BANNED.some((w) => t.includes(w));
}

export function maskBanned(text) {
  let out = String(text || '');
  for (const w of BANNED) {
    const re = new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    out = out.replace(re, '***');
  }
  return out;
}

// ---- Giọng đọc trình duyệt (speechSynthesis) ----
export function listVoices() {
  try {
    if (!('speechSynthesis' in window)) return [];
    return window.speechSynthesis.getVoices();
  } catch { return []; }
}

export function pickVoice(voices, preferURI) {
  if (!voices.length) return null;
  if (preferURI) {
    const v = voices.find((x) => x.voiceURI === preferURI);
    if (v) return v;
  }
  return voices.find((x) => (x.lang || '').toLowerCase().startsWith('vi'))
    || voices.find((x) => (x.lang || '').toLowerCase().startsWith('en'))
    || voices[0];
}

export function speak(text, { voiceURI, rate = 1.2 } = {}) {
  try {
    if (!('speechSynthesis' in window) || !text) return false;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voices = listVoices();
    const v = pickVoice(voices, voiceURI);
    if (v) u.voice = v;
    u.lang = v?.lang || 'vi-VN';
    u.rate = Math.min(2, Math.max(0.5, rate));
    window.speechSynthesis.speak(u);
    return true;
  } catch { return false; }
}

// ---- Chuông / mõ / sen bằng WebAudio (tổng hợp, không cần file) ----
let audioCtx = null;
function ctx() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
  }
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  return audioCtx;
}

// Chuông chùa: sine trầm ngân dài.
export function playBell() {
  const c = ctx(); if (!c) return;
  const t = c.currentTime;
  [523.25, 783.99, 1046.5].forEach((f, i) => {
    const o = c.createOscillator(); const g = c.createGain();
    o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22 / (i + 1), t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3.5);
    o.connect(g).connect(c.destination);
    o.start(t); o.stop(t + 3.6);
  });
}

// Mõ: tiếng gõ gỗ ngắn, 2 nhịp.
export function playMo() {
  const c = ctx(); if (!c) return;
  [0, 0.28].forEach((dt) => {
    const t = c.currentTime + dt;
    const o = c.createOscillator(); const g = c.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(880, t);
    o.frequency.exponentialRampToValueAtTime(220, t + 0.09);
    g.gain.setValueAtTime(0.35, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    o.connect(g).connect(c.destination);
    o.start(t); o.stop(t + 0.16);
  });
}

// Chuông sen: chime cao, trong.
export function playLotus() {
  const c = ctx(); if (!c) return;
  const t = c.currentTime;
  [1318.5, 1567.98, 2093].forEach((f, i) => {
    const o = c.createOscillator(); const g = c.createGain();
    o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t + i * 0.08);
    g.gain.exponentialRampToValueAtTime(0.15, t + i * 0.08 + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.08 + 1.2);
    o.connect(g).connect(c.destination);
    o.start(t + i * 0.08); o.stop(t + i * 0.08 + 1.3);
  });
}
