import { useEffect, useRef, useState, useCallback } from "react";
import { fetchCurrentlyPlaying } from "../utils/spotifyApi";

const POLL_INTERVAL_MS = 2000;

// Polls Spotify for the currently playing track and exposes a smoothly
// interpolated "live" progress value (updated via requestAnimationFrame)
// so the UI doesn't feel stuck between 2s polls.
export function useSpotifyNowPlaying() {
  const [track, setTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progressMs, setProgressMs] = useState(0);
  const [authError, setAuthError] = useState(false);
  const [loading, setLoading] = useState(true);

  const lastFetch = useRef({ progressMs: 0, fetchedAt: 0 });
  const rafRef = useRef(null);
  const trackIdRef = useRef(null);

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
      if (prev?.id === result.track.id) {
        return prev; // keep same reference to avoid re-triggering effects downstream
      }
      trackIdRef.current = result.track.id;
      return result.track;
    });
  }, []);

  useEffect(() => {
    poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [poll]);

  // Smoothly interpolate progress between polls for fluid lyric animation.
  useEffect(() => {
    function tick() {
      if (isPlaying) {
        const elapsed = Date.now() - lastFetch.current.fetchedAt;
        setProgressMs(lastFetch.current.progressMs + elapsed);
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying]);

  return { track, isPlaying, progressMs, authError, loading };
}
