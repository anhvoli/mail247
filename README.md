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
2. Chọn 1 trong 3 phòng: **Rạp phim** (100 ghế), **Rạp Trời** (72 ghế bàn) hoặc
   **Đấu trường LoL Park** (72 ghế khán đài vòng tròn, xem bán kết T1 vs BLG).
3. Chọn ghế trên sơ đồ 2D. Ghế của bạn màu xanh lá, có dấu ✓. Ghế đã có người
   hiện tên người ngồi. **Bot sẽ nhường ghế** khi bạn chọn trúng ghế của bot
   (bot tự chuyển sang ghế trống khác), và bot cũng tự đổi ghế thỉnh thoảng.
   Bot đã ngồi sẵn ngay khi mở phòng nên số người online khớp với ghế trên sơ đồ.
4. Xem video chung trên màn hình YouTube, bình chọn bài trong hàng đợi (bài
   nhiều vote nhất chiếu tiếp), vote bỏ qua (đủ 30% người thật thì chuyển bài),
   chat tối đa 160 ký tự, dùng emoji, làm 3 điệu bộ: nhún nhảy / vẫy tay / vỗ tay.
5. Đổi góc camera của rạp 3D: toàn cảnh, từ ghế, tập trung màn hình, từ màn
   chiếu về hàng ghế. Hint “W A S D để đi lại · Space để nhảy · E hoặc bấm
   vào ghế để ngồi” hiện ở đáy khung 3D (di chuyển avatar WASD chưa làm ở
   Phase 1). Nút “⛶ Toàn màn hình” mở toàn màn hình cho cả khu vực rạp,
   bấm **Esc** để thoát.
6. Mỗi phòng có hàng đợi và video riêng: Rạp phim mở đầu bằng MV Sơn Tùng
   M-TP, Rạp Trời mở đầu bằng “Thêm Một Lần Đau (Remake)” của NDMT, Đấu trường
   LoL Park mở đầu bằng highlights chung kết CKTG 2024 T1 vs BLG; đổi phòng
   là state của phòng cũ được giữ nguyên theo từng phòng, không lẫn nhau.

## Màn hình chiếu hoạt động như thế nào (ghi rõ để khỏi nhầm)

- **Video thật TRÊN màn hình 3D (round 3):** YouTube không cho nhúng iframe
  làm texture WebGL, nên dùng **`Html` transform của drei** (CSS3D):
  đúng iframe trình phát YouTube được đặt lên mặt phẳng màn hình trong cảnh
  3D — video chạy thật, đổi góc camera thì màn hình phối cảnh theo như màn
  hình thật. Tỉ lệ lấy từ code drei (`Html.js`): bề rộng thế giới =
  `px * distanceFactor / 400`, nên div 900×500px + `distanceFactor={4}` =
  đúng 9×5 đơn vị (màn rạp phim); Rạp Trời 1100×600px = 11×6. Mặt màn hình
  vẫn giữ **thumbnail làm lớp nền** dưới iframe, nên màn hình không bao giờ
  trống. **Giới hạn thật:** iframe là phần tử DOM nằm TRÊN canvas WebGL,
  nên (a) ở góc **“Từ màn chiếu về hàng ghế”** (màn hình ở sau lưng người
  xem) và góc **“Góc nhìn từ ghế”** (ghế ngồi sẽ bị iframe “xuyên qua” vì
  DOM luôn vẽ trên canvas), iframe live bị ẩn và chỉ còn thumbnail —
  player unmount lúc đó rồi mount lại, phát tiếp từ đúng giây đã xem tới
  (RoomView poll `getCurrentTime` mỗi giây, truyền `startSeconds`);
  (b) chỉ góc toàn cảnh + tập trung màn hình mới thấy video live.
  Góc “Tập trung màn hình” vẫn hiện video lấp đầy khung hình như trước,
  vì camera đã dí sát màn hình.
