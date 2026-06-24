import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { seekToPosition } from "../utils/spotifyApi";

function formatTime(ms) {
  if (!ms || ms < 0) return "0:00";
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export default function ProgressBar({ progressMs, durationMs, isPlaying }) {
  const [showRemaining, setShowRemaining] = useState(false);
  const trackRef = useRef(null);
  
  const progress = durationMs > 0 ? Math.min(progressMs / durationMs, 1) : 0;
  const displayTimeLeft = durationMs - progressMs;

  const handleSeek = (e) => {
    if (!trackRef.current || !durationMs) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    seekToPosition(percentage * durationMs);
  };

  return (
    <div className="progress-wrap">
      <span className="progress-time">{formatTime(progressMs)}</span>
      <div className="progress-track" ref={trackRef} onClick={handleSeek}>
        <motion.div
          className="progress-fill"
          style={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.1, ease: "linear" }}
        />
        <motion.div
          className="progress-dot"
          style={{ left: `${progress * 100}%` }}
          transition={{ duration: 0.1, ease: "linear" }}
        />
      </div>
      <div 
        className="progress-time clickable" 
        onClick={() => setShowRemaining(!showRemaining)}
        style={{ cursor: "pointer", width: "3.5rem", position: "relative" }}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={showRemaining ? "remaining" : "duration"}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)" }}
          >
            {showRemaining ? `-${formatTime(displayTimeLeft)}` : formatTime(durationMs)}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}
