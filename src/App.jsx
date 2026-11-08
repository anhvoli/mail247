import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import GuestSetup from './components/GuestSetup';
import Lobby from './components/Lobby';
import RoomView from './components/RoomView';
import PrivateRooms from './components/PrivateRooms';
import ErrorBoundary from './components/ErrorBoundary';
import { useRoom } from './useRoom';
import { BOT_CHAT_LINES, BOT_NAMES, ROOMS } from './data';
import { SEED_PRIVATE_ROOMS } from './private-rooms-spec';
import { SANH_SPEC } from './sanh-spec';
import { getPlayhead } from './playheadCache';
import { setSharedMuted } from './youtube';

// Code-split (N-01): AdminPanel chỉ admin dùng, Sanh3D nặng three.js — tách
// khỏi bundle chính, nạp khi cần. SANH_DOORS không import tĩnh từ Sanh3D
// nữa (sẽ kéo cả module vào bundle chính) mà lấy nhãn cửa từ SANH_SPEC.
// Ảnh cheer giữ base64 trong cheerImages.js, KHÔNG đưa ra public/:
// snapshot-push không đẩy được file nhị phân.
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const Sanh3D = lazy(() => import('./components/Sanh3D'));

const GUEST_KEY = 'rapchieu-guest';
const EXP_KEY = 'rapchieu-exp';

function todayStr() { return new Date().toISOString().slice(0, 10); }

function loadExp() {
  try {
    const raw = JSON.parse(localStorage.getItem(EXP_KEY) || 'null');
    if (raw && raw.day === todayStr()) return raw;
  } catch { /* ignore */ }
  return { exp: 0, day: todayStr(), missions: {}, watchExp: 0, chatReady: false };
}

