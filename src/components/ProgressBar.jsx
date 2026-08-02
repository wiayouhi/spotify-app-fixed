import { useState, useRef, useEffect, useMemo } from "react";
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

// wavelength/height of the snake wave, in svg units (px, since viewBox = pixel width)
const WAVELENGTH = 22;
const WAVE_HEIGHT = 20;

// builds a smooth sine path covering `width + WAVELENGTH` px so the pattern
// can be shifted by exactly one wavelength and loop seamlessly forever
function buildWavePath(width, amplitude) {
  if (width <= 0) return "";
  const span = width + WAVELENGTH;
  const step = 2; // sample every 2px, smooth enough & cheap
  const mid = WAVE_HEIGHT / 2;
  let d = `M0 ${mid}`;
  for (let x = 0; x <= span; x += step) {
    const y = mid + amplitude * Math.sin((2 * Math.PI * x) / WAVELENGTH);
    d += ` L${x} ${y.toFixed(2)}`;
  }
  return d;
}

export default function ProgressBar({ progressMs, durationMs, isPlaying }) {
  const [showRemaining, setShowRemaining] = useState(false);
  const [trackWidth, setTrackWidth] = useState(0);
  const trackRef = useRef(null);
  const { targetDeviceId } = useDevice();

  const progress = durationMs > 0 ? Math.min(progressMs / durationMs, 1) : 0;
  const displayTimeLeft = durationMs - progressMs;

  // measure track width so the wave path always matches real pixels (no stretching)
  useEffect(() => {
    if (!trackRef.current) return;
    const el = trackRef.current;
    const update = () => setTrackWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const amplitude = isPlaying ? 3.4 : 0;
  const wavePath = useMemo(
    () => buildWavePath(trackWidth, amplitude),
    [trackWidth, amplitude]
  );

  const handleSeek = (e) => {
    if (!trackRef.current || !durationMs) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    seekToPosition(percentage * durationMs, targetDeviceId);
  };

  return (
    <motion.div
      className="progress-wrap"
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <span className="progress-time">{formatTime(progressMs)}</span>

      <div
        className="progress-track"
        ref={trackRef}
        onClick={handleSeek}
        style={{
          position: "relative",
          height: WAVE_HEIGHT,
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
        }}
      >
        {/* quiet baseline track */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "50%",
            height: 2,
            transform: "translateY(-50%)",
            borderRadius: 2,
            background: "rgba(255,255,255,0.18)",
          }}
        />

        {/* played portion: clipped wrapper reveals only the snake up to progress */}
        <motion.div
          initial={false}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.1, ease: "linear" }}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            overflow: "hidden",
            willChange: "width",
          }}
        >
          {trackWidth > 0 && (
            <motion.svg
              width={trackWidth + WAVELENGTH}
              height={WAVE_HEIGHT}
              viewBox={`0 0 ${trackWidth + WAVELENGTH} ${WAVE_HEIGHT}`}
              style={{ display: "block", overflow: "visible" }}
              animate={isPlaying ? { x: [0, -WAVELENGTH] } : { x: 0 }}
              transition={
                isPlaying
                  ? { duration: 0.9, ease: "linear", repeat: Infinity }
                  : { duration: 0.3, ease: "easeOut" }
              }
            >
              <motion.path
                d={wavePath}
                fill="none"
                stroke="var(--accent-color, #1DB954)"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                animate={{ d: wavePath }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                style={{
                  filter: isPlaying
                    ? "drop-shadow(0 0 4px var(--accent-color, #1DB954))"
                    : "none",
                }}
              />
            </motion.svg>
          )}
        </motion.div>

        {/* scrubber dot */}
        <motion.div
          className="progress-dot"
          initial={false}
          animate={{ left: `${progress * 100}%` }}
          transition={{ duration: 0.1, ease: "linear" }}
          style={{
            position: "absolute",
            top: "50%",
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "#fff",
            transform: "translate(-50%, -50%)",
            boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
            pointerEvents: "none",
          }}
        />
      </div>

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
            style={{
              position: "absolute",
              right: 0,
              top: "50%",
              transform: "translateY(-50%)",
            }}
          >
            {showRemaining ? `-${formatTime(displayTimeLeft)}` : formatTime(durationMs)}
          </motion.span>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
