import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchQueue } from "../utils/spotifyApi";

export default function QueueList({ currentTrackId, animSpeed = 1 }) {
  const [queue, setQueue] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const dur = (b) => b / animSpeed;

  const loadQueue = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const q = await fetchQueue();
      // Deduplicate by id, keep ALL tracks
      const seen = new Set();
      const unique = q.filter((t) => {
        if (seen.has(t.id)) return false;
        seen.add(t.id);
        return true;
      });
      setQueue(unique);
    } catch (e) {
      console.error("Queue fetch error", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadQueue(false);
    const interval = setInterval(() => loadQueue(true), 5000);
    return () => clearInterval(interval);
  }, [currentTrackId]);

  if (!queue || queue.length === 0) {
    return (
      <motion.div className="queue-empty-state"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ duration: dur(0.4) }}
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.06, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="rgba(255,255,255,0.25)">
            <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
          </svg>
        </motion.div>
        <span>ไม่มีรายการในคิว</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="queue-fullscreen-half"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: dur(0.5), ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Header */}
      <div className="queue-header-sticky">
        <div className="queue-header-left">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="rgba(255,255,255,0.8)">
            <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
          </svg>
          <h3 className="queue-title">รายการต่อไป</h3>
        </div>
        <div className="queue-header-right">
          <span className="queue-count">{queue.length} บทเพลง</span>
          <motion.button
            className="queue-refresh-btn"
            onClick={() => loadQueue(false)}
            animate={isRefreshing ? { rotate: 360 } : {}}
            transition={isRefreshing ? { duration: dur(0.8), repeat: Infinity, ease: "linear" } : {}}
            title="รีเฟรชคิว"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
          </motion.button>
        </div>
      </div>

      {/* List */}
      <div className="queue-scroll-area">
        <AnimatePresence mode="popLayout">
          {queue.map((track, index) => (
            <motion.div
              key={track.id}
              layout
              className="queue-item-row"
              initial={{ opacity: 0, x: 40, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -40, scale: 0.94 }}
              transition={{
                type: "spring",
                stiffness: 300 * animSpeed,
                damping: 30,
                delay: index < 12 ? index * (0.03 / animSpeed) : 0,
              }}
              whileHover={{ backgroundColor: "rgba(255,255,255,0.07)", x: 3 }}
            >
              <div className="queue-index-number">
                {(index + 1).toString().padStart(2, "0")}
              </div>

              {track.albumArt && (
                <motion.div className="queue-art-wrapper" whileHover={{ scale: 1.08 }}>
                  <img src={track.albumArt} alt="" className="queue-art-img" />
                  <div className="queue-art-overlay">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </motion.div>
              )}

              <div className="queue-meta-info">
                <span className="queue-track-name">{track.name}</span>
                <span className="queue-artist-name">{track.artists}</span>
              </div>

              {/* Duration if available */}
              {track.durationMs && (
                <span className="queue-duration">
                  {Math.floor(track.durationMs / 60000)}:{String(Math.floor((track.durationMs % 60000) / 1000)).padStart(2,"0")}
                </span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div style={{ height: "2rem" }} />
      </div>
    </motion.div>
  );
}