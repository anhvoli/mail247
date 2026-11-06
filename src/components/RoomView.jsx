import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Cinema3D, { CAMERA_PRESETS } from './Cinema3D';
import Arena3D, { ARENA_CAMERA_PRESETS } from './Arena3D';
import Karaoke3D, { KARAOKE_CAMERA_PRESETS } from './Karaoke3D';
import ErrorBoundary from './ErrorBoundary';
import SeatMap from './SeatMap';
import { EMOJI_GROUPS, GESTURES, MISSIONS } from '../data';
import { KARAOKE_RULES } from '../karaoke-room-spec';

// Karaoke mở 19:00–23:00 giờ VN (theo bản gốc). Ngoài giờ vẫn vào xem thử
// được, chỉ hiện ghi chú — không chặn cửa.
function karaokeOpenNow() {
  try {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const h = now.getHours();
    const open = parseInt(KARAOKE_RULES.openHours.open, 10);
    const close = parseInt(KARAOKE_RULES.openHours.close, 10);
    return h >= open && h < close;
  } catch { return true; }
}

function fmtTime(d) {
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function fmtClock(s) {
  s = Math.max(0, Math.floor(s || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function parseDuration(str) {
  const m = String(str || '').match(/(\d+):(\d+)/);
  return m ? (+m[1]) * 60 + (+m[2]) : 0;
}

// Panel "TRÊN MÀN ẢNH" như bản gốc (đè lên góc trái khung 3D): tên bài, người
// đề xuất, thời gian hiện tại / tổng thời lượng, thanh tiến trình, vote bỏ qua
// theo đúng định dạng gốc "Vote bỏ qua X/Y" và "X/N người thật đồng ý · P% ·
// Đủ 30% thì chuyển bài".
// HIỆU NĂNG: panel được memo + tự cập nhật đồng hồ bằng interval RIÊNG đọc
// từ playheadRef — RoomView không còn setState mỗi giây, nên Canvas 3D không
// bị render lại mỗi giây nữa. Panel chỉ render lại khi đúng props của nó đổi
// (đổi bài, vote, hàng đợi).
const NowPlayingPanel = memo(function NowPlayingPanel({ current, queue, playheadRef, skipCount, skipThreshold, realCount, skipVoted, onVoteSkip }) {
  // Trên điện thoại panel mặc định thu gọn thành 1 chip để không che video;
  // bấm để mở đầy đủ. Trên màn hình lớn mặc định mở.
  const [open, setOpen] = useState(() => typeof window === 'undefined' || window.innerWidth > 640);
  // Đồng hồ phát chỉ sống trong panel này: đọc playheadRef mỗi giây, setState
  // cục bộ nên chỉ panel render lại, không chạm tới Canvas hay RoomView.
  // Chỉ nhận giờ từ đúng bài đang chiếu (so vid): player lúc chuyển bài có
  // lúc còn trả giờ/thời lượng của bài CŨ, nhận bừa là panel hiện sai thời
  // lượng (từng hiện 5:26 của bài Sơn Tùng cho video đấu trường).
  const [time, setTime] = useState(() => ({ ...playheadRef.current }));
  // Đổi bài thì đồng hồ về 0 ngay (không lấy giờ bài cũ).
  useEffect(() => { setTime({ cur: 0, dur: parseDuration(current.duration), vid: current.id }); }, [current.id, current.duration]);
  useEffect(() => {
    const t = setInterval(() => {
      const p = playheadRef.current;
      if (p.vid !== current.id) return;
      setTime((prev) => (prev.cur === p.cur && prev.dur === p.dur ? prev : { cur: p.cur, dur: p.dur, vid: p.vid }));
    }, 1000);
    return () => clearInterval(t);
  }, [playheadRef, current.id]);
  const suggester = queue.find((q) => q.id === current.id)?.byGuest || current.by;
  const dur = time.dur > 0 ? time.dur : parseDuration(current.duration);
  const pct = dur > 0 ? Math.min(100, (time.cur / dur) * 100) : 0;
  const agreePct = realCount > 0 ? Math.round((skipCount / realCount) * 100) : 0;
  if (!open) {
    const short = current.title.length > 42 ? current.title.slice(0, 42) + '…' : current.title;
    return (
      <div className="now-playing collapsed">
        <button className="np-toggle" onClick={() => setOpen(true)}>▶ Đang chiếu: {short}</button>
      </div>
    );
  }
  return (
    <div className="now-playing">
      <button className="np-collapse" onClick={() => setOpen(false)} title="Thu gọn panel" aria-label="Thu gọn panel">✕</button>
      <div className="kicker">Trên màn ảnh</div>
      <div className="title">{current.title}</div>
      <div className="meta">{suggester} đề xuất · {fmtClock(time.cur)} / {fmtClock(dur)}</div>
      <div className="progress"><div style={{ width: `${pct}%` }} /></div>
      <button className="skip-btn" disabled={skipVoted} onClick={onVoteSkip}>
        ▶ Vote bỏ qua {skipCount}/{skipThreshold}
      </button>
      <div className="vote-line">
        {skipCount}/{realCount} người thật đồng ý · {agreePct}% · Đủ 30% thì chuyển bài
      </div>
    </div>
  );
});

// Thanh dọc bên phải khung 3D (như bản gốc): Hàng chờ / Trò chuyện / Tương tác
// chuyển tab hoặc cuộn tới hàng điệu bộ; Gửi video mở tab hàng đợi;
// Chiếu ảnh / Tủ đồ / Ủng hộ là tính năng phase sau (bấm chỉ báo, không giả vờ có).
function RightRail({ queueCount, onTab, onToast, gestureRowRef }) {
  const items = [
    { icon: '➕', label: 'Gửi video', act: () => { onTab('queue'); onToast('Dán link YouTube vào ô bên dưới rồi bấm Thêm.'); } },
    { icon: '🖼️', label: 'Chiếu ảnh', act: () => onToast('Chiếu ảnh sẽ có ở phase sau (cần số dư ủng hộ).') },
    { icon: '☰', label: 'Hàng chờ', badge: queueCount, act: () => onTab('queue') },
    { icon: '💬', label: 'Trò chuyện', act: () => onTab('chat') },
    { icon: '✨', label: 'Tương tác', act: () => gestureRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }) },
    { icon: '👕', label: 'Tủ đồ', act: () => onToast('Tủ đồ sẽ có ở phase sau.') },
    { icon: '❤️', label: 'Ủng hộ', act: () => onToast('Ủng hộ sẽ có ở phase sau.') },
  ];
  return (
    <div className="rail">
      {items.map((it) => (
        <button key={it.label} onClick={it.act} title={it.label}>
          <span className="ic">{it.icon}</span>
          {it.badge ? <span className="badge">{it.badge}</span> : null}
          <span>{it.label}</span>
        </button>
      ))}
    </div>
  );
}

// Ảnh thumbnail hàng đợi: thử default.jpg, lỗi thì thử mqdefault.jpg, vẫn lỗi thì
// hiện ô placeholder — không để ảnh vỡ nằm trong danh sách.
function QueueThumb({ videoId, title }) {
  const [step, setStep] = useState(0);
  useEffect(() => { setStep(0); }, [videoId]);
  if (step >= 2) {
    return (
      <span className="thumb-fallback" aria-label={title}>🎬</span>
    );
  }
  return (
    <img src={step === 0 ? `https://i.ytimg.com/vi/${videoId}/default.jpg` : `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`}
      alt="" loading="lazy" onError={() => setStep((s) => s + 1)} />
  );
}

export default function RoomView({ guest, roomState, onLeave, exp, missionsDone, onMissionDone, onChatSent }) {
  const { room, seats, mySeat, pickSeat, queue, current, voted, vote, addToQueue,
    messages, sendMessage, skipVoted, voteSkip, skipCount, skipThreshold, realCount, occupiedCount, advanceToNext } = roomState;
  // Góc camera theo từng loại phòng: đấu trường dùng preset riêng (vị trí cho
  // khán đài vòng tròn), karaoke dùng preset riêng (sân khấu rèm đỏ),
  // rạp phim / Rạp Trời dùng preset cũ.
  const PRESETS = room.kind === 'arena' ? ARENA_CAMERA_PRESETS : room.kind === 'karaoke' ? KARAOKE_CAMERA_PRESETS : CAMERA_PRESETS;
  const isKaraoke = room.kind === 'karaoke';
  const [tab, setTab] = useState('queue');
  const [chatText, setChatText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [emojiGroup, setEmojiGroup] = useState('Cảm xúc');
  const [gesture, setGesture] = useState(null);
  const [toast, setToast] = useState('');
  const [queueUrl, setQueueUrl] = useState('');
  const [camera, setCamera] = useState('overview');
  const [controlsOn, setControlsOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Số lần ngắm lại camera (fix 07/11 ~00:30): AvatarWalk chỉnh camera trực
  // tiếp nên Rig chỉ ngắm lại khi preset đổi — bấm lại góc đang chọn là
  // state no-op, ngồi xuống ghế sau khi đi lại cũng vậy, camera kẹt ở vị
  // trí đi lại. Tăng số này mỗi lần bấm nút góc hoặc ngồi ghế để Rig ngắm
  // lại đúng góc preset.
  const [cameraNonce, setCameraNonce] = useState(0);
  const prevSeatRef = useRef(mySeat);
  useEffect(() => {
    if (mySeat && prevSeatRef.current !== mySeat) setCameraNonce((n) => n + 1);
    prevSeatRef.current = mySeat;
  }, [mySeat]);
  // Thời gian phát hiện tại CHỈ ghi vào ref (poll player mỗi giây): trước đây
  // setPlayhead mỗi giây làm RoomView render lại toàn bộ — kể cả Canvas R3F
  // và toàn bộ cảnh 3D — nên phòng bị giật mỗi giây. Giờ interval chỉ ghi
  // ref; panel "TRÊN MÀN ẢNH" tự đọc ref bằng interval riêng của nó, còn
  // startSeconds (phát tiếp từ giây đã xem khi player remount vì đổi góc)
  // đọc ref lúc render lại vì đổi góc/đổi bài.
  const playheadRef = useRef({ cur: 0, dur: 0, vid: null });
  // Đổi bài thì playhead về 0 ngay trong lúc render (không đợi effect) để
  // startSeconds của bài mới không lấy nhầm giờ bài cũ.
  const playheadVideoId = useRef(current.id);
  if (playheadVideoId.current !== current.id) {
    playheadVideoId.current = current.id;
    playheadRef.current = { cur: 0, dur: parseDuration(current.duration), vid: current.id };
  }
  const stageRef = useRef(null);
  const playerRef = useRef(null);
  const gestureRowRef = useRef(null);

  // --- Chấm điểm Karaoke (chỉ dùng khi room.kind === 'karaoke') ---
  // Ca sĩ đang hát = người đề xuất bài đang chiếu; điểm trung bình hiện trên
  // bảng ScoreBoard trong cảnh 3D (Karaoke3D.jsx).
  const singerName = queue.find((q) => q.id === current.id)?.byGuest || current.by;
  const [scores, setScores] = useState([]);
  const [myScore, setMyScore] = useState(null);
  const [inviteDownCount, setInviteDownCount] = useState(0);
  const [inviteDownVoted, setInviteDownVoted] = useState(false);
  // Đổi bài (đổi ca sĩ) thì reset điểm + vote mời xuống.
  useEffect(() => {
    setScores([]); setMyScore(null); setInviteDownCount(0); setInviteDownVoted(false);
  }, [current.id]);
  const averageScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null;
  const scorerCount = scores.length;

  const currentIdRef = useRef(current.id);
  useEffect(() => { currentIdRef.current = current.id; }, [current.id]);
  useEffect(() => {
    const t = setInterval(() => {
      const p = playerRef.current;
      if (!p) return;
      try {
        const dur = p.getDuration ? p.getDuration() : 0;
        const cur = p.getCurrentTime ? p.getCurrentTime() : 0;
        // Chỉ ghi giờ khi player đang giữ đúng bài đang chiếu VÀ đã chạy
        // thật (cur > 0): lúc chuyển bài player còn trả thời lượng của bài
        // cũ, ghi bừa là panel hiện sai thời lượng (từng hiện 5:26 cho
        // video đấu trường); video lỗi kẹt ở 0:00 thì không ghi gì cả.
        let vid = currentIdRef.current;
        try {
          const vd = p.getVideoData && p.getVideoData();
          if (vd && vd.video_id) vid = vd.video_id;
        } catch { /* API cũ không có getVideoData */ }
        if (dur > 0 && cur > 0 && vid === currentIdRef.current) playheadRef.current = { cur, dur, vid };
      } catch { /* player chưa sẵn / đã hủy */ }
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Callback ổn định cho cảnh 3D: dùng ref "latest" để memo của cảnh không
  // bị phá mỗi lần App render lại (advanceToNext/pickSeat trong roomState có
  // thể đổi identity khi App render lại vì EXP/nhiệm vụ).
  const advanceRef = useRef(advanceToNext);
  advanceRef.current = advanceToNext;
  const pickRef = useRef(pickSeat);
  pickRef.current = pickSeat;
  const handleEnded = useCallback(() => advanceRef.current(), []);
  const handlePickSeat = useCallback((id) => pickRef.current(id), []);
  const handlePlayerReady = useCallback((p) => { playerRef.current = p; }, []);

  // Cảnh 3D được memo: element này giữ nguyên identity qua các lần RoomView
  // render lại vì gõ chat / đổi tab / vote / toast / EXP, nên React bỏ qua
  // luôn subtree Canvas. Chỉ render lại khi đúng thứ làm đổi cảnh: phòng,
  // ghế (bot đổi chỗ / mình chọn ghế), khách, góc camera, bài đang chiếu,
  // bật/tắt điều khiển trình phát.
  const scene = useMemo(() => {
    const common = {
      room, seats, mySeat, guest,
      cameraPreset: camera, videoId: current.id,
      showLive: camera === 'overview' || camera === 'screen',
      onEnded: handleEnded, onPlayerReady: handlePlayerReady,
      controls: controlsOn, startSeconds: playheadRef.current.vid === current.id ? Math.floor(playheadRef.current.cur) : 0,
      onPickSeat: handlePickSeat, reAim: cameraNonce,
    };
    return room.kind === 'karaoke'
      ? <Karaoke3D {...common} singerName={singerName} averageScore={averageScore} scorerCount={scorerCount} />
      : room.kind === 'arena' ? <Arena3D {...common} /> : <Cinema3D {...common} />;
  }, [room, seats, mySeat, guest, camera, current.id, controlsOn, handleEnded, handlePlayerReady, handlePickSeat, singerName, averageScore, scorerCount, cameraNonce]);

  const showToast = (text, ms = 3500) => {
    setToast(text);
    setTimeout(() => setToast(''), ms);
  };

  // Chấm điểm ca sĩ đang hát (1–10, mỗi người chấm 1 lần / tiết mục).
  const doScore = (n) => {
    if (myScore !== null) return;
    setMyScore(n);
    setScores((s) => [...s, n]);
    showToast(`Bạn chấm ${singerName}: ${n}/10 — cảm ơn bạn!`);
  };

  // "Mời xuống": cần 50% người xem đồng ý, tối thiểu 3 người (luật phòng
  // Karaoke — xem KARAOKE_RULES). Đủ ngưỡng thì chuyển sang ca sĩ tiếp theo.
  const doInviteDown = () => {
    if (inviteDownVoted) return;
    setInviteDownVoted(true);
    const n = inviteDownCount + 1;
    setInviteDownCount(n);
    const threshold = Math.max(
      KARAOKE_RULES.inviteDown.minVoters,
      Math.ceil((occupiedCount * KARAOKE_RULES.inviteDown.percent) / 100),
    );
    if (n >= threshold) {
      showToast(`Cả rạp đã mời ${singerName} xuống — tới lượt ca sĩ tiếp theo!`);
      advanceToNext('skip');
    } else {
      showToast(`Đã bấm Mời xuống (${n}/${threshold}) — cần 50% người xem (tối thiểu 3 người).`);
    }
  };

  // useCallback để prop onVoteSkip của panel (đã memo) không đổi identity
  // mỗi lần RoomView render lại.
  const doVoteSkip = useCallback(() => {
    voteSkip();
    // Hiện rõ 1/1 ngay khi vote: round 1 chờ có 600ms là đổi bài
    // và reset counter về 0/1, nên người bấm không bao giờ thấy
    // vote của mình được ghi (nay chờ 5 giây mới chuyển bài).
    setToast(`Đã ghi nhận vote bỏ qua (${skipThreshold}/${skipThreshold}) — chuyển bài sau 5 giây…`);
    setTimeout(() => setToast(''), 5000);
  }, [voteSkip, skipThreshold]);

  // Escape thoát toàn màn hình (kể cả khi đang ở góc "Tập trung màn hình").
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && document.fullscreenElement) {
        document.exitFullscreen().catch(() => { /* ignore */ });
      }
    };
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('keydown', onKey);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('fullscreenchange', onFsChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => { /* ignore */ });
      return;
    }
    if (stageRef.current && stageRef.current.requestFullscreen) {
      stageRef.current.requestFullscreen().catch(() => { /* ignore */ });
    }
  };

  const sendChat = () => {
    const text = chatText.trim();
    if (!text) return;
    sendMessage(text.slice(0, 160));
    setChatText('');
    onChatSent();
  };

  const doGesture = (g) => {
    setGesture(g.id);
    setToast(`${guest.name} ${g.id === 'dance' ? 'đang nhún nhảy' : g.id === 'wave' ? 'đang vẫy tay' : 'đang vỗ tay'} — cả rạp cùng làm nào!`);
    setTimeout(() => setToast(''), 3500);
  };

  const submitQueue = () => {
    if (!queueUrl.trim()) return;
    // Karaoke: chỉ người đã ngồi ghế mới được chọn bài (luật phòng).
    if (isKaraoke && !mySeat) {
      showToast('Ngồi vào ghế rồi mới chọn bài được nhé (luật phòng Karaoke).');
      return;
    }
    const res = addToQueue(queueUrl.trim());
    if (res === true) {
      setToast('Đã thêm video vào hàng đợi — cả rạp cùng bình chọn nhé.');
      setQueueUrl('');
    } else if (res === 'duplicate') {
      setToast('Video này đã có trong hàng đợi (hoặc đang chiếu) rồi.');
    } else {
      setToast('Link chưa đúng — dán link YouTube dạng watch?v=... hoặc youtu.be/...');
    }
    setTimeout(() => setToast(''), 4000);
  };

  return (
    <div className="room">
      <div className="topbar">
        <button className="btn ghost" onClick={onLeave}>← Sảnh</button>
        <b>{room.name}</b>
        <span className="chip live">● Đang chiếu</span>
        <span className="chip">{occupiedCount}/{room.totalSeats} ghế · {occupiedCount} đang online</span>
        <span className="chip">Ghế của bạn: {mySeat || 'chưa chọn'}</span>
        <span className="spacer" />
        <span className="chip">{guest.name} · LV{Math.floor(exp / 300) + 1} · {exp} EXP</span>
      </div>

      <div className="main">
        <div className={`stage ${camera === 'screen' ? 'focus-screen' : ''}`} ref={stageRef}>
          <div className="view3d">
            {/* Cảnh 3D đã memo (biến `scene` ở trên): RoomView render lại vì
                gõ chat / đổi tab / vote / toast cũng không render lại Canvas.
                Video LIVE vẫn nằm TRÊN mặt màn hình 3D bằng drei Html transform
                (xem Cinema3D.jsx) — chỉ hiện ở góc toàn cảnh + tập trung màn
                hình; góc ghế / góc ngược thì ẩn iframe (chỉ còn thumbnail),
                vì iframe DOM luôn vẽ trên canvas và sẽ "xuyên" qua ghế ngồi,
                còn góc ngược thì màn hình ở sau lưng người xem. */}
            <ErrorBoundary>
              {scene}
            </ErrorBoundary>
            <NowPlayingPanel current={current} queue={queue} playheadRef={playheadRef}
              skipCount={skipCount} skipThreshold={skipThreshold} realCount={realCount}
              skipVoted={skipVoted} onVoteSkip={doVoteSkip} />
            <RightRail queueCount={queue.length}
              onTab={setTab} onToast={(t) => showToast(t)} gestureRowRef={gestureRowRef} />
            {camera === 'screen' && (
              <button className="focus-exit" onClick={() => { setCamera('overview'); setCameraNonce((n) => n + 1); }}>
                ✕ Thoát góc tập trung màn hình
              </button>
            )}
            <span className="cam-label">{PRESETS[camera].label}</span>
            <span className="wasd-hint">{isKaraoke ? 'Bấm vào ghế để ngồi · Chấm điểm ca sĩ sau mỗi tiết mục' : 'W A S D để đi lại · Space để nhảy · E hoặc bấm vào ghế để ngồi'}</span>
          </div>
          <div className="controls">
            <span><b>Đang chiếu:</b> {current.title} · {current.by}</span>
            <span className="cam-btns">
              {Object.entries(PRESETS).map(([key, p]) => (
                <button key={key} className={camera === key ? 'on' : ''} onClick={() => { setCamera(key); setCameraNonce((n) => n + 1); }}>{p.label}</button>
              ))}
            </span>
            <span className="cam-btns">
              <button className="player-controls-btn" onClick={() => setControlsOn((v) => !v)} title="Bật/tắt nút điều khiển của trình phát YouTube">
                {controlsOn ? 'Ẩn điều khiển trình phát' : 'Hiện điều khiển trình phát'}
              </button>
              <button className="player-controls-btn" onClick={toggleFullscreen} title="Toàn màn hình (Esc để thoát)">
                {isFullscreen ? 'Thoát toàn màn hình (Esc)' : '⛶ Toàn màn hình'}
              </button>
            </span>
          </div>
          <div className="gesture-row" ref={gestureRowRef}>
            {GESTURES.map((g) => (
              <button key={g.id} className={gesture === g.id ? 'active' : ''} onClick={() => doGesture(g)}>
                {g.icon} {g.label}
              </button>
            ))}
          </div>
          <div className="toast">{toast}</div>
          <SeatMap room={room} seats={seats} mySeat={mySeat} onPick={pickSeat} />
        </div>

        <div className="side">
          <div className="tabs">
            <button className={tab === 'queue' ? 'on' : ''} onClick={() => setTab('queue')}>Hàng đợi</button>
            <button className={tab === 'chat' ? 'on' : ''} onClick={() => setTab('chat')}>Trò chuyện</button>
            <button className={tab === 'missions' ? 'on' : ''} onClick={() => setTab('missions')}>Nhiệm vụ</button>
          </div>

          {tab === 'queue' && (
            <div className="panel">
              <h3 style={{ marginTop: 0 }}>{isKaraoke ? 'Lượt hát — Got Talent' : 'Cùng chọn, cùng xem'}</h3>
              {isKaraoke && !karaokeOpenNow() && (
                <div className="hours-note">Karaoke mở 19:00–23:00 (giờ VN) — hiện đang ngoài giờ, bạn vẫn xem thử được.</div>
              )}
              <div className="skip-box">
                Vote bỏ qua: {skipCount}/{skipThreshold} người thật · Đủ 30% thì chuyển bài.
                <br />
                <button className="btn ghost" style={{ marginTop: 8 }} disabled={skipVoted} onClick={doVoteSkip}>
                  {skipVoted ? 'Đã vote bỏ qua ✓' : 'Vote bỏ qua bài này'}
                </button>
              </div>
              {isKaraoke && (
                <div className="score-box">
                  <b>🎤 Chấm điểm ca sĩ đang hát: {singerName}</b>
                  <div className="score-row">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                      <button key={n} className={`score-btn ${myScore === n ? 'on' : ''}`}
                        disabled={myScore !== null} onClick={() => doScore(n)}>{n}</button>
                    ))}
                  </div>
                  <div style={{ fontSize: 13, color: '#9aa5b1' }}>
                    {averageScore ? `Điểm trung bình: ★ ${averageScore}/10 (${scorerCount} người chấm)` : 'Chưa ai chấm — bạn chấm đầu tiên đi!'}
                    {myScore !== null && ` · Bạn đã chấm ${myScore}/10`}
                  </div>
                  <button className="btn ghost" style={{ marginTop: 8 }} disabled={inviteDownVoted} onClick={doInviteDown}>
                    {inviteDownVoted ? 'Đã bấm Mời xuống ✓' : '⬇ Mời ca sĩ xuống'}
                  </button>
                  <div style={{ fontSize: 12, color: '#9aa5b1', marginTop: 4 }}>
                    Cần 50% người xem đồng ý (tối thiểu 3 người) · Hát xong chờ 3 ca sĩ khác mới đăng ký lại.
                  </div>
                </div>
              )}
              {queue.map((item) => (
                <div key={item.id + item.title} className={`queue-item ${item.id === current.id ? 'playing' : ''}`}>
                  <QueueThumb videoId={item.id} title={item.title} />
                  <div>
                    <div className="t">{item.title}</div>
                    <div className="m">{item.by} · {item.duration} · {item.byGuest} đề xuất{item.id === current.id ? ' · ĐANG CHIẾU' : ''}</div>
                  </div>
                  <button className={`vote-btn ${voted.has(item.id) ? 'voted' : ''}`} disabled={voted.has(item.id) || item.id === current.id}
                    onClick={() => vote(item.id)}>▲ {item.votes}</button>
                </div>
              ))}
              <div className="add-queue">
                <input value={queueUrl} onChange={(e) => setQueueUrl(e.target.value)}
                  placeholder={isKaraoke ? 'Dán link YouTube bài karaoke…' : 'Dán link YouTube…'} onKeyDown={(e) => e.key === 'Enter' && submitQueue()} />
                <button className="btn" onClick={submitQueue}>{isKaraoke ? 'Chọn bài' : 'Thêm'}</button>
              </div>
              <p style={{ color: '#9aa5b1', fontSize: 12 }}>{isKaraoke ? 'Lượt hát theo thứ tự đăng ký — không xếp theo vote như rạp phim. Chỉ người đã ngồi ghế mới được chọn bài.' : 'Bài nhiều vote nhất sẽ chiếu tiếp khi bài hiện tại kết thúc.'}</p>
            </div>
          )}

          {tab === 'chat' && (
            <>
              <div className="panel">
                <div className="chat-list">
                  {messages.map((m) => (
                    <div key={m.id} className="chat-msg">
                      <span className={`who ${m.bot ? 'bot' : ''}`}>{m.system ? '📢 ' : ''}{m.name}</span>
                      <span className="time">{fmtTime(m.time)}</span>
                      <div>{m.text}</div>
                    </div>
                  ))}
                </div>
              </div>
              {showEmoji && (
                <div>
                  <div className="emoji-bar">
                    {Object.keys(EMOJI_GROUPS).map((g) => (
                      <button key={g} className="chip-btn" style={emojiGroup === g ? { borderColor: '#b8cd8e', color: '#b8cd8e' } : {}}
                        onClick={() => setEmojiGroup(g)}>{g}</button>
                    ))}
                  </div>
                  <div className="emoji-bar">
                    {EMOJI_GROUPS[emojiGroup].map((e) => (
                      <button key={e} onClick={() => setChatText((t) => (t + e).slice(0, 160))}>{e}</button>
                    ))}
                  </div>
                </div>
              )}
              <div className="chat-input">
                <button className="chip-btn" onClick={() => setShowEmoji((v) => !v)} title="Emoji">😀</button>
                <input value={chatText} onChange={(e) => setChatText(e.target.value.slice(0, 160))}
                  placeholder="Nói gì với cả rạp đi... (tối đa 160 ký tự)"
                  onKeyDown={(e) => e.key === 'Enter' && sendChat()} />
                <button className="btn" disabled={!chatText.trim()} onClick={sendChat}>Gửi</button>
              </div>
              <div style={{ padding: '0 12px 10px', color: '#9aa5b1', fontSize: 12 }}>{chatText.length}/160 ký tự</div>
            </>
          )}

          {tab === 'missions' && (
            <div className="panel">
              <h3 style={{ marginTop: 0 }}>Nhiệm vụ hằng ngày</h3>
              <p style={{ color: '#9aa5b1', fontSize: 13 }}>Làm nhiệm vụ rồi bấm Nhận để lấy EXP. Nhiệm vụ làm mới lúc 0h00 mỗi ngày.</p>
              {MISSIONS.map((m) => {
                const done = missionsDone[m.id];
                return (
                  <div key={m.id} className={`mission ${done ? 'done' : ''}`}>
                    <div className="row">
                      <div><b>{m.label}</b> · +{m.exp} EXP<br /><small>{m.hint}</small></div>
                      <button className="btn" disabled={done || (m.id === 'chat' && !missionsDone.chatReady)}
                        onClick={() => onMissionDone(m.id, m.exp)}>
                        {done ? 'Đã nhận ✓' : 'Nhận'}
                      </button>
                    </div>
                    {m.id === 'chat' && !missionsDone.chatReady && !done && (
                      <small>Gửi 1 tin nhắn trong tab Trò chuyện để mở khóa.</small>
                    )}
                  </div>
                );
              })}
              <p style={{ color: '#9aa5b1', fontSize: 12 }}>Ngồi xem trong rạp tự cộng +1 EXP / 3 phút, tối đa 50 EXP/ngày.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
