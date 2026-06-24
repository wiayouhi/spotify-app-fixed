import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchQueue } from "../utils/spotifyApi";

export default function MiniNextTrack({ currentTrackId }) {
  const [nextTrack, setNextTrack] = useState(null);

  useEffect(() => {
    let cancelled = false;
    
    const updateNextTrack = async () => {
      const q = await fetchQueue();
      if (cancelled) return;
      const uniqueQueue = q.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
      setNextTrack(uniqueQueue.length > 0 ? uniqueQueue[0] : null);
    };

    updateNextTrack();
    const interval = setInterval(updateNextTrack, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [currentTrackId]);

  return (
    <div style={{ height: "40px", marginTop: "1rem" }}>
      <AnimatePresence mode="wait">
        {nextTrack && (
          <motion.div
            key={nextTrack.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="mini-next-track"
          >
            <span className="mini-next-label">ต่อไป:</span>
            <span className="mini-next-title">{nextTrack.name}</span>
            <span className="mini-next-artist">• {nextTrack.artists}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
