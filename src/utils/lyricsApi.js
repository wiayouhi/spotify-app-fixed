// LRCLIB is a free, open lyrics database with synced (timestamped) lyrics.
// No API key required. https://lrclib.net
// IMPORTANT: We never store or hardcode lyrics in this codebase — everything
// is fetched live at runtime directly from LRCLIB based on whatever track
// Spotify reports is currently playing.

import { getValidAccessToken } from "./spotifyAuth";

const BASE_URL = "https://lrclib.net/api";

// Parses standard .lrc format lines like "[01:23.45]Some lyric line"
// into an array of { time: seconds, text: string }.
function parseSyncedLyrics(syncedLyrics) {
  if (!syncedLyrics) return [];

  const lines = syncedLyrics.split("\n");
  const result = [];

  const timeTag = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g;

  for (const line of lines) {
    const matches = [...line.matchAll(timeTag)];
    if (matches.length === 0) continue;

    const text = line.replace(timeTag, "").trim();

    for (const match of matches) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const fraction = match[3] ? parseInt(match[3].padEnd(3, "0"), 10) : 0;
      const time = minutes * 60 + seconds + fraction / 1000;
      result.push({ time, text });
    }
  }

  return result.sort((a, b) => a.time - b.time);
}

async function fetchSpotifyLyrics(trackId) {
  if (!trackId) return { found: false };
  const token = await getValidAccessToken();
  if (!token) return { found: false };

  try {
    const res = await fetch(`/api/spotify-lyrics/color-lyrics/v2/track/${trackId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "App-Platform": "WebPlayer",
      },
    });

    if (!res.ok) return { found: false };

    const data = await res.json();
    if (!data || !data.lyrics) return { found: false };

    const isInstrumental = data.lyrics.syncType === "UNSYNCED" && data.lyrics.lines.length === 0;
    
    // Convert Spotify format to our format
    const synced = [];
    let plain = "";

    if (data.lyrics.syncType === "LINE_SYNCED" || data.lyrics.syncType === "SYLLABLE_SYNCED") {
      for (const line of data.lyrics.lines) {
        if (line.startTimeMs) {
          synced.push({
            time: parseInt(line.startTimeMs, 10) / 1000,
            text: line.words || ""
          });
        }
        plain += (line.words || "") + "\n";
      }
    } else {
      for (const line of data.lyrics.lines) {
        plain += (line.words || "") + "\n";
      }
    }

    return {
      found: true,
      isInstrumental,
      synced: synced.length > 0 ? synced : null,
      plain: plain.trim() || null,
    };
  } catch {
    return { found: false };
  }
}

export async function fetchLyrics({ track, artist, album, durationMs, id }) {
  // Try Spotify internal API first
  const spotifyLyrics = await fetchSpotifyLyrics(id);
  if (spotifyLyrics.found) {
    return spotifyLyrics;
  }

  // Fallback to LRCLIB
  const params = new URLSearchParams({
    track_name: track,
    artist_name: artist,
  });
  if (album) params.set("album_name", album);
  if (durationMs) params.set("duration", String(Math.round(durationMs / 1000)));

  try {
    const res = await fetch(`${BASE_URL}/get?${params.toString()}`);

    if (res.status === 404) {
      // Fall back to search endpoint, which is more lenient with matching.
      return await searchLyrics({ track, artist });
    }

    if (!res.ok) return { found: false };

    const data = await res.json();
    return normalizeLrclibResponse(data);
  } catch {
    return { found: false, error: true };
  }
}

async function searchLyrics({ track, artist }) {
  const params = new URLSearchParams({
    track_name: track,
    artist_name: artist,
  });

  try {
    const res = await fetch(`${BASE_URL}/search?${params.toString()}`);
    if (!res.ok) return { found: false };

    const results = await res.json();
    if (!Array.isArray(results) || results.length === 0) {
      return { found: false };
    }

    // Prefer a result that actually has synced lyrics.
    const best =
      results.find((r) => r.syncedLyrics) || results.find((r) => r.plainLyrics) || results[0];

    return normalizeLrclibResponse(best);
  } catch {
    return { found: false, error: true };
  }
}

function normalizeLrclibResponse(data) {
  if (!data) return { found: false };

  const synced = parseSyncedLyrics(data.syncedLyrics);

  return {
    found: true,
    isInstrumental: Boolean(data.instrumental),
    synced: synced.length > 0 ? synced : null,
    plain: data.plainLyrics || null,
  };
}
