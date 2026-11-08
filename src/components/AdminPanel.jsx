// Bảng Quản trị Live — gắn vào mail247 (clone rạp chiếu chung).
// Bố cục theo ảnh admin trà đá của người dùng; cấu trúc theo StreamerDeck /
// LiveControlPanel của repo chùa nhưng viết lại hoàn toàn, không sao chép.
// MỌI THỨ Ở ĐÂY LÀ MÔ PHỎNG LOCAL: không server, không TikTok thật —
// "Kết Nối Live" chỉ bật phiên live mô phỏng (bot vào/xem/chat/tặng quà),
// nhạc MP3 chỉ phát local trên trình duyệt, log /rpc chỉ là nhật ký nội bộ.
import { useCallback, useEffect, useRef, useState } from 'react';
import { BOT_NAMES } from '../data';
import {
  DEFAULT_ADMIN_CONFIG,
  loadAdminConfig,
  saveAdminConfig,
  GIFT_MENU,
  GANG_EVENT,
  FAKE_KEYWORDS,
  FAKE_COMMENT_TEMPLATES,
  FORTUNES,
  detectWish,
  replyLine,
  shouldAnswer,
  containsBanned,
  maskBanned,
  listVoices,
  pickVoice,
  speak,
  playBell,
  playMo,
  playLotus,
} from '../adminConfig';
import CameraControl from './admin/CameraControl';

const GANG_NAMES = ['Anh Tám Exciter', 'Giang Hồ Xóm', 'Báo Đời Bé', 'Đại Ca Nét Pô', 'Em Út Phá Quán'];

