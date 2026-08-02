import { useState, useRef, useEffect } from "react";
import { motion, useAnimationFrame, AnimatePresence } from "framer-motion";
import { seekToPosition } from "../utils/spotifyApi";
import { useDevice } from "../context/DeviceContext";

function formatTime(ms) {
  if (!ms || ms < 0) return "0:00";
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

const WAVELENGTH = 64; // px per full cycle — longer = calmer, more elongated wave
const WAVE_HEIGHT = 22; // vertical room for the wave to swing in
const AMPLITUDE = 5;
const STROKE_WIDTH = 5;
const PHASE_SPEED = 0.0045; // slither speed
const DOT_SIZE = 15;
const END_FADE_MS = 30000; // last 30s: wave eases back to flat

// Catmull-Rom → cubic-Bezier: draws a naturally rounded curve through a
// sparse set of points, so there are no straight-line segments or sharp
// corners at the peaks.
function smoothPathFromPoints(points) {
  if (points.length < 2) return "";
  let d = `M${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${cp1x.toFixed(2)} ${cp1y.toFixed(2)} ${cp2x.toFixed(2)} ${cp2y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

// Builds the wave path across [0, width]. Both ends are pinned to the exact
// vertical center: it eases up from flat right at the very start of the
// track (so the line visibly "grows into" being wavy as the song begins),
// and eases back down to flat right at its own tip (current position) —
// and that tip taper shrinks further to fully flat over the final 30s.
function buildWavePath(width, amplitude, phase) {
  const mid = WAVE_HEIGHT / 2;
  if (width <= 0) return `M0 ${mid} L0 ${mid}`;

  const step = Math.max(4, WAVELENGTH / 8);
  const taperZone = Math.min(WAVELENGTH * 1.6, width / 2);
  const pts = [];

  for (let x = 0; x <= width; x += step) {
    let env = amplitude;
    if (amplitude > 0 && taperZone > 0) {
      const startEnv = x < taperZone ? x / taperZone : 1;
      const endEnv = x > width - taperZone ? Math.max(0, (width - x) / taperZone) : 1;
      env = amplitude * Math.min(startEnv, endEnv);
    }
    const y = mid + env * Math.sin((2 * Math.PI * x) / WAVELENGTH + phase);
    pts.push({ x, y });
  }
  pts.push({ x: width, y: mid }); // guarantee an exact flat tip

  return smoothPathFromPoints(pts);
}

// NOTE: this component intentionally does NOT reuse the app's old
// `.progress-wrap / .progress-track / .progress-time / .clickable` classes.
// Those carried legacy rules (background, padding, line-height, possibly a
// ::before/::after) that kept causing the phantom white block and the
// left/right label misalignment even after overriding what we could see.
// Everything below is fully self-contained inline styling instead, so there
// is nothing external left to fight with.
const timeLabelStyle = {
  fontSize: "1rem",
  fontWeight: 500,
  fontVariantNumeric: "tabular-nums",
  width: "2.75rem",
  height: "1.2rem",
  lineHeight: "1.2rem",
  margin: 0,
  padding: 0,
  border: 0,
  boxSizing: "border-box",
  color: "#fff",
};

export default function ProgressBar({ progressMs, durationMs, isPlaying }) {
  const [showRemaining, setShowRemaining] = useState(false);
  const [trackWidth, setTrackWidth] = useState(0);
  const [wavePath, setWavePath] = useState("");
  const trackRef = useRef(null);
  const phaseRef = useRef(0);
  const { targetDeviceId } = useDevice();

  const progress = durationMs > 0 ? Math.min(progressMs / durationMs, 1) : 0;
  const displayTimeLeft = durationMs - progressMs;

  // amplitude scale that smoothly ramps to 0 over the final 30s of the track
  const endScale =
    durationMs > 0 && displayTimeLeft <= END_FADE_MS
      ? Math.max(0, displayTimeLeft / END_FADE_MS)
      : 1;

  // measure the real pixel width so the wave never stretches
  useEffect(() => {
    if (!trackRef.current) return;
    const el = trackRef.current;
    const update = () => setTrackWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // continuous slither animation while playing — recalculated every frame so
  // the start-of-track ease-in, the tip taper, and the last-30s flatten are
  // all smooth, never a hard cut
  useAnimationFrame((_, delta) => {
    if (!isPlaying || trackWidth <= 0) return;
    phaseRef.current += delta * PHASE_SPEED;
    const clipWidth = progress * trackWidth;
    setWavePath(buildWavePath(clipWidth, AMPLITUDE * endScale, phaseRef.current));
  });

  // when paused (or on seek/resize) settle into a flat, static line
  useEffect(() => {
    if (isPlaying) return;
    const clipWidth = progress * trackWidth;
    setWavePath(buildWavePath(clipWidth, 0, phaseRef.current));
  }, [isPlaying, trackWidth, progress]);

  const handleSeek = (e) => {
    if (!trackRef.current || !durationMs) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    seekToPosition(percentage * durationMs, targetDeviceId);
  };

  const clipWidthPx = progress * trackWidth;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          ...timeLabelStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
        }}
      >
        {formatTime(progressMs)}
      </div>

      <div
        ref={trackRef}
        onClick={handleSeek}
        style={{
          position: "relative",
          height: WAVE_HEIGHT,
          flex: 1,
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          background: "transparent",
          margin: 0,
          padding: 0,
          border: "none",
          boxSizing: "border-box",
        }}
      >
        {/* played portion only — the unplayed remainder is fully invisible,
            no background/border/line drawn anywhere on this element */}
        {trackWidth > 0 && (
          <svg
            width={clipWidthPx}
            height={WAVE_HEIGHT}
            viewBox={`0 0 ${clipWidthPx} ${WAVE_HEIGHT}`}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              display: "block",
              overflow: "visible",
              pointerEvents: "none",
            }}
          >
            <path
              d={wavePath}
              fill="none"
              stroke="#fff"
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                filter: isPlaying
                  ? "drop-shadow(0 0 6px rgba(255,255,255,0.55))"
                  : "none",
                transition: "filter 0.3s ease",
              }}
            />
          </svg>
        )}

        {/* scrubber dot at the current position */}
        <motion.div
          initial={false}
          animate={{ left: clipWidthPx }}
          transition={{ duration: 0.1, ease: "linear" }}
          style={{
            position: "absolute",
            top: "50%",
            width: DOT_SIZE,
            height: DOT_SIZE,
            borderRadius: "50%",
            background: "#fff",
            transform: "translate(-50%, -50%)",
            boxShadow: "0 1px 6px rgba(0,0,0,0.45)",
            pointerEvents: "none",
          }}
        />
      </div>

      <div
        onClick={() => setShowRemaining(!showRemaining)}
        style={{
          ...timeLabelStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          position: "relative",
          cursor: "pointer",
          overflow: "hidden",
        }}
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
              lineHeight: timeLabelStyle.lineHeight,
              margin: 0,
              padding: 0,
            }}
          >
            {showRemaining ? `-${formatTime(displayTimeLeft)}` : formatTime(durationMs)}
          </motion.span>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
