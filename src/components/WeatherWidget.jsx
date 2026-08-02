import { useState, useEffect } from "react";
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

// Gradient mood per condition — used for the expanded card header.
const MOOD = {
  clear: { day: ["#FF9A3D", "#FFD93D"], night: ["#0F2350", "#2A3D6B"] },
  "mostly-clear": { day: ["#4FACFE", "#FFD93D"], night: ["#101E42", "#2C3E68"] },
  "partly-cloudy": { day: ["#6DA9E4", "#C9DEF2"], night: ["#16233F", "#324262"] },
  overcast: { day: ["#7C8DA6", "#B7C3D2"], night: ["#1C2534", "#3A4457"] },
  fog: { day: ["#8FA3B8", "#D3DEE8"], night: ["#20293A", "#3E4A5E"] },
  drizzle: { day: ["#5B8DBE", "#A2C4E3"], night: ["#152239", "#2C4260"] },
  rain: { day: ["#3A6EA5", "#7FA6D1"], night: ["#101B33", "#233854"] },
  "rain-heavy": { day: ["#2E5C90", "#5F8CBE"], night: ["#0C1830", "#1E304C"] },
  snow: { day: ["#8CA4C0", "#E9F1F9"], night: ["#1D2A42", "#465A78"] },
  shower: { day: ["#4A7AB5", "#8FB6DD"], night: ["#122036", "#28405E"] },
  thunderstorm: { day: ["#3E4C6E", "#69769B"], night: ["#0D1220", "#292F49"] },
};

// ─── Reusable animated pieces (all pure SVG, nothing emoji) ───

