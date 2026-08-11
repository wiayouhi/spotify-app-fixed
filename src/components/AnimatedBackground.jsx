import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useMotionValue,
  useMotionTemplate,
  animate,
} from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

// หยุด animation เมื่อ tab ถูกซ่อน
function usePageVisible() {
  const [visible, setVisible] = useState(!document.hidden);
  useEffect(() => {
    const handler = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);
  return visible;
}

// ===== ไล่สีแบบนุ่ม ๆ เมื่อ target color เปลี่ยน (ไม่ผูกกับ remount) =====
function useSmoothColor(target, duration = 1.8) {
  const mv = useMotionValue(target);
  useEffect(() => {
    const controls = animate(mv, target, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });
    return controls.stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return mv;
}

// ===== สร้าง clip-path รูปคลื่น ที่ตำแหน่ง progress (0-1) ปาดจากซ้ายไปขวา =====
function waveClipPath(progress, { waves = 3, amplitude = 6 } = {}) {
  const steps = 24;
  const edgeX = progress * 100; // % ตำแหน่งขอบคลื่นหลัก
  let top = [];
  let bottom = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const wave = Math.sin(t * Math.PI * 2 * waves + progress * Math.PI * 2) * amplitude;
    const x = Math.max(0, Math.min(100, edgeX + wave));
    top.push(`${x}% ${t * 100}%`);
  }
  // ปิดรูปด้านซ้าย (พื้นที่ที่ reveal แล้ว)
  const points = [`0% 0%`, ...top, `0% 100%`];
  return `polygon(${points.join(",")})`;
}

function useWaveClipPath(playKey) {
  return useMemo(() => {
    const frames = [];
    const N = 12;
    for (let i = 0; i <= N; i++) frames.push(waveClipPath(i / N));
    return frames;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playKey]);
}

// ===== เอฟเฟกต์ transition แบบต่าง ๆ =====
function buildTransitions(waveFrames) {
  return [
    {
      name: "zoom-in-blur",
      initial: { opacity: 0, scale: 1.3, filter: "blur(16px)" },
      animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
      exit: { opacity: 0, scale: 0.92, filter: "blur(10px)" },
      transition: { duration: 1.8, ease: [0.22, 1, 0.36, 1] },
    },
    {
      name: "zoom-out",
      initial: { opacity: 0, scale: 0.72, filter: "blur(4px)" },
      animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
      exit: { opacity: 0, scale: 1.22, filter: "blur(8px)" },
      transition: { duration: 1.9, ease: [0.22, 1, 0.36, 1] },
    },
    {
      name: "diagonal-wipe",
      initial: { clipPath: "polygon(0 0,0 0,0 100%,0 100%)", opacity: 1 },
      animate: { clipPath: "polygon(0 0,100% 0,100% 100%,0 100%)", opacity: 1 },
      exit: { clipPath: "polygon(100% 0,100% 0,100% 100%,100% 100%)", opacity: 1 },
      transition: { duration: 1.6, ease: [0.65, 0, 0.35, 1] },
    },
    {
      name: "iris-reveal",
      initial: { clipPath: "circle(0% at 50% 50%)", opacity: 1, scale: 1.04 },
      animate: { clipPath: "circle(75% at 50% 50%)", opacity: 1, scale: 1 },
      exit: { clipPath: "circle(0% at 50% 50%)", opacity: 1, scale: 0.97 },
      transition: { duration: 1.7, ease: [0.22, 1, 0.36, 1] },
    },
    {
      name: "rotate-zoom",
      initial: { opacity: 0, scale: 1.15, rotate: -3, filter: "blur(6px)" },
      animate: { opacity: 1, scale: 1, rotate: 0, filter: "blur(0px)" },
      exit: { opacity: 0, scale: 1.1, rotate: 3, filter: "blur(6px)" },
      transition: { duration: 1.8, ease: [0.22, 1, 0.36, 1] },
    },
    // คลื่นทะเลปาดเข้ามา
    {
      name: "wave-wipe",
      initial: { clipPath: waveFrames[0], opacity: 1 },
      animate: { clipPath: waveFrames, opacity: 1 },
      exit: { opacity: 0, transition: { duration: 0.6 } },
      transition: { duration: 2.1, ease: "easeInOut", times: waveFrames.map((_, i) => i / (waveFrames.length - 1)) },
    },
  ];
}

function pickRandom(pool, excludeName) {
  const filtered = excludeName ? pool.filter((t) => t.name !== excludeName) : pool;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export default function AnimatedBackground({ colors, trackId }) {
  const visible = usePageVisible();
  const prefersReduced = useReducedMotion();
  const animateBlobs = visible && !prefersReduced;

  // --- สีพื้นหลังไล่แบบนุ่ม ๆ ตลอดเวลา ไม่ผูกกับ remount ---
  const secondary = useSmoothColor(colors.secondary);
  const primary = useSmoothColor(colors.primary);
  const p3 = useSmoothColor(colors.palette?.[2] || colors.primary);
  const p4 = useSmoothColor(colors.palette?.[3] || colors.secondary);
  const baseGradient = useMotionTemplate`linear-gradient(135deg, ${secondary}, #05050a)`;

  const waveFrames = useWaveClipPath(trackId);
  const transitions = useMemo(() => buildTransitions(waveFrames), [waveFrames]);

  const lastName = useRef(null);
  const transition = useMemo(() => {
    const t = pickRandom(transitions, lastName.current);
    lastName.current = t.name;
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackId]);

  return (
    <div className="bg-root">
      {/* เลเยอร์สีพื้นถาวร ไล่สีนุ่ม ๆ เอง ไม่กระพริบ ไม่ remount */}
      <motion.div className="bg-base" style={{ background: baseGradient }} />

      {/* เลเยอร์เอฟเฟกต์ reveal (wipe / zoom / wave) วางทับ */}
      <AnimatePresence mode="sync">
        <motion.div
          key={trackId || "default"}
          className="bg-fade-layer"
          initial={transition.initial}
          animate={transition.animate}
          exit={transition.exit}
          transition={transition.transition}
          style={{ willChange: "clip-path, transform, filter, opacity" }}
        >
          <motion.div className="bg-blob bg-blob-1" style={{ background: primary }}
            animate={animateBlobs ? { x: [0, 120, -80, 0], y: [0, -100, 80, 0], scale: [1, 1.25, 0.85, 1] } : {}}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} />
          <motion.div className="bg-blob bg-blob-2" style={{ background: secondary }}
            animate={animateBlobs ? { x: [0, -140, 100, 0], y: [0, 120, -60, 0], scale: [1, 0.8, 1.3, 1] } : {}}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} />
          <motion.div className="bg-blob bg-blob-3" style={{ background: p3 }}
            animate={animateBlobs ? { x: [0, 80, -120, 0], y: [0, -60, 100, 0], scale: [1, 1.2, 0.75, 1] } : {}}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} />
          <motion.div className="bg-blob bg-blob-4" style={{ background: p4 }}
            animate={animateBlobs ? { x: [0, -60, 90, 0], y: [0, 70, -90, 0], scale: [0.8, 1.1, 0.9, 0.8] } : {}}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 3 }} />

          {animateBlobs && [...Array(8)].map((_, i) => (
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
              transition={{ duration: 4 + i * 1.2, repeat: Infinity, delay: i * 0.6, ease: "easeInOut" }}
            />
          ))}

          <motion.div className="bg-ring" style={{ borderColor: colors.primary }}
            animate={animateBlobs ? { scale: [1, 1.08, 1], opacity: [0.08, 0.18, 0.08] } : {}}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />

          <div className="bg-noise" />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
