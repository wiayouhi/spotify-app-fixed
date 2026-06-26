import { getValidAccessToken } from "./spotifyAuth";

export async function fetchCurrentlyPlaying() {
  const token = await getValidAccessToken();
  if (!token) return { error: "NO_TOKEN" };

  const res = await fetch(
    "https://api.spotify.com/v1/me/player/currently-playing?additional_types=track",
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (res.status === 204) return { isPlaying: false, track: null };
  if (res.status === 401) return { error: "UNAUTHORIZED" };
  if (!res.ok)            return { error: "REQUEST_FAILED" };

  const data = await res.json();
  if (!data || !data.item) return { isPlaying: false, track: null };

  return {
    isPlaying:  data.is_playing,
    progressMs: data.progress_ms,
    fetchedAt:  Date.now(),
    track: {
      id:         data.item.id,
      name:       data.item.name,
      artists:    data.item.artists.map((a) => a.name).join(", "),
      album:      data.item.album.name,
      durationMs: data.item.duration_ms,
      albumArt:   data.item.album.images?.[0]?.url || data.item.album.images?.[1]?.url || null,
    },
  };
}

// ─── Playback controls ───────────────────────────────────────────────────────
// ถ้า WebPlayer SDK active → ใช้ SDK โดยตรง (หลีกเลี่ยง 403 device mismatch)
// ถ้าไม่มี SDK → fallback ไปใช้ REST API ตามปกติ

export async function togglePlayPause(isPlaying) {
  // ลองใช้ SDK ก่อน
  if (window.__spotifyPlayer) {
    try {
      if (isPlaying) {
        await window.__spotifyPlayer.pause();
      } else {
        await window.__spotifyPlayer.resume();
      }
      return;
    } catch (e) {
      console.warn("SDK toggle failed, fallback to REST:", e);
    }
  }
  // fallback: REST API
  const token = await getValidAccessToken();
  if (!token) return;
  const endpoint = isPlaying ? "pause" : "play";
  await fetch(`https://api.spotify.com/v1/me/player/${endpoint}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function skipToNext() {
  if (window.__spotifyPlayer) {
    try { await window.__spotifyPlayer.nextTrack(); return; } catch {}
  }
  const token = await getValidAccessToken();
  if (!token) return;
  await fetch("https://api.spotify.com/v1/me/player/next", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function skipToPrevious() {
  if (window.__spotifyPlayer) {
    try { await window.__spotifyPlayer.previousTrack(); return; } catch {}
  }
  const token = await getValidAccessToken();
  if (!token) return;
  await fetch("https://api.spotify.com/v1/me/player/previous", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function seekToPosition(positionMs) {
  if (window.__spotifyPlayer) {
    try { await window.__spotifyPlayer.seek(Math.round(positionMs)); return; } catch {}
  }
  const token = await getValidAccessToken();
  if (!token) return;
  await fetch(
    `https://api.spotify.com/v1/me/player/seek?position_ms=${Math.round(positionMs)}`,
    { method: "PUT", headers: { Authorization: `Bearer ${token}` } }
  );
}

export async function fetchQueue() {
  const token = await getValidAccessToken();
  if (!token) return [];
  const res = await fetch("https://api.spotify.com/v1/me/player/queue", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.queue || []).slice(0, 5).map((item) => ({
    id:       item.id,
    name:     item.name,
    artists:  item.artists.map((a) => a.name).join(", "),
    albumArt: item.album.images?.[2]?.url || item.album.images?.[1]?.url || null,
  }));
}
