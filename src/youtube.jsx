// Trình phát YouTube — YouTube IFrame Player API + watchdog dự phòng.
//
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

export default function YouTubePlayer({ videoId, onEnded, onPlayerReady, controls = true }) {
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
  const loadedVideoIdRef = useRef(null);
  const pendingVideoIdRef = useRef(null);
  const endedFiredForRef = useRef(null);
  const lastTimeRef = useRef(0);

  useEffect(() => { onEndedRef.current = onEnded; }, [onEnded]);
  useEffect(() => { onPlayerReadyRef.current = onPlayerReady; }, [onPlayerReady]);

  // Bắn onEnded tối đa 1 lần cho mỗi video (tránh watchdog + onStateChange
  // cùng bắn, hoặc poll liên tục bắn khi video đã hết).
  const fireEnded = useCallback(() => {
    const vid = videoIdRef.current;
    if (endedFiredForRef.current === vid) return;
    endedFiredForRef.current = vid;
    if (onEndedRef.current) onEndedRef.current();
  }, []);

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

    const handleReady = (target) => {
      playerRef.current = target;
      if (onPlayerReadyRef.current) onPlayerReadyRef.current(target);
      // Video đổi trong lúc player chưa sẵn: nạp ngay khi sẵn sàng.
      if (pendingVideoIdRef.current && pendingVideoIdRef.current !== loadedVideoIdRef.current) {
        const vid = pendingVideoIdRef.current;
        pendingVideoIdRef.current = null;
        try { target.loadVideoById(vid); loadedVideoIdRef.current = vid; } catch { /* ignore */ }
      } else {
        loadedVideoIdRef.current = videoIdRef.current;
      }
    };

    const attach = (YT, startSeconds) => {
      if (cancelled || !mountEl.isConnected) return;
      player = new YT.Player(mountEl, {
        videoId: videoIdRef.current,
        playerVars: { autoplay: 1, rel: 0, controls: controlsRef.current ? 1 : 0, start: startSeconds || 0 },
        events: {
          onReady: (e) => handleReady(e.target),
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.ENDED) fireEnded();
          },
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
      iframe.src = `https://www.youtube.com/embed/${videoIdRef.current}?autoplay=1&rel=0&enablejsapi=1`;
      iframe.allow = IFRAME_ALLOW;
      iframe.allowFullscreen = true;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = '0';
      iframe.style.display = 'block';
      container.appendChild(iframe);
      fallbackIframeRef.current = iframe;
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
                  if (e.data === window.YT.PlayerState.ENDED) fireEnded();
                },
              },
            });
          } catch { /* giữ iframe thường, watchdog không áp dụng được */ }
          return;
        }
        // API vẫn chưa có: thử nạp lại (loadYouTubeApi tự retry tối đa 3 lượt).
        loadYouTubeApi().catch(() => { /* vẫn chưa được, đợi lượt sau */ });
      }, 2000);
    };

    loadYouTubeApi()
      .then((YT) => { if (!cancelled) attach(YT, lastTimeRef.current || 0); })
      .catch(() => { if (!cancelled) createFallbackIframe(); });

    return () => {
      cancelled = true;
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
    lastTimeRef.current = 0;
    const p = playerRef.current;
    if (p && p.loadVideoById) {
      try { p.loadVideoById(videoId); loadedVideoIdRef.current = videoId; } catch { /* ignore */ }
      return;
    }
    if (fallbackIframeRef.current) {
      // Đang ở fallback iframe thường: đổi src tại chỗ (giữ enablejsapi=1
      // để sau này vẫn nâng cấp được thành player API).
      try {
        fallbackIframeRef.current.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&enablejsapi=1`;
      } catch { /* ignore */ }
      return;
    }
    pendingVideoIdRef.current = videoId; // player chưa sẵn, onReady sẽ nạp
  }, [videoId]);

  // ---- Watchdog: dự phòng khi onStateChange bị lỡ ----
  // Poll mỗi giây: state ENDED (0) hoặc đã chạy tới cuối video
  // (currentTime >= duration - 0.75s) thì chuyển bài. Đọc qua try/catch vì
  // getPlayerState/getDuration ném lỗi khi player chưa sẵn sàng.
  useEffect(() => {
    const t = setInterval(() => {
      const p = playerRef.current;
      if (!p) return;
      try {
        if (p.getPlayerState && p.getPlayerState() === 0) { fireEnded(); return; }
        const dur = p.getDuration ? p.getDuration() : 0;
        const cur = p.getCurrentTime ? p.getCurrentTime() : 0;
        if (dur > 0) lastTimeRef.current = Math.floor(cur);
        if (dur > 0 && cur >= dur - 0.75) fireEnded();
      } catch { /* player chưa sẵn */ }
    }, 1000);
    return () => clearInterval(t);
  }, [fireEnded]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
