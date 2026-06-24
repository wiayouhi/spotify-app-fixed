import { motion, AnimatePresence } from "framer-motion";

export default function AlbumArt({ track, isPlaying }) {
  return (
    <div className="album-art-wrap">
      <AnimatePresence mode="wait">
        {track?.albumArt && (
          <motion.div
            key={track.id}
            className="album-art-card"
            initial={{ opacity: 0, scale: 0.85, rotate: -3, y: 30 }}
            animate={{
              opacity: 1,
              scale: 1,
              rotate: 0,
              y: 0,
            }}
            exit={{ opacity: 0, scale: 0.85, rotate: 3, y: -30 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.img
              src={track.albumArt}
              alt={`${track.album} cover`}
              className="album-art-img"
              animate={
                isPlaying
                  ? { scale: [1, 1.03, 1] }
                  : { scale: 1 }
              }
              transition={{
                duration: 6,
                repeat: isPlaying ? Infinity : 0,
                ease: "easeInOut",
              }}
            />
            <div className="album-art-shine" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
