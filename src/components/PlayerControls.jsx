import { motion, AnimatePresence } from "framer-motion";
import { togglePlayPause, skipToNext, skipToPrevious } from "../utils/spotifyApi";
import { useDevice } from "../context/DeviceContext";

/**
 * PlayerControls — ปุ่มควบคุมเพลง (ก่อนหน้า / เล่น-หยุด / ถัดไป)
 * ดีไซน์ให้เข้าชุดกับ VolumeSlider (กระจกโปร่งใส, ไม่มีขอบ, โทนเขียว Spotify)
 * แต่เด่นกว่า เพราะปุ่มเล่นตรงกลางใหญ่กว่า มีแสงเรืองต่อเนื่องตอนกำลังเล่นอยู่
 */
export default function PlayerControls({ isPlaying, animSpeed = 1 }) {
  const { targetDeviceId } = useDevice();
  const dur = (b) => b / animSpeed;

  return (
    <AnimatePresence>
      <motion.div
        className="player-controls"
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 28, scale: 0.96 }}
        transition={{ duration: dur(0.45), ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.button
          className="control-btn"
          onClick={() => skipToPrevious(targetDeviceId)}
          title="Previous"
          whileHover={{ scale: 1.1, x: -2 }}
          whileTap={{ scale: 0.88 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
          </svg>
        </motion.button>

        <motion.button
          className="control-btn play-btn"
          onClick={() => togglePlayPause(isPlaying, targetDeviceId)}
          title={isPlaying ? "Pause" : "Play"}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: "spring", stiffness: 350, damping: 20 }}
        >
          {/* แสงเรืองต่อเนื่อง วิ่งเป็นวงขยาย-จาง ตราบใดที่กำลังเล่นเพลงอยู่ */}
          <AnimatePresence>
            {isPlaying && (
              <>
                <motion.span
                  key="pulse-1"
                  className="play-pulse"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: [0.55, 0], scale: [0.9, 1.7] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: dur(1.8), repeat: Infinity, ease: "easeOut" }}
                />
                <motion.span
                  key="pulse-2"
                  className="play-pulse"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: [0.4, 0], scale: [0.9, 1.7] }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: dur(1.8),
                    repeat: Infinity,
                    ease: "easeOut",
                    delay: dur(0.9),
                  }}
                />
              </>
            )}
          </AnimatePresence>

          <span className="play-btn-bg" />

          {/* ไอคอน play/pause สลับกันแบบ crossfade + หมุนนิดๆ */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={isPlaying ? "pause" : "play"}
              className="play-icon"
              initial={{ opacity: 0, scale: 0.5, rotate: -25 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.5, rotate: 25 }}
              transition={{ duration: dur(0.22), ease: [0.34, 1.56, 0.64, 1] }}
            >
              {isPlaying ? (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 2 }}>
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </motion.span>
          </AnimatePresence>
        </motion.button>

        <motion.button
          className="control-btn"
          onClick={() => skipToNext(targetDeviceId)}
          title="Next"
          whileHover={{ scale: 1.1, x: 2 }}
          whileTap={{ scale: 0.88 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
        </motion.button>

        <style>{`
          .player-controls {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 18px;
            padding: 10px 22px;
            width: fit-content;
            box-sizing: border-box;
            border-radius: 999px;
            background: linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.08),
              rgba(255, 255, 255, 0.03)
            );
            backdrop-filter: blur(18px) saturate(140%);
            -webkit-backdrop-filter: blur(18px) saturate(140%);
            box-shadow: 0 10px 36px rgba(0, 0, 0, 0.32),
              inset 0 1px 0 rgba(255, 255, 255, 0.07);
          }

          .control-btn {
            position: relative;
            flex-shrink: 0;
            width: 38px;
            height: 38px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            border: none;
            background: rgba(255, 255, 255, 0.05);
            color: rgba(255, 255, 255, 0.75);
            cursor: pointer;
            transition: background 0.2s ease, color 0.2s ease;
          }
          .control-btn:hover {
            color: #fff;
            background: rgba(255, 255, 255, 0.12);
          }

          /* ปุ่มเล่น/หยุด — เด่นกว่าเพื่อนด้วยขนาด, สี, และแสงเรือง */
          .play-btn {
            width: 56px;
            height: 56px;
            color: #0b0f0c;
            overflow: visible;
          }
          .play-btn:hover {
            background: transparent;
          }

          .play-btn-bg {
            position: absolute;
            inset: 0;
            border-radius: 50%;
            background: linear-gradient(155deg, #21e065, #1db954 65%, #17a34a);
            box-shadow: 0 6px 20px rgba(29, 185, 84, 0.45),
              inset 0 1px 0 rgba(255, 255, 255, 0.35);
            z-index: 0;
          }

          .play-icon {
            position: relative;
            z-index: 2;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          /* วงแหวนแสงขยายจางต่อเนื่อง ตราบใดที่กำลังเล่นอยู่ — signature ของปุ่มนี้ */
          .play-pulse {
            position: absolute;
            inset: 0;
            border-radius: 50%;
            background: radial-gradient(
              circle,
              rgba(29, 185, 84, 0.55),
              transparent 70%
            );
            z-index: 1;
            pointer-events: none;
          }

          @media (prefers-reduced-motion: reduce) {
            .player-controls,
            .control-btn,
            .play-btn-bg,
            .play-icon,
            .play-pulse {
              transition: none !important;
              animation: none !important;
            }
          }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
}
