import { useEffect, useRef, useState, useCallback } from "react";
import { fetchCurrentlyPlaying } from "../utils/spotifyApi";

// Adaptive polling: เร็วขึ้นเมื่อเพลงเล่น ช้าลงเมื่อหยุด/tab ซ่อน
const POLL_PLAYING = 2000;
const POLL_PAUSED  = 5000;
const POLL_HIDDEN  = 15000;

export function useSpotifyNowPlaying() {
  const [track, setTrack]       = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progressMs, setProgressMs] = useState(0);
  const [authError, setAuthError]   = useState(false);
  const [loading, setLoading]       = useState(true);

  const lastFetch  = useRef({ progressMs: 0, fetchedAt: 0 });
  const rafRef     = useRef(null);
  const timerRef   = useRef(null);
  const isPlayingRef = useRef(false);

  // sync ref กับ state เพื่อใช้ใน closure
  isPlayingRef.current = isPlaying;

  const poll = useCallback(async () => {
    const result = await fetchCurrentlyPlaying();

    if (result.error === "NO_TOKEN" || result.error === "UNAUTHORIZED") {
      setAuthError(true);
      setLoading(false);
      return;
    }
    if (result.error) { setLoading(false); return; }

    setLoading(false);
    setIsPlaying(Boolean(result.isPlaying));

    if (!result.track) {
      setTrack(null);
      return;
    }

    lastFetch.current = {
      progressMs: result.progressMs || 0,
      fetchedAt:  result.fetchedAt,
    };
    setProgressMs(result.progressMs || 0);

    setTrack((prev) => {
      if (prev?.id === result.track.id) return prev;
      return result.track;
    });
  }, []);

  // Adaptive polling scheduler
  const scheduleNextPoll = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const hidden  = document.visibilityState === "hidden";
    const delay   = hidden ? POLL_HIDDEN : isPlayingRef.current ? POLL_PLAYING : POLL_PAUSED;
    timerRef.current = setTimeout(async () => {
      await poll();
      scheduleNextPoll();
    }, delay);
  }, [poll]);

  useEffect(() => {
    poll().then(scheduleNextPoll);

    // เร่ง poll ทันทีเมื่อ tab กลับมา
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        poll().then(scheduleNextPoll);
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearTimeout(timerRef.current);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [poll, scheduleNextPoll]);

  // Smooth progress interpolation ด้วย RAF — หยุดเมื่อ pause/hidden
  useEffect(() => {
    let animId;
    function tick() {
      if (isPlaying && document.visibilityState === "visible") {
        const elapsed = Date.now() - lastFetch.current.fetchedAt;
        setProgressMs(lastFetch.current.progressMs + elapsed);
      }
      animId = requestAnimationFrame(tick);
    }
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  return { track, isPlaying, progressMs, authError, loading };
}
