import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { redirectToSpotifyLogin } from "../utils/spotifyAuth";
import "./LoginScreen.css";

// ────────────────────────────────────────
//  Discord presence — ดึงสถานะจาก Lanyard API
// ────────────────────────────────────────
function useDiscordPresence(userId) {
  const [presence, setPresence] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchPresence = async () => {
      try {
        const res = await fetch(`https://api.lanyard.rest/v1/users/${userId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) setPresence(data.data);
        }
      } catch (e) {
        console.warn("Discord presence unavailable:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchPresence();
    const interval = setInterval(fetchPresence, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  return { presence, loading };
}

function statusColor(status) {
  switch (status) {
    case "online": return "#23a55a";
    case "idle": return "#f0b232";
    case "dnd": return "#f23f42";
    default: return "#80848e";
  }
}
function statusLabel(status) {
  switch (status) {
    case "online": return "ออนไลน์";
    case "idle": return "ไม่อยู่หน้าจอ";
    case "dnd": return "ห้ามรบกวน";
    default: return "ออฟไลน์";
  }
}

// ────────────────────────────────────────
//  Discord Status Card
// ────────────────────────────────────────
function DiscordCard({ userId }) {
  const { presence, loading } = useDiscordPresence(userId);

  return (
    <motion.div
      className="dc-card"
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.9, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="dc-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#5865F2" style={{ flexShrink: 0 }}>
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
        </svg>
        <span className="dc-label">สถานะ Discord</span>
      </div>

      {loading ? (
        <div className="dc-loading">
          <motion.div
            className="dc-spinner"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <span>กำลังโหลด...</span>
        </div>
      ) : presence ? (
        <div className="dc-content">
          <div className="dc-avatar-wrap">
            <img
              src={`https://cdn.discordapp.com/avatars/${presence.discord_user.id}/${presence.discord_user.avatar}.webp?size=64`}
              alt="avatar"
              className="dc-avatar"
              onError={(e) => { e.target.style.display = "none"; }}
            />
            <motion.div
              className="dc-status-dot"
              style={{ background: statusColor(presence.discord_status) }}
              animate={{ scale: presence.discord_status === "online" ? [1, 1.15, 1] : 1 }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          <div className="dc-info">
            <div className="dc-username">
              {presence.discord_user.display_name || presence.discord_user.username}
            </div>
            <div className="dc-status-row">
              <span className="dc-dot-inline" style={{ background: statusColor(presence.discord_status) }} />
              <span className="dc-status-text">{statusLabel(presence.discord_status)}</span>
            </div>
            {presence.spotify && (
              <motion.div
                className="dc-spotify"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.4 }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#1db954">
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.622.622 0 01-.853.205c-2.336-1.426-5.275-1.75-8.743-.957a.623.623 0 11-.271-1.215c3.784-.863 7.037-.48 9.662 1.125a.622.622 0 01.205.842zm1.218-2.724a.777.777 0 01-1.066.255c-2.673-1.642-6.76-2.096-9.877-1.148a.777.777 0 11-.454-1.485c3.568-1.085 8.1-.58 11.142 1.288a.777.777 0 01.255 1.09zm.106-2.85c-3.21-1.906-8.5-2.08-11.564-1.152a.933.933 0 11-.537-1.788c3.518-1.062 9.356-.86 13.06 1.34a.933.933 0 01-.96 1.6z"/>
                </svg>
                <span className="dc-spotify-track">
                  {presence.spotify.song} — {presence.spotify.artist}
                </span>
              </motion.div>
            )}
          </div>
        </div>
      ) : (
        <div className="dc-offline">ไม่สามารถดึงข้อมูลได้</div>
      )}
    </motion.div>
  );
}

