import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const WMO_CODES = {
  0: { label: "แจ่มใส", key: "clear" },
  1: { label: "เกือบแจ่มใส", key: "mostly-clear" },
  2: { label: "มีเมฆบางส่วน", key: "partly-cloudy" },
  3: { label: "มีเมฆมาก", key: "overcast" },
  45: { label: "มีหมอก", key: "fog" },
  48: { label: "หมอกเกาะ", key: "fog" },
  51: { label: "ฝนปรอย", key: "drizzle" },
  53: { label: "ฝนปรอย", key: "drizzle" },
  55: { label: "ฝนปรอยหนัก", key: "drizzle" },
  61: { label: "ฝนเบา", key: "rain" },
  63: { label: "ฝนปานกลาง", key: "rain" },
  65: { label: "ฝนหนัก", key: "rain-heavy" },
  71: { label: "หิมะเบา", key: "snow" },
  73: { label: "หิมะ", key: "snow" },
  75: { label: "หิมะหนัก", key: "snow" },
  80: { label: "ฝนฟ้าคะนอง", key: "shower" },
  81: { label: "ฝนฟ้าคะนอง", key: "shower" },
  82: { label: "ฝนฟ้าคะนองหนัก", key: "shower" },
  95: { label: "พายุฝน", key: "thunderstorm" },
  96: { label: "พายุลูกเห็บ", key: "thunderstorm" },
  99: { label: "พายุลูกเห็บหนัก", key: "thunderstorm" },
};

const MOOD = {
  clear: { day: ["#FF9A3D", "#FFD93D"], night: ["#0B1830", "#1F3762"] },
  "mostly-clear": { day: ["#4FACFE", "#8FD3FE"], night: ["#0D1B38", "#22335C"] },
  "partly-cloudy": { day: ["#6DA9E4", "#9FC4EB"], night: ["#122140", "#2A3A5E"] },
  overcast: { day: ["#7C8DA6", "#9DAABE"], night: ["#1C2534", "#39434F"] },
  fog: { day: ["#8FA3B8", "#B7C4D2"], night: ["#20293A", "#3A4658"] },
  drizzle: { day: ["#5B8DBE", "#87ABD1"], night: ["#101E38", "#233752"] },
  rain: { day: ["#3A6EA5", "#6690BE"], night: ["#0C1830", "#1E3050"] },
  "rain-heavy": { day: ["#28517F", "#4A749F"], night: ["#0A1426", "#182A44"] },
  snow: { day: ["#8CA4C0", "#C4D3E3"], night: ["#1D2A42", "#3D4C68"] },
  shower: { day: ["#4A7AB5", "#7BA0CB"], night: ["#101E38", "#243C58"] },
  thunderstorm: { day: ["#333F5C", "#525F80"], night: ["#0A0E1C", "#20263C"] },
};

const range = (n) => Array.from({ length: n }, (_, i) => i);

// ─── Sky bodies ───

