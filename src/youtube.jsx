// Trình phát YouTube dùng YouTube IFrame Player API — không đoán thời gian bằng timer.
// - onStateChange ENDED (YT.PlayerState.ENDED) -> gọi onEnded() để chuyển bài tiếp theo.
// - onPlayerReady trả ra player để RoomView lấy thời gian hiện tại khi cần.
// - Nút "Hiện/Ẩn điều khiển trình phát" đổi playerVars controls: API không cho đổi
//   controls trực tiếp nên component sẽ hủy player cũ và tạo lại từ đúng giây đang xem.
// - Nếu API của YouTube không tải được (mạng chặn), fallback sang iframe nhúng thường.
import { useEffect, useRef, useState } from 'react';

let apiPromise = null;
function loadYouTubeApi() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    tag.onerror = () => reject(new Error('YouTube API load failed'));
    document.head.appendChild(tag);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prev) prev();
      resolve(window.YT);
    };
    // Hết 8s vẫn chưa có API thì coi như tải thất bại, dùng fallback iframe.
    setTimeout(() => {
      if (!window.YT || !window.YT.Player) reject(new Error('YouTube API timeout'));
    }, 8000);
  });
  return apiPromise;
}

export default function YouTubePlayer({ videoId, onEnded, onPlayerReady, controls = true }) {
  const mountRef = useRef(null);
  const playerRef = useRef(null);
  const onEndedRef = useRef(onEnded);
  const onPlayerReadyRef = useRef(onPlayerReady);
  const [apiFailed, setApiFailed] = useState(false);
  const videoIdRef = useRef(videoId);
  const controlsRef = useRef(controls);
  const pendingStartRef = useRef(0);

  useEffect(() => { onEndedRef.current = onEnded; }, [onEnded]);
  useEffect(() => { onPlayerReadyRef.current = onPlayerReady; }, [onPlayerReady]);

  // Tạo player. Khi đổi controls: ghi lại giây đang xem, hủy player cũ, tạo lại từ giây đó.
  useEffect(() => {
    let cancelled = false;
    let player = null;

    const create = (YT, startSeconds) => {
      if (cancelled || !mountRef.current) return;
      player = new YT.Player(mountRef.current, {
        videoId,
        playerVars: { autoplay: 1, rel: 0, controls: controlsRef.current ? 1 : 0, start: startSeconds || 0 },
        events: {
          onReady: (e) => {
            playerRef.current = e.target;
            if (onPlayerReadyRef.current) onPlayerReadyRef.current(e.target);
          },
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.ENDED) {
              if (onEndedRef.current) onEndedRef.current();
            }
          },
        },
      });
    };

    loadYouTubeApi()
      .then((YT) => { if (!cancelled) create(YT, pendingStartRef.current); })
      .catch(() => { if (!cancelled) setApiFailed(true); });

    return () => {
      cancelled = true;
      try { if (player) player.destroy(); } catch { /* ignore */ }
      if (playerRef.current) { try { playerRef.current.destroy(); } catch { /* ignore */ } }
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Đổi video: nạp video mới vào player đang có (không tạo lại player).
  useEffect(() => {
    if (videoIdRef.current === videoId) return;
    videoIdRef.current = videoId;
    pendingStartRef.current = 0;
    const p = playerRef.current;
    if (p && p.loadVideoById) {
      try { p.loadVideoById(videoId); } catch { /* ignore */ }
    }
  }, [videoId]);

  // Đổi controls: giữ nguyên giây đang xem rồi tạo lại player.
  useEffect(() => {
    if (controlsRef.current === controls) return;
    controlsRef.current = controls;
    const p = playerRef.current;
    if (!p) return;
    let t = 0;
    try { t = Math.floor(p.getCurrentTime() || 0); } catch { /* ignore */ }
    pendingStartRef.current = t;
    // Hủy player cũ; effect tạo player chạy lại nhờ key đổi (xem dưới).
    try { p.destroy(); } catch { /* ignore */ }
    playerRef.current = null;
    setRecreateKey((k) => k + 1);
  }, [controls]);

  const [recreateKey, setRecreateKey] = useState(0);

  // Tạo lại player sau khi hủy vì đổi controls.
  useEffect(() => {
    if (recreateKey === 0 || apiFailed) return undefined;
    let cancelled = false;
    let player = null;
    loadYouTubeApi().then((YT) => {
      if (cancelled || !mountRef.current) return;
      player = new YT.Player(mountRef.current, {
        videoId: videoIdRef.current,
        playerVars: { autoplay: 1, rel: 0, controls: controlsRef.current ? 1 : 0, start: pendingStartRef.current || 0 },
        events: {
          onReady: (e) => {
            playerRef.current = e.target;
            if (onPlayerReadyRef.current) onPlayerReadyRef.current(e.target);
          },
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.ENDED && onEndedRef.current) onEndedRef.current();
          },
        },
      });
    }).catch(() => setApiFailed(true));
    return () => {
      cancelled = true;
      try { if (player) player.destroy(); } catch { /* ignore */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recreateKey]);

  if (apiFailed) {
    return (
      <iframe title="Trình phát video" key={videoId}
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen />
    );
  }

  return <div key={recreateKey} ref={mountRef} style={{ width: '100%', height: '100%' }} />;
}
