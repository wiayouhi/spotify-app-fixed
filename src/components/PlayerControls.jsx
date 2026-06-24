import { motion } from "framer-motion";
import { togglePlayPause, skipToNext, skipToPrevious } from "../utils/spotifyApi";

export default function PlayerControls({ isPlaying }) {
  return (
    <div className="player-controls">
      <button className="control-btn" onClick={skipToPrevious} title="Previous">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
        </svg>
      </button>

      <button className="control-btn play-btn" onClick={() => togglePlayPause(isPlaying)} title={isPlaying ? "Pause" : "Play"}>
        <motion.div animate={{ scale: isPlaying ? 1 : 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
          {isPlaying ? (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </motion.div>
      </button>

      <button className="control-btn" onClick={skipToNext} title="Next">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
        </svg>
      </button>
    </div>
  );
}