function SunCore({ reduce, cx = 20, cy = 20, r = 7 }) {
  return (
    <>
      <motion.circle
        cx={cx} cy={cy} r={r + 5} fill="url(#sunGlow)"
        animate={reduce ? {} : { opacity: [0.55, 0.9, 0.55], scale: [1, 1.08, 1] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />
      <motion.g
        animate={reduce ? {} : { rotate: 360 }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      >
        {range(8).map((i) => {
          const a = (i * Math.PI) / 4;
          return (
            <line key={i}
              x1={cx + Math.cos(a) * (r + 3)} y1={cy + Math.sin(a) * (r + 3)}
              x2={cx + Math.cos(a) * (r + 7)} y2={cy + Math.sin(a) * (r + 7)}
              stroke="#FFD93D" strokeWidth="1.8" strokeLinecap="round" />
          );
        })}
      </motion.g>
      <circle cx={cx} cy={cy} r={r} fill="#FFD93D" />
    </>
  );
}

function MoonCore({ reduce, cx = 20, cy = 20, r = 7 }) {
  return (
    <>
      <motion.circle cx={cx} cy={cy} r={r + 4} fill="url(#moonGlow)"
        animate={reduce ? {} : { opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: `${cx}px ${cy}px` }} />
      <path d={`M${cx + r * 0.6} ${cy - r}a${r} ${r} 0 1 0 0 ${r * 2}a${r * 0.78} ${r * 0.78} 0 0 1 0-${r * 2}z`} fill="#EAF0FA" />
      {[[-4, -3, 1.1], [3, 2, 0.8], [-1, 4, 0.7]].map(([dx, dy, rr], i) => (
        <circle key={i} cx={cx + dx} cy={cy + dy} r={rr} fill="rgba(180,196,224,0.55)" />
      ))}
    </>
  );
}

function StarField({ w, h, count = 16, reduce }) {
  const stars = useMemo(() => range(count).map((i) => ({
    x: (i * 53.7) % w,
    y: (i * 29.3) % (h * 0.6),
    r: 0.6 + (i % 3) * 0.35,
    delay: (i % 7) * 0.4,
  })), [w, h, count]);
  return (
    <>
      {stars.map((s, i) => (
        <motion.circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff"
          animate={reduce ? { opacity: 0.7 } : { opacity: [0.2, 0.9, 0.2] }}
          transition={{ duration: 2.4 + (i % 4) * 0.5, repeat: Infinity, ease: "easeInOut", delay: s.delay }} />
      ))}
    </>
  );
}

// ─── Puffy clouds built from primitives so they scale cleanly to any size ───

function Puff({ fill }) {
  return (
    <>
      <rect x="-26" y="-2" width="52" height="15" rx="7.5" fill={fill} />
      <circle cx="-14" cy="-7" r="11.5" fill={fill} />
      <circle cx="3" cy="-11" r="13.5" fill={fill} />
      <circle cx="19" cy="-6" r="10.5" fill={fill} />
    </>
  );
}

function CloudLayer({ cx, cy, scale = 1, fill, driftX = 4, duration = 7, delay = 0, reduce }) {
  return (
    <g transform={`translate(${cx},${cy}) scale(${scale})`}>
      <motion.g
        animate={reduce ? {} : { x: [-driftX, driftX, -driftX] }}
        transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}
      >
        <Puff fill={fill} />
      </motion.g>
    </g>
  );
}

// ─── Realistic precipitation fields — many streaks/flakes spread across
// the whole scene and animated continuously, instead of a handful of
// static dots, so rain reads as rain rather than a countable few drops. ───

function RainField({ w, h, count = 40, heavy = false, angle = 10, reduce }) {
  const rad = (angle * Math.PI) / 180;
  const drops = useMemo(() => range(count).map((i) => {
    const x = (i * 61.8) % w;
    const len = heavy ? 16 + (i % 6) * 2.5 : 10 + (i % 5) * 2;
    const dur = (heavy ? 0.5 : 0.85) + (i % 6) * 0.06;
    const delay = (i * dur) / count;
    return { x, len, dur, delay, opacity: heavy ? 0.85 : 0.6 + (i % 3) * 0.08 };
  }), [w, count, heavy]);

  return (
    <g>
      {drops.map((d, i) => {
        const dx = Math.sin(rad) * d.len;
        const dy = Math.cos(rad) * d.len;
        const travel = h + 30;
        return (
          <motion.line
            key={i}
            x1={d.x} y1={-14} x2={d.x - dx} y2={-14 + dy}
            stroke={heavy ? "rgba(165,200,238,0.85)" : "rgba(180,212,242,0.65)"}
            strokeWidth={heavy ? 1.7 : 1.15}
            strokeLinecap="round"
            animate={reduce ? { opacity: d.opacity } : { y: [0, travel], opacity: [0, d.opacity, d.opacity, 0] }}
            transition={{ duration: d.dur, repeat: Infinity, ease: "linear", delay: d.delay }}
          />
        );
      })}
    </g>
  );
}

function SnowField({ w, h, count = 30, reduce }) {
  const flakes = useMemo(() => range(count).map((i) => {
    const x = (i * 47.3) % w;
    const r = 0.9 + (i % 4) * 0.5;
    const dur = 3.2 + (i % 5) * 0.6;
    const delay = (i * dur) / count;
    const sway = 5 + (i % 3) * 3;
    return { x, r, dur, delay, sway };
  }), [w, count]);

  return (
    <g>
      {flakes.map((f, i) => (
        <motion.circle
          key={i} cx={f.x} cy={-6} r={f.r} fill="#fff"
          animate={reduce ? { opacity: 0.85 } : { y: [0, h + 14], x: [0, f.sway, -f.sway, 0], opacity: [0, 0.95, 0.95, 0] }}
          transition={{ duration: f.dur, repeat: Infinity, ease: "linear", delay: f.delay }}
        />
      ))}
    </g>
  );
}

function FogBands({ w, h, reduce }) {
  const bands = [
    { y: h * 0.28, width: w * 0.85, o: 0.55, dur: 9 },
    { y: h * 0.5, width: w * 0.65, o: 0.4, dur: 7 },
    { y: h * 0.72, width: w * 0.9, o: 0.5, dur: 11 },
  ];
  return (
    <g>
      {bands.map((b, i) => (
        <motion.rect
          key={i} x={(w - b.width) / 2} y={b.y} width={b.width} height={h * 0.12} rx={h * 0.06}
          fill={`rgba(220,230,240,${b.o})`}
          animate={reduce ? {} : { x: [(w - b.width) / 2 - 10, (w - b.width) / 2 + 10, (w - b.width) / 2 - 10] }}
          transition={{ duration: b.dur, repeat: Infinity, ease: "easeInOut", delay: i * 0.6 }}
        />
      ))}
    </g>
  );
}

function LightningFlash({ w, h, reduce }) {
  return (
    <>
      <motion.rect
        x={0} y={0} width={w} height={h} fill="#EAF0FF"
        animate={reduce ? { opacity: 0 } : { opacity: [0, 0, 0.35, 0, 0.15, 0, 0, 0, 0, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "linear", times: [0, 0.42, 0.45, 0.49, 0.52, 0.56, 0.6, 0.7, 0.85, 1] }}
      />
      <motion.path
        d={`M${w * 0.52} ${h * 0.3}l-9 15h7l-8 16 13-17h-7l8-14z`}
        fill="#FFE066"
        animate={reduce ? { opacity: 1 } : { opacity: [0, 0, 1, 0.3, 1, 0, 0, 0, 0, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "linear", times: [0, 0.42, 0.45, 0.48, 0.5, 0.54, 0.6, 0.7, 0.85, 1] }}
      />
    </>
  );
}

// ─── Compact icon for the collapsed pill (viewBox 0 0 40 40) ───

function WeatherScene({ code, size = 40, isDay = true }) {
  const reduce = useReducedMotion();
  const key = WMO_CODES[code]?.key || "clear";
  const w = 40, h = 40;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${w} ${h}`} fill="none" style={{ display: "block" }}>
      <defs>
        <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFE08A" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FFE08A" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#C9D6F0" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#C9D6F0" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g transform="translate(0,3)">
        {key === "clear" && (isDay ? <SunCore reduce={reduce} /> : <MoonCore reduce={reduce} />)}

        {key === "mostly-clear" && (
          <>
            {isDay ? <SunCore reduce={reduce} cx={16} cy={16} r={6} /> : <MoonCore reduce={reduce} cx={16} cy={16} r={6} />}
            <CloudLayer cx={20} cy={22} scale={0.42} fill="rgba(255,255,255,0.92)" driftX={2} duration={7} reduce={reduce} />
          </>
        )}

        {key === "partly-cloudy" && (
          <>
            {isDay ? <SunCore reduce={reduce} cx={14} cy={14} r={5.5} /> : <MoonCore reduce={reduce} cx={14} cy={14} r={5.5} />}
            <CloudLayer cx={20} cy={24} scale={0.46} fill="rgba(255,255,255,0.95)" driftX={2.5} duration={6.5} reduce={reduce} />
          </>
        )}

        {key === "overcast" && (
          <>
            <CloudLayer cx={16} cy={16} scale={0.36} fill="rgba(210,224,238,0.85)" driftX={2} duration={8} reduce={reduce} />
            <CloudLayer cx={21} cy={25} scale={0.46} fill="rgba(235,242,248,0.95)" driftX={2.6} duration={6} delay={0.6} reduce={reduce} />
          </>
        )}

        {key === "fog" && <FogBands w={w} h={h} reduce={reduce} />}

        {key === "drizzle" && (
          <>
            <CloudLayer cx={16} cy={16} scale={0.36} fill="rgba(220,232,244,0.95)" driftX={2} duration={7} reduce={reduce} />
            <g transform="translate(0,10)"><RainField w={w} h={h - 10} count={12} heavy={false} angle={6} reduce={reduce} /></g>
          </>
        )}

        {(key === "rain" || key === "rain-heavy") && (
          <>
            <CloudLayer cx={16} cy={15} scale={0.36} fill="rgba(140,180,224,0.95)" driftX={2} duration={6} reduce={reduce} />
            <g transform="translate(0,9)">
              <RainField w={w} h={h - 9} count={key === "rain-heavy" ? 26 : 18} heavy={key === "rain-heavy"} angle={key === "rain-heavy" ? 14 : 8} reduce={reduce} />
            </g>
          </>
        )}

        {key === "snow" && (
          <>
            <CloudLayer cx={15} cy={14} scale={0.34} fill="rgba(220,232,244,0.95)" driftX={2} duration={7} reduce={reduce} />
            <g transform="translate(0,8)"><SnowField w={w} h={h - 8} count={16} reduce={reduce} /></g>
          </>
        )}

        {key === "shower" && (
          <>
            <CloudLayer cx={17} cy={15} scale={0.4} fill="rgba(120,160,208,0.95)" driftX={2} duration={6} reduce={reduce} />
            <g transform="translate(0,9)"><RainField w={w} h={h - 9} count={20} heavy={false} angle={10} reduce={reduce} /></g>
          </>
        )}

        {key === "thunderstorm" && (
          <>
            <CloudLayer cx={16} cy={14} scale={0.36} fill="rgba(70,86,120,0.95)" driftX={1.6} duration={5} reduce={reduce} />
            <g transform="translate(0,9)"><RainField w={w} h={h - 9} count={20} heavy angle={14} reduce={reduce} /></g>
            <motion.path
              d="M20 14l-4.5 7h3.4l-3.9 6.5 6.4-8h-3.6l3.6-5.5z"
              fill="#FFD600"
              animate={reduce ? { opacity: 1 } : { opacity: [0, 0, 1, 0.3, 1, 0, 0, 0] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "linear", repeatDelay: 1.4, times: [0, 0.55, 0.6, 0.65, 0.72, 0.78, 0.9, 1] }}
            />
          </>
        )}
      </g>
    </svg>
  );
}

// ─── Full atmospheric hero scene for the expanded card ───

function WeatherHero({ code, isDay, w = 240, h = 300 }) {
  const reduce = useReducedMotion();
  const key = WMO_CODES[code]?.key || "clear";
  const cx = w * 0.68, cy = h * 0.24;

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0 }}>
      <defs>
        <radialGradient id="heroSunGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFE9B0" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#FFE9B0" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="heroMoonGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#D6E0F5" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#D6E0F5" stopOpacity="0" />
        </radialGradient>
      </defs>

      {key === "clear" && (isDay
        ? <SunCore reduce={reduce} cx={cx} cy={cy} r={30} />
        : <><MoonCore reduce={reduce} cx={cx} cy={cy} r={26} /><StarField w={w} h={h} count={22} reduce={reduce} /></>
      )}

      {key === "mostly-clear" && (
        <>
          {isDay ? <SunCore reduce={reduce} cx={cx} cy={cy} r={26} /> : <><MoonCore reduce={reduce} cx={cx} cy={cy} r={24} /><StarField w={w} h={h} count={16} reduce={reduce} /></>}
          <CloudLayer cx={w * 0.4} cy={h * 0.62} scale={2.4} fill="rgba(255,255,255,0.94)" driftX={8} duration={9} reduce={reduce} />
        </>
      )}

      {key === "partly-cloudy" && (
        <>
          {isDay ? <SunCore reduce={reduce} cx={cx} cy={cy * 0.9} r={24} /> : <><MoonCore reduce={reduce} cx={cx} cy={cy * 0.9} r={22} /><StarField w={w} h={h} count={14} reduce={reduce} /></>}
          <CloudLayer cx={w * 0.38} cy={h * 0.55} scale={2.6} fill="rgba(255,255,255,0.96)" driftX={9} duration={8} reduce={reduce} />
          <CloudLayer cx={w * 0.72} cy={h * 0.74} scale={1.9} fill="rgba(255,255,255,0.8)" driftX={7} duration={10} delay={0.8} reduce={reduce} />
        </>
      )}

      {key === "overcast" && (
        <>
          <CloudLayer cx={w * 0.3} cy={h * 0.38} scale={2.2} fill="rgba(200,214,230,0.8)" driftX={7} duration={10} reduce={reduce} />
          <CloudLayer cx={w * 0.68} cy={h * 0.55} scale={2.7} fill="rgba(220,232,244,0.92)" driftX={9} duration={8} delay={0.5} reduce={reduce} />
          <CloudLayer cx={w * 0.42} cy={h * 0.78} scale={2.1} fill="rgba(232,240,248,0.96)" driftX={6} duration={7} delay={1.1} reduce={reduce} />
        </>
      )}

      {key === "fog" && <FogBands w={w} h={h} reduce={reduce} />}

      {key === "drizzle" && (
        <>
          <CloudLayer cx={w * 0.5} cy={h * 0.28} scale={2.6} fill="rgba(220,232,244,0.95)" driftX={7} duration={8} reduce={reduce} />
          <g transform={`translate(0,${h * 0.32})`}><RainField w={w} h={h * 0.68} count={30} heavy={false} angle={6} reduce={reduce} /></g>
        </>
      )}

      {(key === "rain" || key === "rain-heavy") && (
        <>
          <CloudLayer cx={w * 0.5} cy={h * 0.26} scale={2.8} fill={key === "rain-heavy" ? "rgba(90,124,168,0.95)" : "rgba(140,180,224,0.95)"} driftX={6} duration={6.5} reduce={reduce} />
          <g transform={`translate(0,${h * 0.3})`}>
            <RainField w={w} h={h * 0.7} count={key === "rain-heavy" ? 62 : 42} heavy={key === "rain-heavy"} angle={key === "rain-heavy" ? 16 : 9} reduce={reduce} />
          </g>
        </>
      )}

      {key === "snow" && (
        <>
          <CloudLayer cx={w * 0.5} cy={h * 0.26} scale={2.5} fill="rgba(220,232,244,0.95)" driftX={6} duration={8} reduce={reduce} />
          <g transform={`translate(0,${h * 0.3})`}><SnowField w={w} h={h * 0.7} count={40} reduce={reduce} /></g>
        </>
      )}

      {key === "shower" && (
        <>
          <CloudLayer cx={w * 0.55} cy={h * 0.26} scale={2.6} fill="rgba(120,160,208,0.95)" driftX={6} duration={6.5} reduce={reduce} />
          <g transform={`translate(0,${h * 0.3})`}><RainField w={w} h={h * 0.7} count={38} heavy={false} angle={10} reduce={reduce} /></g>
        </>
      )}

      {key === "thunderstorm" && (
        <>
          <LightningFlash w={w} h={h} reduce={reduce} />
          <CloudLayer cx={w * 0.5} cy={h * 0.24} scale={2.9} fill="rgba(55,66,96,0.96)" driftX={4} duration={5} reduce={reduce} />
          <g transform={`translate(0,${h * 0.3})`}><RainField w={w} h={h * 0.7} count={54} heavy angle={16} reduce={reduce} /></g>
        </>
      )}
    </svg>
  );
}

// ─── Small line icons for the detail grid ───

function DropletIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3s7 7.5 7 12.2A7 7 0 0 1 5 15.2C5 10.5 12 3 12 3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>;
}
function WindIcon({ rotate = 0 }) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ transform: `rotate(${rotate}deg)` }}><path d="M12 20V6M6 10l6-6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function GaugeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M4 15a8 8 0 1 1 16 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 15l3.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="15" r="1.3" fill="currentColor" />
    </svg>
  );
}
function UvIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.8" />
      {range(8).map((i) => {
        const a = (i * Math.PI) / 4;
        return <line key={i} x1={12 + Math.cos(a) * 7.2} y1={12 + Math.sin(a) * 7.2} x2={12 + Math.cos(a) * 10} y2={12 + Math.sin(a) * 10} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />;
      })}
    </svg>
  );
}
function ThermoIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 14.5V5a2 2 0 1 0-4 0v9.5a4 4 0 1 0 4 0z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>;
}
function CloseIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
}

function uvLabel(uv) {
  if (uv == null) return "-";
  if (uv < 3) return "ต่ำ";
  if (uv < 6) return "ปานกลาง";
  if (uv < 8) return "สูง";
  if (uv < 11) return "สูงมาก";
  return "รุนแรง";
}

function windDirLabel(deg) {
  if (deg == null) return "";
  const dirs = ["เหนือ", "ตะวันออกเฉียงเหนือ", "ตะวันออก", "ตะวันออกเฉียงใต้", "ใต้", "ตะวันตกเฉียงใต้", "ตะวันตก", "ตะวันตกเฉียงเหนือ"];
  return dirs[Math.round(deg / 45) % 8];
}

function DayArc({ sunrise, sunset, isDay }) {
  if (!sunrise || !sunset) return null;
  const now = Date.now();
  const total = sunset.getTime() - sunrise.getTime();
  const elapsed = now - sunrise.getTime();
  const frac = Math.min(1, Math.max(0, elapsed / total));
  const cx = 80, cy = 52, r = 50;
  const angle = Math.PI * (1 - frac);
  const mx = cx - r * Math.cos(angle);
  const my = cy - r * Math.sin(angle);

  return (
    <div className="weather-arc">
      <svg width="160" height="62" viewBox="0 0 160 62" fill="none">
        <path d={`M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy}`} stroke="rgba(255,255,255,0.22)" strokeWidth="2" strokeDasharray="1 5" strokeLinecap="round" />
        {isDay && frac > 0 && frac < 1 && (
          <path d={`M${cx - r} ${cy} A${r} ${r} 0 0 1 ${mx} ${my}`} stroke="rgba(255,217,61,0.85)" strokeWidth="2" strokeLinecap="round" />
        )}
        <circle cx={cx - r} cy={cy} r="2.5" fill="rgba(255,255,255,0.5)" />
        <circle cx={cx + r} cy={cy} r="2.5" fill="rgba(255,255,255,0.5)" />
        {isDay && frac >= 0 && frac <= 1 && (
          <motion.circle cx={mx} cy={my} r="5" fill="#FFD93D"
            animate={{ opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }} />
        )}
      </svg>
      <div className="weather-arc-labels">
        <span>{sunrise.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}</span>
        <span>{isDay ? "กลางวัน" : "กลางคืน"}</span>
        <span>{sunset.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}</span>
      </div>
    </div>
  );
}

// ─── Data fetching + widget shell ───

export default function WeatherWidget({ animSpeed = 1 }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchWeather = async () => {
      try {
        const pos = await new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
        );
        const { latitude: lat, longitude: lon } = pos.coords;
        const url =
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
          `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weathercode,pressure_msl,wind_speed_10m,wind_direction_10m` +
          `&daily=sunrise,sunset,uv_index_max,temperature_2m_max,temperature_2m_min` +
          `&timezone=auto`;
        const res = await fetch(url);
        const data = await res.json();
        if (!mounted) return;
        const cur = data.current;
        const day = data.daily;
        setWeather({
          temp: Math.round(cur.temperature_2m),
          feelsLike: Math.round(cur.apparent_temperature),
          code: cur.weathercode,
          isDay: cur.is_day === 1,
          wind: Math.round(cur.wind_speed_10m),
          windDir: cur.wind_direction_10m,
          humidity: cur.relative_humidity_2m,
          pressure: Math.round(cur.pressure_msl),
          uv: day?.uv_index_max?.[0],
          tempMax: day ? Math.round(day.temperature_2m_max[0]) : null,
          tempMin: day ? Math.round(day.temperature_2m_min[0]) : null,
          sunrise: day ? new Date(day.sunrise[0]) : null,
          sunset: day ? new Date(day.sunset[0]) : null,
          label: WMO_CODES[cur.weathercode]?.label || "ไม่ทราบ",
          key: WMO_CODES[cur.weathercode]?.key || "clear",
        });
        setUpdatedAt(new Date());
      } catch {
        if (mounted) setError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchWeather();
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") setExpanded(false); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [expanded]);

  const dur = (base) => base / animSpeed;

  if (loading) {
    return (
      <motion.div className="weather-widget weather-widget--loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <motion.div className="weather-spinner" animate={{ rotate: 360 }} transition={{ duration: dur(1), repeat: Infinity, ease: "linear" }} />
        <WeatherStyles />
      </motion.div>
    );
  }

  if (error || !weather) return null;

  const mood = MOOD[weather.key] || MOOD.clear;
  const [c1, c2] = weather.isDay ? mood.day : mood.night;

  return (
    <>
      <motion.button
        type="button"
        className="weather-widget"
        onClick={() => setExpanded(true)}
        initial={{ opacity: 0, y: -8, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: dur(0.5), ease: [0.16, 1, 0.3, 1] }}
        aria-expanded={expanded}
        aria-label="เปิดดูรายละเอียดสภาพอากาศ"
      >
        <span className="weather-icon-wrap">
          <WeatherScene code={weather.code} size={26} isDay={weather.isDay} />
        </span>
        <span className="weather-temp">{weather.temp}°</span>
        <span className="weather-label">{weather.label}</span>
        <WeatherStyles />
      </motion.button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            className="weather-overlay"
            onClick={() => setExpanded(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: dur(0.28) }}
          >
            <motion.div
              className="weather-sheet"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: dur(0.35), ease: [0.16, 1, 0.3, 1] }}
            >
              <button type="button" className="weather-close" onClick={() => setExpanded(false)} aria-label="ปิด">
                <CloseIcon />
              </button>

              {/* Left: atmospheric hero panel */}
              <div className="weather-sheet-hero" style={{ background: `linear-gradient(160deg, ${c1}, ${c2})` }}>
                <WeatherHero code={weather.code} isDay={weather.isDay} />
                <div className="weather-sheet-hero-content">
                  <span className="weather-sheet-temp">{weather.temp}°</span>
                  <span className="weather-sheet-cond">{weather.label}</span>
                  <span className="weather-sheet-feels">รู้สึกเหมือน {weather.feelsLike}°</span>
                  {weather.tempMax != null && (
                    <div className="weather-sheet-minmax">
                      <span>สูงสุด {weather.tempMax}°</span>
                      <span className="weather-sheet-minmax-dot" />
                      <span>ต่ำสุด {weather.tempMin}°</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: details */}
              <div className="weather-sheet-body">
                <DayArc sunrise={weather.sunrise} sunset={weather.sunset} isDay={weather.isDay} />

                <div className="weather-stat-grid">
                  <div className="weather-stat-card">
                    <DropletIcon />
                    <span className="weather-stat-card-value">{weather.humidity}%</span>
                    <span className="weather-stat-card-label">ความชื้น</span>
                  </div>
                  <div className="weather-stat-card">
                    <WindIcon rotate={(weather.windDir ?? 0) + 180} />
                    <span className="weather-stat-card-value">{weather.wind} กม./ชม.</span>
                    <span className="weather-stat-card-label">{windDirLabel(weather.windDir)}</span>
                  </div>
                  <div className="weather-stat-card">
                    <GaugeIcon />
                    <span className="weather-stat-card-value">{weather.pressure}</span>
                    <span className="weather-stat-card-label">hPa</span>
                  </div>
                  <div className="weather-stat-card">
                    <UvIcon />
                    <span className="weather-stat-card-value">{weather.uv ?? "-"}</span>
                    <span className="weather-stat-card-label">ดัชนี UV {uvLabel(weather.uv)}</span>
                  </div>
                  <div className="weather-stat-card">
                    <ThermoIcon />
                    <span className="weather-stat-card-value">{weather.feelsLike}°</span>
                    <span className="weather-stat-card-label">รู้สึกเหมือน</span>
                  </div>
                  {updatedAt && (
                    <div className="weather-stat-card weather-stat-card--muted">
                      <span className="weather-stat-card-value">
                        {updatedAt.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="weather-stat-card-label">อัปเดตล่าสุด</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function WeatherStyles() {
  return (
    <style>{`
      .weather-widget {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border: none;
        cursor: pointer;
        font-family: inherit;
        color: #fff;
        background: rgba(255, 255, 255, 0.06);
        border-radius: 999px;
        height: 34px;
        padding: 0 14px;
        box-sizing: border-box;
        backdrop-filter: blur(14px) saturate(140%);
        -webkit-backdrop-filter: blur(14px) saturate(140%);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
        transition: background 0.2s ease;
      }
      .weather-widget:hover { background: rgba(255, 255, 255, 0.1); }
      .weather-widget--loading {
        width: 34px; height: 34px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        background: rgba(255, 255, 255, 0.06);
      }
      .weather-icon-wrap { display: flex; align-items: center; justify-content: center; flex-shrink: 0; line-height: 0; }
      .weather-temp { display: flex; align-items: center; line-height: 1; font-size: 14px; font-weight: 600; font-variant-numeric: tabular-nums; color: #fff; white-space: nowrap; }
      .weather-label { display: flex; align-items: center; line-height: 1; font-size: 13px; color: rgba(255, 255, 255, 0.7); white-space: nowrap; }

      .weather-overlay {
        position: fixed;
        inset: 0;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
        background: rgba(8, 12, 22, 0.28);
        backdrop-filter: blur(36px) saturate(150%);
        -webkit-backdrop-filter: blur(36px) saturate(150%);
      }

      /* Horizontal card: hero scene on the left, details on the right,
         both sides sharing the same height. */
      .weather-sheet {
        position: relative;
        display: flex;
        flex-direction: row;
        align-items: stretch;
        width: min(640px, 100%);
        max-height: 92vh;
        border-radius: 28px;
        overflow: hidden;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.14);
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(24px) saturate(160%);
        -webkit-backdrop-filter: blur(24px) saturate(160%);
        color: #fff;
        font-family: inherit;
      }

      .weather-close {
        position: absolute;
        top: 14px; right: 14px;
        z-index: 3;
        width: 32px; height: 32px;
        border-radius: 50%;
        border: none;
        display: flex; align-items: center; justify-content: center;
        background: rgba(0, 0, 0, 0.28);
        color: #fff;
        cursor: pointer;
        backdrop-filter: blur(8px);
      }
      .weather-close:hover { background: rgba(0, 0, 0, 0.42); }

      .weather-sheet-hero {
        position: relative;
        flex: 0 0 240px;
        overflow: hidden;
        display: flex;
        align-items: flex-end;
      }
      .weather-sheet-hero-content {
        position: relative;
        z-index: 2;
        display: flex;
        flex-direction: column;
        padding: 24px;
        text-shadow: 0 3px 14px rgba(0,0,0,0.2);
      }
      .weather-sheet-temp { font-size: 56px; font-weight: 700; line-height: 1; letter-spacing: -0.02em; }
      .weather-sheet-cond { margin-top: 8px; font-size: 16px; font-weight: 600; }
      .weather-sheet-feels { margin-top: 2px; font-size: 12.5px; color: rgba(255,255,255,0.85); }
      .weather-sheet-minmax { margin-top: 12px; display: flex; align-items: center; gap: 9px; font-size: 12.5px; color: rgba(255,255,255,0.9); font-variant-numeric: tabular-nums; }
      .weather-sheet-minmax-dot { width: 3px; height: 3px; border-radius: 50%; background: rgba(255,255,255,0.5); }

      .weather-sheet-body { flex: 1; min-width: 0; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; align-items: center; }

      .weather-arc { display: flex; flex-direction: column; align-items: center; }
      .weather-arc-labels { display: flex; justify-content: space-between; width: 160px; margin-top: -8px; font-size: 11px; color: rgba(255,255,255,0.6); font-variant-numeric: tabular-nums; }
      .weather-arc-labels span:nth-child(2) { color: rgba(255,255,255,0.42); }

      .weather-stat-grid {
        width: 100%;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        margin-top: 18px;
      }
      .weather-stat-card {
        display: flex; flex-direction: column; align-items: flex-start; gap: 6px;
        padding: 12px 11px;
        border-radius: 15px;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.08);
        color: rgba(255,255,255,0.85);
      }
      .weather-stat-card--muted { color: rgba(255,255,255,0.55); }
      .weather-stat-card-value { font-size: 13.5px; font-weight: 600; color: rgba(255,255,255,0.97); font-variant-numeric: tabular-nums; }
      .weather-stat-card-label { font-size: 10px; color: rgba(255,255,255,0.55); line-height: 1.3; }

      .weather-spinner { width: 16px; height: 16px; border-radius: 50%; border: 2px solid rgba(255, 255, 255, 0.25); border-top-color: rgba(255, 255, 255, 0.85); }

      @media (max-width: 560px) {
        .weather-sheet { flex-direction: column; width: 100%; max-height: 90vh; }
        .weather-sheet-hero { flex: 0 0 200px; }
        .weather-sheet-body { overflow-y: auto; }
      }

      @media (prefers-reduced-motion: reduce) {
        .weather-widget, .weather-overlay, .weather-sheet { transition: none !important; }
      }
    `}</style>
  );
}