- **Panel “TRÊN MÀN ẢNH”** (góc trái khung 3D, như bản gốc): tên bài, người
  đề xuất, giờ hiện tại / tổng thời lượng, thanh tiến trình, nút
  “Vote bỏ qua X/Y” và dòng “X/N người thật đồng ý · P% · Đủ 30% thì chuyển
  bài”. **Thanh dọc bên phải** khung 3D: Gửi video, Chiếu ảnh, Hàng chờ,
  Trò chuyện, Tương tác, Tủ đồ, Ủng hộ (Chiếu ảnh / Tủ đồ / Ủng hộ là
  phase sau, bấm chỉ báo — không giả vờ có). **Hint WASD** ở đáy khung 3D:
  “W A S D để đi lại · Space để nhảy · E hoặc bấm vào ghế để ngồi” — lưu ý
  đây mới là dòng hint: di chuyển avatar WASD trong rạp 3D chưa làm ở
  Phase 1. **Bảng tên** lơ lửng trên đầu người ngồi trong rạp 3D, **vòng
  xanh lá** trên sàn quanh ghế trống.
- **Tự động chuyển bài:** trình phát dùng **YouTube IFrame Player API**,
  bắt sự kiện `onStateChange` với `YT.PlayerState.ENDED` để chuyển sang bài
  nhiều vote nhất — và có **watchdog dự phòng** poll `getPlayerState()` /
  `getCurrentTime()` mỗi giây, nên hết bài vẫn chuyển ngay cả khi sự kiện
  ENDED bị lỡ. API nạp lại được nếu tải chậm (tối đa 3 lượt, không "chết"
  vĩnh viễn sau 1 lần timeout như round 1); nếu API vẫn chưa tải được,
  trình phát dùng iframe thường có `enablejsapi=1` rồi **tự nâng cấp thành
  player API** khi `window.YT` xuất hiện. Player được tạo trên 1 div tạo
  bằng tay trong container do React sở hữu (không có con React nào) nên
  YouTube thay div bằng iframe cũng không làm lệch DOM của React — đổi bài
  chỉ nạp bằng `loadVideoById`, giữ nguyên instance và handler ENDED, không
  hủy + tạo lại player mỗi lần đổi bài. **Ngoại lệ duy nhất:** đổi sang góc
  ghế / góc ngược thì player unmount theo iframe live (xem trên) rồi tạo
  lại từ `startSeconds` khi quay về góc toàn cảnh / tập trung.
- **Vote bỏ qua:** bấm là counter hiện **1/1** ngay (kèm thông báo), chờ
  2 giây mới chuyển bài rồi reset về 0/1 cho bài mới. Thẻ “Đang chiếu” ở
  sảnh lấy từ bài đang phát thật của từng phòng, và vào lại phòng thì tiếp
  tục bài đó. **Phạm vi thật:** bản source này giữ vote trong state của
  trình duyệt thôi — vote không lưu qua lần tải lại trang và không thấy
  được ở trình duyệt khác; muốn vote chung nhiều người thì cần bản server
  (bản artifact fullstack). Không giả vờ có đồng bộ.
- **Nút “Hiện/Ẩn điều khiển trình phát”** nằm trong thanh controls dưới
  player (không bị iframe đè, có z-index riêng nên luôn bấm được). YouTube
  API không cho đổi `controls` trực tiếp nên khi bấm, player sẽ tạo lại từ
  đúng giây đang xem.
- **Hàng đợi chống trùng:** không thêm được video đã có trong hàng đợi hoặc
  đang chiếu (so theo video ID); hàng đợi mẫu của Rạp phim không còn 2 bản
  của cùng 1 bài Sơn Tùng nữa (bản Audio đã thay bằng MV Quang Đăng Trần
  “Anh Đã Không Biết Cách Yêu Em”, `OKjhlW1MveM`, **4:44** — theo đúng
  thời lượng trình phát báo).
- **Camera:** đổi góc là đặt thẳng vị trí + hướng nhìn của camera R3F
  (không lerp từng frame), Canvas không bao giờ bị unmount/thay thế khi đổi
  góc; góc “Tập trung màn hình” dí camera sát màn hình nên video live lấp
  đầy khung hình. Lỗi WebGL/player được chặn bằng ErrorBoundary nên không
  bao giờ đen cả trang.