function nowTime() {
  return new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randName() { return rand(BOT_NAMES); }

const MUSIC_TRACKS = [
  { id: 'lofi', name: 'Lofi Synth Vỉa Hè (Thuật toán mặc định)' },
  { id: 'mua', name: 'Tiếng Mưa Nhẹ' },
  { id: 'thien', name: 'Nhạc Thiền Nhẹ' },
];

// Nhạc nền tổng hợp bằng WebAudio (không cần file) — đệm nhẹ, lặp.
function useAmbient() {
  const ref = useRef({ ctx: null, timer: null, nodes: [] });
  const stop = useCallback(() => {
    const s = ref.current;
    if (s.timer) { clearInterval(s.timer); s.timer = null; }
    s.nodes.forEach((n) => { try { n.stop ? n.stop() : n.disconnect(); } catch { /* ignore */ } });
    s.nodes = [];
    if (s.ctx) { s.ctx.close().catch(() => {}); s.ctx = null; }
  }, []);
  const start = useCallback((track, volume = 0.6) => {
    stop();
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      const c = new AC();
      const master = c.createGain();
      master.gain.value = volume * 0.5;
      master.connect(c.destination);
      const s = ref.current;
      s.ctx = c;
      if (track === 'mua') {
        // Nhiễu trắng qua lowpass = tiếng mưa.
        const len = c.sampleRate * 2;
        const buf = c.createBuffer(1, len, c.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        const src = c.createBufferSource();
        src.buffer = buf; src.loop = true;
        const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
        const g = c.createGain(); g.gain.value = 0.35;
        src.connect(f).connect(g).connect(master);
        src.start();
        s.nodes.push(src);
      } else if (track === 'thien') {
        // Ngẫu nhiên gảy nốt thang ngũ cung, mỗi 1.6s một nốt.
        const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
        const pluck = () => {
          const o = c.createOscillator(); const g = c.createGain();
          o.type = 'sine'; o.frequency.value = rand(scale);
          const t = c.currentTime;
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
          o.connect(g).connect(master);
          o.start(t); o.stop(t + 1.9);
        };
        pluck();
        s.timer = setInterval(pluck, 1600);
      } else {
        // Lofi: hợp âm đệm đổi mỗi 4s (triangle mềm).
        const chords = [[261.63, 329.63, 392.0], [220.0, 261.63, 329.63], [174.61, 220.0, 261.63], [196.0, 246.94, 293.66]];
        let i = 0;
        const playChord = () => {
          const ch = chords[i % chords.length]; i += 1;
          const t = c.currentTime;
          ch.forEach((f) => {
            const o = c.createOscillator(); const g = c.createGain();
            o.type = 'triangle'; o.frequency.value = f;
            g.gain.setValueAtTime(0.0001, t);
            g.gain.linearRampToValueAtTime(0.07, t + 0.6);
            g.gain.setValueAtTime(0.07, t + 3.2);
            g.gain.linearRampToValueAtTime(0.0001, t + 4.2);
            o.connect(g).connect(master);
            o.start(t); o.stop(t + 4.3);
            s.nodes.push(o);
          });
        };
        playChord();
        s.timer = setInterval(playChord, 4000);
      }
    } catch { /* không có WebAudio thì thôi */ }
  }, [stop]);
  useEffect(() => stop, [stop]);
  return { start, stop };
}

export default function AdminPanel({ guest, onBack }) {
  const [config, setConfig] = useState(loadAdminConfig);
  const [savedTick, setSavedTick] = useState(false);
  const [username, setUsername] = useState('');
  const [live, setLive] = useState({ connected: false, username: '', viewers: 0, likes: 0 });
  const [comments, setComments] = useState([]);
  const [seated, setSeated] = useState([]);
  const [top, setTop] = useState({});
  const [rpcLog, setRpcLog] = useState([{ time: nowTime(), text: '{"status": "Sẵn sàng nhận lệnh JSON-RPC 2.0"}' }]);
  const [lotuses, setLotuses] = useState([]);
  const [rain, setRain] = useState(false);
  const [fortune, setFortune] = useState(null);
  const [voices, setVoices] = useState([]);
  const [ownerLine, setOwnerLine] = useState('Trà đá một lần đây! Mời bạn ghé quán nhé.');
  const [commentInput, setCommentInput] = useState('');
  const [music, setMusic] = useState({ track: config.musicTrack, playing: false, fileName: '', fileUrl: '' });
  const [channelDraft, setChannelDraft] = useState(config.channelName);
  const [boardDraft, setBoardDraft] = useState(config.boardTitle);
  // Trạng thái phản hồi nhìn thấy được của 2 nút đọc thử
  // (bug: bấm không thấy gì khi trình duyệt không có giọng đọc).
  const [voiceTest, setVoiceTest] = useState({ tone: 'idle', text: '' });
  const [commentTest, setCommentTest] = useState({ tone: 'idle', text: '' });
  const testUtterRef = useRef(null); // utterance đọc thử đang chạy
  const testTimerRef = useRef(null); // watchdog nếu trình duyệt nuốt lệnh đọc
  // Timer nghe thử nhạc 6s (M-07): phải lưu vào ref để hủy được — trước đây
  // setTimeout không lưu, bấm "Phát Trên Live" trong 6s thì timer cũ vẫn
  // stop() nhạc live vừa bật.
  const previewTimerRef = useRef(null);
  const testTokenRef = useRef(0); // chống lần bấm cũ chạy sau lần bấm mới
  const testActiveRef = useRef(false); // đang có bài đọc thử chạy (kể cả đang chờ 150ms sau cancel)
  const testStartTimerRef = useRef(null); // timer chờ 150ms sau cancel() rồi mới đọc
  const mountedRef = useRef(true); // còn mount không (dọn timer khi rời panel)
  const voicesChangedRef = useRef(false); // trình duyệt đã báo voiceschanged hay chưa

  const liveRef = useRef(live);
  liveRef.current = live;
  const configRef = useRef(config);
  configRef.current = config;
  const lastSpokeRef = useRef(0);
  const fortuneBlockRef = useRef(0); // số mốc 99 like đã rút quẻ
  const rainBlockRef = useRef(0); // số mốc 666 like đã mưa hoa
  const likesRef = useRef(0); // tổng like phiên live hiện tại (đồng bộ, để addLikes tinh khiết)
  const audioRef = useRef(null);
  const fileRef = useRef(null);
  const idRef = useRef(0);
  const ambient = useAmbient();

  // Nạp danh sách giọng đọc của trình duyệt.
  useEffect(() => {
    const load = () => setVoices(listVoices());
    load();
    try {
      const onChange = () => { voicesChangedRef.current = true; load(); };
      window.speechSynthesis?.addEventListener('voiceschanged', onChange);
      return () => window.speechSynthesis?.removeEventListener('voiceschanged', onChange);
    } catch { return undefined; }
  }, []);

  useEffect(() => () => {
    mountedRef.current = false;
    testActiveRef.current = false;
    if (testTimerRef.current) clearTimeout(testTimerRef.current);
    if (testStartTimerRef.current) clearTimeout(testStartTimerRef.current);
    // Hủy timer nghe thử đang chờ (M-07) — không thì rời panel rồi nó vẫn
    // stop() nhạc đang phát.
    if (previewTimerRef.current) { clearTimeout(previewTimerRef.current); previewTimerRef.current = null; }
    testUtterRef.current = null;
    try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
  }, []);

  const log = useCallback((text) => {
    setRpcLog((prev) => [{ time: nowTime(), text }, ...prev].slice(0, 80));
  }, []);

  // Hủy bài đọc thử đang chạy một cách sạch sẽ: vô hiệu hóa handler của
  // utterance cũ (để nó không ghi kết quả giả), dọn timer, trả trạng thái
  // 2 nút về idle. Dùng khi người dùng bấm đọc câu khác.
  const abortTest = useCallback(() => {
    testTokenRef.current += 1;
    testUtterRef.current = null;
    testActiveRef.current = false;
    if (testTimerRef.current) { clearTimeout(testTimerRef.current); testTimerRef.current = null; }
    if (testStartTimerRef.current) { clearTimeout(testStartTimerRef.current); testStartTimerRef.current = null; }
    setVoiceTest({ tone: 'idle', text: '' });
    setCommentTest({ tone: 'idle', text: '' });
  }, []);

  const say = useCallback((text) => {
    // Câu tự động (auto-reply / cảm ơn quà): đang đọc thử thì bỏ qua lượt
    // này, không cancel() làm cắt ngang bài đọc thử.
    if (testActiveRef.current) return false;
    const cfg = configRef.current;
    const ok = speak(text, { voiceURI: cfg.ttsVoiceURI, rate: cfg.ttsRate });
    lastSpokeRef.current = Date.now();
    return ok;
  }, []);

  // Đọc do người dùng bấm (lời chủ quán / đọc lại comment): dừng bài đọc
  // thử đang chạy một cách sạch sẽ rồi mới đọc câu mới.
  const sayNow = useCallback((text) => {
    abortTest();
    const cfg = configRef.current;
    const ok = speak(text, { voiceURI: cfg.ttsVoiceURI, rate: cfg.ttsRate });
    lastSpokeRef.current = Date.now();
    return ok;
  }, [abortTest]);

  // Đọc thử có phản hồi NHÌN THẤY được: đang đọc / đã xong (kèm tên giọng) /
  // lỗi rõ ràng. Dùng đúng giọng + tốc độ đã chọn (ưu tiên giọng tiếng Việt).
  // Bấm khi đang đọc thì dừng câu cũ rồi đọc câu mới, không chồng giọng.
  // resetOther: reset trạng thái của nút đọc thử còn lại về idle ngay khi
  // lượt mới bắt đầu — để nút cũ không kẹt "Đang đọc thử…" nếu lượt cũ
  // chưa kịp tạo utterance (đổi nút trong 150ms chờ sau cancel).
  const speakTest = useCallback((text, setStatus, label, resetOther) => {
    const cfg = configRef.current;
    const synth = window.speechSynthesis;
    // Tốc độ tính 1 lần, clamp [0.5, 2] — dùng chung cho u.rate và chuỗi
    // trạng thái (tránh toFixed() ném lỗi khi config lưu hỏng).
    const rate = Math.min(2, Math.max(0.5, Number(cfg.ttsRate) || 1.2));
    const myToken = ++testTokenRef.current;
    resetOther?.();
    testActiveRef.current = true;
    if (testTimerRef.current) { clearTimeout(testTimerRef.current); testTimerRef.current = null; }
    if (testStartTimerRef.current) { clearTimeout(testStartTimerRef.current); testStartTimerRef.current = null; }
    const wasSpeaking = !!(synth && (synth.speaking || synth.pending));
    if (wasSpeaking) {
      try { synth.cancel(); } catch { /* ignore */ }
      // Vô hiệu hóa handler của utterance cũ NGAY: Chrome phát onerror
      // 'canceled' bất đồng bộ, lúc đó utter ref vẫn trỏ utterance cũ nên
      // guard cũ không chặn được → nút cũ hiện kết quả giả + log rác.
      testUtterRef.current = null;
    }
    const fail = (msg) => {
      testActiveRef.current = false;
      setStatus({ tone: 'error', text: msg });
      log(`Đọc thử (${label}): lỗi — ${msg}`);
    };
    if (!synth) {
      fail('Trình duyệt không hỗ trợ đọc giọng (speechSynthesis).');
      return;
    }
    const vs = listVoices();
    if (!vs.length) {
      fail(voicesChangedRef.current
        ? 'Trình duyệt này không có giọng đọc nào — cần cài thêm giọng đọc cho hệ điều hành hoặc trình duyệt.'
        : 'Trình duyệt chưa nạp xong danh sách giọng, thử lại sau vài giây.');
      return;
    }
    const v = pickVoice(vs, cfg.ttsVoiceURI); // không null khi vs không rỗng (vi → en → voices[0])
    setStatus({ tone: 'speaking', text: 'Đang đọc thử…' });
    // Kết thúc 1 lượt đọc thử (xong / lỗi / watchdog): dọn hết ref + timer.
    const finish = (tone, msg, logMsg) => {
      testActiveRef.current = false;
      testUtterRef.current = null;
      if (testTimerRef.current) { clearTimeout(testTimerRef.current); testTimerRef.current = null; }
      setStatus({ tone, text: msg });
      log(logMsg);
    };
    const start = () => {
      testStartTimerRef.current = null;
      if (!mountedRef.current) { testActiveRef.current = false; return; }
      if (testTokenRef.current !== myToken) return; // đã có lần bấm mới hơn
      try {
        const u = new SpeechSynthesisUtterance(text);
        u.voice = v;
        u.lang = v.lang || 'vi-VN';
        u.rate = rate;
        testUtterRef.current = u;
        // Guard bằng token: handler của utterance đã bị hủy (do lần bấm
        // mới hơn hoặc do sayNow) phải im lặng, không ghi kết quả giả.
        u.onend = () => {
          if (testTokenRef.current !== myToken || testUtterRef.current !== u) return;
          const done = `Đã đọc xong ✓ (giọng: ${v.name} · ${rate.toFixed(2)}×)`;
          finish('done', done, `Đọc thử (${label}): đã đọc xong (giọng: ${v.name})`);
        };
        u.onerror = (e) => {
          if (testTokenRef.current !== myToken || testUtterRef.current !== u) return;
          const msg = `Lỗi đọc giọng (${e?.error || 'không rõ nguyên nhân'}) — thử đổi giọng hoặc tải lại trang.`;
          finish('error', msg, `Đọc thử (${label}): lỗi — ${msg}`);
        };
        synth.speak(u);
        // Đề phòng trình duyệt nuốt lệnh đọc mà không báo onend/onerror.
        // Timeout theo độ dài câu + tốc độ; nếu vẫn đang đọc thật thì hẹn
        // lại thêm 10s thay vì báo lỗi giả.
        const estMs = Math.max(20000, Math.ceil((text.length * 350) / rate) + 5000);
        const armWatchdog = (ms) => {
          testTimerRef.current = setTimeout(() => {
            testTimerRef.current = null;
            if (testTokenRef.current !== myToken || testUtterRef.current !== u) return;
            if (synth.speaking) { armWatchdog(10000); return; }
            const msg = 'Không nhận được phản hồi từ trình duyệt (giọng đọc có thể bị kẹt) — thử bấm lại.';
            finish('error', msg, `Đọc thử (${label}): lỗi — ${msg}`);
          }, ms);
        };
        armWatchdog(estMs);
      } catch {
        testActiveRef.current = false;
        testUtterRef.current = null;
        const msg = 'Không tạo được lệnh đọc giọng trên trình duyệt này.';
        setStatus({ tone: 'error', text: msg });
        log(`Đọc thử (${label}): lỗi — ${msg}`);
      }
    };
    // Chrome có lỗi đã biết: cancel() rồi speak() ngay có thể làm câu mới
    // bị nuốt — chờ 150ms sau cancel rồi mới đọc.
    if (wasSpeaking) testStartTimerRef.current = setTimeout(start, 150);
    else start();
  }, [log]);

  const addTop = useCallback((name, points) => {
    setTop((prev) => ({ ...prev, [name]: (prev[name] || 0) + points }));
  }, []);

  const addLotus = useCallback(() => {
    const id = ++idRef.current;
    setLotuses((prev) => [...prev, { id, left: 15 + Math.random() * 70 }]);
    setTimeout(() => setLotuses((prev) => prev.filter((l) => l.id !== id)), 2600);
  }, []);

  // Cộng like + kiểm tra mốc rút quẻ (99) và mưa hoa (666).
  // Tính toán ngoài setState updater: updater phải tinh khiết — React có thể
  // gọi lại updater (StrictMode dev / concurrent), gây rút quẻ và log trùng.
  const addLikes = useCallback((n) => {
    const total = likesRef.current + n;
    likesRef.current = total;
    const fBlock = Math.floor(total / 99);
    const rBlock = Math.floor(total / 666);
    if (fBlock > fortuneBlockRef.current) {
      fortuneBlockRef.current = fBlock;
      const f = FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
      setFortune(f);
      setTimeout(() => setFortune(null), 9000);
      log(`Đủ 99 like — rút quẻ: ${f}`);
    }
    if (rBlock > rainBlockRef.current) {
      rainBlockRef.current = rBlock;
      setRain(true);
      setTimeout(() => setRain(false), 60000);
      log('Đủ 666 like — mưa hoa sen 60 giây');
    }
    setLive((prev) => ({ ...prev, likes: total }));
  }, [log]);

  // Nhận 1 bình luận (từ bot giả lập hoặc admin gõ): xếp ghế nếu có từ khóa,
  // cộng điểm TOP, và đọc đáp lời chúc nếu đủ điều kiện (không đọc nguyên văn).
  const receiveComment = useCallback((name, rawText) => {
    const text = maskBanned(rawText);
    const id = ++idRef.current;
    const seatedNow = plainHasKeyword(text, configRef.current.keyword);
    setComments((prev) => [{ id, name, text, time: nowTime(), seated: seatedNow }, ...prev].slice(0, 30));
    addTop(name, 1);
    if (seatedNow) {
      setSeated((prev) => (prev.includes(name) ? prev : [...prev, name]));
      log(`${name} gõ từ khóa "${configRef.current.keyword}" — đã xếp ghế + thắp hương`);
    }
    const cfg = configRef.current;
    if (!cfg.ttsEnabled || containsBanned(rawText)) return;
    const len = text.length;
    if (len < cfg.ttsMinChars || len > cfg.ttsMaxChars) return;
    const topic = detectWish(text);
    if (!topic) return;
    if (!shouldAnswer(name)) return;
    const line = replyLine(topic, name, cfg.channelName, cfg.ttsTemplate);
    const wait = Math.max(0, cfg.ttsGapSec * 1000 - (Date.now() - lastSpokeRef.current));
    setTimeout(() => say(line), wait);
  }, [addTop, log, say]);

  // Từ khóa vào lễ: so khớp không dấu/không khoảng trắng (như repo chùa).
  function plainHasKeyword(text, keyword) {
    const norm = (s) => ` ${String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '')} `;
    return norm(text).includes(norm(keyword).trim());
  }

  // Phiên live mô phỏng: bot vào/xem/chat/tặng quà theo chu kỳ.
  useEffect(() => {
    if (!live.connected) return undefined;
    const t = setInterval(() => {
      const r = Math.random();
      if (r < 0.4) {
        const kw = rand(FAKE_KEYWORDS);
        const line = rand(FAKE_COMMENT_TEMPLATES).replace('{kw}', kw);
        receiveComment(randName(), line);
      } else if (r < 0.6) {
        const gift = rand(GIFT_MENU);
        const giver = randName();
        addTop(giver, gift.coins * 10);
        addLotus();
        log(`${giver} tặng ${gift.name} (${gift.coins} xu) — +${gift.coins * 10} điểm TOP`);
      } else if (r < 0.85) {
        addLikes(3 + Math.floor(Math.random() * 10));
      } else {
        const joiner = randName();
        setLive((prev) => ({ ...prev, viewers: prev.viewers + 1 }));
        log(`${joiner} vào live`);
      }
    }, 4000);
    return () => clearInterval(t);
  }, [live.connected, receiveComment, addTop, addLotus, addLikes, log]);

  const connectLive = () => {
    if (!username.trim()) return;
    likesRef.current = 0;
    setLive({ connected: true, username: username.trim(), viewers: 12 + Math.floor(Math.random() * 8), likes: 0 });
    fortuneBlockRef.current = 0;
    rainBlockRef.current = 0;
    log(`Kết nối live mô phỏng với @${username.trim()} — chưa nối TikTok thật`);
  };

  const disconnectLive = () => {
    likesRef.current = 0;
    setLive({ connected: false, username: '', viewers: 0, likes: 0 });
    ambient.stop();
    if (audioRef.current) audioRef.current.pause();
    setMusic((m) => ({ ...m, playing: false }));
    log('Đã ngắt live mô phỏng');
  };

  const sendGift = (gift) => {
    const giver = guest?.name || 'Chủ quán';
    addTop(giver, gift.coins * 10);
    addLotus();
    playLotus();
    log(`${giver} tặng ${gift.name} (${gift.coins} xu) — +${gift.coins * 10} điểm TOP`);
    if (configRef.current.ttsEnabled) say(`Cảm ơn ${giver} đã tặng ${gift.name} ạ.`);
  };

  const gangEvent = () => {
    log(`Sự kiện: ${GANG_EVENT.name} (${GANG_EVENT.coins} xu) — ${GANG_EVENT.note}`);
    GANG_NAMES.forEach((n, i) => {
      setTimeout(() => receiveComment(n, rand(['Nét pô đây anh em ơi!', 'Exciter tới phá quán nè', 'Chạy tán loạn thôi!', 'Giang hồ xăm trổ đã tới!'])), i * 700);
    });
    addLikes(40);
    playBell();
  };

  const inviteMinhDuc = () => {
    if (!seated.includes('Minh Đức')) setSeated((prev) => [...prev, 'Minh Đức']);
    log('Thêm khách mời: Minh Đức đã vào ngồi');
    if (configRef.current.ttsEnabled) say('Chào mừng anh Minh Đức, chủ quán, đã vào ngồi ạ.');
  };

  const sendAdminComment = () => {
    const text = commentInput.trim();
    if (!text) {
      const kw = rand(FAKE_KEYWORDS);
      receiveComment(guest?.name || 'Chủ quán', rand(FAKE_COMMENT_TEMPLATES).replace('{kw}', kw));
    } else {
      receiveComment(guest?.name || 'Chủ quán', text);
    }
    setCommentInput('');
  };

  const simulateJoin = () => {
    const joiner = randName();
    setLive((prev) => ({ ...prev, viewers: prev.viewers + 1 }));
    receiveComment(joiner, 'Chào cả nhà, mình mới vào live!');
    log(`${joiner} vào live (giả lập)`);
  };

  // Lưu 1 phần cấu hình ngay (tên kênh, tiêu đề bảng): trước đây nút "Lưu"
  // chỉ đổi state trong bộ nhớ — tải lại trang là mất, dù nút ghi là Lưu.
  const persistConfig = useCallback((patch) => {
    const next = { ...configRef.current, ...patch };
    setConfig(next);
    saveAdminConfig(next);
    return next;
  }, []);

  const saveConfig = () => {
    saveAdminConfig(config);
    setSavedTick(true);
    log('Đã lưu cài đặt admin (localStorage)');
    setTimeout(() => setSavedTick(false), 2000);
  };

  const testComment = () => {
    const sample = 'Chào chủ quán, con mong tuần sau thi được điểm cao ạ';
    const topic = detectWish(sample);
    const line = topic ? replyLine(topic, 'Khách Vỉa Hè', config.channelName, config.ttsTemplate) : 'Chúc bạn một ngày bình an ạ.';
    speakTest(line, setCommentTest, 'comment', () => setVoiceTest({ tone: 'idle', text: '' }));
  };

  const onPickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (music.fileUrl) { try { URL.revokeObjectURL(music.fileUrl); } catch { /* ignore */ } }
    const url = URL.createObjectURL(f);
    setMusic((m) => ({ ...m, fileName: f.name, fileUrl: url, playing: false }));
    log(`Đã chọn file MP3 local: ${f.name} (chỉ phát trên trình duyệt — không tải lên server)`);
  };

  const toggleMusic = (on) => {
    if (on) {
      // Hủy timer nghe thử còn chờ (M-07): không thì nó stop() nhạc live
      // vừa bật sau 6s.
      if (previewTimerRef.current) { clearTimeout(previewTimerRef.current); previewTimerRef.current = null; }
      if (music.fileUrl && audioRef.current) {
        audioRef.current.play().catch(() => {});
      } else {
        ambient.start(music.track, config.musicVolume);
      }
      setMusic((m) => ({ ...m, playing: true }));
      log('Phát nhạc trên live (local)');
    } else {
      ambient.stop();
      if (audioRef.current) audioRef.current.pause();
      setMusic((m) => ({ ...m, playing: false }));
      log('Dừng nhạc trên live');
    }
  };

  const previewMusic = () => {
    // Bấm nghe thử lại thì đếm lại 6s từ đầu, không để 2 timer cùng chạy.
    if (previewTimerRef.current) { clearTimeout(previewTimerRef.current); previewTimerRef.current = null; }
    if (music.fileUrl && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
      previewTimerRef.current = setTimeout(() => { audioRef.current?.pause(); previewTimerRef.current = null; }, 6000);
    } else {
      ambient.start(music.track, config.musicVolume);
      previewTimerRef.current = setTimeout(() => { ambient.stop(); previewTimerRef.current = null; }, 6000);
    }
    log('Nghe thử nhạc 6 giây');
  };

  const topList = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const likeToFortune = live.likes % 99;
  const likeToRain = live.likes % 666;

  return (
    <div className="admin-wrap">
      {/* Quẻ rút được: hiện 9 giây */}
      {fortune && (
        <div className="admin-fortune">
          <div className="admin-fortune-kicker">🪷 Gieo quẻ — đủ 99 like</div>
          <div>{fortune}</div>
        </div>
      )}
      {/* Mưa hoa sen 60 giây */}
      {rain && (
        <div className="admin-rain" aria-hidden>
          {Array.from({ length: 18 }).map((_, i) => (
            <span key={i} style={{ left: `${(i * 53) % 100}%`, animationDelay: `${(i % 6) * 0.5}s` }}>🪷</span>
          ))}
        </div>
      )}
      {/* Sen vàng bay lên khi có quà */}
      <div className="admin-lotuses" aria-hidden>
        {lotuses.map((l) => (
          <span key={l.id} style={{ left: `${l.left}%` }}>🪷</span>
        ))}
      </div>

      <div className="admin-topbar">
        <button className="btn ghost" onClick={onBack}>← Về sảnh</button>
        <b>Quản trị Live</b>
        <span className="chip live">● {live.connected ? `Đang live mô phỏng @${live.username}` : 'Chưa live'}</span>
        <span className="chip">👥 {live.viewers} người xem</span>
        <span className="chip">❤️ {live.likes} like</span>
        <span className="spacer" />
        <span className="admin-note">Live mô phỏng — chưa nối TikTok thật</span>
      </div>

      {/* Thanh tiến trình like / quẻ */}
      <div className="admin-progress">
        <div><span>❤️ Like tới quẻ: {likeToFortune}/99</span><div className="admin-bar"><div style={{ width: `${(likeToFortune / 99) * 100}%` }} /></div></div>
        <div><span>🪷 Like tới mưa hoa: {likeToRain}/666</span><div className="admin-bar"><div style={{ width: `${(likeToRain / 666) * 100}%` }} /></div></div>
      </div>

      <div className="admin-grid">
        {/* 1. Kết nối Live + giọng đọc */}
        <section className="admin-card">
          <h3>🔴 Kết Nối Live</h3>
          <div className="admin-row">
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Nhập @username TikTok đang phát" disabled={live.connected} />
            {live.connected
              ? <button className="admin-btn danger" onClick={disconnectLive}>⏹ Ngắt</button>
              : <button className="admin-btn gold" onClick={connectLive} disabled={!username.trim()}>Kết Nối Live</button>}
          </div>
          <p className="admin-hint">⚠️ Đây là live mô phỏng chạy ngay trên trình duyệt (bot vào/xem/chat/tặng quà) — chưa nối TikTok thật, chưa cần server.</p>

          <div className="admin-field">
            <label>Tên kênh</label>
            <div className="admin-row">
              <input value={channelDraft} maxLength={40} onChange={(e) => setChannelDraft(e.target.value)} placeholder="Trà Đá Vỉa Hè" />
              <button className="admin-btn gold" onClick={() => { const name = channelDraft.trim(); if (name) { persistConfig({ channelName: name }); log(`Đổi tên kênh: ${name} (đã lưu)`); } }}>Lưu tên</button>
            </div>
          </div>
          <div className="admin-field">
            <label>Tiêu đề bảng TOP</label>
            <div className="admin-row">
              <input value={boardDraft} maxLength={30} onChange={(e) => setBoardDraft(e.target.value)} placeholder="TOP THÀNH TÂM" />
              <button className="admin-btn gold" onClick={() => { const t = boardDraft.trim(); if (t) { persistConfig({ boardTitle: t }); log(`Đổi tiêu đề bảng: ${t} (đã lưu)`); } }}>Lưu</button>
            </div>
          </div>
          <button className="admin-btn ghost" onClick={() => { setConfig((c) => ({ ...c, showTopBoard: !c.showTopBoard })); }}>
            Bảng TOP: {config.showTopBoard ? 'Đang BẬT' : 'Đang TẮT'} — bấm để đổi
          </button>

          <div className="admin-field">
            <label>Đọc lời chủ quán (phát trên live)</label>
            <div className="admin-row">
              <input value={ownerLine} onChange={(e) => setOwnerLine(e.target.value)} placeholder="Câu chủ quán muốn đọc…" />
              <button className="admin-btn gold" onClick={() => { sayNow(ownerLine); log(`Đọc lời chủ quán: "${ownerLine}"`); }}>🔊 Đọc Lời Chủ Quán</button>
            </div>
            <p className="admin-hint">Giọng đọc phát ngay trên trình duyệt này. Màn hình quán không phát tiếng — muốn lên live/OBS thì mở web này làm nguồn trình duyệt.</p>
          </div>

          <h3 style={{ marginTop: 18 }}>🎙 Giọng đọc</h3>
          <div className="admin-field">
            <label>Chọn giọng đọc</label>
            <select value={config.ttsVoiceURI} onChange={(e) => setConfig((c) => ({ ...c, ttsVoiceURI: e.target.value }))}>
              <option value="">Mặc định của trình duyệt (ưu tiên tiếng Việt)</option>
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>
              ))}
            </select>
            <p className="admin-hint">{voices.length ? `${voices.length} giọng có sẵn trên trình duyệt này.` : 'Trình duyệt chưa nạp xong danh sách giọng — thử lại sau vài giây.'}</p>
          </div>
          <div className="admin-field">
            <label>Tốc độ giọng đọc: <b>{config.ttsRate.toFixed(2)}×</b></label>
            <input type="range" min="0.5" max="2" step="0.05" value={config.ttsRate}
              onChange={(e) => setConfig((c) => ({ ...c, ttsRate: parseFloat(e.target.value) }))} />
            <div className="admin-range-labels"><span>Chậm · 0.5×</span><span>Nhanh · 2×</span></div>
          </div>
          <button className="admin-btn gold" onClick={() => speakTest('Trà đá một lần đây! Mời bạn ghé quán nhé.', setVoiceTest, 'giọng đọc', () => setCommentTest({ tone: 'idle', text: '' }))}>▶ Đọc thử</button>
          {voiceTest.text && (
            <p className="admin-hint" style={voiceTest.tone === 'error' ? { color: '#ffb3b3' } : voiceTest.tone === 'done' ? { color: '#8fd6a0' } : undefined}>{voiceTest.text}</p>
          )}
        </section>

        {/* Góc quay từng phòng — web client chỉ xem, chỉ admin chỉnh ở đây */}
        <CameraControl />

        {/* 2. Menu quà */}
        <section className="admin-card">
          <h3>👑 Đại Gia Phố Cổ</h3>
          <p className="admin-hint">Bấm 1 món là tặng thử ngay — cộng điểm vào bảng TOP (10 điểm/1 xu).</p>
          <div className="admin-gifts">
            {GIFT_MENU.map((g) => (
              <button key={g.id} className="admin-gift" onClick={() => sendGift(g)}>
                <span>{g.icon}</span> {g.name} ({g.coins} xu)
              </button>
            ))}
            <button className="admin-gift invite" onClick={inviteMinhDuc}>🧑‍🍳 Thêm Khách Mời: Minh Đức</button>
          </div>
          <button className="admin-banner-red" onClick={gangEvent}>
            🚨 {GANG_EVENT.name} ({GANG_EVENT.coins} XU • {GANG_EVENT.note})
          </button>

          {config.showTopBoard && (
            <div className="admin-topboard">
              <h4>🏆 {config.boardTitle}</h4>
              <p className="admin-hint">1 điểm/bình luận · 10 điểm/1 xu quà</p>
              {topList.length === 0
                ? <p className="admin-hint">Chưa có điểm — tặng quà hoặc chat để lên bảng.</p>
                : topList.map(([name, pts], i) => (
                  <div key={name} className="admin-top-row"><span>{i + 1}. {name}</span><b>{pts} điểm</b></div>
                ))}
            </div>
          )}
          <div className="admin-field">
            <label>Đã xếp ghế + thắp hương ({seated.length})</label>
            <p className="admin-hint">{seated.length ? seated.join(' · ') : 'Chưa ai gõ từ khóa vào lễ.'}</p>
          </div>
        </section>

        {/* 3. Giả lập bình luận */}
        <section className="admin-card">
          <h3>💬 3. Giả Lập Bình Luận Người Xem TikTok</h3>
          <div className="admin-row">
            <button className="admin-btn ghost" onClick={gangEvent}>Gọi mấy anh giang hồ</button>
            <button className="admin-btn gold" onClick={sendAdminComment}>Gửi Comment</button>
            <button className="admin-btn ghost" onClick={simulateJoin}>Giả Lập Người Vào Live</button>
          </div>
          <div className="admin-field">
            <label>Nội dung comment (để trống = lấy câu mẫu)</label>
            <input value={commentInput} onChange={(e) => setCommentInput(e.target.value.slice(0, 160))}
              placeholder={`VD: cho 1 ly trà đá — hoặc gõ "${config.keyword}" để xếp ghế`} />
          </div>
          <p className="admin-hint">Từ khóa tự động: {FAKE_KEYWORDS.join(' · ')} — bình luận chứa từ khóa vào lễ <b>"{config.keyword}"</b> sẽ được xếp ghế + thắp hương.</p>
          <div className="admin-comments">
            {comments.length === 0
              ? <p className="admin-hint">Chưa có bình luận nào — bật live mô phỏng hoặc bấm Giả Lập.</p>
              : comments.slice(0, 10).map((c) => (
                <div key={c.id} className="admin-comment">
                  <b>{c.name}</b> <span className="admin-time">{c.time}</span>
                  {c.seated && <span className="admin-seated">🪷 đã xếp ghế</span>}
                  <div>{c.text}</div>
                </div>
              ))}
          </div>
        </section>

        {/* 4. Nhạc nền MP3 */}
        <section className="admin-card">
          <h3>🎵 4. Quản Lý Nhạc Nền MP3 Vỉa Hè (Đồng Bộ Sang Live)</h3>
          <div className="admin-field">
            <label>Track nhạc nền (tổng hợp bằng WebAudio — không cần file)</label>
            <select value={music.track} onChange={(e) => { setMusic((m) => ({ ...m, track: e.target.value })); setConfig((c) => ({ ...c, musicTrack: e.target.value })); }}>
              {MUSIC_TRACKS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="admin-row">
            <button className="admin-btn gold" onClick={() => toggleMusic(true)} disabled={music.playing}>▶ Phát Trên Live</button>
            <button className="admin-btn ghost" onClick={() => toggleMusic(false)} disabled={!music.playing}>⏸ Dừng Trên Live</button>
          </div>
          <div className="admin-row">
            <button className="admin-btn ghost" onClick={previewMusic}>🎧 Nghe Thử</button>
            <button className="admin-btn danger" onClick={() => { if (music.fileUrl) { try { URL.revokeObjectURL(music.fileUrl); } catch { /* ignore */ } } setMusic((m) => ({ ...m, fileName: '', fileUrl: '' })); if (audioRef.current) audioRef.current.pause(); log('Đã xóa file MP3 đã chọn'); }}>🗑 Xóa</button>
          </div>
          <div className="admin-field">
            <label>Tải thêm file MP3 (chỉ phát local trên trình duyệt — không tải lên server)</label>
            <input ref={fileRef} type="file" accept="audio/*" onChange={onPickFile} style={{ display: 'none' }} />
            <button className="admin-btn ghost" onClick={() => fileRef.current?.click()}>📁 Tải Thêm File MP3 Lên…</button>
            {music.fileName && <p className="admin-hint">Đang chọn: <b>{music.fileName}</b></p>}
            {music.fileUrl && <audio ref={audioRef} src={music.fileUrl} controls loop style={{ width: '100%', marginTop: 8 }} />}
          </div>
          <div className="admin-field">
            <label>Âm lượng nhạc nền: <b>{Math.round(config.musicVolume * 100)}%</b></label>
            <input type="range" min="0" max="1" step="0.05" value={config.musicVolume}
              onChange={(e) => setConfig((c) => ({ ...c, musicVolume: parseFloat(e.target.value) }))} />
          </div>
          <div className="admin-row">
            <button className="admin-btn ghost" onClick={() => { playBell(); log('Thỉnh chuông'); }}>🔔 Thỉnh chuông</button>
            <button className="admin-btn ghost" onClick={() => { playMo(); log('Gõ mõ'); }}>🪵 Gõ mõ</button>
            <button className="admin-btn ghost" onClick={() => { playLotus(); log('Chuông sen'); }}>🪷 Chuông sen</button>
          </div>
        </section>

        {/* 5. Đọc comment TTS */}
        <section className="admin-card admin-span2">
          <h3>🎙 6. Đọc Comment Người Dùng (TikTok Live TTS)</h3>
          <div className="admin-row">
            <label className="admin-check">
              <input type="checkbox" checked={config.ttsEnabled}
                onChange={(e) => setConfig((c) => ({ ...c, ttsEnabled: e.target.checked }))} />
              Bật Tự Động Đọc Bình Luận Trên Live
            </label>
            <span className="chip live">{config.ttsEnabled ? 'Đang BẬT' : 'Đang TẮT'}</span>
          </div>
          <div className="admin-tts-grid">
            <div className="admin-field">
              <label>Mẫu câu đọc AI (Template)</label>
              <select value={config.ttsTemplate} onChange={(e) => setConfig((c) => ({ ...c, ttsTemplate: e.target.value }))}>
                <option value="blessing">Lời chúc theo chủ đề (khuyên dùng)</option>
                <option value="thanks">Cảm ơn ngắn + lời chúc</option>
                <option value="short">Chỉ lời chúc ngắn</option>
              </select>
              <p className="admin-hint">Giọng đọc không bao giờ đọc nguyên văn bình luận — chỉ đáp lời chúc soạn sẵn theo chủ đề (thi, sức khỏe, tình duyên, gia đình, việc, tiền, bình an).</p>
            </div>
            <div className="admin-field">
              <label>Giãn cách (giây)</label>
              <input type="number" min="1" max="30" value={config.ttsGapSec}
                onChange={(e) => setConfig((c) => ({ ...c, ttsGapSec: Math.max(1, parseInt(e.target.value, 10) || 3) }))} />
            </div>
            <div className="admin-field">
              <label>Ký tự tối đa</label>
              <input type="number" min="10" max="200" value={config.ttsMaxChars}
                onChange={(e) => setConfig((c) => ({ ...c, ttsMaxChars: Math.max(10, parseInt(e.target.value, 10) || 80) }))} />
            </div>
            <div className="admin-field">
              <label>Ký tự tối thiểu</label>
              <input type="number" min="1" max="20" value={config.ttsMinChars}
                onChange={(e) => setConfig((c) => ({ ...c, ttsMinChars: Math.max(1, parseInt(e.target.value, 10) || 2) }))} />
              <button className="admin-btn gold" onClick={saveConfig} style={{ marginTop: 8 }}>{savedTick ? '✓ Đã lưu' : '💾 Lưu Cài Đặt'}</button>
            </div>
          </div>
          <p className="admin-hint">Giới hạn chống spam: 1 lời đáp/người/10 phút, tối đa 1 lời đáp/20 giây toàn phòng. Tên/bình luận có từ cấm sẽ bị che *** và không đọc.</p>
          <div className="admin-row">
            <button className="admin-btn gold" onClick={testComment}>🔊 Đọc Thử Comment</button>
            <button className="admin-btn ghost" onClick={() => { setComments([]); log('Đã xóa danh sách bình luận gần nhất'); }}>🗑 Xóa danh sách</button>
          </div>
          {commentTest.text && (
            <p className="admin-hint" style={commentTest.tone === 'error' ? { color: '#ffb3b3' } : commentTest.tone === 'done' ? { color: '#8fd6a0' } : undefined}>{commentTest.text}</p>
          )}
          <div className="admin-field">
            <label>Bình Luận Gần Nhất (Click nút Loa để đọc lại trên Live)</label>
            {comments.length === 0
              ? <p className="admin-hint">Chưa có bình luận nào.</p>
              : comments.slice(0, 5).map((c) => (
                <div key={c.id} className="admin-comment">
                  <b>{c.name}</b> <span className="admin-time">{c.time}</span>
                  <div>{c.text}</div>
                  <button className="admin-btn ghost" style={{ marginTop: 6 }} onClick={() => {
                    const topic = detectWish(c.text);
                    sayNow(topic ? replyLine(topic, c.name, config.channelName, config.ttsTemplate) : `Cảm ơn ${c.name} đã ghé live ạ.`);
                  }}>🔊 Đọc lại</button>
                </div>
              ))}
          </div>
        </section>

        {/* 6. Nhật ký RPC */}
        <section className="admin-card admin-span2">
          <h3>📟 5. Nhật Ký Phản Hồi JSON-RPC 2.0 (/rpc)</h3>
          <p className="admin-hint">Nhật ký nội bộ của bảng admin — chưa nối server /rpc thật (repo chùa cũng không có JSON-RPC, chỉ có SSE + REST).</p>
          <div className="admin-log">
            {rpcLog.map((e, i) => (
              <div key={i}><span className="admin-time">{e.time}</span> {e.text}</div>
            ))}
          </div>
          <button className="admin-btn ghost" onClick={() => { setRpcLog([{ time: nowTime(), text: '{"status": "Sẵn sàng nhận lệnh JSON-RPC 2.0"}' }]); }}>🗑 Xóa nhật ký</button>
        </section>
      </div>

      <p className="admin-foot">
        Quản trị Live chạy hoàn toàn trên trình duyệt này: live mô phỏng, giọng đọc, nhạc và nhật ký đều local — không server, không TikTok thật, không tải file lên đâu cả.
      </p>
    </div>
  );
}
