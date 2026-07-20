import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getValidAccessToken } from "../utils/spotifyAuth";

async function searchSpotify(query) {
  const token = await getValidAccessToken();
  if (!token) return [];
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=8`,
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

const panelSpring = { type: "spring", stiffness: 320, damping: 30, mass: 0.9 };
const cursorSpring = { type: "spring", stiffness: 500, damping: 40 };

export default function SearchBar({ onPlay }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [playingId, setPlayingId] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);
  const itemRefs = useRef([]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults([]);
    setSelectedIndex(0);
  }, []);

  const openPanel = useCallback(() => {
    setOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const handlePlay = useCallback(
    async (track) => {
      if (!track) return;
      setPlayingId(track.id);
      await playTrack(track.uri);
      if (onPlay) onPlay(track);
      setTimeout(() => {
        setPlayingId(null);
        close();
      }, 350);
    },
    [onPlay, close]
  );

  // secret key: press "f" anywhere (not while typing) to open the spotlight search.
  // once open, arrow keys move the selection and Enter plays it.
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName;
      const isTyping = tag === "INPUT" || tag === "TEXTAREA" || document.activeElement?.isContentEditable;

      if (!open) {
        if (!isTyping && !e.metaKey && !e.ctrlKey && !e.altKey && e.key.toLowerCase() === "f") {
          e.preventDefault();
          openPanel();
        }
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === "ArrowDown" && results.length > 0) {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      }
      if (e.key === "ArrowUp" && results.length > 0) {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && results.length > 0 && playingId === null) {
        e.preventDefault();
        handlePlay(results[selectedIndex]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, results, selectedIndex, playingId, close, openPanel, handlePlay]);

  // keep the selected row scrolled into view as arrow keys move it
  useEffect(() => {
    itemRefs.current[selectedIndex]?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const handleInput = (e) => {
    const q = e.target.value;
    setQuery(q);
    setSelectedIndex(0);
    clearTimeout(debounceRef.current);
    if (!q.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const res = await searchSpotify(q);
      setResults(res);
      setSelectedIndex(0);
      setLoading(false);
    }, 400);
  };

  return (
    <div className="search-wrap">
      <motion.button
        className="search-btn"
        onClick={() => (open ? close() : openPanel())}
        title="ค้นหาเพลง (หรือกด F)"
        whileTap={{ scale: 0.88 }}
        whileHover={{ scale: 1.06 }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              className="search-backdrop"
              initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
              animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
              exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              onClick={close}
            />

            <motion.div
              key="panel"
              className="search-panel"
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={panelSpring}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="search-header">
                <svg className="search-header-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  ref={inputRef}
                  autoFocus
                  className="search-input"
                  placeholder="ค้นหาเพลง หรือศิลปิน..."
                  value={query}
                  onChange={handleInput}
                />
                {query && (
                  <button className="search-clear-btn" onClick={() => { setQuery(""); setResults([]); }}>
                    ✕
                  </button>
                )}
              </div>

              <div className="search-body">
                {loading && (
                  <ul className="search-skeleton-list">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <motion.li
                        key={i}
                        className="search-skeleton-item"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <span className="search-skeleton-art" />
                        <span className="search-skeleton-lines">
                          <span className="search-skeleton-line search-skeleton-line--wide" />
                          <span className="search-skeleton-line search-skeleton-line--narrow" />
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                )}

                {!loading && results.length === 0 && query && (
                  <motion.div className="search-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    ไม่พบเพลงที่ตรงกับ "{query}"
                  </motion.div>
                )}

                {!loading && results.length === 0 && !query && (
                  <motion.div className="search-hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                    พิมพ์ชื่อเพลงหรือศิลปินที่ต้องการค้นหา
                    <span className="search-hint-key">↑ ↓ เลื่อนเลือก · Enter เล่นเพลง · Esc ปิด</span>
                  </motion.div>
                )}

                {!loading && results.length > 0 && (
                  <ul className="search-results">
                    <AnimatePresence initial={false}>
                      {results.map((t, i) => {
                        const isThisPlaying = playingId === t.id;
                        const isAnyPlaying = playingId !== null;
                        const isSelected = i === selectedIndex;
                        return (
                          <motion.li
                            ref={(el) => (itemRefs.current[i] = el)}
                            layout
                            key={t.id}
                            className={`search-result-item${isThisPlaying ? " search-result-item--playing" : ""}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{
                              opacity: isAnyPlaying && !isThisPlaying ? 0.35 : 1,
                              y: 0,
                            }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ ...panelSpring, delay: isAnyPlaying ? 0 : i * 0.035 }}
                            onMouseEnter={() => setSelectedIndex(i)}
                            onClick={() => !isAnyPlaying && handlePlay(t)}
                          >
                            {isSelected && !isAnyPlaying && (
                              <motion.div layoutId="search-cursor" className="search-cursor" transition={cursorSpring} />
                            )}
                            <div className="search-result-content">
                              {t.albumArt && <img src={t.albumArt} alt="" className="search-result-art" />}
                              <div className="search-result-info">
                                <span className="search-result-name">{t.name}</span>
                                <span className="search-result-artist">{t.artists}</span>
                              </div>
                              <span className="search-play-btn">
                                {isThisPlaying ? (
                                  <motion.span
                                    className="search-spinner"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                                  />
                                ) : (
                                  "▶"
                                )}
                              </span>
                            </div>
                          </motion.li>
                        );
                      })}
                    </AnimatePresence>
                  </ul>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        .search-wrap { position: relative; }

        .search-btn {
          display: flex; align-items: center; justify-content: center;
          width: 38px; height: 38px; border-radius: 50%; border: none;
          background: rgba(255,255,255,0.08); color: #fff; cursor: pointer;
        }

        .search-backdrop {
          position: fixed; inset: 0; z-index: 40;
          background: rgba(6,6,8,0.5);
        }

        .search-panel {
          position: fixed; z-index: 50;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: min(600px, 92vw);
          max-height: min(64vh, 600px);
          display: flex; flex-direction: column;
          background: rgba(22,22,26,0.5);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 20px;
          backdrop-filter: blur(26px) saturate(180%);
          -webkit-backdrop-filter: blur(26px) saturate(180%);
          box-shadow: 0 30px 90px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06);
          overflow: hidden;
        }

        .search-header {
          display: flex; align-items: center; gap: 12px;
          padding: 18px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          flex-shrink: 0;
        }

        .search-header-icon { color: rgba(255,255,255,0.45); flex-shrink: 0; }

        .search-input {
          flex: 1; background: none; border: none; outline: none;
          color: #fff; font-size: 19px;
        }
        .search-input::placeholder { color: rgba(255,255,255,0.4); }

        .search-clear-btn {
          background: rgba(255,255,255,0.08); border: none; color: rgba(255,255,255,0.7);
          width: 26px; height: 26px; border-radius: 50%; cursor: pointer;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .search-clear-btn:hover { background: rgba(255,255,255,0.16); color: #fff; }

        .search-body { overflow-y: auto; padding: 10px; }

        .search-results { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }

        .search-result-item {
          position: relative;
          border-radius: 12px; cursor: pointer;
        }

        .search-cursor {
          position: absolute; inset: 0;
          background: rgba(29,185,84,0.16);
          border: 1px solid rgba(29,185,84,0.35);
          border-radius: 12px;
        }

        .search-result-content {
          position: relative; z-index: 1;
          display: flex; align-items: center; gap: 12px;
          padding: 9px 10px;
        }

        .search-result-item--playing .search-result-content { background: rgba(29,185,84,0.12); border-radius: 12px; }

        .search-result-art { width: 42px; height: 42px; border-radius: 7px; object-fit: cover; flex-shrink: 0; }
        .search-result-info { display: flex; flex-direction: column; min-width: 0; flex: 1; }
        .search-result-name { color: #fff; font-size: 14.5px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .search-result-artist { color: rgba(255,255,255,0.55); font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .search-play-btn {
          width: 24px; height: 24px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.7); font-size: 11px;
        }
        .search-spinner {
          width: 15px; height: 15px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.25); border-top-color: #1DB954;
          display: inline-block;
        }

        .search-empty, .search-hint {
          padding: 40px 20px; text-align: center; color: rgba(255,255,255,0.5); font-size: 14px;
        }
        .search-hint-key {
          display: block; margin-top: 8px; font-size: 12px; color: rgba(255,255,255,0.3);
        }

        .search-skeleton-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
        .search-skeleton-item { display: flex; align-items: center; gap: 12px; padding: 9px 10px; }
        .search-skeleton-art, .search-skeleton-line {
          border-radius: 7px;
          background: linear-gradient(90deg, rgba(255,255,255,0.06) 25%, rgba(255,255,255,0.14) 37%, rgba(255,255,255,0.06) 63%);
          background-size: 400% 100%;
          animation: search-shimmer 1.4s ease infinite;
        }
        .search-skeleton-art { width: 42px; height: 42px; flex-shrink: 0; }
        .search-skeleton-lines { flex: 1; display: flex; flex-direction: column; gap: 6px; }
        .search-skeleton-line { height: 10px; }
        .search-skeleton-line--wide { width: 70%; }
        .search-skeleton-line--narrow { width: 40%; }

        @keyframes search-shimmer {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .search-skeleton-art, .search-skeleton-line { animation: none; }
        }
      `}</style>
    </div>
  );
}
