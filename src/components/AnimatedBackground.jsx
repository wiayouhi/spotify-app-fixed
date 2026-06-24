import { motion, AnimatePresence } from "framer-motion";

export default function AnimatedBackground({ colors, trackId }) {
  return (
    <div className="bg-root">
      <AnimatePresence mode="sync">
        <motion.div
          key={trackId || "default"}
          className="bg-fade-layer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4, ease: "easeInOut" }}
        >
          <div
            className="bg-base"
            style={{ background: `linear-gradient(135deg, ${colors.secondary}, #05050a)` }}
          />

          {/* Main blobs */}
          <motion.div
            className="bg-blob bg-blob-1"
            style={{ background: colors.primary }}
            animate={{ x: [0, 120, -80, 0], y: [0, -100, 80, 0], scale: [1, 1.25, 0.85, 1] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="bg-blob bg-blob-2"
            style={{ background: colors.secondary }}
            animate={{ x: [0, -140, 100, 0], y: [0, 120, -60, 0], scale: [1, 0.8, 1.3, 1] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="bg-blob bg-blob-3"
            style={{ background: colors.palette?.[2] || colors.primary }}
            animate={{ x: [0, 80, -120, 0], y: [0, -60, 100, 0], scale: [1, 1.2, 0.75, 1] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Extra accent blob */}
          <motion.div
            className="bg-blob bg-blob-4"
            style={{ background: colors.palette?.[3] || colors.secondary }}
            animate={{ x: [0, -60, 90, 0], y: [0, 70, -90, 0], scale: [0.8, 1.1, 0.9, 0.8] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          />

          {/* Floating particles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="bg-particle"
              style={{ "--pi": i, background: i % 2 === 0 ? colors.primary : colors.secondary }}
              animate={{
                y: [0, -60 - i * 10, 0],
                x: [0, (i % 2 === 0 ? 1 : -1) * (20 + i * 8), 0],
                opacity: [0.15, 0.5, 0.15],
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 4 + i * 1.2,
                repeat: Infinity,
                delay: i * 0.6,
                ease: "easeInOut",
              }}
            />
          ))}

          {/* Shimmer ring */}
          <motion.div
            className="bg-ring"
            style={{ borderColor: colors.primary }}
            animate={{ scale: [1, 1.08, 1], opacity: [0.08, 0.18, 0.08] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="bg-noise" />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
