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

// spring used for the shared morph between docked <-> fullscreen
const morphTransition = { type: "spring", stiffness: 340, damping: 32, mass: 0.9 };

export default function SearchBar({ onPlay }) {
  const [open, setOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [playingId, setPlayingId] = useState(null);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  const close = useCallback(() => {
    setOpen(false);
    setFullscreen(false);
    setQuery("");
    setResults([]);
  }, []);

  const openPanel = useCallback((asFullscreen) => {
    setOpen(true);
    setFullscreen(asFullscreen);
    // wait for the panel to mount before focusing
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  // secret key: press "f" anywhere (not while typing) to jump straight into
  // fullscreen spotlight search. Esc always backs out.
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName;
      const isTyping = tag === "INPUT" || tag === "TEXTAREA" || document.activeElement?.isContentEditable;

      if (e.key === "Escape" && open) {
        e.preventDefault();
        close();
        return;
      }

      if (
        !isTyping &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        e.key.toLowerCase() === "f"
      ) {
        e.preventDefault();
        if (open && fullscreen) {
          close();
        } else {
          openPanel(true);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, fullscreen, close, openPanel]);

  const handleInput = (e) => {
    const q = e.target.value;
    setQuery(q);
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
      setLoading(false);
    }, 400);
  };

  const handlePlay = async (track) => {
    setPlayingId(track.id);
    await playTrack(track.uri);
    if (onPlay) onPlay(track);
    // small beat so the "now loading" state is felt before the panel folds away
    setTimeout(() => {
      setPlayingId(null);
      close();
    }, 350);
  };

  return (
    <div className="search-wrap">
      <motion.button
        className="search-btn"
        onClick={() => (open ? close() : openPanel(false))}
        title="ค้นหาเพลง (หรือกด F)"
        whileTap={{ scale: 0.88 }}
        whileHover={{ scale: 1.06 }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </motion.button>

      <AnimatePresence>
        {fullscreen && (
          <motion.div
            className="search-backdrop"
            key="backdrop"
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(18px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={close}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="popLayout">
        {open && (
          <motion.div
            layout
            key="panel"
            className={`search-panel${fullscreen ? " search-panel--full" : ""}`}
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={morphTransition}
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
              <button
                className="search-mode-btn"
                title={fullscreen ? "ย่อหน้าต่าง" : "ขยายเต็มจอ (F)"}
                onClick={() => setFullscreen((f) => !f)}
              >
                {fullscreen ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M3 16v3a2 2 0 0 0 2 2h3" />
                  </svg>
                )}
              </button>
            </div>

            <div className="search-body">
              {loading && (
                <ul className="search-skeleton-list">
                  {Array.from({ length: fullscreen ? 6 : 4 }).map((_, i) => (
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
                <motion.div
                  className="search-empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  ไม่พบเพลงที่ตรงกับ "{query}"
                </motion.div>
              )}

              {!loading && results.length === 0 && !query && fullscreen && (
                <motion.div
                  className="search-hint"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  พิมพ์ชื่อเพลงหรือศิลปินที่ต้องการค้นหา
                  <span className="search-hint-key">กด Esc เพื่อปิด</span>
                </motion.div>
              )}

              {!loading && results.length > 0 && (
                <motion.ul layout className={`search-results${fullscreen ? " search-results--grid" : ""}`}>
                  <AnimatePresence>
                    {results.map((t, i) => {
                      const isThisPlaying = playingId === t.id;
                      const isAnyPlaying = playingId !== null;
                      return (
                        <motion.li
                          layout
                          key={t.id}
                          className={`search-result-item${isThisPlaying ? " search-result-item--playing" : ""}`}
                          initial={{ opacity: 0, y: 10, scale: 0.97 }}
                          animate={{
                            opacity: isAnyPlaying && !isThisPlaying ? 0.35 : 1,
                            y: 0,
                            scale: 1,
                          }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ ...morphTransition, delay: isAnyPlaying ? 0 : i * 0.04 }}
                          onClick={() => !isAnyPlaying && handlePlay(t)}
                        >
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
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </motion.ul>
              )}
            </div>
          </motion.div>
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
          background: rgba(8,8,10,0.55);
        }

        .search-panel {
          position: absolute; top: calc(100% + 10px); right: 0;
          width: 340px; max-height: 420px;
          background: rgba(24,24,27,0.55);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 16px;
          backdrop-filter: blur(24px) saturate(180%);
          -webkit-backdrop-filter: blur(24px) saturate(180%);
          box-shadow: 0 20px 60px rgba(0,0,0,0.45);
          overflow: hidden;
          z-index: 20;
          display: flex; flex-direction: column;
        }

        .search-panel--full {
          position: fixed; z-index: 50;
          top: 50%; left: 50%; right: auto;
          transform: translate(-50%, -50%);
          width: min(640px, 92vw);
          max-height: min(70vh, 640px);
          border-radius: 20px;
          background: rgba(20,20,24,0.5);
          box-shadow: 0 30px 90px rgba(0,0,0,0.6);
        }

        .search-header {
          display: flex; align-items: center; gap: 10px;
          padding: 14px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          flex-shrink: 0;
        }

        .search-header-icon { color: rgba(255,255,255,0.45); flex-shrink: 0; }

        .search-input {
          flex: 1; background: none; border: none; outline: none;
          color: #fff; font-size: 15px;
        }
        .search-panel--full .search-input { font-size: 19px; }
        .search-input::placeholder { color: rgba(255,255,255,0.4); }

        .search-clear-btn, .search-mode-btn {
          background: rgba(255,255,255,0.08); border: none; color: rgba(255,255,255,0.7);
          width: 26px; height: 26px; border-radius: 50%; cursor: pointer;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .search-clear-btn:hover, .search-mode-btn:hover { background: rgba(255,255,255,0.16); color: #fff; }

        .search-body { overflow-y: auto; padding: 8px; }

        .search-results { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
        .search-results--grid {
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;
        }

        .search-result-item {
          display: flex; align-items: center; gap: 10px;
          padding: 8px; border-radius: 10px; cursor: pointer;
        }
        .search-result-item:hover { background: rgba(255,255,255,0.08); }
        .search-result-item--playing { background: rgba(29,185,84,0.15); }

        .search-result-art { width: 40px; height: 40px; border-radius: 6px; object-fit: cover; flex-shrink: 0; }
        .search-result-info { display: flex; flex-direction: column; min-width: 0; flex: 1; }
        .search-result-name { color: #fff; font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .search-result-artist { color: rgba(255,255,255,0.55); font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

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
          padding: 28px 16px; text-align: center; color: rgba(255,255,255,0.5); font-size: 14px;
        }
        .search-hint-key {
          display: block; margin-top: 6px; font-size: 12px; color: rgba(255,255,255,0.3);
        }

        .search-skeleton-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
        .search-skeleton-item { display: flex; align-items: center; gap: 10px; padding: 8px; }
        .search-skeleton-art, .search-skeleton-line {
          border-radius: 6px;
          background: linear-gradient(90deg, rgba(255,255,255,0.06) 25%, rgba(255,255,255,0.14) 37%, rgba(255,255,255,0.06) 63%);
          background-size: 400% 100%;
          animation: search-shimmer 1.4s ease infinite;
        }
        .search-skeleton-art { width: 40px; height: 40px; flex-shrink: 0; }
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