function SunCore({ reduce, cx = 20, cy = 20, r = 7 }) {
  return (
    <>
      <motion.circle
        cx={cx}
        cy={cy}
        r={r + 5}
        fill="url(#sunGlow)"
        animate={reduce ? {} : { opacity: [0.55, 0.9, 0.55], scale: [1, 1.08, 1] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />
      <motion.g
        animate={reduce ? {} : { rotate: 360 }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      >
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * Math.PI) / 4;
          const x1 = cx + Math.cos(angle) * (r + 3);
          const y1 = cy + Math.sin(angle) * (r + 3);
          const x2 = cx + Math.cos(angle) * (r + 7);
          const y2 = cy + Math.sin(angle) * (r + 7);
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FFD93D" strokeWidth="1.8" strokeLinecap="round" />
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
      <motion.circle
        cx={cx}
        cy={cy}
        r={r + 4}
        fill="url(#moonGlow)"
        animate={reduce ? {} : { opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />
      <path
        d={`M${cx + r * 0.6} ${cy - r}a${r} ${r} 0 1 0 0 ${r * 2}a${r * 0.78} ${r * 0.78} 0 0 1 0-${r * 2}z`}
        fill="#EAF0FA"
      />
      {[[-4, -3, 1.1], [3, 2, 0.8], [-1, 4, 0.7]].map(([dx, dy, rr], i) => (
        <circle key={i} cx={cx + dx} cy={cy + dy} r={rr} fill="rgba(180,196,224,0.55)" />
      ))}
    </>
  );
}

function CloudShape({ d, fill, driftX = 3, duration = 6, delay = 0, reduce }) {
  return (
    <motion.path
      d={d}
      fill={fill}
      animate={reduce ? {} : { x: [-driftX, driftX, -driftX] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}
    />
  );
}

function RainDrops({ count = 3, xs, fromY = 16, toY = 26, color = "#42A5F5", speed = 0.9, reduce }) {
  const drops = xs || Array.from({ length: count }).map((_, i) => 6 + i * 6);
  return (
    <>
      {drops.map((x, i) => (
        <motion.line
          key={i}
          x1={x}
          y1={fromY}
          x2={x - 1.5}
          y2={fromY + 4}
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          animate={reduce ? { opacity: 0.85 } : { y: [0, toY - fromY], opacity: [0, 1, 0] }}
          transition={{ duration: speed, repeat: Infinity, ease: "easeIn", delay: (i * speed) / drops.length }}
        />
      ))}
    </>
  );
}

function SnowFlakes({ xs, reduce }) {
  const flakes = xs || [8, 14, 20, 26, 32];
  return (
    <>
      {flakes.map((x, i) => (
        <motion.circle
          key={i}
          cx={x}
          cy={16}
          r={1.4}
          fill="#fff"
          animate={reduce ? { opacity: 0.85 } : { y: [0, 14, 0], x: [0, i % 2 === 0 ? 2 : -2, 0], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 2.4 + (i % 3) * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
        />
      ))}
    </>
  );
}

function LightningBolt({ reduce }) {
  return (
    <motion.path
      d="M20 14l-4.5 7h3.4l-3.9 6.5 6.4-8h-3.6l3.6-5.5z"
      fill="#FFD600"
      animate={reduce ? { opacity: 1 } : { opacity: [0, 0, 1, 0.3, 1, 0, 0, 0] }}
      transition={{ duration: 2.6, repeat: Infinity, ease: "linear", repeatDelay: 1.4, times: [0, 0.55, 0.6, 0.65, 0.72, 0.78, 0.9, 1] }}
    />
  );
}

function FogLines({ reduce }) {
  const rows = [{ y: 9, w: 26, o: 0.75 }, { y: 15, w: 20, o: 0.55 }, { y: 21, w: 26, o: 0.4 }];
  return (
    <>
      {rows.map((r, i) => (
        <motion.rect
          key={i}
          x={5}
          y={r.y}
          width={r.w}
          height={2.6}
          rx={1.3}
          fill={`rgba(190,208,226,${r.o})`}
          animate={reduce ? {} : { x: [5, 9, 5] }}
          transition={{ duration: 5 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
        />
      ))}
    </>
  );
}

// ─── Full animated scene per condition, viewBox 0 0 40 40 ───
// All condition content is wrapped in a small downward translate so the
// visual weight of each glyph sits on the box's true center — several of
// the cloud/rain/fog compositions are top-heavy in their raw coordinates,
// which reads as "icon high, text low" once placed next to a text baseline.
function WeatherScene({ code, size = 40, isDay = true }) {
  const reduce = useReducedMotion();
  const key = WMO_CODES[code]?.key || "clear";

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
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
            <CloudShape reduce={reduce} driftX={2} duration={7} fill="rgba(255,255,255,0.92)" d="M10 24c-3 0-5.5-2.4-5.5-5.3 0-2.7 2.1-5 4.8-5.3.9-2.6 3.4-4.4 6.3-4.4 3.6 0 6.6 2.8 6.9 6.3 2.4.4 4.2 2.5 4.2 5 0 2.9-2.4 5.3-5.3 5.3H10z" />
          </>
        )}

        {key === "partly-cloudy" && (
          <>
            {isDay ? <SunCore reduce={reduce} cx={14} cy={14} r={5.5} /> : <MoonCore reduce={reduce} cx={14} cy={14} r={5.5} />}
            <CloudShape reduce={reduce} driftX={2.5} duration={6.5} fill="rgba(255,255,255,0.95)" d="M9 26c-3.3 0-6-2.6-6-5.8 0-3 2.3-5.4 5.2-5.7 1-2.8 3.7-4.8 6.9-4.8 3.9 0 7.2 3 7.6 6.8 2.6.4 4.6 2.7 4.6 5.5 0 3.1-2.6 5.8-5.9 5.8H9z" />
          </>
        )}

        {key === "overcast" && (
          <>
            <CloudShape reduce={reduce} driftX={2} duration={8} fill="rgba(210,224,238,0.85)" d="M6 18c-2.5 0-4.6-2-4.6-4.5 0-2.3 1.7-4.2 4-4.4.9-2.1 3-3.6 5.4-3.6 3 0 5.5 2.2 5.9 5.1 2 .3 3.6 2 3.6 4.1 0 2.3-1.9 4.2-4.2 4.2H6z" />
            <CloudShape reduce={reduce} driftX={2.6} duration={6} delay={0.6} fill="rgba(235,242,248,0.95)" d="M9 29c-3.3 0-6-2.6-6-5.8 0-3 2.3-5.4 5.2-5.7 1-2.8 3.7-4.8 6.9-4.8 3.9 0 7.2 3 7.6 6.8 2.6.4 4.6 2.7 4.6 5.5 0 3.1-2.6 5.8-5.9 5.8H9z" />
          </>
        )}

        {key === "fog" && <FogLines reduce={reduce} />}

        {key === "drizzle" && (
          <>
            <path d="M8 20c-2.8 0-5-2.2-5-5s2.2-5 5-5c.8-2.3 3-4 5.6-4 3.2 0 5.8 2.5 6.1 5.6 2.1.4 3.6 2.2 3.6 4.4 0 2.5-2 4.5-4.5 4.5H8z" fill="rgba(220,232,244,0.95)" />
            <RainDrops reduce={reduce} xs={[10, 16, 22, 28]} fromY={20} toY={28} speed={1.3} color="#90CAF9" />
          </>
        )}

        {(key === "rain" || key === "rain-heavy") && (
          <>
            <path d="M7 19c-3 0-5.5-2.4-5.5-5.4 0-2.7 2-4.9 4.6-5.3.9-2.5 3.3-4.3 6.1-4.3 3.5 0 6.4 2.7 6.7 6.1 2.3.4 4.1 2.4 4.1 4.9 0 2.7-2.3 5-5.1 5H7z" fill="rgba(140,180,224,0.95)" />
            <RainDrops reduce={reduce} xs={key === "rain-heavy" ? [7, 12, 17, 22, 27, 32] : [9, 15, 21, 27]} fromY={19} toY={30} speed={key === "rain-heavy" ? 0.55 : 0.85} color={key === "rain-heavy" ? "#1E88E5" : "#42A5F5"} />
          </>
        )}

        {key === "snow" && (
          <>
            <path d="M7 18c-2.8 0-5-2.2-5-5s2.2-5 5-5c.8-2.2 2.9-3.8 5.4-3.8 3.1 0 5.6 2.4 5.9 5.5 2 .4 3.5 2.1 3.5 4.2 0 2.4-2 4.4-4.4 4.4H7z" fill="rgba(220,232,244,0.95)" />
            <SnowFlakes reduce={reduce} xs={[9, 14, 19, 24, 29]} />
          </>
        )}

        {key === "shower" && (
          <>
            <path d="M9 20c-3.3 0-6-2.6-6-5.8 0-3 2.3-5.4 5.2-5.7 1-2.8 3.7-4.8 6.9-4.8 3.9 0 7.2 3 7.6 6.8 2.6.4 4.6 2.7 4.6 5.5H9z" fill="rgba(120,160,208,0.95)" />
            <RainDrops reduce={reduce} xs={[11, 17, 23, 29]} fromY={20} toY={30} speed={0.7} color="#64B5F6" />
          </>
        )}

        {key === "thunderstorm" && (
          <>
            <path d="M8 18c-3 0-5.5-2.4-5.5-5.4 0-2.7 2-4.9 4.6-5.3.9-2.5 3.3-4.3 6.1-4.3 3.5 0 6.4 2.7 6.7 6.1 2.3.4 4.1 2.4 4.1 4.9 0 2.7-2.3 5-5.1 5H8z" fill="rgba(70,86,120,0.95)" />
            <RainDrops reduce={reduce} xs={[9, 27]} fromY={18} toY={27} speed={0.8} color="#5C7CB8" />
            <LightningBolt reduce={reduce} />
          </>
        )}
      </g>
    </svg>
  );
}

// ─── Small line icons for the detail grid (all SVG, no emoji) ───

function DropletIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M12 3s7 7.5 7 12.2A7 7 0 0 1 5 15.2C5 10.5 12 3 12 3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function WindIcon({ rotate = 0 }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ transform: `rotate(${rotate}deg)` }}>
      <path d="M12 20V6M6 10l6-6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GaugeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M4 15a8 8 0 1 1 16 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 15l3.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="15" r="1.3" fill="currentColor" />
    </svg>
  );
}

function UvIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.8" />
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i * Math.PI) / 4;
        const x1 = 12 + Math.cos(a) * 7.2, y1 = 12 + Math.sin(a) * 7.2;
        const x2 = 12 + Math.cos(a) * 10, y2 = 12 + Math.sin(a) * 10;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />;
      })}
    </svg>
  );
}

function ThermoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M12 14.5V5a2 2 0 1 0-4 0v9.5a4 4 0 1 0 4 0z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
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

// A quiet signature element: an arc tracing the sun's path between sunrise
// and sunset, with a marker at the current position — this is the one
// place the card earns a little visual flourish.
function DayArc({ sunrise, sunset, isDay }) {
  if (!sunrise || !sunset) return null;
  const now = Date.now();
  const total = sunset.getTime() - sunrise.getTime();
  const elapsed = now - sunrise.getTime();
  const frac = Math.min(1, Math.max(0, elapsed / total));
  const cx = 60, cy = 44, r = 40;
  const angle = Math.PI * (1 - frac);
  const mx = cx - r * Math.cos(angle);
  const my = cy - r * Math.sin(angle);

  return (
    <div className="weather-arc">
      <svg width="120" height="52" viewBox="0 0 120 52" fill="none">
        <path d={`M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy}`} stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" strokeDasharray="1 4.5" strokeLinecap="round" />
        {isDay && frac > 0 && frac < 1 && (
          <path d={`M${cx - r} ${cy} A${r} ${r} 0 0 1 ${mx} ${my}`} stroke="rgba(255,217,61,0.85)" strokeWidth="1.5" strokeLinecap="round" />
        )}
        <circle cx={cx - r} cy={cy} r="2" fill="rgba(255,255,255,0.5)" />
        <circle cx={cx + r} cy={cy} r="2" fill="rgba(255,255,255,0.5)" />
        {isDay && frac >= 0 && frac <= 1 && (
          <motion.circle
            cx={mx}
            cy={my}
            r="4"
            fill="#FFD93D"
            animate={{ opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
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
    <AnimatePresence>
      <motion.button
        key="weather"
        type="button"
        className={`weather-widget${expanded ? " weather-widget--expanded" : ""}`}
        onClick={() => setExpanded((v) => !v)}
        initial={{ opacity: 0, y: -8, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.92 }}
        transition={{ duration: dur(0.5), ease: [0.16, 1, 0.3, 1] }}
        aria-expanded={expanded}
      >
        <div className="weather-row">
          <motion.div className="weather-icon-wrap" animate={{ y: [0, -2, 0] }} transition={{ duration: dur(3), repeat: Infinity, ease: "easeInOut" }}>
            <WeatherScene code={weather.code} size={30} isDay={weather.isDay} />
          </motion.div>
          <span className="weather-temp">{weather.temp}°</span>
          <span className="weather-label">{weather.label}</span>
          <motion.svg className="weather-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: dur(0.25) }}>
            <path d="M6 9l6 6 6-6" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </motion.svg>
        </div>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              className="weather-profile"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: dur(0.35), ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="weather-profile-inner">
                <div className="weather-profile-header" style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
                  <div className="weather-profile-header-glow" />
                  <div className="weather-profile-icon">
                    <WeatherScene code={weather.code} size={56} isDay={weather.isDay} />
                  </div>
                  <div className="weather-profile-temps">
                    <span className="weather-profile-temp">{weather.temp}°</span>
                    <div className="weather-profile-meta">
                      <span className="weather-profile-cond">{weather.label}</span>
                      <span className="weather-profile-feels">รู้สึกเหมือน {weather.feelsLike}°</span>
                    </div>
                  </div>
                  {weather.tempMax != null && (
                    <div className="weather-profile-minmax">
                      <span>สูงสุด {weather.tempMax}°</span>
                      <span>ต่ำสุด {weather.tempMin}°</span>
                    </div>
                  )}
                </div>

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
          )}
        </AnimatePresence>

        <WeatherStyles />
      </motion.button>
    </AnimatePresence>
  );
}

function WeatherStyles() {
  return (
    <style>{`
      .weather-widget {
        display: block;
        border: none;
        cursor: pointer;
        text-align: left;
        font-family: inherit;
        color: #fff;
        background: rgba(255, 255, 255, 0.06);
        border-radius: 999px;
        padding: 6px 12px;
        box-sizing: border-box;
        backdrop-filter: blur(14px) saturate(140%);
        -webkit-backdrop-filter: blur(14px) saturate(140%);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
        transition: background 0.2s ease, border-radius 0.25s ease, box-shadow 0.2s ease;
      }
      .weather-widget:hover { background: rgba(255, 255, 255, 0.1); }
      .weather-widget--expanded {
        border-radius: 20px;
        background: rgba(255, 255, 255, 0.09);
        box-shadow: 0 8px 28px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08);
      }
      .weather-widget--loading {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.06);
      }

      /* Collapsed pill row — every child is vertically centered on the same
         axis, and text uses line-height:1 so glyph and icon share one
         optical center instead of the icon reading high and the text low. */
      .weather-row {
        display: flex;
        align-items: center;
        gap: 8px;
        min-height: 30px;
      }
      .weather-icon-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        line-height: 0;
      }
      .weather-temp {
        display: inline-flex;
        align-items: center;
        line-height: 1;
        font-size: 14px;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        color: #fff;
      }
      .weather-label {
        display: inline-flex;
        align-items: center;
        line-height: 1;
        font-size: 13px;
        color: rgba(255, 255, 255, 0.7);
        white-space: nowrap;
      }
      .weather-chevron { flex-shrink: 0; margin-left: 2px; }

      /* Expanded "profile" card */
      .weather-profile { overflow: hidden; }
      .weather-profile-inner {
        padding-top: 12px;
        margin-top: 10px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        width: 236px;
      }

      .weather-profile-header {
        position: relative;
        border-radius: 16px;
        padding: 16px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .weather-profile-header-glow {
        position: absolute;
        inset: 0;
        background: radial-gradient(120px 80px at 85% -10%, rgba(255,255,255,0.35), transparent 70%);
        pointer-events: none;
      }
      .weather-profile-icon { align-self: flex-end; margin-top: -8px; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.15)); }
      .weather-profile-temps { display: flex; align-items: baseline; gap: 10px; }
      .weather-profile-temp { font-size: 40px; font-weight: 700; line-height: 1; letter-spacing: -0.02em; text-shadow: 0 2px 10px rgba(0,0,0,0.15); }
      .weather-profile-meta { display: flex; flex-direction: column; gap: 2px; }
      .weather-profile-cond { font-size: 13.5px; font-weight: 600; }
      .weather-profile-feels { font-size: 11.5px; color: rgba(255,255,255,0.85); }
      .weather-profile-minmax { display: flex; gap: 12px; font-size: 11.5px; color: rgba(255,255,255,0.9); font-variant-numeric: tabular-nums; }

      .weather-arc { display: flex; flex-direction: column; align-items: center; margin-top: 10px; }
      .weather-arc-labels {
        display: flex;
        justify-content: space-between;
        width: 100%;
        margin-top: -6px;
        font-size: 10px;
        color: rgba(255,255,255,0.55);
        font-variant-numeric: tabular-nums;
      }
      .weather-arc-labels span:nth-child(2) { color: rgba(255,255,255,0.4); }

      .weather-stat-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin-top: 12px;
      }
      .weather-stat-card {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
        padding: 9px 8px;
        border-radius: 12px;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.07);
        color: rgba(255,255,255,0.8);
      }
      .weather-stat-card--muted { color: rgba(255,255,255,0.55); }
      .weather-stat-card-value {
        font-size: 12.5px;
        font-weight: 600;
        color: rgba(255,255,255,0.95);
        font-variant-numeric: tabular-nums;
      }
      .weather-stat-card-label {
        font-size: 9.5px;
        color: rgba(255,255,255,0.55);
        line-height: 1.25;
      }

      .weather-spinner {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 2px solid rgba(255, 255, 255, 0.25);
        border-top-color: rgba(255, 255, 255, 0.85);
      }

      @media (prefers-reduced-motion: reduce) {
        .weather-widget, .weather-widget--expanded { transition: none !important; }
      }
    `}</style>
  );
}
