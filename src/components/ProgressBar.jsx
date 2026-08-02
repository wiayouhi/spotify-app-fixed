import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { seekToPosition } from "../utils/spotifyApi";
import { useDevice } from "../context/DeviceContext";

function formatTime(ms) {
  if (!ms || ms < 0) return "0:00";
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

/**
 * ProgressBar — แถบความคืบหน้าเพลง ธีมขาว-แพลทินัมเข้าชุดกับ PlayerControls
 * - เปิดตัว: แถบ "คลี่" ออกจากซ้ายไปขวา + เวลาค่อยๆ จางเข้ามาแบบ stagger
 * - ตลอดเวลาที่กำลังเล่น: มีแถวปล้องเล็กๆ ยักขึ้น-ยักลงไล่กันเป็นคลื่นในส่วนที่เล่นไปแล้ว
 *   (เหมือนหนอน/งูเลื่อยคืบตัว) + จุดปลายเรืองแสงเต้นตาม
 * - จุดปลาย (progress-dot) จัดกึ่งกลางด้วย top+margin แทน transform เพื่อไม่ให้หลุดแนว
 *   ตอน framer-motion เขียน inline transform ทับระหว่าง animate scale
 */
export default function ProgressBar({ progressMs, durationMs, isPlaying }) {
  const [showRemaining, setShowRemaining] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const trackRef = useRef(null);
  const { targetDeviceId } = useDevice();

  const progress = durationMs > 0 ? Math.min(progressMs / durationMs, 1) : 0;
  const displayTimeLeft = durationMs - progressMs;

  // จำนวนปล้องหนอน กระจายเท่าๆ กันตลอดแนว fill
  const wormSegments = Array.from({ length: 16 }, (_, i) => i);

  const handleSeek = (e) => {
    if (!trackRef.current || !durationMs) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    seekToPosition(percentage * durationMs, targetDeviceId);
  };

  const wrapVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.45,
        ease: [0.16, 1, 0.3, 1],
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const timeVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
  };

  const trackVariants = {
    hidden: { opacity: 0, scaleX: 0 },
    visible: {
      opacity: 1,
      scaleX: 1,
      transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <motion.div
      className="progress-wrap"
      variants={wrapVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.span variants={timeVariants} className="progress-time">
        {formatTime(progressMs)}
      </motion.span>

      <motion.div
        variants={trackVariants}
        className={`progress-track ${isPlaying ? "is-playing" : ""}`}
        ref={trackRef}
        onClick={handleSeek}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <motion.div
          className="progress-fill"
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.25, ease: "linear" }}
        >
          {/* หนอน/งูเลื่อย: แถวจุดที่ยักขึ้น-ลงไล่กันเป็นคลื่น เหมือนตัวหนอนคืบ ต่อเนื่องตลอดเวลาตอนกำลังเล่น */}
          <span className="worm-track">
            {wormSegments.map((i) => (
              <span
                key={i}
                className="worm-seg"
                style={{ animationDelay: `${i * 0.09}s` }}
              />
            ))}
          </span>
          <span className="fill-sheen" />
        </motion.div>

        <motion.div
          className="progress-dot"
          initial={{ left: 0 }}
          animate={{
            left: `${progress * 100}%`,
            scale: isHovering ? 1.25 : 1,
          }}
          transition={{
            left: { duration: 0.25, ease: "linear" },
            scale: { type: "spring", stiffness: 420, damping: 20 },
          }}
        >
          {isPlaying && <span className="dot-glow" />}
        </motion.div>
      </motion.div>

      <div
        className="progress-time clickable"
        onClick={() => setShowRemaining(!showRemaining)}
        style={{ cursor: "pointer", width: "3.5rem", position: "relative" }}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={showRemaining ? "remaining" : "duration"}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)" }}
          >
            {showRemaining ? `-${formatTime(displayTimeLeft)}` : formatTime(durationMs)}
          </motion.span>
        </AnimatePresence>
      </div>

      <style>{`
        .progress-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          transform-origin: left center;
        }

        .progress-time {
          font-size: 0.75rem;
          font-variant-numeric: tabular-nums;
          color: rgba(255, 255, 255, 0.55);
          flex-shrink: 0;
          transition: color 0.2s ease;
        }
        .progress-time.clickable:hover {
          color: rgba(255, 255, 255, 0.9);
        }

        .progress-track {
          position: relative;
          flex: 1;
          height: 6px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.08);
          box-shadow:
            inset 0 1px 2px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.04);
          cursor: pointer;
          overflow: visible;
          transform-origin: left center;
          transition: height 0.15s ease, background 0.15s ease;
        }
        .progress-track:hover {
          height: 8px;
          background: rgba(255, 255, 255, 0.11);
        }

        .progress-fill {
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          border-radius: 999px;
          overflow: hidden;
          background: linear-gradient(90deg, #c9cbd4, #ffffff 60%, #ffffff);
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.35);
        }

        /* แถวปล้องหนอน กระจายเท่าๆ กันตามแนว fill */
        .worm-track {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 5px;
          pointer-events: none;
        }

        /* แต่ละปล้องยักขึ้น-ยักลงสลับกันไปเรื่อยๆ ให้เห็นเป็นคลื่นไล่กันเหมือนงู/หนอนคืบ */
        .worm-seg {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: rgba(90, 95, 110, 0.65);
          transform: translateY(0);
          opacity: 0.5;
          animation: worm-bob 1.1s ease-in-out infinite;
          animation-play-state: paused;
        }
        .progress-track.is-playing .worm-seg {
          animation-play-state: running;
        }
        @keyframes worm-bob {
          0%, 100% { transform: translateY(-2.5px); opacity: 0.35; }
          50% { transform: translateY(2.5px); opacity: 0.85; }
        }

        /* ประกายเงาวิ่งผ่านผิว fill แบบมุกเงางาม ต่อเนื่องตลอดเวลา */
        .fill-sheen {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            115deg,
            transparent 30%,
            rgba(255, 255, 255, 0.7) 48%,
            transparent 66%
          );
          background-size: 260% 100%;
          animation: sheen-move 3.4s ease-in-out infinite;
          mix-blend-mode: overlay;
        }
        @keyframes sheen-move {
          0% { background-position: 160% 0; }
          60%, 100% { background-position: -60% 0; }
        }

        .progress-dot {
          position: absolute;
          /* ใช้ top+margin แทน transform: translateY(-50%) เพราะ framer-motion
             จะเขียน inline transform ทับตอน animate scale ทำให้จุดหลุดจากเส้น */
          top: calc(50% - 6px);
          width: 12px;
          height: 12px;
          margin-left: -6px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 30%, #ffffff, #d7d9e0 70%);
          box-shadow:
            0 0 6px rgba(255, 255, 255, 0.6),
            0 2px 6px rgba(0, 0, 0, 0.35);
          z-index: 2;
        }

        /* วงแสงเต้นตุบๆ รอบจุดปลาย ตราบใดที่กำลังเล่นอยู่ */
        .dot-glow {
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.55), transparent 70%);
          animation: dot-pulse 1.8s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes dot-pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.85); }
          50% { opacity: 0.9; transform: scale(1.5); }
        }

        @media (prefers-reduced-motion: reduce) {
          .progress-wrap,
          .progress-track,
          .progress-fill,
          .worm-seg,
          .fill-sheen,
          .progress-dot,
          .dot-glow {
            transition: none !important;
            animation: none !important;
          }
        }
      `}</style>
    </motion.div>
  );
}
