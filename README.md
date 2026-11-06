# Rạp Chiếu Chung — bản clone choigivui.com (Phase 1)

Bản clone gốc lấy cảm hứng từ **choigivui.com (wetube ciné)**, viết lại hoàn toàn
từ đầu bằng Vite + React. **Không sao chép code, hình ảnh hay tài sản nào của web
gốc** — mọi giao diện, model 3D và logic đều do project này tự viết, chỉ mô phỏng
lại *cách hoạt động* đã quan sát được trong buổi khảo sát ngày 2026-11-06.

## Chạy thử

```bash
npm install
npm run dev      # mở http://localhost:5173
npm run build    # build production, ra thư mục dist/
npm run preview  # xem thử bản build
```

## Cách chơi — không cần tài khoản

1. Mở app, nhập **tên in trên áo** (để trống sẽ tự gán `Khách NN`), chọn màu áo
   và giới tính, bấm “Chọn ghế và vào rạp”.
2. Chọn 1 trong 2 phòng mẫu: **Rạp phim** (100 ghế) hoặc **Rạp Trời** (72 ghế bàn).
3. Chọn ghế trên sơ đồ 2D. Ghế của bạn màu xanh lá, có dấu ✓. Ghế đã có người
   hiện tên người ngồi. **Bot sẽ nhường ghế** khi bạn chọn trúng ghế của bot
   (bot tự chuyển sang ghế trống khác), và bot cũng tự đổi ghế thỉnh thoảng.
4. Xem video chung trên màn hình YouTube, bình chọn bài trong hàng đợi (bài
   nhiều vote nhất chiếu tiếp), vote bỏ qua (đủ 30% người thật thì chuyển bài),
   chat tối đa 160 ký tự, dùng emoji, làm 3 điệu bộ: nhún nhảy / vẫy tay / vỗ tay.
5. Đổi góc camera của rạp 3D: toàn cảnh, từ ghế, tập trung màn hình, từ màn
   chiếu về hàng ghế (phím điều khiển WASD / Space / E như bản gốc được ghi
   trong giao diện Sảnh ở Phase 2).

## Có gì trong Phase 1

- **2 phòng:** Rạp phim — 10 hàng A–J × 10 ghế (ghế 01 và 10 đơn, 02–03 đôi,
  04–06 và 07–09 ba); Rạp Trời — 12 bàn tròn × 6 ghế.
- **Màn hình chung:** iframe YouTube, video mở màn đã kiểm chứng ID:
  - Rạp phim: `abPmZCZZrFA` — SƠN TÙNG M-TP | ĐỪNG LÀM TRÁI TIM ANH ĐAU (Official MV, 5:26)
  - Rạp Trời: `2WAXXlK3tAA` — Thêm Một Lần Đau (Remake Version) – NDMT
- **Hàng đợi + bình chọn**, **vote bỏ qua 30%**, **chat + emoji 4 nhóm**
  (Cảm xúc 24, Trái tim 12, Cử chỉ, Tiệc tùng), **3 điệu bộ**.
- **Rạp 3D thật bằng React Three Fiber** (`src/components/Cinema3D.jsx`):
  màn hình phát sáng, rèm đỏ, quả cầu disco, ghế + avatar ngồi trên ghế,
  camera lerp mượt giữa 4 góc preset. Không phải ảnh tĩnh giả 3D.
- **Nhiệm vụ ngày + EXP:** điểm danh +20 EXP, chat 1 lần +15 EXP, ngồi xem
  +1 EXP / 3 phút (tối đa 50 EXP/ngày), LV1 cần 300 EXP lên LV2.
  Tên khách, EXP và nhiệm vụ lưu ở `localStorage` trên trình duyệt của bạn.
- **Phase 2 (chưa làm, đã ghi “Sắp có” trong app):** Got Talent / Karaoke,
  Sảnh 3D đi lại tự do, phòng riêng.

## Cái gì chỉ là mô phỏng ở bản source này

- **Trạng thái chia sẻ chỉ ở local:** bot, ghế, hàng đợi, vote và chat đều
  chạy trong trình duyệt của bạn. Muốn nhiều người thật cùng xem 1 phòng
  (đồng bộ video, ghế, chat) thì cần thêm **server** (WebSocket) giữ trạng
  thái phòng — bản artifact fullstack đã có server, còn bản source này chưa
  có. Cấu trúc state đã tách riêng trong `src/useRoom.js` để sau này thay
  bằng dữ liệu từ server mà không phải viết lại giao diện.
- **Ngưỡng vote bỏ qua** tính theo % *người thật*: ở bản local chỉ có 1 người
  thật là bạn, nên 1 vote bỏ qua = 100% và sẽ chuyển bài ngay.
- **Bot chat / đổi ghế** chạy theo timer ở máy bạn, không phải người thật.
- Video YouTube nhúng qua iframe của YouTube; muốn phát đồng bộ chính xác
  từng giây giữa các máy thì cần dùng YouTube IFrame Player API + server
  clock (Phase 2).

## Công nghệ

Vite 5 + React 18 + React Three Fiber 8 + Three.js + Zustand (đã khai báo,
hiện state chính dùng React hooks trong `src/useRoom.js`).
