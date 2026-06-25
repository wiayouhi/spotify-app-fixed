import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const FORMAT_FNS = {
  hhmm: (d) => d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false }),
  hhmmss: (d) => d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }),
  "12h": (d) => d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
};

export default function Clock({ config = {}, animSpeed = 1 }) {
  const {
    clockFormat = "hhmm",
    clockShowDate = false,
    clockGlow = true,
    clockSize = 1.0,
  } = config;

  const [time, setTime] = useState(new Date());
  const [prevMinute, setPrevMinute] = useState(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const minute = now.getMinutes();
      setTime(now);
      if (prevMinute !== null && minute !== prevMinute) {
        setFlash(true);
        setTimeout(() => setFlash(false), 600);
      }
      setPrevMinute(minute);
    }, 1000);
    return () => clearInterval(timer);
  }, [prevMinute]);

  const dur = (b) => b / animSpeed;
  const formatFn = FORMAT_FNS[clockFormat] || FORMAT_FNS.hhmm;
  const timeString = formatFn(time);
  const dateString = time.toLocaleDateString("th-TH", { weekday: "short", month: "short", day: "numeric" });

  const glowStyle = clockGlow
    ? { textShadow: "0 0 20px rgba(255,255,255,0.35), 0 0 40px rgba(255,255,255,0.12)" }
    : {};

  return (
    <div className="app-clock-wrap" style={{ fontSize: `${clockSize}em` }}>
      <motion.div
        className={`app-clock-time ${flash ? "clock-flash" : ""}`}
        style={glowStyle}
        animate={flash ? { scale: [1, 1.04, 1] } : {}}
        transition={{ duration: dur(0.3), ease: "easeOut" }}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={timeString.slice(0, clockFormat === "hhmmss" ? 8 : 5)}
            initial={{ opacity: 0.4, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: dur(0.25), ease: "easeOut" }}
          >
            {timeString}
          </motion.span>
        </AnimatePresence>
      </motion.div>
      {clockShowDate && (
        <motion.div
          className="app-clock-date"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: dur(0.4), delay: 0.1 }}
        >
          {dateString}
        </motion.div>
      )}
    </div>
  );
}
