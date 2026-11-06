import { useEffect, useRef, useState } from 'react';
import Cinema3D, { CAMERA_PRESETS } from './Cinema3D';
import ErrorBoundary from './ErrorBoundary';
import SeatMap from './SeatMap';
import { EMOJI_GROUPS, GESTURES, MISSIONS } from '../data';

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
function NowPlayingPanel({ current, queue, playhead, skipCount, skipThreshold, realCount, skipVoted, onVoteSkip }) {
  const suggester = queue.find((q) => q.id === current.id)?.byGuest || current.by;
  const dur = playhead.dur > 0 ? playhead.dur : parseDuration(current.duration);
  const pct = dur > 0 ? Math.min(100, (playhead.cur / dur) * 100) : 0;
  const agreePct = realCount > 0 ? Math.round((skipCount / realCount) * 100) : 0;
  return (
    <div className="now-playing">
      <div className="kicker">Trên màn ảnh</div>
      <div className="title">{current.title}</div>
      <div className="meta">{suggester} đề xuất · {fmtClock(playhead.cur)} / {fmtClock(dur)}</div>
      <div className="progress"><div style={{ width: `${pct}%` }} /></div>
      <button className="skip-btn" disabled={skipVoted} onClick={onVoteSkip}>
        ▶ Vote bỏ qua {skipCount}/{skipThreshold}
      </button>
      <div className="vote-line">
        {skipCount}/{realCount} người thật đồng ý · {agreePct}% · Đủ 30% thì chuyển bài
      </div>
    </div>
  );
}

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
  // Thời gian phát hiện tại (poll player mỗi giây): vừa để hiện đồng hồ +
  // thanh tiến trình ở panel "TRÊN MÀN ẢNH", vừa để khi player bị unmount
  // lúc ẩn màn live (góc ghế/góc ngược) rồi mount lại thì phát tiếp từ
  // đúng giây đã xem tới thay vì về 0 (startSeconds).
  const [playhead, setPlayhead] = useState({ cur: 0, dur: 0 });
  const stageRef = useRef(null);
  const playerRef = useRef(null);
  const gestureRowRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => {
      const p = playerRef.current;
      if (!p) return;
      try {
        const dur = p.getDuration ? p.getDuration() : 0;
        const cur = p.getCurrentTime ? p.getCurrentTime() : 0;
        if (dur > 0) setPlayhead({ cur, dur });
      } catch { /* player chưa sẵn / đã hủy */ }
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const showToast = (text, ms = 3500) => {
    setToast(text);
    setTimeout(() => setToast(''), ms);
  };

  const doVoteSkip = () => {
    voteSkip();
    // Hiện rõ 1/1 ngay khi vote: round 1 chờ có 600ms là đổi bài
    // và reset counter về 0/1, nên người bấm không bao giờ thấy
    // vote của mình được ghi (nay chờ 2 giây mới chuyển bài).
    setToast(`Đã ghi nhận vote bỏ qua (${skipThreshold}/${skipThreshold}) — chuyển bài sau 2 giây…`);
    setTimeout(() => setToast(''), 2500);
  };

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
            {/* Canvas 3D không bao giờ bị unmount/thay thế khi đổi góc camera
                (chỉ camera di chuyển — xem Rig trong Cinema3D.jsx); bọc thêm
                ErrorBoundary để lỗi WebGL chỉ hiện khung báo lỗi tại chỗ.
                Video LIVE nằm TRÊN mặt màn hình 3D bằng drei Html transform
                (xem Cinema3D.jsx) — chỉ hiện ở góc toàn cảnh + tập trung màn
                hình; góc ghế / góc ngược thì ẩn iframe (chỉ còn thumbnail),
                vì iframe DOM luôn vẽ trên canvas và sẽ "xuyên" qua ghế ngồi,
                còn góc ngược thì màn hình ở sau lưng người xem. */}
            <ErrorBoundary>
              <Cinema3D room={room} seats={seats} mySeat={mySeat} guest={guest}
                cameraPreset={camera} videoId={current.id}
                showLive={camera === 'overview' || camera === 'screen'}
                onEnded={advanceToNext} onPlayerReady={(p) => { playerRef.current = p; }}
                controls={controlsOn} startSeconds={Math.floor(playhead.cur)} />
            </ErrorBoundary>
            <NowPlayingPanel current={current} queue={queue} playhead={playhead}
              skipCount={skipCount} skipThreshold={skipThreshold} realCount={realCount}
              skipVoted={skipVoted} onVoteSkip={doVoteSkip} />
            <RightRail queueCount={queue.length}
              onTab={setTab} onToast={(t) => showToast(t)} gestureRowRef={gestureRowRef} />
            {camera === 'screen' && (
              <button className="focus-exit" onClick={() => setCamera('overview')}>
                ✕ Thoát góc tập trung màn hình
              </button>
            )}
            <span className="cam-label">{CAMERA_PRESETS[camera].label}</span>
            <span className="wasd-hint">W A S D để đi lại · Space để nhảy · E hoặc bấm vào ghế để ngồi</span>
          </div>
          <div className="controls">
            <span><b>Đang chiếu:</b> {current.title} · {current.by}</span>
            <span className="cam-btns">
              {Object.entries(CAMERA_PRESETS).map(([key, p]) => (
                <button key={key} className={camera === key ? 'on' : ''} onClick={() => setCamera(key)}>{p.label}</button>
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
              <h3 style={{ marginTop: 0 }}>Cùng chọn, cùng xem</h3>
              <div className="skip-box">
                Vote bỏ qua: {skipCount}/{skipThreshold} người thật · Đủ 30% thì chuyển bài.
                <br />
                <button className="btn ghost" style={{ marginTop: 8 }} disabled={skipVoted} onClick={doVoteSkip}>
                  {skipVoted ? 'Đã vote bỏ qua ✓' : 'Vote bỏ qua bài này'}
                </button>
              </div>
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
                  placeholder="Dán link YouTube…" onKeyDown={(e) => e.key === 'Enter' && submitQueue()} />
                <button className="btn" onClick={submitQueue}>Thêm</button>
              </div>
              <p style={{ color: '#9aa5b1', fontSize: 12 }}>Bài nhiều vote nhất sẽ chiếu tiếp khi bài hiện tại kết thúc.</p>
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
