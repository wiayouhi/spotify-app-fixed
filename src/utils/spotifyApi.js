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
export async function togglePlayPause(isPlaying) {
  const token = await getValidAccessToken();
  if (!token) return;
  const endpoint = isPlaying ? "pause" : "play";
  await fetch(`https://api.spotify.com/v1/me/player/${endpoint}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function skipToNext() {
  const token = await getValidAccessToken();
  if (!token) return;
  await fetch("https://api.spotify.com/v1/me/player/next", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function skipToPrevious() {
  const token = await getValidAccessToken();
  if (!token) return;
  await fetch("https://api.spotify.com/v1/me/player/previous", {
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

export async function seekToPosition(positionMs) {
  const token = await getValidAccessToken();
  if (!token) return;
  await fetch(`https://api.spotify.com/v1/me/player/seek?position_ms=${Math.round(positionMs)}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` }
  });
}
