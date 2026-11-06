import { useState } from 'react';
import { SHIRT_COLORS } from '../data';

export default function GuestSetup({ onEnter }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(SHIRT_COLORS[0]);
  const [gender, setGender] = useState('Nam');

  const submit = () => {
    const finalName = name.trim() || `Khách ${Math.floor(Math.random() * 90 + 10)}`;
    onEnter({ name: finalName, color, gender });
  };

  return (
    <div className="gate">
      <div className="gate-card">
        <p className="caps" style={{ color: '#b8cd8e', margin: 0, fontSize: 13 }}>Rạp chiếu chung · Cùng nhau</p>
        <h1>Bạn sẽ là ai trong rạp?</h1>
        <p>Tên của bạn được in trên áo. Tin nhắn sẽ hiện trên đầu nhân vật. Không cần tài khoản — vào là xem chung.</p>
        <div className="field">
          <label>Tên in trên áo</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mọi người gọi bạn là gì?" maxLength={20} />
        </div>
        <div className="field">
          <label>Giới tính / Ngoại hình</label>
          <div className="shirt-row">
            <div className="shirt-avatar" style={{ background: color.hex }}>
              {name.trim() || 'Tên bạn'}
            </div>
            <div>
              <div className="color-dots">
                {SHIRT_COLORS.map((c) => (
                  <button key={c.id} className={`color-dot ${color.id === c.id ? 'on' : ''}`}
                    style={{ background: c.hex }} title={c.name}
                    onClick={() => setColor(c)} aria-label={c.name} />
                ))}
              </div>
              <div className="gender-row" style={{ marginTop: 10 }}>
                <button className={gender === 'Nam' ? 'on' : ''} onClick={() => setGender('Nam')}>Nam ✓</button>
                <button className={gender === 'Nữ' ? 'on' : ''} onClick={() => setGender('Nữ')}>Nữ</button>
              </div>
            </div>
          </div>
        </div>
        <button className="btn" onClick={submit} style={{ width: '100%' }}>Chọn ghế và vào rạp →</button>
        <p style={{ fontSize: 12, marginTop: 14 }}>Tên tạm, đóng tab là mất. Không lưu mật khẩu, không thu thập thông tin.</p>
      </div>
    </div>
  );
}
