// Phòng riêng — danh sách + tạo phòng, link-only, không cần tài khoản.
//
// Theo khảo sát choigivui.com 2026-11-06: tab danh sách + tab tạo phòng,
// "Tạm thời miễn phí"; loại Rạp chiếu / Rạp Trời miễn phí, Karaoke khóa
// (chỉ dành cho người đã ủng hộ); tên phòng bắt buộc, mật khẩu tùy chọn;
// phòng tự đóng sau 1 giờ, khi chủ phòng rời quá 2 phút, hoặc khi không
// còn đủ lượt gia hạn. Component này chỉ giữ state cục bộ (rời khỏi là
// mất phòng) — xem private-rooms-spec.js để biết cách đấu nối vào App.

import { useEffect, useMemo, useState } from 'react';
import {
  PRIVATE_ROOM_TYPES,
  PRIVATE_ROOM_LIFETIME_MINUTES,
  PRIVATE_ROOM_HOST_GRACE_MINUTES,
  SEED_PRIVATE_ROOMS,
  makeInviteLink,
  makePrivateRoom,
} from '../private-rooms-spec';

function fmtCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function typeLabel(typeId) {
  return PRIVATE_ROOM_TYPES.find((t) => t.id === typeId)?.label || typeId;
}

// rooms/onRoomsChange: App nâng state lên để phòng riêng tồn tại khi quay
// lại sảnh (xem private-rooms-spec.js). Không truyền thì component tự giữ
// state cục bộ như cũ.
export default function PrivateRooms({ guest, onEnterRoom, onBack, rooms: roomsProp, onRoomsChange }) {
  const [localRooms, setLocalRooms] = useState(SEED_PRIVATE_ROOMS);
  const rooms = roomsProp ?? localRooms;
  const setRooms = onRoomsChange ?? setLocalRooms;
  const [tab, setTab] = useState('list');
  const [name, setName] = useState('');
  const [type, setType] = useState('phim');
  const [password, setPassword] = useState('');
  const [nameError, setNameError] = useState('');
  const [created, setCreated] = useState(null);
  const [toast, setToast] = useState('');
  const [nowMs, setNowMs] = useState(Date.now());

  // Tick mỗi giây để đếm ngược 1 giờ + tự dọn phòng hết hạn khỏi danh sách.
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const openRooms = useMemo(
    () => rooms.filter((r) => r.expiresAt > nowMs),
    [rooms, nowMs],
  );

  const showToast = (text, ms = 3500) => {
    setToast(text);
    setTimeout(() => setToast(''), ms);
  };

  const copyLink = async (room) => {
    const link = makeInviteLink(room.id);
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // Fallback khi clipboard API không dùng được (môi trường không an toàn).
      const ta = document.createElement('textarea');
      ta.value = link;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    showToast('Đã sao chép link phòng...');
  };

  const createRoom = () => {
    if (!name.trim()) {
      setNameError('Đặt tên phòng đã nhé — tên phòng là bắt buộc.');
      return;
    }
    setNameError('');
    const room = makePrivateRoom({ name, type, password });
    setRooms((prev) => [room, ...prev]);
    setCreated(room);
    setTab('created');
    showToast('Đã tạo phòng riêng — gửi link cho hội bạn vào cùng nhé.');
  };

  const enterRoom = (room) => {
    if (typeof onEnterRoom === 'function') onEnterRoom(room);
  };

  return (
    <div className="lobby">
      <header>
        <div>
          <div className="logo">PHÒNG <span>RIÊNG</span></div>
          <div style={{ color: '#9aa5b1' }}>
            Một góc rạp dành cho hội bạn — vào bằng link, không cần tài khoản
          </div>
        </div>
        <div style={{ minWidth: 220 }}>
          <div>Xin chào, <b>{guest?.name || 'Khách'}</b></div>
          <div style={{ fontSize: 12, color: '#9aa5b1' }}>Tạm thời miễn phí</div>
          <button className="btn ghost" onClick={onBack} style={{ marginTop: 8 }}>
            ← Quay lại sảnh
          </button>
        </div>
      </header>

      <div className="tabs" style={{ marginTop: 24 }}>
        <button className={tab === 'list' || tab === 'created' ? 'on' : ''} onClick={() => setTab('list')}>
          Phòng đang mở ({openRooms.length})
        </button>
        <button className={tab === 'create' ? 'on' : ''} onClick={() => setTab('create')}>
          Tạo phòng mới
        </button>
      </div>

      {tab === 'list' && (
        <div style={{ marginTop: 16 }}>
          {openRooms.length === 0 && (
            <div className="panel">
              <p>Chưa có phòng riêng nào đang mở. Tạo một phòng mới cho hội bạn nhé.</p>
            </div>
          )}
          <div className="room-grid">
            {openRooms.map((room) => {
              const left = room.expiresAt - nowMs;
              const urgent = left < 5 * 60 * 1000;
              return (
                <div key={room.id} className="room-card">
                  <span className="tag">{typeLabel(room.type)} · Tạm thời miễn phí</span>
                  <h2 style={{ marginTop: 10 }}>{room.name}</h2>
                  <p>
                    Chủ phòng: {room.host} · {room.people} người trong phòng
                    {room.password ? ' · 🔒 Có mật khẩu' : ''}
                  </p>
                  <p className="count" style={urgent ? { color: '#ff7a7a' } : {}}>
                    Còn lại: {fmtCountdown(left)} / {PRIVATE_ROOM_LIFETIME_MINUTES} phút
                  </p>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button className="btn" onClick={() => enterRoom(room)}>Vào phòng</button>
                    <button className="btn ghost" onClick={() => copyLink(room)}>Sao chép link</button>
                  </div>
                </div>
              );
            })}
          </div>
          <p style={{ color: '#9aa5b1', fontSize: 13, marginTop: 24 }}>
            Phòng riêng tự đóng sau 1 giờ, khi chủ phòng rời quá {PRIVATE_ROOM_HOST_GRACE_MINUTES} phút,
            hoặc khi không còn đủ lượt gia hạn. Ai có link cũng vào được — đừng chia link cho người lạ.
          </p>
        </div>
      )}

      {tab === 'create' && (
        <div className="panel" style={{ marginTop: 16, maxWidth: 560 }}>
          <h3 style={{ marginTop: 0 }}>Tạo phòng riêng</h3>
          <p style={{ color: '#9aa5b1', fontSize: 13 }}>
            Tạm thời miễn phí — phòng tự đóng sau {PRIVATE_ROOM_LIFETIME_MINUTES} phút.
          </p>
          <label style={{ display: 'block', marginBottom: 12 }}>
            <div style={{ marginBottom: 6 }}>Tên phòng *</div>
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError(''); }}
              placeholder="Ví dụ: Phòng xem MV tối nay"
              style={{ width: '100%' }}
            />
            {nameError && <div style={{ color: '#ff7a7a', fontSize: 13, marginTop: 6 }}>{nameError}</div>}
          </label>
          <label style={{ display: 'block', marginBottom: 12 }}>
            <div style={{ marginBottom: 6 }}>Loại phòng</div>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{ width: '100%', padding: 8, borderRadius: 8 }}
            >
              {PRIVATE_ROOM_TYPES.map((t) => (
                <option key={t.id} value={t.id} disabled={t.locked}>
                  {t.label} — {t.locked ? t.price : t.price}
                </option>
              ))}
            </select>
            <div style={{ color: '#9aa5b1', fontSize: 13, marginTop: 6 }}>
              {PRIVATE_ROOM_TYPES.find((t) => t.id === type)?.desc}
              {type === 'karaoke' && ' Karaoke đang khóa — chỉ dành cho người đã ủng hộ.'}
            </div>
          </label>
          <label style={{ display: 'block', marginBottom: 16 }}>
            <div style={{ marginBottom: 6 }}>Mật khẩu (tùy chọn)</div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Để trống là phòng mở, ai có link cũng vào"
              style={{ width: '100%' }}
            />
          </label>
          <button className="btn" onClick={createRoom}>Tạo phòng</button>
          <p style={{ color: '#9aa5b1', fontSize: 12, marginTop: 12 }}>
            Phòng tự đóng sau 1 giờ, khi chủ phòng rời quá {PRIVATE_ROOM_HOST_GRACE_MINUTES} phút,
            hoặc khi không còn đủ lượt gia hạn.
          </p>
        </div>
      )}

      {tab === 'created' && created && (
        <div className="panel" style={{ marginTop: 16, maxWidth: 560 }}>
          <h3 style={{ marginTop: 0 }}>Đã tạo phòng: {created.name}</h3>
          <p>
            Loại: {typeLabel(created.type)} · Tạm thời miễn phí<br />
            Còn lại: {fmtCountdown(created.expiresAt - nowMs)} / {PRIVATE_ROOM_LIFETIME_MINUTES} phút
          </p>
          <label style={{ display: 'block', marginBottom: 12 }}>
            <div style={{ marginBottom: 6 }}>Link mời</div>
            <input readOnly value={makeInviteLink(created.id)} style={{ width: '100%' }} />
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={() => copyLink(created)}>Sao chép link</button>
            <button className="btn ghost" onClick={() => enterRoom(created)}>Vào phòng ngay</button>
          </div>
          <p style={{ color: '#9aa5b1', fontSize: 12, marginTop: 12 }}>
            Gửi link cho hội bạn — ai có link cũng vào được, không cần tài khoản.
          </p>
        </div>
      )}

      <div className="toast">{toast}</div>
    </div>
  );
}
