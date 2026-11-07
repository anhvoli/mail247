// Trình phát YouTube — YouTube IFrame Player API + watchdog dự phòng.
//
// Round 4 (sau kiểm tra live 23:02–23:28):
// - Video kẹt ở 0:00 lúc vào phòng lần đầu: trình duyệt chặn autoplay CÓ
//   TIẾNG. Player nay khởi động TẮT TIẾNG (mute=1) + autoplay, rồi bật tiếng
//   ở lần chạm/phím đầu tiên trong phòng; có nút "Đang tắt tiếng" trên góc
//   màn hình để bấm bật tiếng (xem overlay trong effect mount).
// - Video lỗi/không nhúng được (mã 100/101/150...): onError tự bỏ qua sang
//   bài tiếp theo thay vì kẹt màn đen 0:00 (chống lặp: 3 lỗi trong 15s thì
//   dừng tự bỏ qua).
// Vì sao viết lại (round 2, sau khi kiểm tra live thấy tự chuyển bài vẫn hỏng):
// - Round 1 chỉ gắn onStateChange ENDED trên player API, nhưng có 3 điểm gãy:
//   (1) loadYouTubeApi() timeout 8s là reject VĨNH VIỄN (apiPromise cache ở
//   module, apiFailed không bao giờ hồi) — tải chậm 1 lần là cả phiên chỉ còn
//   iframe thường, mà iframe thường không có sự kiện ENDED nên không bao giờ
//   tự chuyển bài. (2) RoomView dùng key={current.nonce} nên mỗi lần đổi bài
//   là hủy + tạo lại toàn bộ player. (3) Không có cơ chế kiểm tra dự phòng.
// - Cách sửa: API nạp lại được (retry, không poison vĩnh viễn); player được
//   tạo trên 1 div TẠO BẰNG TAY bên trong container do React sở hữu nhưng
//   KHÔNG có con React nào — YT.Player thay div đó bằng iframe cũng không
//   làm lệch DOM của React (đây cũng là gốc của lỗi camera/màn đen round 2);
//   watchdog poll getPlayerState()/getCurrentTime() mỗi giây để bắt hết bài
//   ngay cả khi onStateChange bị lỡ; fallback iframe có enablejsapi=1 và tự
//   nâng cấp thành player API khi API tải xong.
import { useCallback, useEffect, useRef } from 'react';

// ---- Nạp API YouTube: thử lại, không "chết" vĩnh viễn sau 1 lần lỗi ----
let apiPromise = null;
const MAX_API_ATTEMPTS = 3;

function loadYouTubeApi() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    let done = false;
    const tryLoad = (attempt) => {
      if (done) return;
      if (window.YT && window.YT.Player) { done = true; resolve(window.YT); return; }
      if (attempt > MAX_API_ATTEMPTS) {
        done = true;
        apiPromise = null; // cho lần mount sau thử lại từ đầu
        reject(new Error('YouTube API unavailable'));
        return;
      }
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      tag.onerror = () => { setTimeout(() => tryLoad(attempt + 1), 2000); };
      document.head.appendChild(tag);
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prev) prev();
        if (!done) { done = true; resolve(window.YT); }
      };
      // 8s chưa thấy API thì thử nạp lại (lượt sau), không reject ngay.
      setTimeout(() => {
        if (!done && (!window.YT || !window.YT.Player)) tryLoad(attempt + 1);
      }, 8000);
    };
    tryLoad(1);
  });
  return apiPromise;
}

const IFRAME_ALLOW = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';

// Trạng thái tiếng dùng chung cho mọi lần tạo lại player (vòng 2): trước
// đây mutedRef khởi tạo true trong mỗi instance nên đổi góc camera (player
// remount) là tiếng tắt lại dù người xem đã bấm bật tiếng. Nay giữ ở cấp
// module để player mount lại vẫn nhớ đã bật tiếng hay chưa. Engine nền
// (background) luôn tắt tiếng và không đụng tới trạng thái này.
let sharedMuted = true;

