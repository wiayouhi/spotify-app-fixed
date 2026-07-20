import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
  const [pickedId, setPickedId] = useState(null);
  const [mounted, setMounted] = useState(false);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  // โฟกัสช่องพิมพ์ทันทีเมื่อเปิด Modal
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [open]);

  // คีย์ลัด ⌘K / Ctrl+K / Tab / Esc
  useEffect(() => {
    const onKeyDown = (e) => {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      const nothingFocused = !document.activeElement || document.activeElement === document.body;
      const isTabToOpen = e.key === "Tab" && !open && nothingFocused;

      if (isCmdK || isTabToOpen) {
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
        title="ค้นหาเพลง (⌘K หรือ Tab)"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.9 }}
        style={{
          background: "rgba(255,255,255,0.12)",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: "50%",
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </motion.button>

      {/* Render Modal ไว้ที่ document.body โดยตรง */}
      {mounted && createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              key="search-overlay"
              className="search-overlay"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 999999, // ดันขึ้นมาเลเยอร์บนสุดแน่นอน
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0, 0, 0, 0.65)", // ปรับพื้นหลังดำโปร่งแสงเข้มขึ้น
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                padding: 16,
              }}
            >
              <motion.div
                className="search-panel"
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
                style={{
                  width: "min(92vw, 480px)",
                  maxHeight: "min(80vh, 560px)",
                  display: "flex",
                  flexDirection: "column",
                  background: "#18181f", // เปลี่ยนเป็นสีทึบเข้ม ป้องกันปัญหาจอดำ/ใสจนมองไม่เห็น
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 20,
                  boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
                  overflow: "hidden",
                  color: "#fff",
                }}
              >
                {/* Header / Input Box */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    ref={inputRef}
                    className="search-input"
                    placeholder="พิมพ์ชื่อเพลงหรือศิลปิน..."
                    value={query}
                    onChange={handleInput}
                    style={{
                      flex: 1,
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      color: "#ffffff",
                      fontSize: 16,
                    }}
                  />
                  <kbd style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.5)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: 6,
                    padding: "2px 6px",
                    cursor: "pointer",
                  }}
                  onClick={() => setOpen(false)}>
                    ESC
                  </kbd>
                </div>

                {/* Results Container */}
                <div style={{ overflowY: "auto", padding: "8px 12px 16px", minHeight: 180 }}>
                  <AnimatePresence mode="wait">
                    {loading && (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 8px" }}
                      >
                        <DotLoader />
                        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>กำลังค้นหา...</span>
                      </motion.div>
                    )}

                    {showEmpty && (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ padding: "28px 8px", textAlign: "center", fontSize: 14, color: "rgba(255,255,255,0.5)" }}
                      >
                        ไม่พบเพลงที่ค้นหา ลองพิมพ์คำอื่นดูครับ
                      </motion.div>
                    )}

                    {!loading && !query.trim() && (
                      <motion.div
                        key="hint"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ padding: "32px 8px", textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.4)" }}
                      >
                        พิมพ์ชื่อเพลงหรือศิลปินเพื่อค้นหาได้เลย
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!loading && results.length > 0 && (
                    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                      {results.map((t) => {
                        const isPlaying = playingId === t.id;
                        const isPicked = pickedId === t.id;
                        return (
                          <li
                            key={t.id}
                            onClick={() => !playingId && !pickedId && handlePlay(t)}
                            style={{
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              padding: "10px 10px",
                              borderRadius: 12,
                              marginBottom: 4,
                              background: "rgba(255,255,255,0.04)",
                              transition: "background 0.2s",
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                          >
                            {t.albumArt && (
                              <img src={t.albumArt} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover" }} />
                            )}
                            <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, flex: 1 }}>
                              <span style={{ fontSize: 14, fontWeight: 500, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</span>
                              <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.artists}</span>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24 }}>
                              {isPicked ? <CheckBadge /> : isPlaying ? <DotLoader size={4} color="#1ed760" /> : <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>▶</span>}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
