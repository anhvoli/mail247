import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BOT_NAMES, ROOMS, arenaSeatId, seatId } from './data';
import { karaokeAllSeatIds } from './karaoke-room-spec';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function allSeatIds(room) {
  if (room.kind === 'cinema') {
    const ids = [];
    for (const r of room.rows) for (let c = 1; c <= room.cols; c++) ids.push(seatId(r, c));
    return ids;
  }
  if (room.kind === 'arena') {
    const ids = [];
    for (const r of room.rings) for (let n = 1; n <= room.seatsPerRing; n++) ids.push(arenaSeatId(r, n));
    return ids;
  }
  // Karaoke / Got Talent: 3 hàng A/B/C × 10 ghế đỏ (xem karaoke-room-spec.js).
  if (room.kind === 'karaoke') return karaokeAllSeatIds();
  const ids = [];
  for (let t = 1; t <= room.tables; t++) for (let s = 1; s <= room.seatsPerTable; s++) ids.push(`B${String(t).padStart(2, '0')}-${s}`);
  return ids;
}

// Bot đã ngồi sẵn ngay từ lúc mở phòng — số người online khớp với ghế trên sơ đồ
// ngay ở lần render đầu, không chờ timer.
function seedSeats(room) {
  const ids = shuffle(allSeatIds(room));
  const seats = {};
  const bots = shuffle(BOT_NAMES).slice(0, room.botCount);
  bots.forEach((name, i) => { seats[ids[i]] = { kind: 'bot', name }; });
  return seats;
}

