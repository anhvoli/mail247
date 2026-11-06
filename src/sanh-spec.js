// Spec nối Sảnh 3D (Sanh3D.jsx) vào app — file này chỉ mô tả, không sửa
// file nào khác. Parent (agent chính) đọc spec này rồi tự nối vào Lobby /
// App / RoomView theo các bước ở cuối file.

export const SANH_SPEC = {
  id: 'sanh',
  name: 'Sảnh 3D',
  sub: 'ĐI LẠI TỰ DO (THỬ NGHIỆM) · TỐI ĐA 40 NGƯỜI',
  kind: 'hall',
  capacity: 40,
  // Màn hình lớn trong sảnh chiếu CÙNG video với Rạp phim (như bản gốc
  // choigivui.com /sanh): parent truyền videoId = video đang chiếu của
  // Rạp phim (mặc định 'abPmZCZZrFA' — MV Sơn Tùng M-TP, đã kiểm chứng).
  videoSource: 'same-as-phim',
  defaultVideoId: 'abPmZCZZrFA',
  // 4 cửa trong sảnh → id phòng đích (khớp ROOMS trong data.js, trừ karaoke).
  doors: [
    { id: 'phim', label: 'Rạp phim', target: 'phim' },
    { id: 'troi', label: 'Rạp Trời', target: 'troi' },
    { id: 'karaoke', label: 'Karaoke', target: 'karaoke' },
    { id: 'arena', label: 'Đấu trường', target: 'arena' },
  ],
  // Điều khiển trong sảnh (đúng chữ bản gốc).
  controls: [
    'WASD hoặc phím mũi tên để đi',
    'Shift chạy',
    'Space nhảy',
    'E vào cửa rạp',
    'Enter để chat',
    'Kéo chuột xoay camera, lăn chuột để zoom',
  ],
  // Nút ngoài khung 3D (parent tự làm ở RoomView, giống các phòng khác):
  // "Bật tiếng" (gọi player.setVolume(100)/mute qua onPlayerReady),
  // "Tắt màn hình" (truyền prop screenOff=true vào Sanh3D).
  uiButtons: ['Bật tiếng', 'Tắt màn hình'],
};

// Ghi chú nối dây cho parent — đọc kỹ trước khi sửa App/Lobby/RoomView:
// 1. Lobby.jsx: thêm 1 thẻ phòng cho 'sanh' (dùng SANH_SPEC.name/sub, số
//    người online lấy từ guests.length, bấm vào thì onEnterRoom('sanh')).
// 2. App.jsx: khi roomId === 'sanh', render <Sanh3D videoId={liveNowPlaying
//    phim} ... /> thay vì <RoomView/> (Sảnh không có ghế/hàng đợi, nên
//    KHÔNG dùng useRoom cho sảnh; chỉ cần video + khách + chat). Chat trong
//    sảnh dùng chung messages của Rạp phim hoặc 1 kênh chat riêng — parent
//    tự chọn, không có sẵn trong Sanh3D.jsx.
// 3. Sanh3D props: videoId, showLive, screenOff, onEnded, onPlayerReady,
//    controls, startSeconds, guests (mảng {name, color, x, z}), myGuest
//    ({name, color:{hex}}), onNearDoor(id|null), onEnterDoor(doorId),
//    onOpenChat(). onEnterDoor nhận doorId là id PHÒNG ĐÍCH ('phim' /
//    'troi' / 'karaoke' / 'arena') — parent setRoomId(doorId) là vào phòng.
// 4. Karaoke chưa có trong ROOMS (data.js): cửa Karaoke trong sảnh chỉ hoạt
//    động sau khi agent Karaoke tạo xong phòng 'karaoke'; trước đó parent
//    nên cho cửa này hiện toast "Karaoke sẽ có ở phase sau" thay vì vào
//    phòng trống (kẻo đen trang).
// 5. "Bật tiếng": YouTubePlayer (youtube.jsx) không có prop muted — parent
//    giữ player từ onPlayerReady rồi gọi player.unMute()/setVolume(100),
//    hoặc player.mute() khi tắt tiếng. "Tắt màn hình": set screenOff=true
//    (màn thành đen, không unmount player).
// 6. Giới hạn thật: Sanh3D chỉ là cảnh 3D local-only như các phòng khác —
//    khách khác, chat, vị trí avatar chưa đồng bộ qua máy chủ; muốn nhiều
//    người thật cùng đi lại trong sảnh cần bản server (WebSocket) sau này.
//    Avatar của mình chỉ di chuyển trong sảnh này, không đi xuyên tường.
export const SANH_WIRING_NOTES = 'Xem comment ở cuối file src/sanh-spec.js (mục 1–6).';