// ────────────────────────────────────────
//  Ambient equalizer mesh — พื้นหลังต่อเนื่องทั้งหน้า (signature element)
//  แถบไล่สีเบลอที่ขยับขึ้นลงคล้าย equalizer เบาๆ ตลอดความสูงของเพจ
// ────────────────────────────────────────
function EqualizerMesh() {
  const bars = Array.from({ length: 24 });
  return (
    <div className="eq-mesh" aria-hidden="true">
      {bars.map((_, i) => (
        <motion.div
          key={i}
          className="eq-mesh-bar"
          style={{ left: `${(i / bars.length) * 100}%` }}
          animate={{
            scaleY: [0.4, 1, 0.5, 0.85, 0.4],
            opacity: [0.12, 0.28, 0.16, 0.24, 0.12],
          }}
          transition={{
            duration: 6 + (i % 5) * 1.3,
            repeat: Infinity,
            delay: i * 0.18,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ────────────────────────────────────────
//  Intro overlay (แสดงครั้งแรกต่อ session)
// ────────────────────────────────────────
function IntroOverlay({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      className="intro-overlay"
      exit={{ opacity: 0, scale: 1.08 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="intro-ring"
          style={{ "--ri": i }}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1 + i * 0.25, opacity: [0, 0.4, 0] }}
          transition={{ duration: 2, delay: i * 0.3, repeat: Infinity, ease: "easeOut" }}
        />
      ))}

      <motion.div
        className="intro-logo"
        initial={{ scale: 0, rotate: -30, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      >
        <svg width="64" height="64" viewBox="0 0 24 24" fill="#1db954">
          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.622.622 0 01-.853.205c-2.336-1.426-5.275-1.75-8.743-.957a.623.623 0 11-.271-1.215c3.784-.863 7.037-.48 9.662 1.125a.622.622 0 01.205.842zm1.218-2.724a.777.777 0 01-1.066.255c-2.673-1.642-6.76-2.096-9.877-1.148a.777.777 0 11-.454-1.485c3.568-1.085 8.1-.58 11.142 1.288a.777.777 0 01.255 1.09zm.106-2.85c-3.21-1.906-8.5-2.08-11.564-1.152a.933.933 0 11-.537-1.788c3.518-1.062 9.356-.86 13.06 1.34a.933.933 0 01-.96 1.6z"/>
        </svg>
      </motion.div>

      <motion.div
        className="intro-title"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        Synced Lyrics
      </motion.div>
      <motion.div
        className="intro-sub"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        เนื้อเพลงแบบเรียลไทม์ · สำหรับ Spotify
      </motion.div>
    </motion.div>
  );
}

// ────────────────────────────────────────
//  Login page-transition overlay — เล่นก่อน redirect ไป Spotify
// ────────────────────────────────────────
function LoginTransition() {
  return (
    <motion.div
      className="login-transition"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="login-transition-disc"
        initial={{ scale: 0, rotate: 0 }}
        animate={{ scale: 1, rotate: 360 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="login-transition-disc-hole" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
      >
        กำลังพาไปที่ Spotify...
      </motion.p>
    </motion.div>
  );
}

const FEATURES = [
  { icon: "🎵", text: "เนื้อเพลง Sync แบบเรียลไทม์" },
  { icon: "🎨", text: "พื้นหลังสีจากปกอัลบั้ม" },
  { icon: "⏱️", text: "แสดงคิวและ Progress Bar" },
  { icon: "🌤️", text: "นาฬิกาและสภาพอากาศ" },
  { icon: "🖥️", text: "เล่นเสียงผ่าน Browser โดยตรง" },
];

// เนื้อหาสำหรับ section "เกี่ยวกับเว็บนี้" — ไม่ใช่ลำดับขั้นตอน จึงใช้เป็น grid ไม่ใส่เลข
const ABOUT_CARDS = [
  {
    title: "ซิงก์ทุกจังหวะ",
    body: "เนื้อเพลงขยับตามเพลงที่กำลังเล่นในบัญชี Spotify ของคุณแบบวินาทีต่อวินาที ไม่ต้องกดเลื่อนเอง",
  },
  {
    title: "พื้นหลังมีชีวิต",
    body: "สีพื้นหลังดึงมาจากปกอัลบั้มที่กำลังฟัง แล้วไล่โทนนุ่มๆ ให้เข้ากับบรรยากาศเพลงนั้น",
  },
  {
    title: "เล่นได้จากเบราว์เซอร์",
    body: "ไม่ต้องสลับแอป เปิดเพลง ควบคุม เล่น/หยุด/ข้าม ได้จากหน้าเว็บโดยตรง",
  },
  {
    title: "รู้เวลา รู้อากาศ",
    body: "นาฬิกาและสภาพอากาศแบบเรียลไทม์ วางไว้มุมจอให้เห็นระหว่างฟังเพลงโดยไม่ต้องสลับแท็บ",
  },
];

const DISCORD_USER_ID = "902739412172046427";

export default function LoginScreen() {
  const [showIntro, setShowIntro] = useState(() => !sessionStorage.getItem("intro_seen"));
  const [transitioning, setTransitioning] = useState(false);
  const aboutRef = useRef(null);

  const handleIntroDone = () => {
    sessionStorage.setItem("intro_seen", "1");
    setShowIntro(false);
  };

  const handleLogin = () => {
    setTransitioning(true);
    setTimeout(() => {
      redirectToSpotifyLogin();
    }, 650);
  };

  const scrollToAbout = () => {
    aboutRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="login-screen-v2">
      <EqualizerMesh />

      {/* Ambient blobs */}
      <div className="lv2-bg">
        <motion.div className="lv2-blob lv2-blob-1"
          animate={{ scale: [1, 1.2, 1], x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div className="lv2-blob lv2-blob-2"
          animate={{ scale: [1, 1.15, 1], x: [0, -20, 0], y: [0, 25, 0] }}
          transition={{ duration: 13, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.div className="lv2-blob lv2-blob-3"
          animate={{ scale: [1, 1.1, 1], rotate: [0, 20, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 5 }}
        />
        <div className="lv2-grid" />
      </div>

      <AnimatePresence>
        {showIntro && (
          <motion.div key="intro" initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
            <IntroOverlay onDone={handleIntroDone} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {transitioning && <LoginTransition key="login-transition" />}
      </AnimatePresence>

      <AnimatePresence>
        {!showIntro && (
          <motion.div
            className="lv2-scroll-root"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* ── Hero section (เต็มจอ) ── */}
            <section className="lv2-hero">
              <div className="lv2-layout">
                <motion.div
                  className="lv2-card"
                  initial={{ opacity: 0, x: -40, scale: 0.96 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="lv2-card-shimmer" />

                  <motion.div
                    className="lv2-logo"
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <motion.div
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <svg width="56" height="56" viewBox="0 0 24 24" fill="#1db954">
                        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.622.622 0 01-.853.205c-2.336-1.426-5.275-1.75-8.743-.957a.623.623 0 11-.271-1.215c3.784-.863 7.037-.48 9.662 1.125a.622.622 0 01.205.842zm1.218-2.724a.777.777 0 01-1.066.255c-2.673-1.642-6.76-2.096-9.877-1.148a.777.777 0 11-.454-1.485c3.568-1.085 8.1-.58 11.142 1.288a.777.777 0 01.255 1.09zm.106-2.85c-3.21-1.906-8.5-2.08-11.564-1.152a.933.933 0 11-.537-1.788c3.518-1.062 9.356-.86 13.06 1.34a.933.933 0 01-.96 1.6z"/>
                      </svg>
                    </motion.div>
                    <motion.div
                      className="lv2-logo-ring"
                      animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </motion.div>

                  <motion.h1 className="lv2-title"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.5 }}
                  >
                    Synced Lyrics
                  </motion.h1>

                  <motion.p className="lv2-subtitle"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.5 }}
                  >
                    แสดงเนื้อเพลงแบบ Sync กับ Spotify แบบเรียลไทม์<br/>
                    พร้อมพื้นหลังสีสดใสจากปกอัลบั้มของคุณ
                  </motion.p>

                  <motion.div
                    className="lv2-features"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    {FEATURES.map((f, i) => (
                      <motion.div
                        key={i}
                        className="lv2-chip"
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.55 + i * 0.07, duration: 0.4 }}
                        whileHover={{ scale: 1.03, x: 4 }}
                      >
                        <span className="lv2-chip-icon">{f.icon}</span>
                        <span>{f.text}</span>
                      </motion.div>
                    ))}
                  </motion.div>

                  <motion.button
                    className="lv2-login-btn"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.85, duration: 0.5 }}
                    whileHover={{ scale: 1.03, boxShadow: "0 0 40px rgba(29,185,84,0.5)" }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleLogin}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.622.622 0 01-.853.205c-2.336-1.426-5.275-1.75-8.743-.957a.623.623 0 11-.271-1.215c3.784-.863 7.037-.48 9.662 1.125a.622.622 0 01.205.842zm1.218-2.724a.777.777 0 01-1.066.255c-2.673-1.642-6.76-2.096-9.877-1.148a.777.777 0 11-.454-1.485c3.568-1.085 8.1-.58 11.142 1.288a.777.777 0 01.255 1.09zm.106-2.85c-3.21-1.906-8.5-2.08-11.564-1.152a.933.933 0 11-.537-1.788c3.518-1.062 9.356-.86 13.06 1.34a.933.933 0 01-.96 1.6z"/>
                    </svg>
                    เชื่อมต่อกับ Spotify
                    <motion.div
                      className="lv2-btn-shine"
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
                    />
                  </motion.button>

                  <motion.p className="lv2-hint"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.0 }}
                  >
                    ต้องเปิดเพลงอยู่ใน Spotify · รองรับทุกแพลตฟอร์ม
                  </motion.p>

                  {[0, 1, 2, 3].map((i) => (
                    <motion.div key={i} className={`lv2-note lv2-note-${i}`}
                      animate={{
                        y: [0, -24, 0],
                        opacity: [0.3, 0.7, 0.3],
                        rotate: [0, i % 2 === 0 ? 12 : -12, 0],
                        scale: [1, 1.15, 1],
                      }}
                      transition={{ duration: 3 + i * 0.7, repeat: Infinity, delay: i * 0.9, ease: "easeInOut" }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(29,185,84,0.65)">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                      </svg>
                    </motion.div>
                  ))}
                </motion.div>

                <motion.div
                  className="lv2-right"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                >
                  <DiscordCard userId={DISCORD_USER_ID} />

                  <motion.div
                    className="lv2-creator"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1, duration: 0.5 }}
                  >
                    <div className="lv2-creator-title">ผู้จัดทำ</div>
                    <div className="lv2-creator-row">
                      <div className="lv2-creator-avatar">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(255,255,255,0.6)">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                      </div>
                      <div>
                        <div className="lv2-creator-name">นายทะเบียน</div>
                        <div className="lv2-creator-role">Developer · Designer</div>
                      </div>
                    </div>

                    <div className="lv2-creator-tags">
                      {["React", "Spotify API", "Framer Motion", "Vite"].map((tag) => (
                        <motion.span
                          key={tag}
                          className="lv2-tech-tag"
                          whileHover={{ scale: 1.05, backgroundColor: "rgba(29,185,84,0.15)" }}
                        >
                          {tag}
                        </motion.span>
                      ))}
                    </div>

                    <div className="lv2-version">
                      <span>Synced Lyrics v2.0</span>
                      <span className="lv2-dot">·</span>
                      <span>© {new Date().getFullYear()}</span>
                    </div>
                  </motion.div>

                  <motion.div
                    className="lv2-waveform"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.3, duration: 0.6 }}
                  >
                    {[...Array(18)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="lv2-bar"
                        animate={{ scaleY: [0.3, 1, 0.3, 0.6, 0.3] }}
                        transition={{
                          duration: 1.2 + (i % 3) * 0.3,
                          repeat: Infinity,
                          delay: i * 0.08,
                          ease: "easeInOut",
                        }}
                      />
                    ))}
                  </motion.div>
                </motion.div>
              </div>

              <motion.button
                className="lv2-scroll-cue"
                onClick={scrollToAbout}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: [0, 8, 0] }}
                transition={{ opacity: { delay: 1.4, duration: 0.5 }, y: { duration: 1.8, repeat: Infinity, ease: "easeInOut" } }}
                aria-label="เลื่อนดูเพิ่มเติมเกี่ยวกับเว็บนี้"
              >
                <span>รู้จักเว็บนี้เพิ่มเติม</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </motion.button>
            </section>

            {/* ── About section (เลื่อนดู) ── */}
            <section className="lv2-about" ref={aboutRef}>
              <motion.div
                className="lv2-about-inner"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="lv2-about-eyebrow">เกี่ยวกับเว็บนี้</span>
                <h2 className="lv2-about-title">
                  ฟังเพลงและอ่านเนื้อเพลงไปพร้อมกัน<br />ไม่ต้องสลับแอปให้เสียจังหวะ
                </h2>

                <div className="lv2-about-grid">
                  {ABOUT_CARDS.map((c, i) => (
                    <motion.div
                      key={c.title}
                      className="lv2-about-card"
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.4 }}
                      transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                      whileHover={{ y: -6 }}
                    >
                      <h3>{c.title}</h3>
                      <p>{c.body}</p>
                    </motion.div>
                  ))}
                </div>

                <motion.button
                  className="lv2-login-btn lv2-login-btn-ghost"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleLogin}
                >
                  เริ่มต้นใช้งานเลย
                </motion.button>
              </motion.div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
