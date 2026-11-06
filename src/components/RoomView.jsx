import { useState } from 'react';
import Cinema3D, { CAMERA_PRESETS } from './Cinema3D';
import SeatMap from './SeatMap';
import { EMOJI_GROUPS, GESTURES, MISSIONS } from '../data';

function fmtTime(d) {
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

export default function RoomView({ guest, roomState, onLeave, exp, missionsDone, onMissionDone, onChatSent }) {
  const { room, seats, mySeat, pickSeat, queue, current, voted, vote, addToQueue,
    messages, sendMessage, skipVoted, voteSkip, skipCount, skipThreshold, occupiedCount } = roomState;
  const [tab, setTab] = useState('queue');
  const [chatText, setChatText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [emojiGroup, setEmojiGroup] = useState('Cảm xúc');
  const [gesture, setGesture] = useState(null);
  const [toast, setToast] = useState('');
  const [queueUrl, setQueueUrl] = useState('');
  const [camera, setCamera] = useState('overview');

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
    if (addToQueue(queueUrl.trim())) {
      setToast('Đã thêm video vào hàng đợi — cả rạp cùng bình chọn nhé.');
      setQueueUrl('');
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
        <span className="chip">{occupiedCount}/{room.totalSeats} ghế · {occupiedCount} đang online</span>
        <span className="chip">Ghế của bạn: {mySeat || 'chưa chọn'}</span>
        <span className="spacer" />
        <span className="chip">{guest.name} · LV{Math.floor(exp / 300) + 1} · {exp} EXP</span>
      </div>

      <div className="main">
        <div className="stage">
          <div className="view3d">
            <Cinema3D room={room} seats={seats} mySeat={mySeat} guest={guest} cameraPreset={camera} />
            <span className="cam-label">{CAMERA_PRESETS[camera].label}</span>
          </div>
          <div className="player-wrap">
            <iframe key={current.id} title={current.title}
              src={`https://www.youtube.com/embed/${current.id}?autoplay=1&rel=0`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen />
          </div>
          <div className="controls">
            <span><b>Đang chiếu:</b> {current.title} · {current.by}</span>
            <span className="cam-btns">
              {Object.entries(CAMERA_PRESETS).map(([key, p]) => (
                <button key={key} className={camera === key ? 'on' : ''} onClick={() => setCamera(key)}>{p.label}</button>
              ))}
            </span>
          </div>
          <div className="gesture-row">
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
                <button className="btn ghost" style={{ marginTop: 8 }} disabled={skipVoted} onClick={voteSkip}>
                  {skipVoted ? 'Đã vote bỏ qua ✓' : 'Vote bỏ qua bài này'}
                </button>
              </div>
              {queue.map((item) => (
                <div key={item.id + item.title} className={`queue-item ${item.id === current.id ? 'playing' : ''}`}>
                  <img src={`https://i.ytimg.com/vi/${item.id}/default.jpg`} alt="" loading="lazy" />
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
