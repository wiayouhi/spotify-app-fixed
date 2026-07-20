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
      const t = setTimeout(() => inputRef.current?.focus(), 320);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Global shortcut: ⌘K / Ctrl+K opens the search, Escape closes it — works from
  // anywhere on the page, not just while the input is focused.
  useEffect(() => {
    const onKeyDown = (e) => {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (isCmdK) {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
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
        title="ค้นหาเพลง (⌘K)"
        whileHover={{ scale: 1.08, background: "rgba(255,255,255,0.14)" }}
        whileTap={{ scale: 0.9 }}
        style={{ position: "relative" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="search-overlay"
            className="search-overlay"
            onClick={() => setOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            style={{
              position: "fixed", inset: 0, zIndex: 100,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(10,10,14,0.35)",
              backdropFilter: "blur(28px) saturate(160%)",
              WebkitBackdropFilter: "blur(28px) saturate(160%)",
              padding: 24,
            }}
          >
            <motion.div
              className="search-panel search-panel-glass"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9, y: 28, filter: "blur(16px)" }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.93, y: 16, filter: "blur(10px)" }}
              transition={{ type: "spring", stiffness: 240, damping: 26, mass: 0.9 }}
              style={{
                width: "min(92vw, 480px)",
                maxHeight: "min(80vh, 560px)",
                display: "flex", flexDirection: "column",
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: 24,
                boxShadow: "0 24px 70px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)",
                overflow: "hidden",
              }}
            >
              <motion.div
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "18px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.22 }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  ref={inputRef}
                  className="search-input"
                  placeholder="ค้นหาเพลง..."
                  value={query}
                  onChange={handleInput}
                  style={{
                    flex: 1, background: "transparent", border: "none", outline: "none",
                    color: "#fff", fontSize: 16, letterSpacing: "0.01em",
                  }}
                />
                <kbd style={{
                  fontSize: 11, color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 6, padding: "2px 6px", fontFamily: "inherit",
                }}>
                  esc
                </kbd>
              </motion.div>

              <div style={{ overflowY: "auto", padding: "6px 12px 14px" }}>
                <AnimatePresence mode="wait">
                  {loading && (
                    <motion.div
                      key="loading"
                      className="search-loading"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "18px 8px" }}
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
                      style={{ padding: "24px 8px", textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.4)" }}
                    >
                      ไม่พบเพลงที่ค้นหา ลองคำอื่นดูไหม
                    </motion.div>
                  )}

                  {!loading && !query.trim() && (
                    <motion.div
                      key="hint"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25, delay: 0.05 }}
                      style={{ padding: "28px 8px", textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.3)" }}
                    >
                      พิมพ์ชื่อเพลงหรือศิลปินเพื่อค้นหา
                    </motion.div>
                  )}
                </AnimatePresence>

                {!loading && results.length > 0 && (
                  <motion.ul className="search-results" layout style={{ listStyle: "none", margin: 0, padding: 0 }}>
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
                            whileHover={!playingId && !pickedId ? { background: "rgba(255,255,255,0.08)", x: 2 } : {}}
                            style={{
                              cursor: playingId || pickedId ? "default" : "pointer",
                              display: "flex", alignItems: "center", gap: 12,
                              padding: "10px 8px", borderRadius: 12,
                            }}
                          >
                            <motion.div
                              style={{ position: "relative", flexShrink: 0 }}
                              animate={isPlaying ? { scale: [1, 1.04, 1] } : { scale: 1 }}
                              transition={isPlaying ? { duration: 1.1, repeat: Infinity, ease: "easeInOut" } : {}}
                            >
                              {t.albumArt && (
                                <img src={t.albumArt} alt="" className="search-result-art" style={{ width: 44, height: 44, borderRadius: 8, display: "block" }} />
                              )}
                              {isPlaying && (
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  style={{
                                    position: "absolute", inset: 0, borderRadius: 8,
                                    background: "rgba(0,0,0,0.45)", display: "flex",
                                    alignItems: "center", justifyContent: "center",
                                  }}
                                >
                                  <DotLoader size={4} color="#fff" />
                                </motion.div>
                              )}
                            </motion.div>

                            <div className="search-result-info" style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, flex: 1 }}>
                              <span className="search-result-name" style={{ fontSize: 14, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</span>
                              <span className="search-result-artist" style={{ fontSize: 12.5, color: "rgba(255,255,255,0.45)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.artists}</span>
                            </div>

                            <div className="search-play-btn" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, flexShrink: 0 }}>
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
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
