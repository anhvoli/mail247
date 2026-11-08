import { ROOMS, LV_EXP } from '../data';
import { SANH_SPEC } from '../sanh-spec';
import { karaokeOpenNow } from '../utils';

export default function Lobby({ guest, exp, nowPlayingByRoom, onEnterRoom, onOpenPrivateRooms, onOpenAdmin, onLeave }) {
  const level = Math.floor(exp / LV_EXP) + 1;
  const progress = exp % LV_EXP;
  return (
    <div className="lobby">
      <header>
        <div>
          <div className="logo">RẠP CHIẾU <span>CHUNG</span></div>
          <div style={{ color: '#9aa5b1' }}>Xem video, nghe nhạc cùng nhau — không cần tài khoản</div>
        </div>
        <div className="lobby-user">
          <div>Xin chào, <b>{guest.name}</b> · LV{level} · {exp} EXP</div>
          <div className="exp-bar"><div style={{ width: `${(progress / LV_EXP) * 100}%` }} /></div>
          <div style={{ fontSize: 12, color: '#9aa5b1' }}>Còn {LV_EXP - progress} EXP nữa để lên LV{level + 1}</div>
          <button className="btn ghost" onClick={onLeave} style={{ marginTop: 8 }}>Đổi tên</button>
          <button className="btn" onClick={onOpenAdmin} style={{ marginTop: 8, marginLeft: 8, background: '#f0a832' }}>⚙️ Quản trị Live</button>
        </div>
      </header>

      <h2 style={{ marginTop: 28 }}>Chọn rạp để vào</h2>
      <div className="room-grid">
        {Object.values(ROOMS).map((room) => (
          <button key={room.id} className="room-card" onClick={() => onEnterRoom(room.id)}>
            <span className="tag">{room.sub}</span>
            <h2 style={{ marginTop: 10 }}>{room.name}</h2>
            <p>{room.kind === 'cinema' ? 'Rạp 3D tối, rèm đỏ, màn hình lớn — xem MV cùng cả rạp.' : room.kind === 'arena' ? 'Đấu trường LoL Park: khán đài 3 vòng quanh màn hình khổng lồ giữa sân — cùng xem bán kết T1 vs BLG.' : room.kind === 'karaoke' ? 'Sân khấu rèm đỏ, hát karaoke, chấm điểm 1–10 — mở 19:00–23:00.' : 'Rạp ngoài trời ban đêm: trăng, đồi, cây thông, bàn tròn, màn LED.'}</p>
            <p className="count">~{room.botCount} người đang online · {room.totalSeats} ghế</p>
            {/* "Đang chiếu" lấy từ bài đang phát thật của phòng (App ghi lại mỗi
                lần đổi bài) — sau vote bỏ qua hay hết bài tự chuyển, thẻ sảnh
                cũng đổi theo; chưa vào phòng lần nào thì hiện bài mẫu. */}
            <p>Đang chiếu: {nowPlayingByRoom?.[room.id]?.title || room.nowPlaying.title}</p>
            {room.kind === 'karaoke' && !karaokeOpenNow() && (
              <p style={{ color: '#ffb454' }}>Chưa mở cửa — 19:00–23:00 (vẫn vào xem thử được)</p>
            )}
          </button>
        ))}
        {/* Sảnh 3D: không có trong ROOMS (không dùng useRoom) — vào bằng
            roomId 'sanh', App render Sanh3D riêng. */}
        <button className="room-card" onClick={() => onEnterRoom('sanh')}>
          <span className="tag">{SANH_SPEC.sub}</span>
          <h2 style={{ marginTop: 10 }}>{SANH_SPEC.name}</h2>
          <p>Đi lại tự do trong sảnh (WASD, Shift chạy, Space nhảy), màn hình lớn chiếu cùng video với Rạp phim, 4 cửa vào các phòng.</p>
          <p className="count">Tối đa {SANH_SPEC.capacity} người</p>
          <p>Đang chiếu: {nowPlayingByRoom?.phim?.title || ROOMS.phim.nowPlaying.title}</p>
        </button>
        {/* Phòng riêng: mở màn danh sách + tạo phòng (link-only, không cần tài khoản). */}
        <button className="room-card" onClick={onOpenPrivateRooms}>
          <span className="tag">Tạm thời miễn phí</span>
          <h2 style={{ marginTop: 10 }}>Phòng riêng</h2>
          <p>Một góc rạp dành cho hội bạn, tạo phòng theo link, tự đóng sau 1 giờ.</p>
          <p className="count">Vào bằng link — không cần tài khoản</p>
        </button>
      </div>
      <p style={{ color: '#9aa5b1', fontSize: 13, marginTop: 24 }}>
        Bản clone gốc lấy cảm hứng từ choigivui.com (wetube ciné), viết lại hoàn toàn — không sao chép code hay tài sản của web gốc.
      </p>
    </div>
  );
}
