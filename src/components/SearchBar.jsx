import { useState, useRef, useEffect } from "react";
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

/* ─────────── Three-dot "thinking" loader, matches the app's lyrics-loading language ─────────── */
function DotLoader({ size = 6, color = "rgba(255,255,255,0.6)" }) {
  return (
    <div style={{ display: "flex", gap: size * 0.9, alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.25, 1, 0.25], scale: [0.75, 1.1, 0.75] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.16, ease: "easeInOut" }}
          style={{ width: size, height: size, borderRadius: "50%", background: color }}
        />
      ))}
    </div>
  );
}

/* ─────────── Animated checkmark, used for the "picked" success beat ─────────── */
function CheckBadge() {
  return (
    <motion.svg
      width="16" height="16" viewBox="0 0 24 24" fill="none"
      initial={{ scale: 0.4, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 20 }}
    >
      <motion.circle cx="12" cy="12" r="11" fill="rgba(30,215,96,0.18)" />
      <motion.path
        d="M7 12.5l3 3 7-7"
        stroke="#1ed760" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
      />
    </motion.svg>
  );
}

export default function SearchBar({ onPlay }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [playingId, setPlayingId] = useState(null);
  const [pickedId, setPickedId] = useState(null); // brief success state before closing
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 260);
      return () => clearTimeout(t);
    }
  }, [open]);

  const handleInput = (e) => {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); setLoading(false); return; }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const res = await searchSpotify(q);
      setResults(res);
      setLoading(false);
    }, 400);
  };

  const handlePlay = async (track) => {
    setPlayingId(track.id);
    await playTrack(track.uri);
    setPlayingId(null);
    setPickedId(track.id);
    if (onPlay) onPlay(track);
    // let the success check land for a beat before the panel folds away
    setTimeout(() => {
      setOpen(false);
      setQuery("");
      setResults([]);
      setPickedId(null);
    }, 520);
  };

  const showEmpty = !loading && query.trim() && results.length === 0;

  return (
    <div className="search-wrap" style={{ position: "relative" }}>
      <motion.button
        className="search-btn"
        onClick={() => setOpen((o) => !o)}
        title="ค้นหาเพลง"
        whileHover={{ scale: 1.08, background: "rgba(255,255,255,0.14)" }}
        whileTap={{ scale: 0.9 }}
        animate={{ rotate: open ? 90 : 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 22 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.svg
              key="close" width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
              initial={{ opacity: 0, rotate: -45, scale: 0.6 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 45, scale: 0.6 }}
              transition={{ duration: 0.18 }}
            >
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </motion.svg>
          ) : (
            <motion.svg
              key="search" width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
              initial={{ opacity: 0, rotate: 45, scale: 0.6 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: -45, scale: 0.6 }}
              transition={{ duration: 0.18 }}
            >
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="search-panel"
            initial={{ opacity: 0, y: -14, scale: 0.94, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, scale: 0.96, filter: "blur(6px)" }}
            transition={{ type: "spring", stiffness: 260, damping: 26, mass: 0.9 }}
            style={{ transformOrigin: "top right" }}
          >
            <motion.input
              ref={inputRef}
              className="search-input"
              placeholder="ค้นหาเพลง..."
              value={query}
              onChange={handleInput}
              onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.22 }}
            />

            <AnimatePresence mode="wait">
              {loading && (
                <motion.div
                  key="loading"
                  className="search-loading"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 4px" }}
                >
                  <DotLoader />
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>กำลังค้นหา...</span>
                </motion.div>
              )}

              {showEmpty && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ padding: "18px 4px", textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.4)" }}
                >
                  ไม่พบเพลงที่ค้นหา ลองคำอื่นดูไหม
                </motion.div>
              )}
            </AnimatePresence>

            {!loading && results.length > 0 && (
              <motion.ul className="search-results" layout>
                <AnimatePresence initial={false}>
                  {results.map((t, i) => {
                    const isPlaying = playingId === t.id;
                    const isPicked = pickedId === t.id;
                    const isDimmed = (playingId || pickedId) && playingId !== t.id && pickedId !== t.id;
                    return (
                      <motion.li
                        key={t.id}
                        layout
                        className="search-result-item"
                        onClick={() => !playingId && !pickedId && handlePlay(t)}
                        initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
                        animate={{
                          opacity: isDimmed ? 0.35 : 1,
                          y: 0,
                          filter: "blur(0px)",
                          scale: isPicked ? 1.015 : 1,
                        }}
                        exit={{ opacity: 0, x: -12, filter: "blur(4px)" }}
                        transition={{
                          type: "spring", stiffness: 260, damping: 26,
                          delay: i * 0.045,
                        }}
                        whileHover={!playingId && !pickedId ? { background: "rgba(255,255,255,0.06)", x: 2 } : {}}
                        style={{ cursor: playingId || pickedId ? "default" : "pointer" }}
                      >
                        <motion.div
                          style={{ position: "relative", flexShrink: 0 }}
                          animate={isPlaying ? { scale: [1, 1.04, 1] } : { scale: 1 }}
                          transition={isPlaying ? { duration: 1.1, repeat: Infinity, ease: "easeInOut" } : {}}
                        >
                          {t.albumArt && (
                            <img src={t.albumArt} alt="" className="search-result-art" />
                          )}
                          {isPlaying && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              style={{
                                position: "absolute", inset: 0, borderRadius: "inherit",
                                background: "rgba(0,0,0,0.45)", display: "flex",
                                alignItems: "center", justifyContent: "center",
                              }}
                            >
                              <DotLoader size={4} color="#fff" />
                            </motion.div>
                          )}
                        </motion.div>

                        <div className="search-result-info">
                          <span className="search-result-name">{t.name}</span>
                          <span className="search-result-artist">{t.artists}</span>
                        </div>

                        <div className="search-play-btn" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 20, height: 20 }}>
                          <AnimatePresence mode="wait" initial={false}>
                            {isPicked ? (
                              <motion.div key="check">
                                <CheckBadge />
                              </motion.div>
                            ) : isPlaying ? (
                              <motion.div
                                key="spin"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                                style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.25)", borderTopColor: "#fff", borderRadius: "50%" }}
                              />
                            ) : (
                              <motion.span
                                key="play"
                                initial={{ opacity: 0, scale: 0.7 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.7 }}
                                style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}
                              >
                                ▶
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </motion.ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
