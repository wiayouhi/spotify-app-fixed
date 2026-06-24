import { motion, AnimatePresence } from "framer-motion";

export default function TrackInfo({ track }) {
  return (
    <div className="track-info">
      <AnimatePresence mode="wait">
        <motion.div
          key={track?.id || "none"}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={{
            visible: { transition: { staggerChildren: 0.1 } }
          }}
        >
          <motion.h1 
            className="track-title"
            variants={{
              hidden: { opacity: 0, y: 16 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
              exit: { opacity: 0, y: -16, transition: { duration: 0.3 } }
            }}
          >
            {track?.name || "ไม่มีเพลงกำลังเล่น"}
          </motion.h1>
          
          <motion.p 
            className="track-artist"
            variants={{
              hidden: { opacity: 0, y: 16 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
              exit: { opacity: 0, y: -16, transition: { duration: 0.3 } }
            }}
          >
            {track?.artists || ""}
          </motion.p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
