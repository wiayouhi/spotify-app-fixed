import { useEffect, useState, useMemo } from "react";
import { fetchLyrics } from "../utils/lyricsApi";

// Fetches synced lyrics for the given track from LRCLIB and figures out
// which line should be highlighted based on current playback position.
export function useLyrics(track, progressMs) {
  const [lyricsData, setLyricsData] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | found | not_found | error

  useEffect(() => {
    if (!track) {
      setLyricsData(null);
      setStatus("idle");
      return;
    }

    let cancelled = false;
    setStatus("loading");
    setLyricsData(null);

    fetchLyrics({
      id: track.id,
      track: track.name,
      artist: track.artists,
      album: track.album,
      durationMs: track.durationMs,
    }).then((result) => {
      if (cancelled) return;

      if (result.error) {
        setStatus("error");
        return;
      }
      if (!result.found || (!result.synced && !result.plain)) {
        setStatus("not_found");
        return;
      }

      setLyricsData(result);
      setStatus("found");
    });

    return () => {
      cancelled = true;
    };
  }, [track?.id]);

  const currentLineIndex = useMemo(() => {
    if (!lyricsData?.synced) return -1;
    const seconds = progressMs / 1000;

    let idx = -1;
    for (let i = 0; i < lyricsData.synced.length; i++) {
      if (lyricsData.synced[i].time <= seconds) {
        idx = i;
      } else {
        break;
      }
    }
    return idx;
  }, [lyricsData, progressMs]);

  return {
    status,
    synced: lyricsData?.synced || null,
    plain: lyricsData?.plain || null,
    isInstrumental: lyricsData?.isInstrumental || false,
    currentLineIndex,
  };
}
