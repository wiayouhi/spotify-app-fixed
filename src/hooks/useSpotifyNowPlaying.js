import { useEffect, useRef, useState, useCallback } from "react";
import { fetchCurrentlyPlaying } from "../utils/spotifyApi";

const POLL_INTERVAL_MS = 3000;          // poll ทุก 3 วิ (ลดจาก 2 วิ)
const POLL_INTERVAL_BACKGROUND_MS = 10000; // tab ซ่อน — ลด poll เหลือ 10 วิ

export function useSpotifyNowPlaying() {
  const [track, setTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progressMs, setProgressMs] = useState(0);
  const [authError, setAuthError] = useState(false);
  const [loading, setLoading] = useState(true);

  const lastFetch = useRef({ progressMs: 0, fetchedAt: 0 });
  const rafRef = useRef(null);
  const trackIdRef = useRef(null);
  const intervalRef = useRef(null);
  const isPlayingRef = useRef(false); // sync ref for RAF

  // Keep ref in sync with state
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  const poll = useCallback(async () => {
    const result = await fetchCurrentlyPlaying();

    if (result.error === "NO_TOKEN" || result.error === "UNAUTHORIZED") {
      setAuthError(true);
      setLoading(false);
      return;
    }

    if (result.error) {
      setLoading(false);
      return;
    }

    setLoading(false);
    setIsPlaying(Boolean(result.isPlaying));

    if (!result.track) {
      setTrack(null);
      trackIdRef.current = null;
      return;
    }

    lastFetch.current = {
      progressMs: result.progressMs || 0,
      fetchedAt: result.fetchedAt,
    };
    setProgressMs(result.progressMs || 0);

    setTrack((prev) => {
      if (prev?.id === result.track.id) return prev;
      trackIdRef.current = result.track.id;
      return result.track;
    });
  }, []);

  // ──────────────────────────────────────────────────────
  // Smart polling: ช้าลงเมื่อ tab ถูกซ่อน / เร็วขึ้นเมื่อกลับมา
  // ──────────────────────────────────────────────────────
  const startPolling = useCallback((interval) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(poll, interval);
  }, [poll]);

  useEffect(() => {
    poll();
    startPolling(POLL_INTERVAL_MS);

    const handleVisibility = () => {
      if (document.hidden) {
        startPolling(POLL_INTERVAL_BACKGROUND_MS);
      } else {
        poll(); // poll ทันทีเมื่อ tab กลับมา
        startPolling(POLL_INTERVAL_MS);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [poll, startPolling]);

  // Smooth progress interpolation via RAF
  useEffect(() => {
    function tick() {
      if (isPlayingRef.current) {
        const elapsed = Date.now() - lastFetch.current.fetchedAt;
        setProgressMs(lastFetch.current.progressMs + elapsed);
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { track, isPlaying, progressMs, authError, loading };
}
