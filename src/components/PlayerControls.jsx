import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { togglePlayPause, skipToNext, skipToPrevious } from "../utils/spotifyApi";
import { useDevice } from "../context/DeviceContext";

/**
 * PlayerControls — ปุ่มควบคุมเพลง (สุ่ม / ก่อนหน้า / เล่น-หยุด / ถัดไป / วน)
 * ธีม: ขาว-แพลทินัมเงางาม, ขนาดใหญ่ขึ้นกว่าเดิมทั้งชุด
 * - เปิดตัวแบบ "unfurl": วงแหวนแสงกระเพื่อมออกจากศูนย์กลาง ปุ่มกางออกจากปุ่มเล่นเหมือนพัด
 * - พื้นผิวมุก (pearlescent) ที่ปุ่มเล่น มีแสงวิ่งวนตลอดเวลา + อนุภาคแสงโคจรรอบปุ่ม
 * - ปุ่มสุ่ม/วน เมื่อ active จะเรืองแสงขาวนวลค้างไว้ + จุดบอกโหมด "เล่นซ้ำเพลงเดียว"
 *
 * Props เสริม (ใช้ controlled ได้ ถ้าไม่ส่งมาจะจำสถานะเองภายใน):
 *  - shuffleOn: boolean, onToggleShuffle: () => void
 *  - repeatMode: "off" | "all" | "one", onCycleRepeat: () => void
 */
