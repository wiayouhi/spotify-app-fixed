import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

// หยุด animation เมื่อ tab ถูกซ่อน ประหยัด CPU/GPU
function usePageVisible() {
  const [visible, setVisible] = useState(!document.hidden);
  useEffect(() => {
    const handler = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);
  return visible;
}

// ===== เอฟเฟกต์ทรานซิชันแบบต่าง ๆ (สุ่มเลือกทุกครั้งที่เปลี่ยนเพลง) =====
const TRANSITIONS = [
  // 1. ซูมเข้าแบบเบลอ
  {
    name: "zoom-in-blur",
    initial: { opacity: 0, scale: 1.35, filter: "blur(18px)" },
    animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
    exit: { opacity: 0, scale: 0.9, filter: "blur(14px)" },
    transition: { duration: 1.3, ease: [0.22, 1, 0.36, 1] },
  },
  // 2. ซูมออก
  {
    name: "zoom-out",
    initial: { opacity: 0, scale: 0.65, filter: "blur(6px)" },
    animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
    exit: { opacity: 0, scale: 1.3, filter: "blur(10px)" },
    transition: { duration: 1.4, ease: [0.22, 1, 0.36, 1] },
  },
  // 3. ปาดสีแนวทแยง (clip-path wipe)
  {
    name: "diagonal-wipe",
    initial: { clipPath: "polygon(0 0, 0 0, 0 100%, 0 100%)", opacity: 1 },
    animate: { clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)", opacity: 1 },
    exit: { clipPath: "polygon(100% 0, 100% 0, 100% 100%, 100% 100%)", opacity: 1 },
    transition: { duration: 1.1, ease: [0.65, 0, 0.35, 1] },
  },
  // 4. ปาดสีแนวนอนกลับด้าน
  {
    name: "horizontal-wipe-reverse",
    initial: { clipPath: "inset(0 0 0 100%)", opacity: 1 },
    animate: { clipPath: "inset(0 0 0 0%)", opacity: 1 },
    exit: { clipPath: "inset(0 100% 0 0)", opacity: 1 },
    transition: { duration: 1.1, ease: [0.65, 0, 0.35, 1] },
  },
  // 5. เปิดจากตรงกลางแบบวงกลม (iris)
  {
    name: "iris-reveal",
    initial: { clipPath: "circle(0% at 50% 50%)", opacity: 1, scale: 1.05 },
    animate: { clipPath: "circle(75% at 50% 50%)", opacity: 1, scale: 1 },
    exit: { clipPath: "circle(0% at 50% 50%)", opacity: 1, scale: 0.95 },
    transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] },
  },
  // 6. ปาดสีแนวตั้งจากบน
  {
    name: "vertical-wipe-down",
    initial: { clipPath: "inset(0 0 100% 0)", opacity: 1 },
    animate: { clipPath: "inset(0 0 0% 0)", opacity: 1 },
    exit: { clipPath: "inset(100% 0 0 0)", opacity: 1 },
    transition: { duration: 1.15, ease: [0.65, 0, 0.35, 1] },
  },
  // 7. หมุนเบา ๆ พร้อมซูม
  {
    name: "rotate-zoom",
    initial: { opacity: 0, scale: 1.2, rotate: -4, filter: "blur(8px)" },
    animate: { opacity: 1, scale: 1, rotate: 0, filter: "blur(0px)" },
    exit: { opacity: 0, scale: 1.15, rotate: 4, filter: "blur(8px)" },
    transition: { duration: 1.3, ease: [0.22, 1, 0.36, 1] },
  },
  // 8. เลื่อนเข้าจากด้านข้างพร้อมซูม
  {
    name: "slide-scale",
    initial: { opacity: 0, x: 80, scale: 1.15, filter: "blur(10px)" },
    animate: { opacity: 1, x: 0, scale: 1, filter: "blur(0px)" },
    exit: { opacity: 0, x: -80, scale: 0.9, filter: "blur(10px)" },
    transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] },
  },
];

function pickRandomTransition(excludeName) {
  const pool = excludeName
    ? TRANSITIONS.filter((t) => t.name !== excludeName)
    : TRANSITIONS;
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function AnimatedBackground({ colors, trackId }) {
  const visible = usePageVisible();
  const prefersReduced = useReducedMotion();
  const animate = visible && !prefersReduced;

  // เก็บชื่อ transition ล่าสุดไว้กันเลือกซ้ำติดกัน 2 ครั้ง
  const [lastName, setLastName] = useState(null);

  // สุ่มใหม่ทุกครั้งที่ trackId เปลี่ยน
  const transition = useMemo(() => {
    const t = pickRandomTransition(lastName);
    setLastName(t.name);
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackId]);

  return (
    <div className="bg-root">
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
          <div
            className="bg-base"
            style={{ background: `linear-gradient(135deg, ${colors.secondary}, #05050a)` }}
          />

          {/* Main blobs */}
          <motion.div
            className="bg-blob bg-blob-1"
            style={{ background: colors.primary }}
            animate={animate ? { x: [0, 120, -80, 0], y: [0, -100, 80, 0], scale: [1, 1.25, 0.85, 1] } : {}}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="bg-blob bg-blob-2"
            style={{ background: colors.secondary }}
            animate={animate ? { x: [0, -140, 100, 0], y: [0, 120, -60, 0], scale: [1, 0.8, 1.3, 1] } : {}}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="bg-blob bg-blob-3"
            style={{ background: colors.palette?.[2] || colors.primary }}
            animate={animate ? { x: [0, 80, -120, 0], y: [0, -60, 100, 0], scale: [1, 1.2, 0.75, 1] } : {}}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="bg-blob bg-blob-4"
            style={{ background: colors.palette?.[3] || colors.secondary }}
            animate={animate ? { x: [0, -60, 90, 0], y: [0, 70, -90, 0], scale: [0.8, 1.1, 0.9, 0.8] } : {}}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          />

          {/* Floating particles */}
          {animate && [...Array(8)].map((_, i) => (
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
              transition={{
                duration: 4 + i * 1.2,
                repeat: Infinity,
                delay: i * 0.6,
                ease: "easeInOut",
              }}
            />
          ))}

          {/* Shimmer ring */}
          <motion.div
            className="bg-ring"
            style={{ borderColor: colors.primary }}
            animate={animate ? { scale: [1, 1.08, 1], opacity: [0.08, 0.18, 0.08] } : {}}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="bg-noise" />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
