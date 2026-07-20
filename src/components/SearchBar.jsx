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

// Animation Variants
const panelVariants = {
  hidden: { opacity: 0, y: -15, scale: 0.95, filter: "blur(8px)" },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1, 
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 300, damping: 24 }
  },
  exit: { 
    opacity: 0, 
    y: -10, 
    scale: 0.98, 
    filter: "blur(4px)",
    transition: { duration: 0.2 }
  }
};

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 }
};

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
    }, 500);
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
      <motion.button 
        className="search-btn" 
        onClick={() => setOpen((o) => !o)} 
        title="ค้นหาเพลง"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="search-panel"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="search-input-wrapper">
              <svg className="search-icon-inner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                autoFocus
                className="search-input"
                placeholder="ค้นหาเพลง ศิลปิน หรืออัลบั้ม..."
                value={query}
                onChange={handleInput}
                onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
              />
            </div>

            {/* Loading State for Search */}
            {loading && (
              <div className="search-loading">
                <motion.div className="dot" animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
                <motion.div className="dot" animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
                <motion.div className="dot" animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
              </div>
            )}

            {/* Results List */}
            {!loading && results.length > 0 && (
              <motion.ul 
                className="search-results"
                variants={listVariants}
                initial="hidden"
                animate="visible"
              >
                {results.map((t) => (
                  <motion.li 
                    key={t.id} 
                    className="search-result-item" 
                    variants={itemVariants}
                    whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.08)" }}
                    onClick={() => handlePlay(t)}
                  >
                    <div className="img-container">
                      {t.albumArt ? (
                        <img src={t.albumArt} alt={t.name} className="search-result-art" />
                      ) : (
                        <div className="search-result-art-placeholder" />
                      )}
                      
                      {/* Play overlay / Loading spinner on the image */}
                      <div className={`play-overlay ${playingId === t.id ? 'active' : ''}`}>
                        {playingId === t.id ? (
                          <svg className="spinner" viewBox="0 0 50 50">
                            <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                          </svg>
                        ) : (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                        )}
                      </div>
                    </div>

                    <div className="search-result-info">
                      <span className="search-result-name">{t.name}</span>
                      <span className="search-result-artist">{t.artists}</span>
                    </div>
                  </motion.li>
                ))}
              </motion.ul>
            )}

            {!loading && query.trim() !== "" && results.length === 0 && (
              <div className="search-empty">ไม่พบเพลงที่ค้นหา</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
