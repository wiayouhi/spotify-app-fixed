import { motion, AnimatePresence } from "framer-motion";

/**
 * LyricsTicker — แสดงเนื้อเพลงบรรทัดเดียวแบบ slide animation
 * ถ้า showLyrics=false ซ่อนตัวเองด้วย AnimatePresence
 */
export default function LyricsTicker({ synced, plain, currentLineIndex, trackId, show, animSpeed = 1 }) {
  const dur = (base) => base / animSpeed;

  const currentText = synced
    ? (synced[currentLineIndex]?.text || "")
    : plain
      ? plain.split("\n")[0] || ""
      : "";

  const hasContent = !!currentText.trim();

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          key="ticker-wrap"
          className="lyrics-ticker-wrap"
          initial={{ opacity: 0, height: 0, marginTop: 0 }}
          animate={{ opacity: 1, height: "auto", marginTop: "0.6rem" }}
          exit={{ opacity: 0, height: 0, marginTop: 0 }}
          transition={{ duration: dur(0.4), ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="lyrics-ticker-inner">
            {/* music note icon */}
            <div className="ticker-icon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
            <div className="ticker-text-clip">
              <AnimatePresence mode="wait">
                {hasContent ? (
                  <motion.span
                    key={`ticker-${trackId}-${currentLineIndex}`}
                    className="ticker-text"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: dur(0.32), ease: "easeOut" }}
                  >
                    {currentText}
                  </motion.span>
                ) : (
                  <motion.span
                    key="ticker-empty"
                    className="ticker-text ticker-empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: dur(0.25) }}
                  >
                    ♩ ♪ ♫ ♬
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