// Sảnh 3D (xem sanh-spec.js): không dùng useRoom — chỉ chiếu cùng video với
// Rạp phim + chat chung kênh Rạp phim + đi lại tự do (WASD). Cửa trong sảnh
// gọi onEnterDoor với id phòng đích.
function SanhView({ guest, video, roomState, onLeave, onEnterDoor }) {
  const [screenOff, setScreenOff] = useState(false);
  const [muted, setMuted] = useState(true);
  const [chatText, setChatText] = useState('');
  const [nearDoor, setNearDoor] = useState(null);
  const playerRef = useRef(null);
  const chatInputRef = useRef(null);
  // Thử lại unMute khi bật tiếng ở chế độ fallback (M-06): lệnh unMute gửi
  // lúc player chưa boot xong sẽ rớt lặng (iframe mới tạo, chưa nhận lệnh)
  // mà nhãn thì đã lật — thử lại một lần sau 3s để tiếng thật sự bật.
  // Hủy khi bấm tắt lại hoặc rời sảnh để không bật tiếng muộn sai ý.
  const soundRetryRef = useRef(null);
  useEffect(() => () => {
    if (soundRetryRef.current) { clearTimeout(soundRetryRef.current); soundRetryRef.current = null; }
  }, []);
  // Mirror của state `muted` để đọc trong onPlayerReady (closure của
  // callback đó giữ state cũ).
  const mutedStateRef = useRef(true);
  // Nhắc lại unMute sau 3s (M-06): lệnh unMute gửi lúc player chưa boot
  // xong sẽ rớt lặng — nhắc lại khi player đã sẵn sàng thì tiếng bật thật.
  const scheduleUnmuteRetry = () => {
    if (soundRetryRef.current) { clearTimeout(soundRetryRef.current); soundRetryRef.current = null; }
    soundRetryRef.current = setTimeout(() => {
      soundRetryRef.current = null;
      const p2 = playerRef.current;
      try { if (p2?.unMute) p2.unMute(); if (p2?.setVolume) p2.setVolume(100); } catch { /* ignore */ }
    }, 3000);
  };
  const nearDoorLabel = nearDoor ? (SANH_SPEC.doors.find((d) => d.id === nearDoor)?.label || nearDoor) : null;

  // "Bật tiếng": YouTubePlayer không có prop muted — giữ player từ
  // onPlayerReady rồi gọi unMute()/setVolume(100) hoặc mute().
  // Chỉ lật nhãn khi đã có player thật (M-06): ở chế độ fallback mà
  // playerRef còn null thì lật nhãn là lừa người xem (bấm "Bật tiếng" mà
  // tiếng vẫn tắt). Đồng thời đồng bộ sharedMuted để vào phòng sau đó
  // player mới không bị tắt tiếng lại (N-07).
  const toggleSound = () => {
    const p = playerRef.current;
    if (!p) return;
    if (soundRetryRef.current) { clearTimeout(soundRetryRef.current); soundRetryRef.current = null; }
    const next = !muted;
    try {
      if (muted) { if (p?.unMute) p.unMute(); if (p?.setVolume) p.setVolume(100); }
      else if (p?.mute) p.mute();
    } catch { /* ignore */ }
    mutedStateRef.current = next;
    setMuted(next);
    setSharedMuted(next);
    if (muted) scheduleUnmuteRetry();
  };

  const sendChat = () => {
    const text = chatText.trim();
    if (!text) return;
    roomState.sendMessage(text.slice(0, 160));
    setChatText('');
  };

  return (
    <div className="room">
      <div className="topbar">
        <button className="btn ghost" onClick={onLeave}>← Sảnh</button>
        <b>Sảnh 3D</b>
        <span className="chip live">● Đang chiếu</span>
        <span className="chip">{video?.title || '—'}</span>
        <span className="spacer" />
        <button className="btn ghost" onClick={toggleSound}>{muted ? '🔇 Bật tiếng' : '🔊 Tắt tiếng'}</button>
        <button className="btn ghost" onClick={() => setScreenOff((v) => !v)}>{screenOff ? 'Bật màn hình' : 'Tắt màn hình'}</button>
      </div>
      <div className="main">
        <div className="stage">
          <div className="view3d" style={{ height: 'min(60vh, 560px)' }}>
            <ErrorBoundary>
              <Suspense fallback={<div style={{ padding: 40, color: '#9aa5b1' }}>Đang tải sảnh 3D…</div>}>
              <Sanh3D
                videoId={video?.id || ROOMS.phim.nowPlaying.id}
                showLive
                screenOff={screenOff}
                onEnded={() => { /* sảnh chỉ xem ké video Rạp phim — không tự chuyển bài ở đây */ }}
                onPlayerReady={(p) => {
                  playerRef.current = p;
                  // Đồng bộ nhãn với trạng thái thật (M-06): nếu người xem đã
                  // chạm/bấm Bật tiếng trước khi player sẵn sàng thì doUnmute
                  // đã bật tiếng qua handleReady — nhãn phải theo, không để
                  // kẹt ở "Bật tiếng" trong khi tiếng đang mở. Nhắc lại
                  // unMute phòng khi lệnh ở handleReady rớt lúc iframe chưa boot.
                  try {
                    if (mutedStateRef.current && p && p.isMuted && !p.isMuted()) {
                      mutedStateRef.current = false;
                      setMuted(false);
                      setSharedMuted(false);
                      scheduleUnmuteRetry();
                    }
                  } catch { /* ignore */ }
                }}
                controls
                // Tiếp tục từ vị trí Rạp phim đang chiếu (M-06) thay vì phát
                // lại từ giây 0 — đọc từ playheadCache dùng chung với RoomView.
                startSeconds={getPlayhead('phim')?.cur ?? 0}
                myGuest={guest}
                onNearDoor={setNearDoor}
                onEnterDoor={onEnterDoor}
                onOpenChat={() => chatInputRef.current?.focus()}
              />
              </Suspense>
            </ErrorBoundary>
            {nearDoorLabel && <span className="cam-label">Đang đứng trước cửa {nearDoorLabel} — bấm E để vào</span>}
            <span className="wasd-hint">W A S D để đi lại · Shift chạy · Space nhảy · E vào cửa · Enter chat</span>
          </div>
          <div className="controls">
            <span><b>Đang chiếu:</b> {video?.title || '—'}</span>
          </div>
          <div className="panel" style={{ padding: '0 14px 14px' }}>
            <p style={{ color: '#9aa5b1', fontSize: 13, margin: '4px 0 10px' }}>
              Sảnh đi lại tự do — đi tới gần cửa rồi bấm E để vào phòng, hoặc quay lại sảnh chính để chọn phòng khác.
            </p>
          </div>
        </div>
        <div className="side">
          <div className="tabs"><button className="on">Trò chuyện</button></div>
          <div className="panel">
            <div className="chat-list">
              {roomState.messages.slice(-30).map((m) => (
                <div key={m.id} className="chat-msg">
                  <span className={`who ${m.bot ? 'bot' : ''}`}>{m.system ? '📢 ' : ''}{m.name}</span>
                  <span className="time">{m.time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                  <div>{m.text}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="chat-input">
            <input ref={chatInputRef} value={chatText} onChange={(e) => setChatText(e.target.value.slice(0, 160))}
              placeholder="Nói gì trong sảnh đi... (tối đa 160 ký tự)"
              onKeyDown={(e) => e.key === 'Enter' && sendChat()} />
            <button className="btn" disabled={!chatText.trim()} onClick={sendChat}>Gửi</button>
          </div>
          <div style={{ padding: '0 12px 10px', color: '#9aa5b1', fontSize: 12 }}>{chatText.length}/160 ký tự</div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [guest, setGuest] = useState(() => {
    try { return JSON.parse(localStorage.getItem(GUEST_KEY) || 'null'); } catch { return null; }
  });
  const [expState, setExpState] = useState(loadExp);
  const [roomId, setRoomId] = useState(null);
  // Bảng Quản trị Live (xem AdminPanel.jsx): live mô phỏng + TTS + quà +
  // nhạc local + log nội bộ. Mở từ sảnh, không động vào state các phòng.
  const [showAdmin, setShowAdmin] = useState(false);
  // Màn Phòng riêng (danh sách + tạo phòng).
  const [showPrivate, setShowPrivate] = useState(false);
  // Phòng riêng nâng state lên App (xem PRIVATE_ROOMS_WIRING) để phòng không
  // mất khi quay lại sảnh; khởi tạo bằng phòng mẫu trong spec.
  const [privateRooms, setPrivateRooms] = useState(SEED_PRIVATE_ROOMS);
  // Định nghĩa phòng riêng đã dựng sẵn, key theo id (S-02): KHÔNG ghi đè
  // vào ROOMS nữa — ROOMS chỉ còn phòng công khai nên Lobby không bao giờ
  // render phòng riêng, và mọi đường vào phòng riêng đều qua
  // enterPrivateRoom (hỏi mật khẩu). useRoom nhận thẳng object này.
  const [privateRoomDefs, setPrivateRoomDefs] = useState({});
  const activeRoom = roomId ? (ROOMS[roomId] || privateRoomDefs[roomId] || null) : null;
  // Bài đang chiếu thật của từng phòng (ghi lại mỗi lần đổi bài) — để thẻ
  // "Đang chiếu" ở sảnh luôn khớp với bài đang phát, và vào lại phòng thì
  // tiếp tục bài đó thay vì quay về bài mẫu.
  const [liveNowPlaying, setLiveNowPlaying] = useState({});
  // Sảnh 3D không có trong ROOMS và không dùng useRoom — lúc ở sảnh, hook
  // vẫn chạy với 'phim' để giữ state Rạp phim (video + chat dùng chung).
  const roomState = useRoom(roomId && roomId !== 'sanh' ? roomId : 'phim', guest?.name || 'Khách', roomId ? liveNowPlaying[roomId] : null, activeRoom);
  const roomStateRef = useRef(roomState);
  roomStateRef.current = roomState;

  // Phòng cuối mà effect đồng bộ đã thấy — để bỏ qua lần đồng bộ đầu tiên
  // sau mỗi lần đổi phòng (xem effect bên dưới).
  const prevSyncRoomRef = useRef(roomId);
  useEffect(() => {
    // Bỏ qua lần chạy đầu sau khi đổi phòng (kể cả từ sảnh vào): ở lần chạy
    // này roomState.current vẫn là bài của phòng TRƯỚC — reset effect của
    // useRoom chạy cùng commit nhưng setCurrent chỉ có hiệu lực ở lần render
    // sau. Đồng bộ lúc này là ghi nhầm bài phòng cũ vào liveNowPlaying của
    // phòng mới, rồi resume effect áp lại làm bài đang chiếu nhảy qua lại
    // (fix 07/11 ~00:45: Rạp Trời mở ra đã là bài Sơn Tùng của Rạp phim, rồi
    // nhảy Thêm ↔ Sơn Tùng 6 lần/phút trên bản live). Lần chạy sau, khi
    // current đã là bài của phòng mới, mới đồng bộ.
    if (prevSyncRoomRef.current !== roomId) { prevSyncRoomRef.current = roomId; return; }
    if (!roomId || roomId === 'sanh') return;
    const cur = roomState.current;
    // Chỉ đồng bộ bài thuộc đúng phòng này: lúc vừa đổi phòng, roomState
    // vẫn giữ bài của phòng cũ (reset effect của useRoom chưa chạy) — ghi
    // bừa là bài phòng cũ chui vào liveNowPlaying của phòng mới, rồi resume
    // effect áp lại làm bài đang chiếu nhảy qua lại giữa 2 phòng (fix 07/11
    // ~00:30: Karaoke nhảy sang bài Sơn Tùng của Rạp phim). Hàng đợi live
    // (roomState.queue) được tính để video do người xem tự thêm vẫn khớp.
    const r = activeRoom;
    const liveQueue = roomState.queue || [];
    const belongs = r && (cur.id === r.nowPlaying.id
      || r.queue.some((q) => q.id === cur.id)
      || liveQueue.some((q) => q.id === cur.id));
    if (!belongs) return;
    setLiveNowPlaying((prev) => {
      const old = prev[roomId];
      if (old && old.id === cur.id) return prev;
      return { ...prev, [roomId]: { id: cur.id, title: cur.title, by: cur.by, duration: cur.duration } };
    });
    // Chỉ chạy khi đổi phòng hoặc đổi bài (roomState.current đổi tham chiếu
    // chỉ khi setCurrent chạy) — không phụ thuộc cả object roomState.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, roomState.current]);

  useEffect(() => { localStorage.setItem(EXP_KEY, JSON.stringify(expState)); }, [expState]);

  const addExp = useCallback((n) => {
    setExpState((s) => ({ ...s, exp: s.exp + n }));
  }, []);

  // Bot chat thỉnh thoảng (mô phỏng rạp đông).
  useEffect(() => {
    if (!roomId || !guest) return undefined;
    const t = setInterval(() => {
      if (Math.random() < 0.5) {
        const name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
        const line = BOT_CHAT_LINES[Math.floor(Math.random() * BOT_CHAT_LINES.length)];
        roomStateRef.current.botSay(line, name);
      }
    }, 14000);
    return () => clearInterval(t);
  }, [roomId, guest]);

  // Ngồi xem: +1 EXP / 3 phút, tối đa 50 EXP/ngày.
  useEffect(() => {
    if (!roomId || !guest) return undefined;
    const t = setInterval(() => {
      setExpState((s) => {
        if (s.watchExp >= 50) return s;
        return { ...s, exp: s.exp + 1, watchExp: s.watchExp + 1 };
      });
    }, 180000);
    return () => clearInterval(t);
  }, [roomId, guest]);

  const enterGuest = (g) => {
    setGuest(g);
    localStorage.setItem(GUEST_KEY, JSON.stringify(g));
  };

  const claimMission = (id, exp) => {
    // Nhiệm vụ "xem" tự cộng +1 EXP/3 phút, không bấm nhận (N-04) — trả
    // 'auto' để UI hiển thị trạng thái ("đang tự cộng…") thay vì im lặng.
    if (id === 'watch') return 'auto';
    if (expState.missions[id]) return;
    if (id === 'chat' && !expState.chatReady) return;
    setExpState((s) => ({ ...s, exp: s.exp + exp, missions: { ...s.missions, [id]: true } }));
  };

  const onChatSent = () => {
    setExpState((s) => ({ ...s, chatReady: true }));
  };

  const leaveRoom = () => {
    setRoomId(null);
    try { window.history.replaceState(null, '', window.location.pathname); } catch { /* ignore */ }
  };

  // Vào phòng riêng: phòng riêng chỉ khác phòng thường ở nguồn state — dựng
  // 1 định nghĩa phòng từ loại đã chọn (phim/troi) rồi giữ trong state riêng
  // privateRoomDefs (S-02: KHÔNG ghi vào ROOMS — ghi vào ROOMS làm phòng
  // riêng hiện ở sảnh công khai, Lobby bấm vào là vào thẳng không mật khẩu).
  // useRoom/RoomView tái dùng định nghĩa này như phòng thường (botCount 0:
  // chỉ người có link mới vào, không có bot lấp ghế). Mọi đường vào phòng
  // riêng (màn Phòng riêng, deep link ?phong=) đều qua đây nên đều hỏi mật
  // khẩu; Lobby chỉ nhận setRoomId cho phòng công khai trong ROOMS.
  const enterPrivateRoom = useCallback((room) => {
    if (room.type === 'karaoke') {
      window.alert('Phòng riêng Karaoke đang khóa — chỉ dành cho người đã ủng hộ.');
      return;
    }
    if (room.password) {
      const pw = window.prompt('Phòng có mật khẩu — nhập mật khẩu:');
      if (pw !== room.password) {
        window.alert('Sai mật khẩu rồi — thử lại nhé.');
        return;
      }
    }
    const base = ROOMS[room.type];
    if (!base) return;
    const def = {
      id: room.id,
      name: room.name,
      sub: 'PHÒNG RIÊNG · LINK-ONLY',
      kind: base.kind,
      totalSeats: base.totalSeats,
      rows: base.rows,
      cols: base.cols,
      tables: base.tables,
      seatsPerTable: base.seatsPerTable,
      rings: base.rings,
      seatsPerRing: base.seatsPerRing,
      botCount: 0,
      nowPlaying: { ...base.nowPlaying },
      queue: base.queue.map((q) => ({ ...q })),
    };
    // Giữ nguyên def đã có (định danh ổn định cho useRoom) khi vào lại.
    setPrivateRoomDefs((prev) => (prev[room.id] ? prev : { ...prev, [room.id]: def }));
    setShowPrivate(false);
    setRoomId(room.id);
    try { window.history.replaceState(null, '', `${window.location.pathname}?phong=${room.id}`); } catch { /* ignore */ }
  }, []);

  // Deep link ?phong=<id>: mở app bằng link mời thì vào thẳng phòng riêng đó.
  const deepLinkHandled = useRef(false);
  useEffect(() => {
    if (!guest || deepLinkHandled.current) return;
    deepLinkHandled.current = true;
    const phong = new URLSearchParams(window.location.search).get('phong');
    if (!phong) return;
    const room = privateRooms.find((r) => r.id === phong);
    if (room) enterPrivateRoom(room);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guest]);

  // Cửa trong Sảnh 3D: id phòng đích. Karaoke đã nối vào ROOMS nên vào thẳng;
  // giữ guard phòng trường hợp phòng chưa có (tránh đen trang).
  const handleEnterDoor = useCallback((doorId) => {
    if (!ROOMS[doorId]) {
      window.alert('Karaoke sẽ có ở phase sau.');
      return;
    }
    setRoomId(doorId);
  }, []);

  if (!guest) return <GuestSetup onEnter={enterGuest} />;
  if (showAdmin) {
    return (
      <Suspense fallback={<div style={{ padding: 40, color: '#9aa5b1' }}>Đang tải bảng quản trị…</div>}>
        <AdminPanel guest={guest} onBack={() => setShowAdmin(false)} />
      </Suspense>
    );
  }
  if (showPrivate) {
    return (
      <PrivateRooms
        guest={guest}
        rooms={privateRooms}
        onRoomsChange={setPrivateRooms}
        onEnterRoom={enterPrivateRoom}
        onBack={() => setShowPrivate(false)}
      />
    );
  }
  if (!roomId) {
    return <Lobby guest={guest} exp={expState.exp} nowPlayingByRoom={liveNowPlaying} onEnterRoom={setRoomId} onOpenPrivateRooms={() => setShowPrivate(true)} onOpenAdmin={() => setShowAdmin(true)} onLeave={() => { setGuest(null); localStorage.removeItem(GUEST_KEY); }} />;
  }
  if (roomId === 'sanh') {
    // Sảnh 3D: video + chat dùng chung state Rạp phim (roomState đang chạy với 'phim').
    return (
      <ErrorBoundary>
        <SanhView
          guest={guest}
          video={liveNowPlaying.phim || ROOMS.phim.nowPlaying}
          roomState={roomState}
          onLeave={leaveRoom}
          onEnterDoor={handleEnterDoor}
        />
      </ErrorBoundary>
    );
  }
  // ErrorBoundary ngoài cùng: lỗi ở rạp (Canvas WebGL, player) chỉ hiện
  // khung báo lỗi + nút thử lại, không bao giờ đen cả trang.
  return (
    <ErrorBoundary>
      <RoomView
        guest={guest}
        roomState={roomState}
        onLeave={leaveRoom}
        exp={expState.exp}
        missionsDone={{ ...expState.missions, chatReady: expState.chatReady }}
        onMissionDone={claimMission}
        onChatSent={onChatSent}
      />
    </ErrorBoundary>
  );
}
