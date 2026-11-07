import { useState } from 'react';
import { CAMERA_ROOMS, CAMERA_PRESET_KEYS, CAMERA_PRESET_LABELS, loadCameraPresets, setCameraPreset } from '../../adminCamera';

// Mục admin "Góc quay từng phòng" — web client CHỈ XEM, khách không đổi được
// góc quay. Chỉ admin chỉnh ở đây; phòng nào đang mở sẽ chuyển góc ngay lập
// tức (RoomView nghe CustomEvent từ adminCamera.js), không cần tải lại.
export default function CameraControl() {
  const [presets, setPresets] = useState(() => loadCameraPresets());

  const choose = (roomId, preset) => {
    if (setCameraPreset(roomId, preset)) {
      setPresets((p) => ({ ...p, [roomId]: preset }));
    }
  };

  return (
    <section className="admin-card">
      <h3>🎥 Góc quay từng phòng</h3>
      <p className="admin-hint">
        Web khách chỉ xem — khách không đổi được góc quay. Admin chọn góc ở đây,
        phòng nào đang mở sẽ chuyển góc ngay, không cần tải lại.
      </p>
      {CAMERA_ROOMS.map((room) => (
        <div className="admin-field" key={room.id}>
          <label>{room.name}</label>
          <div className="admin-row">
            {CAMERA_PRESET_KEYS.map((key) => (
              <button
                key={key}
                className={`admin-btn ${presets[room.id] === key ? 'gold' : ''}`}
                onClick={() => choose(room.id, key)}
              >
                {CAMERA_PRESET_LABELS[room.id][key]}
              </button>
            ))}
          </div>
        </div>
      ))}
      <p className="admin-hint">Góc mặc định mọi phòng: Toàn cảnh. Đổi góc được lưu ngay vào trình duyệt.</p>
    </section>
  );
}