- **Thumbnail hàng đợi** có fallback: lỗi `default.jpg` thì thử `mqdefault.jpg`,
  vẫn lỗi thì hiện ô placeholder 🎬 thay vì ảnh vỡ.

## Có gì trong Phase 1

- **3 phòng:** Rạp phim — 10 hàng A–J × 10 ghế (ghế 01 và 10 đơn, 02–03 đôi,
  04–06 và 07–09 ba); Rạp Trời — 12 bàn tròn × 6 ghế; **Đấu trường LoL Park** —
  3 vòng khán đài A/B/C × 24 ghế = 72 ghế (mã A01…A24, B01…B24, C01…C24) ôm
  quanh màn hình khổng lồ giữa sân, đèn trần đỏ bên T1 / xanh dương bên BLG,
  vòng neon đỏ–xanh quanh sàn giữa, màn phụ WELCOME + thông tin trận bán kết.
- **Màn hình chung:** video YouTube live ngay trên mặt màn hình 3D
  (drei `Html` transform), video mở màn đã kiểm chứng ID:
  - Rạp phim: `abPmZCZZrFA` — SƠN TÙNG M-TP | ĐỪNG LÀM TRÁI TIM ANH ĐAU (Official MV, 5:26)
  - Rạp Trời: `2WAXXlK3tAA` — Thêm Một Lần Đau (Remake Version) – NDMT
  - Đấu trường LoL Park: `rZHrffKAc6k` — T1 vs BLG Highlights | Grand Finals |
    Worlds 2024 (kênh LoL Esports, đã kiểm chứng qua oEmbed YouTube; thời
    lượng để `?` vì oEmbed không trả thời lượng — trình phát báo giờ thật khi
    chạy). Đây là highlights trận chung kết CKTG 2024 (T1 thắng BLG 3-2) để
    xem lại trước trận bán kết.
- **Lưu ý về trận bán kết T1 vs BLG:** cặp đấu này chỉ chốt khi **T1 thắng KC**
  ở tứ kết (sáng thứ Bảy 07/11 lúc 05:00 giờ VN); BLG đã vào bán kết sau khi
  thắng DK 3-0. Trận bán kết dự kiến **05:00 thứ Hai 09/11/2026 giờ VN, BO5**.
  Nếu T1 thua KC thì phòng đấu trường sẽ xem KC vs BLG — đổi tên/băng hiệu
  trong `Arena3D.jsx` và `data.js` khi có kết quả.
- **Hàng đợi + bình chọn**, **vote bỏ qua 30%**, **chat + emoji 4 nhóm**
  (Cảm xúc 24, Trái tim 12, Cử chỉ, Tiệc tùng), **3 điệu bộ**.
- **Rạp 3D thật bằng React Three Fiber** (`src/components/Cinema3D.jsx`):
  **video live trên mặt màn hình** (drei `Html` transform, xem mục trên),
  thumbnail làm nền dưới iframe, rèm nhung đỏ xếp ly 2 bên +
  diềm trên màn hình, 2 loa tháp lớn có loa tròn 2 bên màn hình, quả cầu disco
  treo cao trước màn hình (không che mặt màn hình), đèn tường ấm 2 bên, ghế +
  avatar ngồi trên ghế **có bảng tên lơ lửng trên đầu**, ghế trống đánh dấu
  bằng **vòng xanh lá trên sàn**, camera đặt thẳng theo 4 góc preset (góc
  “từ màn chiếu về hàng ghế” đứng trước mặt màn hình nên nhìn rõ khán giả).
  Rạp Trời có bục sân khấu gỗ, màn LED lớn hơn, bàn tròn gỗ sáng màu, trăng +
  sao. Không phải ảnh tĩnh giả 3D.
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

Vite 5 + React 18 + React Three Fiber 8 + drei 9 + Three.js + Zustand (đã khai báo,
hiện state chính dùng React hooks trong `src/useRoom.js`).
