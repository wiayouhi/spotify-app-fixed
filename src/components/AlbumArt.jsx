import {
  motion,
  AnimatePresence,
  useMotionValue,
  useMotionTemplate,
  animate as fmAnimate,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";

/* ===================================================================
   เอฟเฟกต์ตอนเปลี่ยนปกเพลง — สุ่มเลือก 1 แบบทุกครั้งที่เปลี่ยนเพลง
   (กันไม่ให้สุ่มซ้ำแบบเดิมติดกัน 2 ครั้ง)
   =================================================================== */
const TRANSITIONS = [
  {
    name: "fade-zoom-in",
    initial: { opacity: 0, scale: 1.14, filter: "blur(16px)" },
    animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
  },
  {
    name: "fade-zoom-out",
    initial: { opacity: 0, scale: 0.82, filter: "blur(10px)" },
    animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
  },
  {
    name: "slide-left",
    initial: { opacity: 0, x: "35%", scale: 1.08, filter: "blur(8px)" },
    animate: { opacity: 1, x: "0%", scale: 1, filter: "blur(0px)" },
  },
  {
    name: "slide-up",
    initial: { opacity: 0, y: "30%", scale: 1.08, filter: "blur(8px)" },
    animate: { opacity: 1, y: "0%", scale: 1, filter: "blur(0px)" },
  },
  {
    name: "rotate-in",
    initial: { opacity: 0, scale: 1.16, rotate: -6, filter: "blur(10px)" },
    animate: { opacity: 1, scale: 1, rotate: 0, filter: "blur(0px)" },
  },
  {
    name: "iris-reveal",
    initial: { opacity: 1, clipPath: "circle(0% at 50% 50%)", scale: 1.05 },
    animate: { opacity: 1, clipPath: "circle(75% at 50% 50%)", scale: 1 },
  },
  {
    name: "diagonal-wipe",
    initial: { opacity: 1, clipPath: "polygon(0 0,0 0,0 100%,0 100%)" },
    animate: { opacity: 1, clipPath: "polygon(0 0,100% 0,100% 100%,0 100%)" },
  },
];

function pickTransition(excludeName) {
  const pool = excludeName ? TRANSITIONS.filter((t) => t.name !== excludeName) : TRANSITIONS;
  return pool[Math.floor(Math.random() * pool.length)];
}

/* ไล่สีนุ่ม ๆ เมื่อสีจากปกใหม่เปลี่ยน ไม่กระตุก ไม่สแนป */
function useSmoothColor(target, duration = 1.3) {
  const mv = useMotionValue(target || "#ffffff");
  useEffect(() => {
    if (!target) return;
    const controls = fmAnimate(mv, target, { duration, ease: [0.22, 1, 0.36, 1] });
    return controls.stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return mv;
}

export default function AlbumArt({ track, isPlaying, colors }) {
  const glowTarget = colors?.primary || "#ffffff";
  const glow = useSmoothColor(glowTarget);
  const glowBackground = useMotionTemplate`radial-gradient(circle, ${glow}66, transparent 70%)`;
  const borderShadow = useMotionTemplate`0 0 0 1.5px ${glow}55 inset`;

  // เลเยอร์ล่าง = รูปที่แสดงอยู่จริงตอนนี้ นิ่ง ไม่กะพริบ ไม่รอโหลด
  const [displayedSrc, setDisplayedSrc] = useState(track?.albumArt || null);
  // เลเยอร์บน = รูปใหม่ที่กำลัง fade/zoom/wipe เข้ามาคลุมรูปเก่า
  const [incoming, setIncoming] = useState(null); // { src, transition }
  const lastTransitionName = useRef(null);

  useEffect(() => {
    const nextSrc = track?.albumArt || null;
    if (!nextSrc || nextSrc === displayedSrc) return;

    let cancelled = false;
    const img = new Image();
    img.src = nextSrc;

    // ★ หัวใจของความสมูท: preload รูปใหม่ให้เสร็จก่อน ค่อยเริ่มอนิเมชัน
    // เพื่อไม่ให้ browser โชว์รูปใหม่ก่อนแอนิเมชันจะเริ่มทำงาน
    const start = () => {
      if (cancelled) return;
      const t = pickTransition(lastTransitionName.current);
      lastTransitionName.current = t.name;
      setIncoming({ src: nextSrc, transition: t });
    };

    if (img.complete && img.naturalWidth > 0) start();
    else {
      img.onload = start;
      img.onerror = start; // โหลดพลาดก็ยังสลับ ไม่ให้ค้าง
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.albumArt]);

  return (
    <div className="album-art-stage">
      {/* แสงเรืองรอบปก ไล่สีนุ่ม ๆ + หายใจตลอดเวลา ไม่ต้องรอเปลี่ยนเพลง */}
      <motion.div
        className="album-glow"
        style={{ background: glowBackground }}
        animate={{ scale: isPlaying ? [1, 1.1, 1] : [1, 1.04, 1] }}
        transition={{ duration: isPlaying ? 3.5 : 6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* กรอบปก — ลอยขึ้นลงเบา ๆ ตลอดเวลา (idle motion) เร็วขึ้นเมื่อกำลังเล่น */}
      <motion.div
        className="album-art-frame"
        animate={{
          y: isPlaying ? [0, -6, 0] : [0, -2, 0],
          scale: isPlaying ? [1, 1.015, 1] : [1, 1.005, 1],
        }}
        transition={{ duration: isPlaying ? 4.5 : 7, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* เลเยอร์ล่าง: รูปปัจจุบัน แสดงนิ่ง ๆ ตลอด ไม่มีการกะพริบ */}
        {displayedSrc && (
          <img
            src={displayedSrc}
            alt={track?.name || "album art"}
            className="album-art-img album-art-img-base"
          />
        )}

        {/* เลเยอร์บน: รูปใหม่ (โหลดเสร็จแล้ว) ค่อย ๆ fade/zoom/wipe เข้ามาคลุมรูปเก่า */}
        <AnimatePresence>
          {incoming && (
            <motion.img
              key={incoming.src}
              src={incoming.src}
              alt={track?.name || "album art"}
              className="album-art-img album-art-img-top"
              initial={incoming.transition.initial}
              animate={incoming.transition.animate}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.15, ease: [0.22, 1, 0.36, 1] }}
              onAnimationComplete={() => {
                // อนิเมชันเข้าเสร็จสมบูรณ์แล้ว ค่อย commit เป็นรูปหลัก แล้วเคลียร์เลเยอร์บนทิ้ง
                setDisplayedSrc(incoming.src);
                setIncoming(null);
              }}
            />
          )}
        </AnimatePresence>

        {/* แสงปาดผ่านทุกครั้งที่มีรูปใหม่กำลังเข้ามา */}
        <AnimatePresence>
          {incoming && (
            <motion.div
              key={`shine-${incoming.src}`}
              className="album-shine"
              initial={{ x: "-130%", opacity: 0 }}
              animate={{ x: "130%", opacity: [0, 0.55, 0] }}
              transition={{ duration: 1.15, ease: "easeInOut", delay: 0.15 }}
            />
          )}
        </AnimatePresence>

        <motion.div className="album-art-border" style={{ boxShadow: borderShadow }} />
      </motion.div>

      {/* เงาสะท้อนด้านล่าง อิงจากรูปที่ commit แล้วเท่านั้น */}
      {displayedSrc && (
        <div className="album-reflection" style={{ backgroundImage: `url(${displayedSrc})` }} />
      )}
    </div>
  );
}
