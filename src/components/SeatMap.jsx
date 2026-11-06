import { arenaSeatId, seatId, seatType } from '../data';

export default function SeatMap({ room, seats, mySeat, onPick }) {
  if (room.kind === 'arena') {
    // Đấu trường LoL Park: 3 vòng khán đài A/B/C × 24 ghế, ôm quanh màn hình giữa.
    return (
      <div className="seatmap">
        <h3>Chọn một chỗ thật ưng</h3>
        <p className="hint">3 vòng khán đài · 72 ghế · Vòng A gần sân nhất, vòng C cao nhất. Bạn có thể đổi chỗ bất kỳ lúc nào. Bot sẽ nhường khi bạn chọn ghế của bot.</p>
        <div className="screen-bar">MÀN HÌNH TRUNG TÂM</div>
        <div className="seat-rows">
          {room.rings.map((ring) => (
            <div className="seat-row" key={ring}>
              <span className="row-label">Vòng {ring}</span>
              {Array.from({ length: room.seatsPerRing }, (_, i) => i + 1).map((n) => {
                const id = arenaSeatId(ring, n);
                const occ = seats[id];
                return (
                  <button key={id} title={occ ? `${id} — ${occ.name}` : `${id} — còn trống`}
                    className={`seat ${occ ? (occ.kind === 'me' ? 'mine' : 'occupied bot') : ''}`}
                    onClick={() => onPick(id)}>
                    {occ ? (occ.kind === 'me' ? '✓' : occ.name.split(' ').pop()) : n}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="legend">
          <span><i className="dot" style={{ background: '#1a2230', border: '1px solid #2a3342' }} />Còn trống</span>
          <span><i className="dot" style={{ background: '#39445a' }} />Đã có người</span>
          <span><i className="dot" style={{ background: '#b8cd8e' }} />Ghế của bạn</span>
        </div>
      </div>
    );
  }
  if (room.kind === 'cinema') {
    return (
      <div className="seatmap">
        <h3>Chọn một chỗ thật ưng</h3>
        <p className="hint">10 hàng · 100 chỗ · Ghế đơn, ghế đôi và ghế ba. Bạn có thể đổi chỗ bất kỳ lúc nào. Bot sẽ nhường khi bạn chọn ghế của bot.</p>
        <div className="screen-bar">MÀN HÌNH</div>
        <div className="seat-rows">
          {room.rows.map((row) => (
            <div className="seat-row" key={row}>
              <span className="row-label">{row}</span>
              {Array.from({ length: room.cols }, (_, i) => i + 1).map((col) => {
                const id = seatId(row, col);
                const occ = seats[id];
                const type = seatType(row, col);
                return (
                  <button key={id} title={occ ? `${id} — ${occ.name}` : `${id} — còn trống (${type === 'single' ? 'ghế đơn' : type === 'double' ? 'ghế đôi' : 'ghế ba'})`}
                    className={`seat ${type} ${occ ? (occ.kind === 'me' ? 'mine' : 'occupied bot') : ''}`}
                    onClick={() => onPick(id)}>
                    {occ ? (occ.kind === 'me' ? '✓' : occ.name.split(' ').pop()) : id}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="legend">
          <span><i className="dot" style={{ background: '#1a2230', border: '1px solid #2a3342' }} />Còn trống</span>
          <span><i className="dot" style={{ background: '#39445a' }} />Đã có người</span>
          <span><i className="dot" style={{ background: '#b8cd8e' }} />Ghế của bạn</span>
        </div>
      </div>
    );
  }
  // Rạp Trời: 12 bàn tròn × 6 ghế.
  return (
    <div className="seatmap">
      <h3>Chọn một bàn thật ưng</h3>
      <p className="hint">12 bàn tròn · 72 ghế · Ghế của bot sẽ nhường khi bạn chọn trúng.</p>
      <div className="screen-bar">SÂN KHẤU · MÀN LED</div>
      <div className="tables">
        {Array.from({ length: room.tables }, (_, t) => t + 1).map((table) => (
          <div className="table" key={table}>
            <h4>Bàn {table}</h4>
            <div className="seats">
              {Array.from({ length: room.seatsPerTable }, (_, s) => s + 1).map((s) => {
                const id = `B${String(table).padStart(2, '0')}-${s}`;
                const occ = seats[id];
                return (
                  <button key={id} title={occ ? `${id} — ${occ.name}` : `${id} — còn trống`}
                    className={`seat ${occ ? (occ.kind === 'me' ? 'mine' : 'occupied bot') : ''}`}
                    onClick={() => onPick(id)}>
                    {occ ? (occ.kind === 'me' ? '✓' : occ.name.split(' ').pop()) : s}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
