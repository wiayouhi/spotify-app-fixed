import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

function WeatherIcon({ code, size = 20 }) {
  const key = WMO_CODES[code]?.key || "clear";
  const s = size;
  const icons = {
    "clear": (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="4.5" fill="#FFD93D" />
        <g stroke="#FFD93D" strokeWidth="1.8" strokeLinecap="round">
          <line x1="12" y1="2" x2="12" y2="4.5" />
          <line x1="12" y1="19.5" x2="12" y2="22" />
          <line x1="2" y1="12" x2="4.5" y2="12" />
          <line x1="19.5" y1="12" x2="22" y2="12" />
          <line x1="4.93" y1="4.93" x2="6.64" y2="6.64" />
          <line x1="17.36" y1="17.36" x2="19.07" y2="19.07" />
          <line x1="19.07" y1="4.93" x2="17.36" y2="6.64" />
          <line x1="6.64" y1="17.36" x2="4.93" y2="19.07" />
        </g>
      </svg>
    ),
    "mostly-clear": (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <circle cx="10" cy="11" r="3.5" fill="#FFD93D" />
        <rect x="5" y="13" width="14" height="7" rx="3.5" fill="rgba(255,255,255,0.85)" />
      </svg>
    ),
    "partly-cloudy": (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="10" r="3" fill="#FFD93D" />
        <rect x="4" y="12" width="16" height="8" rx="4" fill="rgba(255,255,255,0.9)" />
      </svg>
    ),
    "overcast": (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="8" width="18" height="10" rx="5" fill="rgba(180,200,220,0.95)" />
        <rect x="6" y="5" width="12" height="8" rx="4" fill="rgba(200,215,230,0.9)" />
      </svg>
    ),
    "fog": (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="7" width="18" height="3" rx="1.5" fill="rgba(180,200,220,0.7)" />
        <rect x="5" y="12" width="14" height="3" rx="1.5" fill="rgba(180,200,220,0.5)" />
        <rect x="3" y="17" width="18" height="3" rx="1.5" fill="rgba(180,200,220,0.4)" />
      </svg>
    ),
    "drizzle": (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="4" y="4" width="16" height="9" rx="4.5" fill="rgba(160,200,240,0.9)" />
        <line x1="8" y1="15" x2="7" y2="19" stroke="#90CAF9" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="12" y1="16" x2="11" y2="20" stroke="#90CAF9" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="16" y1="15" x2="15" y2="19" stroke="#90CAF9" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    "rain": (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="10" rx="5" fill="rgba(100,160,220,0.9)" />
        <line x1="7" y1="15" x2="5" y2="21" stroke="#42A5F5" strokeWidth="2" strokeLinecap="round"/>
        <line x1="12" y1="15" x2="10" y2="21" stroke="#42A5F5" strokeWidth="2" strokeLinecap="round"/>
        <line x1="17" y1="15" x2="15" y2="21" stroke="#42A5F5" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    "rain-heavy": (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="2" width="20" height="10" rx="5" fill="rgba(70,130,180,0.95)" />
        <line x1="6" y1="14" x2="4" y2="22" stroke="#1E88E5" strokeWidth="2.2" strokeLinecap="round"/>
        <line x1="11" y1="14" x2="9" y2="22" stroke="#1E88E5" strokeWidth="2.2" strokeLinecap="round"/>
        <line x1="16" y1="14" x2="14" y2="22" stroke="#1E88E5" strokeWidth="2.2" strokeLinecap="round"/>
        <line x1="20" y1="14" x2="18" y2="20" stroke="#1E88E5" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    "snow": (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="10" rx="5" fill="rgba(200,220,240,0.95)" />
        <circle cx="8" cy="18" r="2" fill="white" opacity="0.9"/>
        <circle cx="14" cy="20" r="1.5" fill="white" opacity="0.8"/>
        <circle cx="18" cy="17" r="1.5" fill="white" opacity="0.7"/>
      </svg>
    ),
    "shower": (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <path d="M6 11a6 6 0 1 1 11.95 1H17a4 4 0 0 1 0 8H6a5 5 0 0 1-.5-9.97" fill="rgba(100,140,200,0.9)"/>
        <line x1="9" y1="15" x2="7" y2="21" stroke="#64B5F6" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="14" y1="15" x2="12" y2="21" stroke="#64B5F6" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
    "thunderstorm": (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="2" width="20" height="10" rx="5" fill="rgba(60,80,120,0.95)" />
        <path d="M13 13l-3 5h4l-3 4" stroke="#FFD600" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
    ),
  };
  return icons[key] || icons["clear"];
}

export default function WeatherWidget({ animSpeed = 1 }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchWeather = async () => {
      try {
        const pos = await new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
        );
        const { latitude: lat, longitude: lon } = pos.coords;
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,windspeed_10m,relative_humidity_2m&timezone=auto`;
        const res = await fetch(url);
        const data = await res.json();
        if (!mounted) return;
        const cur = data.current;
        setWeather({
          temp: Math.round(cur.temperature_2m),
          code: cur.weathercode,
          wind: Math.round(cur.windspeed_10m),
          humidity: cur.relative_humidity_2m,
          label: WMO_CODES[cur.weathercode]?.label || "ไม่ทราบ",
        });
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

  if (loading) return (
    <motion.div className="weather-widget weather-loading"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div className="weather-spinner"
        animate={{ rotate: 360 }}
        transition={{ duration: dur(1), repeat: Infinity, ease: "linear" }} />
    </motion.div>
  );

  if (error || !weather) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="weather"
        className="weather-widget"
        initial={{ opacity: 0, y: -8, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.92 }}
        transition={{ duration: dur(0.5), ease: [0.16, 1, 0.3, 1] }}
        title={`${weather.label} | ความชื้น ${weather.humidity}% | ลม ${weather.wind} km/h`}
      >
        <motion.div className="weather-icon-wrap"
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: dur(3), repeat: Infinity, ease: "easeInOut" }}
        >
          <WeatherIcon code={weather.code} size={18} />
        </motion.div>
        <span className="weather-temp">{weather.temp}°</span>
        <span className="weather-label">{weather.label}</span>
      </motion.div>
    </AnimatePresence>
  );
}
