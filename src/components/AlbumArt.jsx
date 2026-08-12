import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export default function AlbumArt({ track, isPlaying, colors }) {
  const [loaded, setLoaded] = useState(false);
  const glow = colors?.primary || "#ffffff";

  useEffect(() => {
    setLoaded(false);
  }, [track?.id]);

  return (
    <div className="album-art-stage">
      {/* เงาเรืองแสงด้านหลัง ไล่สีตามเพลง */}
      <motion.div
        className="album-glow"
        animate={{
          background: `radial-gradient(circle, ${glow}55, transparent 70%)`,
          scale: isPlaying ? [1, 1.08, 1] : 1,
        }}
        transition={{
          background: { duration: 1.2, ease: "easeInOut" },
          scale: { duration: 4, repeat: isPlaying ? Infinity : 0, ease: "easeInOut" },
        }}
      />

      {/* วงแหวน vinyl ด้านหลังปก โผล่มานิดหน่อยตอนเล่น */}
      <motion.div
        className="album-vinyl"
        animate={{
          rotate: isPlaying ? 360 : 0,
          x: isPlaying ? 14 : 0,
          opacity: isPlaying ? 1 : 0,
        }}
        transition={{
          rotate: { duration: 8, repeat: isPlaying ? Infinity : 0, ease: "linear" },
          x: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
          opacity: { duration: 0.5 },
        }}
      >
        <div className="album-vinyl-grooves" />
        <div className="album-vinyl-label" style={{ background: glow }} />
      </motion.div>

      {/* ตัวปกจริง — cross-fade + zoom เบา ๆ ตอนเปลี่ยนเพลง */}
      <div className="album-art-frame">
        <AnimatePresence mode="popLayout">
          {track?.albumArt && (
            <motion.img
              key={track.id || "empty"}
              src={track.albumArt}
              alt={track.name || "album art"}
              className="album-art-img"
              initial={{ opacity: 0, scale: 1.08, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.95, filter: "blur(6px)" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              onLoad={() => setLoaded(true)}
            />
          )}
        </AnimatePresence>

        {/* แถบแสงปาดผ่าน ตอนโหลดเสร็จ */}
        <AnimatePresence>
          {loaded && (
            <motion.div
              key={`shine-${track?.id}`}
              className="album-shine"
              initial={{ x: "-120%", opacity: 0 }}
              animate={{ x: "120%", opacity: [0, 0.6, 0] }}
              transition={{ duration: 1.1, ease: "easeInOut" }}
            />
          )}
        </AnimatePresence>

        {/* ขอบไล่สีบาง ๆ ตามสีเพลง */}
        <motion.div
          className="album-art-border"
          animate={{ boxShadow: `0 0 0 1.5px ${glow}55 inset` }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        />
      </div>

      {/* เงาสะท้อนด้านล่าง */}
      {track?.albumArt && (
        <div
          className="album-reflection"
          style={{ backgroundImage: `url(${track.albumArt})` }}
        />
      )}
    </div>
  );
}
