import { ROOMS, LV_EXP } from '../data';

export default function Lobby({ guest, exp, nowPlayingByRoom, onEnterRoom, onLeave }) {
  const level = Math.floor(exp / LV_EXP) + 1;
  const progress = exp % LV_EXP;
  return (
    <div className="lobby">
      <header>
        <div>
          <div className="logo">RẠP CHIẾU <span>CHUNG</span></div>
          <div style={{ color: '#9aa5b1' }}>Xem video, nghe nhạc cùng nhau — không cần tài khoản</div>
        </div>
        <div style={{ minWidth: 220 }}>
          <div>Xin chào, <b>{guest.name}</b> · LV{level} · {exp} EXP</div>
          <div className="exp-bar"><div style={{ width: `${(progress / LV_EXP) * 100}%` }} /></div>
          <div style={{ fontSize: 12, color: '#9aa5b1' }}>Còn {LV_EXP - progress} EXP nữa để lên LV{level + 1}</div>
          <button className="btn ghost" onClick={onLeave} style={{ marginTop: 8 }}>Đổi tên</button>
        </div>
      </header>

      <h2 style={{ marginTop: 28 }}>Chọn rạp để vào</h2>
      <div className="room-grid">
        {Object.values(ROOMS).map((room) => (
          <button key={room.id} className="room-card" onClick={() => onEnterRoom(room.id)}>
            <span className="tag">{room.sub}</span>
            <h2 style={{ marginTop: 10 }}>{room.name}</h2>
            <p>{room.kind === 'cinema' ? 'Rạp 3D tối, rèm đỏ, màn hình lớn — xem MV cùng cả rạp.' : room.kind === 'arena' ? 'Đấu trường LoL Park: khán đài 3 vòng quanh màn hình khổng lồ giữa sân — cùng xem bán kết T1 vs BLG.' : 'Rạp ngoài trời ban đêm: trăng, đồi, cây thông, bàn tròn, màn LED.'}</p>
            <p className="count">~{room.botCount} người đang online · {room.totalSeats} ghế</p>
            {/* "Đang chiếu" lấy từ bài đang phát thật của phòng (App ghi lại mỗi
                lần đổi bài) — sau vote bỏ qua hay hết bài tự chuyển, thẻ sảnh
                cũng đổi theo; chưa vào phòng lần nào thì hiện bài mẫu. */}
            <p>Đang chiếu: {nowPlayingByRoom?.[room.id]?.title || room.nowPlaying.title}</p>
          </button>
        ))}
        <div className="room-card phase2">
          <span className="tag">Sắp có</span>
          <h2 style={{ marginTop: 10 }}>Got Talent / Karaoke</h2>
          <p>Sân khấu hát karaoke, chấm điểm 1–10. Mở ở Phase 2 (19:00–23:00 như bản gốc).</p>
        </div>
        <div className="room-card phase2">
          <span className="tag">Sắp có</span>
          <h2 style={{ marginTop: 10 }}>Sảnh 3D</h2>
          <p>Đi lại tự do trong sảnh (WASD, Shift chạy, Space nhảy). Mở ở Phase 2.</p>
        </div>
        <div className="room-card phase2">
          <span className="tag">Sắp có</span>
          <h2 style={{ marginTop: 10 }}>Phòng riêng</h2>
          <p>Một góc rạp dành cho hội bạn, tạo phòng theo link. Mở ở Phase 2.</p>
        </div>
      </div>
      <p style={{ color: '#9aa5b1', fontSize: 13, marginTop: 24 }}>
        Bản clone gốc lấy cảm hứng từ choigivui.com (wetube ciné), viết lại hoàn toàn — không sao chép code hay tài sản của web gốc.
      </p>
    </div>
  );
}