export default function YouTubePlayer({ videoId, onEnded, onPlayerReady, controls = true, startSeconds = 0, onMutedChange, background = false }) {
  // Container do React sở hữu, JSX không render con nào bên trong — mọi node
  // con (mount div / iframe) đều tạo bằng tay, YT thay thế chúng cũng không
  // làm lệch cây DOM của React.
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const fallbackIframeRef = useRef(null);
  const onEndedRef = useRef(onEnded);
  const onPlayerReadyRef = useRef(onPlayerReady);
  const videoIdRef = useRef(videoId);
  const controlsRef = useRef(controls);
  // Giây bắt đầu (round 3): khi player bị unmount lúc ẩn màn live (góc ghế /
  // góc ngược) rồi mount lại, phát tiếp từ đúng giây đã xem tới thay vì về 0.
  const startSecondsRef = useRef(startSeconds);
  useEffect(() => { startSecondsRef.current = startSeconds; }, [startSeconds]);
  const loadedVideoIdRef = useRef(null);
  const pendingVideoIdRef = useRef(null);
  const endedFiredForRef = useRef(null);
  const lastTimeRef = useRef(0);

  useEffect(() => { onEndedRef.current = onEnded; }, [onEnded]);
  useEffect(() => { onPlayerReadyRef.current = onPlayerReady; }, [onPlayerReady]);
  const onMutedChangeRef = useRef(onMutedChange);
  useEffect(() => { onMutedChangeRef.current = onMutedChange; }, [onMutedChange]);
  // Bắt đầu TẮT TIẾNG (round 4): autoplay có tiếng bị chặn nên video kẹt ở
  // 0:00 tới khi người dùng tương tác. mutedRef giữ trạng thái qua các lần
  // tạo lại player (đổi controls / đổi góc camera) — đọc từ sharedMuted
  // (vòng 2) để đổi góc không làm tiếng tắt lại; engine nền (background)
  // luôn tắt tiếng vì người xem không thấy video (bật tiếng là tiếng phát
  // ra từ chỗ không có hình).
  const mutedRef = useRef(background ? true : sharedMuted);
  // Chống vòng lặp tự bỏ qua làm giao diện NHẢY (fix 07/11 ~00:10):
  // khi YouTube chặn/không phát được, onError bắn liên tục — mỗi lần bỏ qua
  // là advanceToNext đổi bài + tạo lại player, mà guard cũ "3 lỗi trong 15s"
  // không bao giờ kịp chặn vì mỗi vòng lỗi→tạo lại player tốn >5s nên cửa
  // sổ 15s không bao giờ chứa đủ 3 lỗi. Hàng đợi chỉ có 2-3 bài nên nó cứ
  // xoay vòng A→B→A vài giây một lần, bài đang chiếu + thời lượng + tiêu đề
  // iframe nhảy loạn. Đếm LỖI LIÊN TIẾP thay vì lỗi theo thời gian: chỉ cần
  // video phát được thật (state playing / chạy quá 2s) là reset về 0; 2 video
  // lỗi liên tiếp thì DỪNG hẳn tự bỏ qua và để màn hình lỗi của YouTube hiện
  // ra — người xem tự bấm bài khác, không còn vòng lặp.
  const consecutiveErrorsRef = useRef(0);
  const autoSkipStoppedRef = useRef(false);
  const lastErrorVideoRef = useRef(null);
  // Video đã phát được thật hay chưa (fix 07/11 ~00:30): YouTube báo state
  // ENDED (0) cho cả video LỖI/không phát được — nên chỉ chặn onError thôi
  // chưa đủ, watchdog và onStateChange ENDED vẫn tự chuyển bài mỗi giây
  // làm giao diện nhảy. Chỉ cho chuyển bài khi video đã từng phát thật
  // (state playing hoặc đã chạy quá 2s); đổi video thì reset lại.
  const playedRef = useRef(false);

  // Bắn onEnded tối đa 1 lần cho mỗi video (tránh watchdog + onStateChange
  // cùng bắn, hoặc poll liên tục bắn khi video đã hết).
  const fireEnded = useCallback(() => {
    const vid = videoIdRef.current;
    if (endedFiredForRef.current === vid) return;
    endedFiredForRef.current = vid;
    if (onEndedRef.current) onEndedRef.current();
  }, []);

  // Lỗi player (mã 100: không tìm thấy video, 101/150: chủ video cấm nhúng
  // trên web khác, 2/5: lỗi player) → tự bỏ qua sang bài tiếp theo thay vì
  // kẹt màn đen ở 0:00. CHỈ bỏ qua tối đa 1 lần trong 1 chuỗi lỗi liên tiếp:
  // video thứ 2 mà cũng lỗi thì DỪNG hẳn (xem consecutiveErrorsRef) để
  // không xoay vòng đổi bài vô hạn làm giao diện nhảy. Lỗi của player cũ
  // (đã bị hủy/tạo lại, báo muộn) thì bỏ qua hẳn.
  const handlePlayerError = useCallback(() => {
    if (loadedVideoIdRef.current && loadedVideoIdRef.current !== videoIdRef.current) return;
    const vid = videoIdRef.current;
    if (lastErrorVideoRef.current === vid) return; // mỗi video chỉ tính 1 lỗi
    lastErrorVideoRef.current = vid;
    consecutiveErrorsRef.current += 1;
    if (consecutiveErrorsRef.current >= 2 || autoSkipStoppedRef.current) {
      autoSkipStoppedRef.current = true;
      return;
    }
    fireEnded();
  }, [fireEnded]);

  // ---- Vòng đời player: tạo 1 lần, tạo LẠI chỉ khi đổi controls ----
  // Đổi controls: YouTube API không cho đổi trực tiếp nên phải hủy player cũ
  // và tạo lại từ đúng giây đang xem (giây này watchdog cập nhật liên tục).
  useEffect(() => {
    let cancelled = false;
    let player = null;
    let upgradeTimer = null;
    const container = containerRef.current;
    if (!container) return undefined;
    container.innerHTML = ''; // dọn mount/iframe cũ (không có node React nào ở đây)
    fallbackIframeRef.current = null;

    const mountEl = document.createElement('div');
    mountEl.style.width = '100%';
    mountEl.style.height = '100%';
    container.appendChild(mountEl);

    // Nút "đang tắt tiếng" trên góc màn hình + bật tiếng ở lần chạm/phím
    // đầu tiên trong phòng (autoplay có tiếng bị chặn nên phải bắt đầu
    // muted — xem mutedRef). Nút tạo bằng tay như mountEl để YT thay node
    // cũng không lệch DOM của React; cleanup ở dưới gỡ nó cùng container.
    // Engine nền (background, vòng 2) KHÔNG có nút này và không bật tiếng
    // ở lần chạm đầu tiên — video ẩn ngoài màn hình thì không được phát
    // tiếng; tiếng chỉ bật khi player màn hình đang hiện.
    let muteBtn = null;
    const doUnmute = () => {
      if (background || !mutedRef.current) return;
      mutedRef.current = false;
      sharedMuted = false;
      try {
        const p = playerRef.current;
        if (p && p.unMute) { p.unMute(); if (p.setVolume) p.setVolume(100); }
      } catch { /* player chưa sẵn — onReady sẽ áp trạng thái mới */ }
      if (muteBtn && muteBtn.isConnected) muteBtn.style.display = 'none';
      if (onMutedChangeRef.current) onMutedChangeRef.current(false);
    };
    const onFirstGesture = () => { doUnmute(); };
    if (!background) {
      muteBtn = document.createElement('button');
      muteBtn.type = 'button';
      muteBtn.textContent = '🔇 Đang tắt tiếng — bấm để bật tiếng';
      muteBtn.style.cssText = 'position:absolute;top:8px;right:8px;z-index:5;background:rgba(0,0,0,.68);color:#fff;border:1px solid rgba(255,255,255,.35);border-radius:999px;padding:6px 12px;font-size:13px;cursor:pointer;';
      muteBtn.addEventListener('click', (e) => { e.stopPropagation(); doUnmute(); });
      container.appendChild(muteBtn);
      const syncMuteBtn = () => { if (muteBtn.isConnected) muteBtn.style.display = mutedRef.current ? 'block' : 'none'; };
      syncMuteBtn();
      // Lần tương tác đầu tiên ở bất cứ đâu trong phòng thì bật tiếng (sau
      // khi người dùng đã chạm/phím thì trình duyệt cho phát có tiếng).
      window.addEventListener('pointerdown', onFirstGesture);
      window.addEventListener('keydown', onFirstGesture);
    }

    const handleReady = (target) => {
      playerRef.current = target;
      if (onPlayerReadyRef.current) onPlayerReadyRef.current(target);
      // Áp trạng thái tiếng + ép phát (autoplay muted vẫn có lúc không tự
      // chạy nếu tab mới mở chưa có tương tác).
      try {
        if (mutedRef.current) target.mute();
        else { target.unMute(); if (target.setVolume) target.setVolume(100); }
        target.playVideo();
      } catch { /* ignore */ }
      // Video đổi trong lúc player chưa sẵn: nạp ngay khi sẵn sàng.
      if (pendingVideoIdRef.current && pendingVideoIdRef.current !== loadedVideoIdRef.current) {
        const vid = pendingVideoIdRef.current;
        pendingVideoIdRef.current = null;
        try { target.loadVideoById(vid, startSecondsRef.current || 0); loadedVideoIdRef.current = vid; } catch { /* ignore */ }
      } else {
        loadedVideoIdRef.current = videoIdRef.current;
      }
    };

    const attach = (YT, startSeconds) => {
      if (cancelled || !mountEl.isConnected) return;
      player = new YT.Player(mountEl, {
        videoId: videoIdRef.current,
        playerVars: { autoplay: 1, mute: mutedRef.current ? 1 : 0, rel: 0, controls: controlsRef.current ? 1 : 0, start: startSeconds || 0 },
        events: {
          onReady: (e) => handleReady(e.target),
          onStateChange: (e) => {
            // Chỉ chuyển bài khi video đã từng phát thật — video lỗi cũng
            // báo ENDED, để lọt là lại nhảy bài mỗi giây (xem playedRef).
            if (e.data === YT.PlayerState.ENDED && playedRef.current) fireEnded();
          },
          onError: () => handlePlayerError(),
        },
      });
    };

    // Fallback khi API chưa tải được: iframe thường nhưng có enablejsapi=1,
    // rồi tự nâng cấp thành player API khi window.YT xuất hiện — lúc đó
    // onStateChange ENDED + watchdog đều hoạt động trở lại.
    const createFallbackIframe = () => {
      if (cancelled) return;
      container.innerHTML = '';
      const iframe = document.createElement('iframe');
      iframe.title = 'Trình phát video';
      iframe.src = `https://www.youtube.com/embed/${videoIdRef.current}?autoplay=1&mute=${mutedRef.current ? 1 : 0}&rel=0&enablejsapi=1&start=${Math.floor(startSecondsRef.current || 0)}`;
      iframe.allow = IFRAME_ALLOW;
      iframe.allowFullscreen = true;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = '0';
      iframe.style.display = 'block';
      container.appendChild(iframe);
      fallbackIframeRef.current = iframe;
      // Vòng 2: container.innerHTML = '' ở trên đã gỡ luôn nút tắt tiếng
      // (tạo trước đó) — gắn lại để ở chế độ dự phòng người xem vẫn bật
      // được tiếng; engine nền không có nút này (muteBtn null) nên không sao.
      if (muteBtn) {
        container.appendChild(muteBtn);
        muteBtn.style.display = mutedRef.current ? 'block' : 'none';
      }
      // Chống tích tụ thẻ <script> khi YouTube bị chặn: mỗi lần
      // loadYouTubeApi() reject là 1 chu kỳ nạp đã thử đủ 3 lượt trong nội
      // bộ (mỗi lượt append 1 thẻ <script> iframe_api vào <head>). Interval
      // cũ gọi lại mãi mỗi 2s nên thẻ script tích tụ không giới hạn trong
      // môi trường chặn YouTube. Sau 3 chu kỳ lỗi liên tiếp thì dừng hẳn
      // interval và giữ iframe thường. Trên máy thật API tải được thì nhánh
      // window.YT ở trên đã nâng cấp từ lâu, không chạm tới giới hạn này.
      // (Các lượt gọi trong lúc 1 chu kỳ còn đang chờ trả về cùng 1 promise
      // nên chỉ tính 1 lần — lastFailedPromise để phân biệt các chu kỳ.)
      let upgradeFailures = 0;
      let lastFailedPromise = null;
      upgradeTimer = setInterval(() => {
        if (cancelled) return;
        if (window.YT && window.YT.Player && fallbackIframeRef.current) {
          clearInterval(upgradeTimer);
          upgradeTimer = null;
          try {
            player = new YT.Player(fallbackIframeRef.current, {
              events: {
                onReady: (e) => handleReady(e.target),
                onStateChange: (e) => {
                  if (e.data === window.YT.PlayerState.ENDED && playedRef.current) fireEnded();
                },
                onError: () => handlePlayerError(),
              },
            });
          } catch { /* giữ iframe thường, watchdog không áp dụng được */ }
          return;
        }
        // API vẫn chưa có: thử nạp lại (loadYouTubeApi tự retry tối đa 3 lượt).
        const p = loadYouTubeApi();
        p.catch(() => {
          if (cancelled) return;
          if (p === lastFailedPromise) return; // cùng 1 chu kỳ: chỉ tính 1 lần
          lastFailedPromise = p;
          upgradeFailures += 1;
          if (upgradeFailures >= 3 && upgradeTimer) {
            clearInterval(upgradeTimer);
            upgradeTimer = null;
          }
        });
      }, 2000);
    };

    loadYouTubeApi()
      .then((YT) => { if (!cancelled) attach(YT, startSecondsRef.current || lastTimeRef.current || 0); })
      .catch(() => { if (!cancelled) createFallbackIframe(); });

    return () => {
      cancelled = true;
      window.removeEventListener('pointerdown', onFirstGesture);
      window.removeEventListener('keydown', onFirstGesture);
      if (upgradeTimer) clearInterval(upgradeTimer);
      try { if (player) player.destroy(); } catch { /* ignore */ }
      playerRef.current = null;
      if (container) container.innerHTML = '';
      fallbackIframeRef.current = null;
    };
    // Chỉ tạo lại player khi đổi controls; đổi video xử lý riêng ở dưới.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controls]);

  // ---- Đổi video: nạp vào player đang có, KHÔNG tạo lại player ----
  // (Round 1 dùng key={current.nonce} nên mỗi lần đổi bài là hủy + tạo lại
  // toàn bộ player — đó là 1 trong các đường làm mất handler ENDED.)
  useEffect(() => {
    if (videoIdRef.current === videoId) return;
    videoIdRef.current = videoId;
    endedFiredForRef.current = null; // video mới: cho phép bắn ENDED lại
    lastErrorVideoRef.current = null; // video mới: tính lỗi lại từ đầu
    playedRef.current = false; // video mới: chưa phát được, chưa cho chuyển bài
    lastTimeRef.current = 0;
    const p = playerRef.current;
    if (p && p.loadVideoById) {
      try { p.loadVideoById(videoId); loadedVideoIdRef.current = videoId; }
      catch {
        // Nạp lỗi mà nuốt luôn thì iframe kẹt ở video cũ trong khi UI đã
        // hiện bài mới (lệch bài/iframe vài giây trở lên — fix 07/11 ~00:30).
        // Ghi pending để onReady lần sau nạp lại, và thử lại 1 lần sau 1s.
        pendingVideoIdRef.current = videoId;
        setTimeout(() => {
          const pp = playerRef.current;
          if (pp && pp.loadVideoById && pendingVideoIdRef.current === videoIdRef.current) {
            try { pp.loadVideoById(videoIdRef.current); loadedVideoIdRef.current = videoIdRef.current; pendingVideoIdRef.current = null; } catch { /* vẫn pending, player tạo lại sẽ nạp */ }
          }
        }, 1000);
      }
      return;
    }
    if (fallbackIframeRef.current) {
      // Đang ở fallback iframe thường: đổi src tại chỗ (giữ enablejsapi=1
      // để sau này vẫn nâng cấp được thành player API).
      try {
        fallbackIframeRef.current.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${mutedRef.current ? 1 : 0}&rel=0&enablejsapi=1`;
      } catch { /* ignore */ }
      return;
    }
    pendingVideoIdRef.current = videoId; // player chưa sẵn, onReady sẽ nạp
  }, [videoId]);

  // ---- Watchdog: dự phòng khi onStateChange bị lỡ ----
  // Poll mỗi giây: state ENDED (0) hoặc đã chạy tới cuối video
  // (currentTime >= duration - 0.75s) thì chuyển bài. Đọc qua try/catch vì
  // getPlayerState/getDuration ném lỗi khi player chưa sẵn sàng.
  // Đồng thời đây là bằng chứng "video phát được thật": đang phát (state 1)
  // hoặc đã chạy quá 2s thì reset bộ đếm lỗi liên tiếp về 0 — chuỗi lỗi
  // chỉ tính khi video chưa từng phát được, để vòng lặp tự bỏ qua không
  // bao giờ chạy khi video phát bình thường. Nhánh state===0 CHỈ chuyển bài
  // khi video đã từng phát thật: video lỗi cũng báo ENDED, không chặn là
  // watchdog tự chuyển bài mỗi giây làm giao diện nhảy (xem playedRef).
  useEffect(() => {
    const t = setInterval(() => {
      const p = playerRef.current;
      if (!p) return;
      try {
        const state = p.getPlayerState ? p.getPlayerState() : -1;
        const dur = p.getDuration ? p.getDuration() : 0;
        const cur = p.getCurrentTime ? p.getCurrentTime() : 0;
        if (dur > 0) lastTimeRef.current = Math.floor(cur);
        if (state === 1 || (dur > 0 && cur > 2)) {
          playedRef.current = true;
          consecutiveErrorsRef.current = 0;
          autoSkipStoppedRef.current = false;
        }
        if (state === 0) { if (playedRef.current) fireEnded(); return; }
        if (dur > 0 && cur >= dur - 0.75) fireEnded();
      } catch { /* player chưa sẵn */ }
    }, 1000);
    return () => clearInterval(t);
  }, [fireEnded]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }} />;
}
