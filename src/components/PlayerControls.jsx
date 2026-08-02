import { motion, AnimatePresence } from "framer-motion";
import { togglePlayPause, skipToNext, skipToPrevious } from "../utils/spotifyApi";
import { useDevice } from "../context/DeviceContext";

/**
 * PlayerControls — ปุ่มควบคุมเพลง (ก่อนหน้า / เล่น-หยุด / ถัดไป)
 * ธีมใหม่: ขาว-แพลทินัมเงางาม (จากเดิมเขียว Spotify) หรูขึ้น มีมิติขึ้น
 * - เปิดตัวแบบ "unfurl": วงแหวนแสงกระเพื่อมออกจากศูนย์กลาง ปุ่มกางออกจากปุ่มเล่นเหมือนพัด
 * - พื้นผิวมุก (pearlescent) ที่ปุ่มเล่น มีแสงวิ่งวนตลอดเวลา + อนุภาคแสงโคจรรอบปุ่ม
 * - ทุกองค์ประกอบมีจังหวะเคลื่อนไหวของตัวเอง ไม่หยุดนิ่งแม้ตอน idle
 */
export default function PlayerControls({ isPlaying, animSpeed = 1 }) {
  const { targetDeviceId } = useDevice();
  const dur = (b) => b / animSpeed;

  const barVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.82 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: dur(0.55),
        ease: [0.16, 1, 0.3, 1],
        staggerChildren: dur(0.1),
        delayChildren: dur(0.16),
      },
    },
  };

  // ปุ่มซ้าย-ขวา "กางออก" จากจุดศูนย์กลางเหมือนพัด
  const sideVariants = (fromX) => ({
    hidden: { opacity: 0, x: fromX, y: 14, scale: 0.3, rotate: fromX > 0 ? 50 : -50 },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      rotate: 0,
      transition: { type: "spring", stiffness: 260, damping: 18 },
    },
  });

  const playVariants = {
    hidden: { opacity: 0, scale: 0.35, rotate: -140 },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: { type: "spring", stiffness: 240, damping: 16, delay: dur(0.05) },
    },
  };

  // อนุภาคแสงโคจรรอบปุ่มเล่น
  const orbitDots = [0, 1, 2, 3];

  return (
    <AnimatePresence>
      <motion.div
        className="player-controls"
        variants={barVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        {/* วงแหวนกระเพื่อมออกจากศูนย์กลางตอนเปิดตัว */}
        <motion.span
          className="entry-ripple"
          initial={{ opacity: 0.9, scale: 0.2 }}
          animate={{ opacity: 0, scale: 2.4 }}
          transition={{ duration: dur(0.9), ease: "easeOut" }}
        />

        {/* ฮาโล่เรืองแสงหมุนช้าๆ ด้านหลัง — วิ่งตลอดเวลาไม่หยุด */}
        <span className="controls-halo" />
        <span className="controls-halo reverse" />

        <motion.button
          variants={sideVariants(-40)}
          className="control-btn"
          onClick={() => skipToPrevious(targetDeviceId)}
          title="Previous"
          whileHover={{ scale: 1.14 }}
          whileTap={{ scale: 0.85 }}
          transition={{ type: "spring", stiffness: 420, damping: 22 }}
        >
          <span className="icon-float prev">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </span>
        </motion.button>

        <motion.button
          variants={playVariants}
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
                  animate={{ opacity: [0.6, 0], scale: [0.85, 1.8] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: dur(1.8), repeat: Infinity, ease: "easeOut" }}
                />
                <motion.span
                  key="pulse-2"
                  className="play-pulse silver"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: [0.4, 0], scale: [0.85, 1.8] }}
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

          {/* อนุภาคแสงโคจรรอบปุ่มเล่น วิ่งตลอดเวลา */}
          <span className="orbit-wrap">
            {orbitDots.map((i) => (
              <span
                key={i}
                className={`orbit-dot dot-${i}`}
                style={{ animationDelay: `${(dur(4.8) / orbitDots.length) * i}s` }}
              />
            ))}
          </span>

          <span className="play-btn-bg">
            <span className="play-btn-sheen" />
            <span className="play-btn-shine" />
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
          variants={sideVariants(40)}
          className="control-btn"
          onClick={() => skipToNext(targetDeviceId)}
          title="Next"
          whileHover={{ scale: 1.14 }}
          whileTap={{ scale: 0.85 }}
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
              radial-gradient(120% 160% at 20% -10%, rgba(255, 255, 255, 0.14), transparent 60%),
              linear-gradient(180deg, rgba(26, 26, 30, 0.72), rgba(10, 10, 12, 0.62));
            backdrop-filter: blur(22px) saturate(150%);
            -webkit-backdrop-filter: blur(22px) saturate(150%);
            box-shadow:
              0 0 0 1px rgba(255, 255, 255, 0.07),
              0 24px 60px rgba(0, 0, 0, 0.5),
              0 0 44px rgba(255, 255, 255, 0.06),
              inset 0 1px 0 rgba(255, 255, 255, 0.12);
            animation: bar-breathe 6s ease-in-out infinite;
          }
          @keyframes bar-breathe {
            0%, 100% { box-shadow:
              0 0 0 1px rgba(255, 255, 255, 0.07),
              0 24px 60px rgba(0, 0, 0, 0.5),
              0 0 44px rgba(255, 255, 255, 0.06),
              inset 0 1px 0 rgba(255, 255, 255, 0.12); }
            50% { box-shadow:
              0 0 0 1px rgba(255, 255, 255, 0.11),
              0 24px 64px rgba(0, 0, 0, 0.52),
              0 0 58px rgba(255, 255, 255, 0.12),
              inset 0 1px 0 rgba(255, 255, 255, 0.18); }
          }

          /* วงแหวนกระเพื่อมตอนเปิดตัว */
          .entry-ripple {
            position: absolute;
            inset: -20%;
            border-radius: 999px;
            border: 1px solid rgba(255, 255, 255, 0.5);
            box-shadow: 0 0 40px rgba(255, 255, 255, 0.35);
            pointer-events: none;
            z-index: -1;
          }

          /* ฮาโล่หมุนช้าๆ อยู่ด้านหลัง ให้ความรู้สึกพรีเมียม/มีชีวิต ตลอดเวลา */
          .controls-halo {
            position: absolute;
            inset: -55%;
            z-index: -1;
            border-radius: 50%;
            background: conic-gradient(
              from 0deg,
              rgba(255, 255, 255, 0) 0deg,
              rgba(255, 255, 255, 0.3) 90deg,
              rgba(210, 214, 224, 0.2) 180deg,
              rgba(255, 255, 255, 0) 270deg,
              rgba(255, 255, 255, 0) 360deg
            );
            filter: blur(34px);
            animation: halo-spin 11s linear infinite;
            pointer-events: none;
          }
          .controls-halo.reverse {
            inset: -40%;
            opacity: 0.6;
            background: conic-gradient(
              from 90deg,
              rgba(255, 255, 255, 0) 0deg,
              rgba(200, 205, 220, 0.22) 120deg,
              rgba(255, 255, 255, 0) 240deg
            );
            filter: blur(26px);
            animation: halo-spin-reverse 17s linear infinite;
          }
          @keyframes halo-spin {
            to { transform: rotate(360deg); }
          }
          @keyframes halo-spin-reverse {
            to { transform: rotate(-360deg); }
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
            background: rgba(255, 255, 255, 0.06);
            color: rgba(255, 255, 255, 0.85);
            cursor: pointer;
            transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
          }
          .control-btn:hover {
            color: #fff;
            background: rgba(255, 255, 255, 0.16);
            box-shadow: 0 0 16px rgba(255, 255, 255, 0.18);
          }

          /* ลอยขึ้น-ลงเบาๆ ต่อเนื่องคนละจังหวะ */
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

          /* ปุ่มเล่น/หยุด — เด่นกว่าเพื่อนด้วยขนาดและผิวมุกเงางาม */
          .play-btn {
            width: 60px;
            height: 60px;
            color: #17181c;
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
            background: linear-gradient(155deg, #ffffff, #e6e7ec 55%, #c6c9d4);
            box-shadow:
              0 8px 24px rgba(255, 255, 255, 0.28),
              inset 0 1px 0 rgba(255, 255, 255, 0.9),
              inset 0 -6px 10px rgba(0, 0, 0, 0.12);
            z-index: 0;
          }

          /* ประกายเงาวิ่งผ่านผิวปุ่มเล่นแบบมุกเงางาม ต่อเนื่องตลอดเวลา */
          .play-btn-sheen {
            position: absolute;
            inset: 0;
            background: linear-gradient(
              115deg,
              transparent 30%,
              rgba(255, 255, 255, 0.85) 48%,
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

          /* ประกายแสงจุดเล็กวิ่งวนตามขอบปุ่ม ให้ความรู้สึกมุก/เพชร */
          .play-btn-shine {
            position: absolute;
            inset: -2px;
            border-radius: 50%;
            background: conic-gradient(
              from 0deg,
              transparent 0deg,
              rgba(255, 255, 255, 0.9) 8deg,
              transparent 20deg,
              transparent 360deg
            );
            animation: shine-spin 4s linear infinite;
            opacity: 0.7;
          }
          @keyframes shine-spin {
            to { transform: rotate(360deg); }
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
            background: radial-gradient(circle, rgba(255, 255, 255, 0.55), transparent 70%);
            z-index: 1;
            pointer-events: none;
          }
          .play-pulse.silver {
            background: radial-gradient(circle, rgba(200, 205, 220, 0.4), transparent 70%);
          }

          /* อนุภาคแสงโคจรรอบปุ่มเล่น */
          .orbit-wrap {
            position: absolute;
            inset: -14px;
            z-index: 1;
            pointer-events: none;
          }
          .orbit-dot {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 4px;
            height: 4px;
            margin: -2px 0 0 -2px;
            border-radius: 50%;
            background: #fff;
            box-shadow: 0 0 6px 1px rgba(255, 255, 255, 0.9);
            opacity: 0;
            animation: orbit-move 4.8s linear infinite;
          }
          @keyframes orbit-move {
            0% {
              opacity: 0;
              transform: rotate(0deg) translateX(38px) rotate(0deg) scale(0.6);
            }
            8% { opacity: 0.9; }
            50% {
              opacity: 0.6;
              transform: rotate(180deg) translateX(38px) rotate(-180deg) scale(1);
            }
            92% { opacity: 0.9; }
            100% {
              opacity: 0;
              transform: rotate(360deg) translateX(38px) rotate(-360deg) scale(0.6);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .player-controls,
            .controls-halo,
            .control-btn,
            .icon-float,
            .play-btn-bg,
            .play-btn-sheen,
            .play-btn-shine,
            .play-icon,
            .play-pulse,
            .orbit-dot,
            .entry-ripple {
              transition: none !important;
              animation: none !important;
            }
          }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
}
