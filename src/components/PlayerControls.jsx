import { motion, AnimatePresence } from "framer-motion";
import { togglePlayPause, skipToNext, skipToPrevious } from "../utils/spotifyApi";
import { useDevice } from "../context/DeviceContext";

/**
 * PlayerControls — ปุ่มควบคุมเพลง (ก่อนหน้า / เล่น-หยุด / ถัดไป)
 * ดีไซน์พรีเมียม เข้าชุดกับ VolumeSlider แต่เด่นกว่า:
 * - กระจกเข้มขึ้น มีเงาหลายชั้นให้ดูมีมิติ + ฮาโล่หมุนช้าๆ อยู่ด้านหลังตลอดเวลา
 * - แต่ละปุ่มเข้าจอแบบ stagger ทีละตัว (spring pop) ไม่ใช่เข้าพร้อมกันทั้งก้อน
 * - ทุกองค์ประกอบมีอนิเมชั่นของตัวเองที่ไม่ซ้ำกัน วิ่งต่อเนื่องตลอดเวลา
 */
export default function PlayerControls({ isPlaying, animSpeed = 1 }) {
  const { targetDeviceId } = useDevice();
  const dur = (b) => b / animSpeed;

  const barVariants = {
    hidden: { opacity: 0, y: 26, scale: 0.94 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: dur(0.4),
        ease: [0.16, 1, 0.3, 1],
        staggerChildren: dur(0.09),
        delayChildren: dur(0.12),
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 18, scale: 0.5 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 20 },
    },
  };

  return (
    <AnimatePresence>
      <motion.div
        className="player-controls"
        variants={barVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        {/* ฮาโล่เรืองแสงหมุนช้าๆ ด้านหลัง — บรรยากาศพรีเมียม วิ่งตลอดเวลาไม่หยุด */}
        <span className="controls-halo" />

        <motion.button
          variants={itemVariants}
          className="control-btn"
          onClick={() => skipToPrevious(targetDeviceId)}
          title="Previous"
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.86 }}
          transition={{ type: "spring", stiffness: 420, damping: 22 }}
        >
          <span className="icon-float prev">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </span>
        </motion.button>

        <motion.button
          variants={itemVariants}
          className="control-btn play-btn"
          onClick={() => togglePlayPause(isPlaying, targetDeviceId)}
          title={isPlaying ? "Pause" : "Play"}
          whileHover={{ scale: 1.07 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 340, damping: 20 }}
        >
          {/* วงแหวนแสงขยาย-จางต่อเนื่อง ตราบใดที่กำลังเล่นเพลงอยู่ */}
          <AnimatePresence>
            {isPlaying && (
              <>
                <motion.span
                  key="pulse-1"
                  className="play-pulse"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: [0.55, 0], scale: [0.85, 1.75] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: dur(1.8), repeat: Infinity, ease: "easeOut" }}
                />
                <motion.span
                  key="pulse-2"
                  className="play-pulse gold"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: [0.35, 0], scale: [0.85, 1.75] }}
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

          <span className="play-btn-bg">
            <span className="play-btn-sheen" />
          </span>

          {/* ไอคอน play/pause สลับกันแบบ crossfade + หมุนเบาๆ */}
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
                <svg width="25" height="25" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg
                  width="25"
                  height="25"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  style={{ marginLeft: 2 }}
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </motion.span>
          </AnimatePresence>
        </motion.button>

        <motion.button
          variants={itemVariants}
          className="control-btn"
          onClick={() => skipToNext(targetDeviceId)}
          title="Next"
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.86 }}
          transition={{ type: "spring", stiffness: 420, damping: 22 }}
        >
          <span className="icon-float next">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </span>
        </motion.button>

        <style>{`
          .player-controls {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 22px;
            padding: 14px 28px;
            width: fit-content;
            box-sizing: border-box;
            border-radius: 999px;
            background:
              radial-gradient(120% 160% at 20% -10%, rgba(255, 255, 255, 0.10), transparent 60%),
              linear-gradient(180deg, rgba(20, 24, 21, 0.72), rgba(11, 13, 11, 0.6));
            backdrop-filter: blur(22px) saturate(150%);
            -webkit-backdrop-filter: blur(22px) saturate(150%);
            box-shadow:
              0 0 0 1px rgba(255, 255, 255, 0.05),
              0 24px 60px rgba(0, 0, 0, 0.5),
              0 0 44px rgba(29, 185, 84, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.09);
          }

          /* ฮาโล่หมุนช้าๆ อยู่ด้านหลัง ให้ความรู้สึกพรีเมียม/มีชีวิต ตลอดเวลา */
          .controls-halo {
            position: absolute;
            inset: -55%;
            z-index: -1;
            border-radius: 50%;
            background: conic-gradient(
              from 0deg,
              rgba(29, 185, 84, 0) 0deg,
              rgba(29, 185, 84, 0.28) 90deg,
              rgba(255, 214, 140, 0.18) 180deg,
              rgba(29, 185, 84, 0) 270deg,
              rgba(29, 185, 84, 0) 360deg
            );
            filter: blur(34px);
            animation: halo-spin 11s linear infinite;
            pointer-events: none;
          }
          @keyframes halo-spin {
            to { transform: rotate(360deg); }
          }

          .control-btn {
            position: relative;
            flex-shrink: 0;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            border: none;
            background: rgba(255, 255, 255, 0.05);
            color: rgba(255, 255, 255, 0.8);
            cursor: pointer;
            transition: background 0.2s ease, color 0.2s ease;
          }
          .control-btn:hover {
            color: #fff;
            background: rgba(255, 255, 255, 0.13);
          }

          /* ลอยขึ้น-ลงเบาๆ ต่อเนื่องคนละจังหวะ — อยู่ในลูก span ธรรมดา ไม่ใช่ element
             ที่ framer คุม transform อยู่ (ปุ่มแม่) เลยไม่มีทางชนกับ scale ของปุ่มตอน hover/tap */
          .icon-float {
            display: flex;
            animation: icon-bob 2.6s ease-in-out infinite;
          }
          .icon-float.prev { animation-delay: 0s; }
          .icon-float.next { animation-delay: 1.3s; }
          @keyframes icon-bob {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-2px); }
          }

          /* ปุ่มเล่น/หยุด — เด่นกว่าเพื่อนด้วยขนาด สี และแสง */
          .play-btn {
            width: 60px;
            height: 60px;
            color: #0a0f0b;
            overflow: visible;
          }
          .play-btn:hover {
            background: transparent;
          }

          .play-btn-bg {
            position: absolute;
            inset: 0;
            overflow: hidden;
            border-radius: 50%;
            background: linear-gradient(155deg, #24e86c, #1db954 55%, #148a41);
            box-shadow:
              0 8px 24px rgba(29, 185, 84, 0.5),
              inset 0 1px 0 rgba(255, 255, 255, 0.4),
              inset 0 -6px 10px rgba(0, 0, 0, 0.18);
            z-index: 0;
          }

          /* ประกายเงาวิ่งผ่านผิวปุ่มเล่นแบบโลหะ ต่อเนื่องตลอดเวลา — องค์ประกอบธรรมดา ไม่ใช่ motion */
          .play-btn-sheen {
            position: absolute;
            inset: 0;
            background: linear-gradient(
              115deg,
              transparent 30%,
              rgba(255, 255, 255, 0.65) 48%,
              transparent 66%
            );
            background-size: 260% 100%;
            animation: sheen-move 3.2s ease-in-out infinite;
            mix-blend-mode: overlay;
          }
          @keyframes sheen-move {
            0% { background-position: 160% 0; }
            60%, 100% { background-position: -60% 0; }
          }

          .play-icon {
            position: relative;
            z-index: 2;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .play-pulse {
            position: absolute;
            inset: 0;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(29, 185, 84, 0.55), transparent 70%);
            z-index: 1;
            pointer-events: none;
          }
          .play-pulse.gold {
            background: radial-gradient(circle, rgba(255, 214, 140, 0.4), transparent 70%);
          }

          @media (prefers-reduced-motion: reduce) {
            .player-controls,
            .controls-halo,
            .control-btn,
            .icon-float,
            .play-btn-bg,
            .play-btn-sheen,
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
