import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getValidAccessToken } from "../utils/spotifyAuth";

async function searchSpotify(query) {
  const token = await getValidAccessToken();
  if (!token) return [];
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
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

const HOTKEY = "i"; // secret key to open fullscreen search
const cursorSpring = { type: "spring", stiffness: 500, damping: 40 };
const EASE = [0.22, 1, 0.36, 1];

// orchestration: each section fades/slides in on its own beat instead of
// everything popping in at once
const innerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.08 } },
};
const sectionVariants = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.45, ease: EASE } },
};

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

  // mirror the latest state in refs so a *single*, never-re-subscribed
  // keydown listener can always read fresh values. Re-adding/removing the
  // window listener on every state change was the root cause of the hotkey
  // going dead after the first use (a stale-closure race during the
  // "select track -> close -> reopen" sequence).
  const stateRef = useRef({ open, results, selectedIndex, playingId });
  useEffect(() => {
    stateRef.current = { open, results, selectedIndex, playingId };
  }, [open, results, selectedIndex, playingId]);

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

  // single stable listener, attached once for the lifetime of the component
  useEffect(() => {
    const handleKeyDown = (e) => {
      const { open: isOpen, results: currentResults, selectedIndex: currentIndex, playingId: currentPlayingId } = stateRef.current;
      const tag = document.activeElement?.tagName;
      const isTyping = tag === "INPUT" || tag === "TEXTAREA" || document.activeElement?.isContentEditable;

      if (!isOpen) {
        if (!isTyping && !e.metaKey && !e.ctrlKey && !e.altKey && e.key.toLowerCase() === HOTKEY) {
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
      if (e.key === "ArrowDown" && currentResults.length > 0) {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, currentResults.length - 1));
      }
      if (e.key === "ArrowUp" && currentResults.length > 0) {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && currentResults.length > 0 && currentPlayingId === null) {
        e.preventDefault();
        handlePlay(currentResults[currentIndex]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [close, openPanel, handlePlay]);

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
        title={`ค้นหาเพลง (หรือกด ${HOTKEY.toUpperCase()})`}
        whileTap={{ scale: 0.82 }}
        whileHover={{ scale: 1.08 }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="fullscreen"
            className="search-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.25, ease: EASE } }}
            transition={{ duration: 0.28, ease: EASE }}
          >
            <motion.div
              className="search-full-bg"
              initial={{ backdropFilter: "blur(0px)", opacity: 0 }}
              animate={{ backdropFilter: "blur(30px)", opacity: 1 }}
              exit={{ backdropFilter: "blur(0px)", opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
            />

            <motion.div
              className="search-full-inner"
              variants={innerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <motion.button
                className="search-close-btn"
                onClick={close}
                title="ปิด (Esc)"
                variants={sectionVariants}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.85 }}
              >
                ✕
              </motion.button>

              <motion.div className="search-header" variants={sectionVariants}>
                <svg className="search-header-icon" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  <motion.button
                    className="search-clear-btn"
                    onClick={() => { setQuery(""); setResults([]); }}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                  >
                    ✕
                  </motion.button>
                )}
              </motion.div>

              <motion.div className="search-body" variants={sectionVariants}>
                {loading && (
                  <ul className="search-skeleton-list">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <motion.li
                        key={i}
                        className="search-skeleton-item"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
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
                  <motion.div className="search-hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
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
                            initial={{ opacity: 0, y: 12 }}
                            animate={{
                              opacity: isAnyPlaying && !isThisPlaying ? 0.35 : 1,
                              y: 0,
                            }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            transition={{ type: "spring", stiffness: 320, damping: 30, delay: isAnyPlaying ? 0 : i * 0.03 }}
                            onMouseEnter={() => setSelectedIndex(i)}
                            onClick={() => !isAnyPlaying && handlePlay(t)}
                            whileTap={{ scale: 0.98 }}
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
              </motion.div>
            </motion.div>
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

        .search-full {
          position: fixed; inset: 0; z-index: 60;
          display: flex; align-items: center; justify-content: center;
        }

        .search-full-bg {
          position: absolute; inset: 0;
          background: radial-gradient(circle at 50% 20%, rgba(29,185,84,0.14), rgba(6,6,8,0.88) 60%);
        }

        .search-full-inner {
          position: relative; z-index: 1;
          width: 100%; height: 100%;
          display: flex; flex-direction: column; align-items: center;
          padding: 8vh 20px 6vh;
        }

        .search-close-btn {
          position: absolute; top: 22px; right: 26px;
          width: 38px; height: 38px; border-radius: 50%; border: none;
          background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.8);
          font-size: 15px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
        }
        .search-close-btn:hover { background: rgba(255,255,255,0.16); color: #fff; }

        .search-header {
          width: 100%; max-width: 680px;
          display: flex; align-items: center; gap: 14px;
          padding: 0 8px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.12);
          flex-shrink: 0;
        }

        .search-header-icon { color: rgba(255,255,255,0.5); flex-shrink: 0; }

        .search-input {
          flex: 1; background: none; border: none; outline: none;
          color: #fff; font-size: 26px; font-weight: 500;
        }
        .search-input::placeholder { color: rgba(255,255,255,0.35); }

        .search-clear-btn {
          background: rgba(255,255,255,0.08); border: none; color: rgba(255,255,255,0.7);
          width: 28px; height: 28px; border-radius: 50%; cursor: pointer;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .search-clear-btn:hover { background: rgba(255,255,255,0.16); color: #fff; }

        .search-body {
          width: 100%; max-width: 680px;
          flex: 1; overflow-y: auto; margin-top: 18px; padding: 0 4px;
        }

        .search-results { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 3px; }

        .search-result-item {
          position: relative;
          border-radius: 14px; cursor: pointer;
        }

        .search-cursor {
          position: absolute; inset: 0;
          background: rgba(29,185,84,0.16);
          border: 1px solid rgba(29,185,84,0.4);
          border-radius: 14px;
        }

        .search-result-content {
          position: relative; z-index: 1;
          display: flex; align-items: center; gap: 14px;
          padding: 11px 12px;
        }

        .search-result-item--playing .search-result-content { background: rgba(29,185,84,0.12); border-radius: 14px; }

        .search-result-art { width: 48px; height: 48px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
        .search-result-info { display: flex; flex-direction: column; min-width: 0; flex: 1; }
        .search-result-name { color: #fff; font-size: 16px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .search-result-artist { color: rgba(255,255,255,0.55); font-size: 13.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .search-play-btn {
          width: 26px; height: 26px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.7); font-size: 12px;
        }
        .search-spinner {
          width: 16px; height: 16px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.25); border-top-color: #1DB954;
          display: inline-block;
        }

        .search-empty, .search-hint {
          padding: 60px 20px; text-align: center; color: rgba(255,255,255,0.5); font-size: 15px;
        }
        .search-hint-key {
          display: block; margin-top: 10px; font-size: 13px; color: rgba(255,255,255,0.32);
        }

        .search-skeleton-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
        .search-skeleton-item { display: flex; align-items: center; gap: 14px; padding: 11px 12px; }
        .search-skeleton-art, .search-skeleton-line {
          border-radius: 8px;
          background: linear-gradient(90deg, rgba(255,255,255,0.06) 25%, rgba(255,255,255,0.14) 37%, rgba(255,255,255,0.06) 63%);
          background-size: 400% 100%;
          animation: search-shimmer 1.4s ease infinite;
        }
        .search-skeleton-art { width: 48px; height: 48px; flex-shrink: 0; }
        .search-skeleton-lines { flex: 1; display: flex; flex-direction: column; gap: 7px; }
        .search-skeleton-line { height: 11px; }
        .search-skeleton-line--wide { width: 60%; }
        .search-skeleton-line--narrow { width: 35%; }

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
