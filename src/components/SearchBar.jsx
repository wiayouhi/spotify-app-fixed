import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getValidAccessToken } from "../utils/spotifyAuth";

async function searchSpotify(query) {
  const token = await getValidAccessToken();
  if (!token) return [];
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=6`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.tracks?.items || []).map((item) => ({
    id: item.id,
    name: item.name,
    artists: item.artists.map((a) => a.name).join(", "),
    album: item.album.name,
    albumArt: item.album.images?.[1]?.url || item.album.images?.[0]?.url || null,
    uri: item.uri,
    durationMs: item.duration_ms,
  }));
}

async function playTrack(uri) {
  const token = await getValidAccessToken();
  if (!token) return false;
  // Play on active device
  await fetch("https://api.spotify.com/v1/me/player/play", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uris: [uri] }),
  });
  return true;
}

export default function SearchBar({ onPlay }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [playingId, setPlayingId] = useState(null);
  const debounceRef = useRef(null);

  const handleInput = (e) => {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const res = await searchSpotify(q);
      setResults(res);
      setLoading(false);
    }, 400);
  };

  const handlePlay = async (track) => {
    setPlayingId(track.id);
    await playTrack(track.uri);
    setPlayingId(null);
    setOpen(false);
    setQuery("");
    setResults([]);
    if (onPlay) onPlay(track);
  };

  return (
    <div className="search-wrap">
      <button className="search-btn" onClick={() => setOpen((o) => !o)} title="ค้นหาเพลง">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="search-panel"
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ duration: 0.2 }}
          >
            <input
              autoFocus
              className="search-input"
              placeholder="ค้นหาเพลง..."
              value={query}
              onChange={handleInput}
              onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
            />
            {loading && <div className="search-loading">กำลังค้นหา...</div>}
            {results.length > 0 && (
              <ul className="search-results">
                {results.map((t) => (
                  <li key={t.id} className="search-result-item" onClick={() => handlePlay(t)}>
                    {t.albumArt && <img src={t.albumArt} alt="" className="search-result-art" />}
                    <div className="search-result-info">
                      <span className="search-result-name">{t.name}</span>
                      <span className="search-result-artist">{t.artists}</span>
                    </div>
                    <button className="search-play-btn" disabled={playingId === t.id}>
                      {playingId === t.id ? (
                        <motion.div
                          className="search-spinner"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          style={{ width: "16px", height: "16px", border: "2px solid #ccc", borderTopColor: "#fff", borderRadius: "50%" }}
                        />
                      ) : "▶"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
