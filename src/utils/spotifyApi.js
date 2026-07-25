import { getValidAccessToken } from "./spotifyAuth";

// Polls Spotify's "currently playing" endpoint.
// Returns null if nothing is playing, or a normalized track object.
export async function fetchCurrentlyPlaying() {
  const token = await getValidAccessToken();
  if (!token) return { error: "NO_TOKEN" };

  const res = await fetch(
    "https://api.spotify.com/v1/me/player/currently-playing?additional_types=track",
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (res.status === 204) {
    return { isPlaying: false, track: null };
  }

  if (res.status === 401) {
    return { error: "UNAUTHORIZED" };
  }

  if (!res.ok) {
    return { error: "REQUEST_FAILED" };
  }

  const data = await res.json();

  if (!data || !data.item) {
    return { isPlaying: false, track: null };
  }

  return {
    isPlaying: data.is_playing,
    progressMs: data.progress_ms,
    fetchedAt: Date.now(),
    track: {
      id: data.item.id,
      name: data.item.name,
      artists: data.item.artists.map((a) => a.name).join(", "),
      album: data.item.album.name,
      durationMs: data.item.duration_ms,
      albumArt:
        data.item.album.images?.[0]?.url ||
        data.item.album.images?.[1]?.url ||
        null,
    },
  };
}

// Playback Controls
// deviceId ตัวเลือก: ถ้าใส่มา จะสั่งอุปกรณ์นั้นตรงๆ (เช่น web player)
// ถ้าไม่ใส่ Spotify จะสั่งอุปกรณ์ที่ active อยู่ตามปกติ (พฤติกรรมเดิม)
export async function togglePlayPause(isPlaying, deviceId) {
  const token = await getValidAccessToken();
  if (!token) return;
  const endpoint = isPlaying ? "pause" : "play";
  const qs = deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : "";
  await fetch(`https://api.spotify.com/v1/me/player/${endpoint}${qs}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function skipToNext(deviceId) {
  const token = await getValidAccessToken();
  if (!token) return;
  const qs = deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : "";
  await fetch(`https://api.spotify.com/v1/me/player/next${qs}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function skipToPrevious(deviceId) {
  const token = await getValidAccessToken();
  if (!token) return;
  const qs = deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : "";
  await fetch(`https://api.spotify.com/v1/me/player/previous${qs}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function fetchQueue() {
  const token = await getValidAccessToken();
  if (!token) return [];
  const res = await fetch("https://api.spotify.com/v1/me/player/queue", {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.queue || []).slice(0, 5).map(item => ({
    id: item.id,
    name: item.name,
    artists: item.artists.map(a => a.name).join(", "),
    albumArt: item.album.images?.[2]?.url || item.album.images?.[1]?.url || null
  }));
}

export async function seekToPosition(positionMs, deviceId) {
  const token = await getValidAccessToken();
  if (!token) return;
  const qs = new URLSearchParams({ position_ms: String(Math.round(positionMs)) });
  if (deviceId) qs.set("device_id", deviceId);
  await fetch(`https://api.spotify.com/v1/me/player/seek?${qs.toString()}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` }
  });
}

// ─── Volume ───────────────────────────────────────────────
// ปรับเสียงของอุปกรณ์ที่กำหนด (หรืออุปกรณ์ที่ active อยู่ ถ้าไม่ระบุ deviceId)
export async function setPlaybackVolume(volumePercent, deviceId) {
  const token = await getValidAccessToken();
  if (!token) return false;
  const qs = new URLSearchParams({ volume_percent: String(Math.round(volumePercent)) });
  if (deviceId) qs.set("device_id", deviceId);
  const res = await fetch(`https://api.spotify.com/v1/me/player/volume?${qs.toString()}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.ok;
}

// ดึงสถานะการเล่นเต็มรูปแบบ รวมข้อมูลอุปกรณ์ปัจจุบัน (ชื่อ, volume_percent, active)
// ใช้ endpoint /me/player แทน /me/player/currently-playing เพราะตัวหลังไม่มีข้อมูล device
export async function fetchPlaybackState() {
  const token = await getValidAccessToken();
  if (!token) return null;
  const res = await fetch("https://api.spotify.com/v1/me/player", {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (res.status === 204) return { device: null, isPlaying: false };
  if (!res.ok) return null;
  const data = await res.json();
  return {
    device: data.device
      ? {
          id: data.device.id,
          name: data.device.name,
          type: data.device.type,
          isActive: data.device.is_active,
          volumePercent: data.device.volume_percent,
        }
      : null,
    isPlaying: Boolean(data.is_playing),
  };
}

// ─── Search actions: เล่นทันที / เพิ่มเข้าคิว ────────────────
export async function playTrackNow(uri, deviceId) {
  const token = await getValidAccessToken();
  if (!token) return false;
  const qs = deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : "";
  const res = await fetch(`https://api.spotify.com/v1/me/player/play${qs}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uris: [uri] }),
  });
  return res.ok;
}

export async function addTrackToQueue(uri, deviceId) {
  const token = await getValidAccessToken();
  if (!token) return false;
  const qs = new URLSearchParams({ uri });
  if (deviceId) qs.set("device_id", deviceId);
  const res = await fetch(`https://api.spotify.com/v1/me/player/queue?${qs.toString()}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.ok;
}
