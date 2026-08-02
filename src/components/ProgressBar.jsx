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

const WAVELENGTH = 40; // px per full cycle — bigger = gentler, rounder curve
const WAVE_HEIGHT = 22; // overall vertical room for the wave to swing in
const AMPLITUDE = 5;
const STROKE_WIDTH = 5;
const PHASE_SPEED = 0.0045; // slither speed
const DOT_SIZE = 15;
const END_FADE_MS = 30000; // last 30s: wave animates flat

// Catmull-Rom → cubic-Bezier conversion: given a sparse set of points it
// draws a naturally rounded curve through all of them (no straight-line
// segments, no sharp corners at the peaks) — much softer than raw sine
// sampling.
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

// Builds the wave: sine curve that (a) tapers to a flat, straight tip right
// where the played portion ends, and (b) is scaled by `amplitude`, which the
// caller shrinks toward 0 during the last 30s of the track for a smooth
// wavy → straight handoff as the song wraps up.
function buildWavePath(width, amplitude, phase) {
  const mid = WAVE_HEIGHT / 2;
  if (width <= 0) return `M0 ${mid} L0 ${mid}`;

  const step = Math.max(4, WAVELENGTH / 8);
  const taperZone = Math.min(WAVELENGTH * 1.6, width);
  const pts = [];

  for (let x = 0; x <= width; x += step) {
    let env = amplitude;
    if (amplitude > 0 && x > width - taperZone) {
      env = amplitude * Math.max(0, (width - x) / taperZone);
    }
    const y = mid + env * Math.sin((2 * Math.PI * x) / WAVELENGTH + phase);
    pts.push({ x, y });
  }
  pts.push({ x: width, y: mid }); // guarantee a perfectly flat tip

  return smoothPathFromPoints(pts);
}

const timeLabelStyle = {
  fontSize: "1rem",
  fontWeight: 500,
  lineHeight: 1,
  width: "2.75rem",
  fontVariantNumeric: "tabular-nums",
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
  // both the tip taper and the last-30s flatten are always smooth, not a cut
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
      className="progress-wrap"
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
    >
      <span className="progress-time" style={{ ...timeLabelStyle, textAlign: "left" }}>
        {formatTime(progressMs)}
      </span>

      <div
        className="progress-track"
        ref={trackRef}
        onClick={handleSeek}
        style={{
          position: "relative",
          height: WAVE_HEIGHT,
          flex: 1,
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          background: "transparent", // override any default track background
          padding: 0,
          border: "none",
        }}
      >
        {/* unplayed portion — same visual weight as the wave's stroke */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "50%",
            height: STROKE_WIDTH,
            transform: "translateY(-50%)",
            borderRadius: 999,
            background: "rgba(255,255,255,0.22)",
            pointerEvents: "none",
          }}
        />

        {/* played portion — smooth white snake that flattens at its own tip */}
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
          className="progress-dot"
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
        className="progress-time clickable"
        onClick={() => setShowRemaining(!showRemaining)}
        style={{
          ...timeLabelStyle,
          cursor: "pointer",
          position: "relative",
          height: "1em",
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
              lineHeight: 1,
            }}
          >
            {showRemaining ? `-${formatTime(displayTimeLeft)}` : formatTime(durationMs)}
          </motion.span>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
