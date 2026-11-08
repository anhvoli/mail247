# Nối CameraControl vào AdminPanel.jsx (ghi chú — KHÔNG tự sửa file)

Mục đích: hiện mục "Góc quay từng phòng" trong bảng Quản trị Live để admin
chỉnh góc quay từng phòng; web khách chỉ xem, không có nút đổi góc nữa
(RoomView.jsx đã bỏ nút góc quay của khách, preset lấy từ adminCamera.js).

## 1. Thêm import (đầu file AdminPanel.jsx, cùng nhóm import component)

```jsx
import CameraControl from './admin/CameraControl';
```

## 2. Thêm mục vào trong `<div className="admin-grid">` (chọn 1 vị trí, ví dụ ngay sau mục "Kết Nối Live")

```jsx
<CameraControl />
```

Không cần truyền props — CameraControl tự đọc/ghi preset qua `adminCamera.js`
(localStorage key `rapchieu-admin-camera`) và tự cập nhật khi bấm.

## Kiểm tra sau khi nối

- Mở bảng admin: thấy mục "🎥 Góc quay từng phòng" với 5 phòng (Rạp phim,
  Rạp Trời, Đấu trường LoL Park, Karaoke, Sảnh 3D), mỗi phòng 4 nút góc,
  góc đang chọn tô vàng.
- Bấm đổi góc ở admin trong lúc đang mở phòng đó ở tab/cửa sổ khác: phòng
  đổi góc ngay không cần tải lại (RoomView nghe `rapchieu:camera-change`).
- Phòng Sảnh 3D: nút góc lưu được nhưng SanhView chưa đọc preset này (camera
  sảnh vẫn là camera đi theo người) — nối SanhView sau nếu cần.
- Phòng riêng (mã `phong-rieng-...`): chưa có hàng riêng trong mục admin,
  mặc định góc Toàn cảnh; muốn chỉnh thì thêm hàng theo `room.id` sau.