export default function PlayerControls({
  isPlaying,
  animSpeed = 1,
  shuffleOn,
  onToggleShuffle,
  repeatMode,
  onCycleRepeat,
}) {
  const { targetDeviceId } = useDevice();
  const dur = (b) => b / animSpeed;

  // สถานะภายใน ใช้เมื่อไม่ได้ควบคุมจากภายนอก (uncontrolled fallback)
  const [localShuffle, setLocalShuffle] = useState(false);
  const [localRepeat, setLocalRepeat] = useState("off"); // off -> all -> one -> off

  const isShuffleOn = shuffleOn ?? localShuffle;
  const currentRepeat = repeatMode ?? localRepeat;

  const handleToggleShuffle = () => {
    if (onToggleShuffle) onToggleShuffle();
    else setLocalShuffle((v) => !v);
  };

  const handleCycleRepeat = () => {
    if (onCycleRepeat) {
      onCycleRepeat();
    } else {
      setLocalRepeat((m) => (m === "off" ? "all" : m === "all" ? "one" : "off"));
    }
  };

  const barVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.82 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: dur(0.55),
        ease: [0.16, 1, 0.3, 1],
        staggerChildren: dur(0.09),
        delayChildren: dur(0.14),
      },
    },
  };

  // ปุ่มรอบข้าง "กางออก" จากจุดศูนย์กลางเหมือนพัด ยิ่งอยู่ไกลศูนย์กลางยิ่งหมุนมาก
  const sideVariants = (fromX, rotateAmt) => ({
    hidden: { opacity: 0, x: fromX, y: 14, scale: 0.3, rotate: rotateAmt },
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
        className="player-controls-wrap"
        variants={barVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        {/* สุ่มเพลง — อยู่นอกกรอบกระจก ลอยเดี่ยวๆ ด้านซ้าย */}
        <motion.button
          variants={sideVariants(-60, -65)}
          className={`control-btn mini-btn outside-btn ${isShuffleOn ? "is-active" : ""}`}
          onClick={handleToggleShuffle}
          title={isShuffleOn ? "Shuffle: on" : "Shuffle: off"}
          whileHover={{ scale: 1.14 }}
          whileTap={{ scale: 0.85 }}
          transition={{ type: "spring", stiffness: 420, damping: 22 }}
        >
          {isShuffleOn && <span className="active-glow" />}
          <span className="icon-float shuffle">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 3l4 4-4 4v-3h-3.6c-.5 0-1 .25-1.28.68l-1.1 1.63 1.42 2.1 1.02-1.5c.1-.14.27-.22.45-.22H21v-3l4 4-4 4v-3h-3.09c-.53 0-1.03-.26-1.33-.7l-1.15-1.7-2.02 2.98c-.47.7-1.26 1.12-2.1 1.12H4v-2h6.31c.28 0 .55-.14.7-.37l1.1-1.63-1.42-2.1-1.02 1.5c-.1.14-.27.22-.45.22H4v-2h5.22c.53 0 1.03.26 1.33.7l1.15 1.7 2.02-2.98c.47-.7 1.26-1.12 2.1-1.12H17V3z" />
            </svg>
          </span>
        </motion.button>

        {/* กรอบกระจกหลัก — เหลือแค่ ก่อนหน้า / เล่น-หยุด / ถัดไป */}
        <div className="player-controls">
        {/* วงแหวนกระเพื่อมออกจากศูนย์กลางตอนเปิดตัว */}
        <motion.span
          className="entry-ripple"
          initial={{ opacity: 0.9, scale: 0.2 }}
          animate={{ opacity: 0, scale: 2.4 }}
          transition={{ duration: dur(0.9), ease: "easeOut" }}
        />

        <motion.button
          variants={sideVariants(-40, -50)}
          className="control-btn"
          onClick={() => skipToPrevious(targetDeviceId)}
          title="Previous"
          whileHover={{ scale: 1.14 }}
          whileTap={{ scale: 0.85 }}
          transition={{ type: "spring", stiffness: 420, damping: 22 }}
        >
          <span className="icon-float prev">
            <svg width="23" height="23" viewBox="0 0 24 24" fill="currentColor">
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
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg
                  width="28"
                  height="28"
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
          variants={sideVariants(40, 50)}
          className="control-btn"
          onClick={() => skipToNext(targetDeviceId)}
          title="Next"
          whileHover={{ scale: 1.14 }}
          whileTap={{ scale: 0.85 }}
          transition={{ type: "spring", stiffness: 420, damping: 22 }}
        >
          <span className="icon-float next">
            <svg width="23" height="23" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </span>
        </motion.button>
        </div>

        {/* วนเพลง — อยู่นอกกรอบกระจก ลอยเดี่ยวๆ ด้านขวา */}
        <motion.button
          variants={sideVariants(60, 65)}
          className={`control-btn mini-btn outside-btn ${currentRepeat !== "off" ? "is-active" : ""}`}
          onClick={handleCycleRepeat}
          title={
            currentRepeat === "off"
              ? "Repeat: off"
              : currentRepeat === "all"
              ? "Repeat: all"
              : "Repeat: one"
          }
          whileHover={{ scale: 1.14 }}
          whileTap={{ scale: 0.85 }}
          transition={{ type: "spring", stiffness: 420, damping: 22 }}
        >
          {currentRepeat !== "off" && <span className="active-glow" />}
          <span className="icon-float repeat">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
            </svg>
            <AnimatePresence>
              {currentRepeat === "one" && (
                <motion.span
                  className="repeat-one-dot"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                >
                  1
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        </motion.button>

        <style>{`
          .player-controls-wrap {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
            width: fit-content;
          }

          /* ปุ่มสุ่ม/วน ลอยอิสระนอกกรอบกระจก ไม่มีพื้นหลังจนกว่าจะ hover/active */
          .outside-btn {
            background: transparent;
          }
          .outside-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            box-shadow: 0 0 14px rgba(255, 255, 255, 0.12);
          }
          .outside-btn.is-active {
            background: rgba(255, 255, 255, 0.14);
          }

          .player-controls {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 18px;
            padding: 16px 30px;
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

          .control-btn {
            position: relative;
            flex-shrink: 0;
            width: 44px;
            height: 44px;
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

          /* ปุ่มสุ่ม/วน — เล็กกว่าปุ่มหลักเล็กน้อยแต่ยังใหญ่ขึ้นจากเดิม */
          .mini-btn {
            width: 38px;
            height: 38px;
            color: rgba(255, 255, 255, 0.55);
          }
          .mini-btn.is-active {
            color: #fff;
            background: rgba(255, 255, 255, 0.18);
          }
          .active-glow {
            position: absolute;
            inset: -6px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(255, 255, 255, 0.4), transparent 70%);
            animation: active-pulse 2.4s ease-in-out infinite;
            pointer-events: none;
            z-index: -1;
          }
          @keyframes active-pulse {
            0%, 100% { opacity: 0.5; transform: scale(0.9); }
            50% { opacity: 1; transform: scale(1.15); }
          }

          .repeat-one-dot {
            position: absolute;
            top: -5px;
            right: -6px;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: #fff;
            color: #17181c;
            font-size: 9px;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 8px rgba(255, 255, 255, 0.7);
          }

          /* ลอยขึ้น-ลงเบาๆ ต่อเนื่องคนละจังหวะ */
          .icon-float {
            position: relative;
            display: flex;
            animation: icon-bob 2.6s ease-in-out infinite;
          }
          .icon-float.prev { animation-delay: 0s; }
          .icon-float.next { animation-delay: 1.3s; }
          .icon-float.shuffle { animation-delay: 0.5s; animation-duration: 3.1s; }
          .icon-float.repeat { animation-delay: 1.8s; animation-duration: 3.1s; }
          @keyframes icon-bob {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-2px); }
          }

          /* ปุ่มเล่น/หยุด — เด่นกว่าเพื่อนด้วยขนาดและผิวมุกเงางาม */
          .play-btn {
            width: 68px;
            height: 68px;
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
            inset: -16px;
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
              transform: rotate(0deg) translateX(42px) rotate(0deg) scale(0.6);
            }
            8% { opacity: 0.9; }
            50% {
              opacity: 0.6;
              transform: rotate(180deg) translateX(42px) rotate(-180deg) scale(1);
            }
            92% { opacity: 0.9; }
            100% {
              opacity: 0;
              transform: rotate(360deg) translateX(42px) rotate(-360deg) scale(0.6);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .player-controls-wrap,
            .player-controls,
            .control-btn,
            .icon-float,
            .play-btn-bg,
            .play-btn-sheen,
            .play-btn-shine,
            .play-icon,
            .play-pulse,
            .orbit-dot,
            .entry-ripple,
            .active-glow {
              transition: none !important;
              animation: none !important;
            }
          }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
}