export function useRoom(roomId, guestName, resumeVideo) {
  const room = ROOMS[roomId];
  const [seats, setSeats] = useState(() => seedSeats(room));
  const [mySeat, setMySeat] = useState(null);
  const [queue, setQueue] = useState(() => room.queue.map((q) => ({ ...q })));
  const [current, setCurrent] = useState(() => ({ ...room.nowPlaying, nonce: 0 }));
  const [voted, setVoted] = useState(new Set());
  const [skipVotes, setSkipVotes] = useState(0);
  const [messages, setMessages] = useState(() => [
    { id: 1, name: 'Hệ thống', text: `Chào mừng ${guestName || 'bạn'} đến ${room.name}! Chọn một ghế thật ưng rồi cùng xem nhé.`, time: new Date(), bot: false, system: true },
  ]);
  const msgId = useRef(2);

  // Video đang chiếu của phòng này (để mở lại phòng thì tiếp tục bài đó thay
  // vì quay về bài mẫu) — App ghi nhớ từ lần vào phòng trước.
  const resumeVideoRef = useRef(resumeVideo);
  useEffect(() => { resumeVideoRef.current = resumeVideo; }, [resumeVideo]);

  // Mỗi phòng có state riêng: đổi phòng là reset toàn bộ (ghế, hàng đợi, video
  // đang chiếu, vote, chat) về trạng thái gốc của phòng đó — riêng video đang
  // chiếu thì tiếp tục bài đã nhớ (nếu có) để thẻ "Đang chiếu" ở sảnh khớp
  // với bài sẽ phát khi vào lại phòng.
  const roomIdRef = useRef(roomId);
  useEffect(() => {
    if (roomIdRef.current === roomId) return;
    roomIdRef.current = roomId;
    const r = ROOMS[roomId];
    setSeats(seedSeats(r));
    setMySeat(null);
    setQueue(r.queue.map((q) => ({ ...q })));
    // Chỉ tiếp tục bài đã nhớ khi bài đó thuộc phòng này — bài của phòng cũ
    // mà lọt vào resume là bài đang chiếu nhảy qua lại giữa 2 phòng (fix
    // 07/11 ~00:30); không thuộc thì quay về bài mẫu của phòng.
    const saved = resumeVideoRef.current;
    const savedBelongs = saved && (saved.id === r.nowPlaying.id
      || r.queue.some((q) => q.id === saved.id));
    setCurrent(savedBelongs
      ? { ...saved, nonce: 0 }
      : { ...r.nowPlaying, nonce: 0 });
    setVoted(new Set());
    setSkipVotes(0);
    msgId.current = 2;
    setMessages([{
      id: 1, name: 'Hệ thống',
      text: `Chào mừng ${guestName || 'bạn'} đến ${r.name}! Chọn một ghế thật ưng rồi cùng xem nhé.`,
      time: new Date(), bot: false, system: true,
    }]);
  }, [roomId, guestName]);

  const occupiedCount = useMemo(() => Object.keys(seats).length, [seats]);
  const realCount = 1; // bản local: chỉ có bạn là người thật; bot không tính vào ngưỡng bỏ qua
  const skipThreshold = Math.max(1, Math.ceil(realCount * 0.3));
  const skipVoted = skipVotes > 0;
  const skipCount = skipVotes;

  const seatsRef = useRef(seats);
  useEffect(() => { seatsRef.current = seats; }, [seats]);
  const mySeatRef = useRef(mySeat);
  useEffect(() => { mySeatRef.current = mySeat; }, [mySeat]);

  const pickSeat = useCallback((id) => {
    const prev = seatsRef.current;
    const next = { ...prev };
    const occupant = next[id];
    if (occupant && occupant.kind === 'bot') {
      // Bot nhường ghế: chuyển sang một ghế trống ngẫu nhiên.
      const free = allSeatIds(room).filter((s) => !next[s] || s === id);
      const target = free[Math.floor(Math.random() * free.length)];
      if (target && target !== id) next[target] = occupant;
    }
    // Ghế cũ của mình được trả lại (trống).
    const old = mySeatRef.current;
    if (old && old !== id) delete next[old];
    next[id] = { kind: 'me', name: guestName };
    setSeats(next);
    setMySeat(id);
  }, [room, guestName]);

  const queueRef = useRef(queue);
  useEffect(() => { queueRef.current = queue; }, [queue]);
  const currentRef = useRef(current);
  useEffect(() => { currentRef.current = current; }, [current]);

  // Mở lại phòng thì tiếp tục bài đã nhớ (App ghi lại mỗi lần đổi bài).
  // Cần effect riêng ngoài reset-effect vì đường sảnh → Rạp phim không đổi
  // roomId của hook (lúc ở sảnh hook đã chạy với 'phim'), nên reset-effect
  // không chạy lại — chỉ có resumeVideo đổi thì mới khôi phục được bài.
  // KHÔNG áp resume khi đang chờ chuyển bài sau vote bỏ qua (skipVotes > 0):
  // nếu không, App đồng bộ liveNowPlaying trong lúc chờ sẽ đổi bài ngay lúc
  // bấm vote (bài "nhảy" và counter reset về 0/1 trước khi ai kịp nhìn).
  const skipVotesRef = useRef(skipVotes);
  useEffect(() => { skipVotesRef.current = skipVotes; }, [skipVotes]);
  useEffect(() => {
    if (skipVotesRef.current > 0) return;
    if (resumeVideo && resumeVideo.id !== currentRef.current.id) {
      // Chỉ áp bài đã nhớ khi bài đó thuộc phòng này (kể cả video do người
      // xem tự thêm — có trong hàng đợi live); bài phòng khác thì bỏ qua,
      // không để bài đang chiếu nhảy sang phòng khác (fix 07/11 ~00:30).
      const r = ROOMS[roomId];
      const belongs = resumeVideo.id === r.nowPlaying.id
        || r.queue.some((q) => q.id === resumeVideo.id)
        || queueRef.current.some((q) => q.id === resumeVideo.id);
      if (!belongs) return;
      setCurrent({ ...resumeVideo, nonce: 0 });
      setSkipVotes(0);
    }
  }, [resumeVideo]);

  const advanceToNext = useCallback((reason) => {
    const q = queueRef.current;
    const sorted = [...q].sort((a, b) => b.votes - a.votes);
    const next = sorted.find((item) => item.id !== currentRef.current.id) || sorted[0];
    if (!next) return;
    setCurrent({ id: next.id, title: next.title, by: next.by, duration: next.duration, nonce: Date.now() });
    setVoted(new Set());
    setSkipVotes(0);
    setMessages((m) => [...m, {
      id: msgId.current++, name: 'Hệ thống',
      text: reason === 'skip'
        ? `Đã bỏ qua bài theo vote — cả rạp cùng xem: ${next.title} (do ${next.byGuest} đề xuất)`
        : `Cả rạp cùng xem: ${next.title} (do ${next.byGuest} đề xuất)`,
      time: new Date(), bot: false, system: true,
    }]);
    setQueue(q.map((item) => ({ ...item, votes: 0 })));
  }, []);

  const advanceRef = useRef(advanceToNext);
  useEffect(() => { advanceRef.current = advanceToNext; }, [advanceToNext]);

  // Bot tự đổi ghế + chat thỉnh thoảng (mô phỏng rạp đông).
  useEffect(() => {
    const t = setInterval(() => {
      setSeats((prev) => {
        if (Math.random() > 0.45) return prev;
        const botSeats = Object.entries(prev).filter(([, v]) => v.kind === 'bot');
        if (!botSeats.length) return prev;
        const [from, bot] = botSeats[Math.floor(Math.random() * botSeats.length)];
        const free = allSeatIds(room).filter((s) => !prev[s]);
        if (!free.length) return prev;
        const to = free[Math.floor(Math.random() * free.length)];
        const next = { ...prev };
        delete next[from];
        next[to] = bot;
        return next;
      });
      // Chat của bot do App.jsx điều khiển (để tránh trùng lặp interval).
    }, 9000);
    return () => clearInterval(t);
  }, [room]);

  const vote = useCallback((videoId) => {
    setQueue((q) => q.map((item) => (item.id === videoId ? { ...item, votes: item.votes + 1 } : item)));
    setVoted((v) => new Set(v).add(videoId));
  }, []);

  // Trả về: true = đã thêm, 'duplicate' = video đã có trong hàng đợi / đang chiếu, false = link sai.
  const addToQueue = useCallback((url) => {
    const m = url.match(/[?&]v=([A-Za-z0-9_-]{11})|\/shorts\/([A-Za-z0-9_-]{11})|youtu\.be\/([A-Za-z0-9_-]{11})/);
    const id = m ? (m[1] || m[2] || m[3]) : null;
    if (!id) return false;
    if (currentRef.current.id === id) return 'duplicate';
    if (queueRef.current.some((item) => item.id === id)) return 'duplicate';
    setQueue((q) => [...q, { id, title: `Video YouTube ${id}`, by: 'YouTube', duration: '?', votes: 0, byGuest: guestName }]);
    return true;
  }, [guestName]);

  const sendMessage = useCallback((text) => {
    setMessages((m) => [...m, { id: msgId.current++, name: guestName, text, time: new Date(), bot: false }]);
  }, [guestName]);

  const botSay = useCallback((line, name) => {
    setMessages((m) => [...m, { id: msgId.current++, name, text: line, time: new Date(), bot: true }]);
  }, []);

  // Vote bỏ qua: đếm bằng state riêng, watcher effect bên dưới sẽ chuyển bài
  // khi đủ ngưỡng — không phụ thuộc vào closure của callback.
  // Ghi lại bài đang chiếu lúc bấm vote: hẹn chuyển bài chỉ được bắn khi bài
  // đó vẫn đang chiếu — nếu bài đã đổi vì lý do khác trong lúc chờ (hết bài
  // tự nhiên, resume) thì không chuyển nhầm sang bài kế tiếp nữa.
  const skipForVideoRef = useRef(null);
  const voteSkip = useCallback(() => {
    skipForVideoRef.current = currentRef.current.id;
    setSkipVotes((v) => (v > 0 ? v : v + 1));
  }, []);

  // Chuyển bài 5 giây sau khi đủ vote (round 4 — nguyên nhân thật của lỗi
  // "vote xong counter vẫn 0/1" ở kiểm tra live: round 1 chỉ chờ 600ms,
  // round 2 chờ 2s — trạng thái 1/1 + toast chỉ hiện trong tích tắc rồi
  // advanceToNext reset về 0/1 cho bài mới. Người kiểm tra nhìn sau lúc
  // bài đã đổi nên chỉ thấy 0/1 của bài mới, còn bài thì "nhảy" ngay sau
  // mỗi lần bấm. Chờ 5s thì 1/1 và toast nhìn thấy rõ rồi mới chuyển bài;
  // tin nhắn hệ thống của advanceToNext('skip') cũng ghi lại vote đã xảy
  // ra nên dấu vết vote không biến mất cùng counter.
  // Hẹn này bị hủy nếu đổi phòng trong lúc chờ (deps có roomId), và callback
  // kiểm tra lại phòng + bài hiện tại trước khi chuyển — không chuyển bài
  // nhầm sang phòng mới sau khi đã rời phòng cũ (round 2 từng đen trang
  // khi rời phòng ngay sau vote).
  useEffect(() => {
    if (skipVotes <= 0 || skipVotes < skipThreshold) return undefined;
    const targetRoom = roomId;
    const targetVideo = skipForVideoRef.current;
    const t = setTimeout(() => {
      if (roomIdRef.current === targetRoom && currentRef.current.id === targetVideo) advanceRef.current('skip');
    }, 5000);
    return () => clearTimeout(t);
  }, [skipVotes, skipThreshold, roomId]);

  return {
    room, seats, mySeat, pickSeat, queue, current, voted, vote, addToQueue,
    messages, sendMessage, botSay, skipVoted, voteSkip, skipCount, skipThreshold,
    realCount, occupiedCount, advanceToNext,
  };
}
