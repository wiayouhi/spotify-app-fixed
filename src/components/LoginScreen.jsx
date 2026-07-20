import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { redirectToSpotifyLogin } from "../utils/spotifyAuth";

const EASE = [0.16, 1, 0.3, 1];

// ────────────────────────────────────────
//  Responsive helper — mobile UI is not built yet, so anything under the
//  breakpoint gets the <MobileUnsupported /> screen instead of the full layout.
// ────────────────────────────────────────
function useIsMobile(breakpoint = 860) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [breakpoint]);
  return isMobile;
}

// Discord presence fetch — ดึงสถานะจาก Lanyard API
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

const SPOTIFY_PATH =
  "M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.622.622 0 01-.853.205c-2.336-1.426-5.275-1.75-8.743-.957a.623.623 0 11-.271-1.215c3.784-.863 7.037-.48 9.662 1.125a.622.622 0 01.205.842zm1.218-2.724a.777.777 0 01-1.066.255c-2.673-1.642-6.76-2.096-9.877-1.148a.777.777 0 11-.454-1.485c3.568-1.085 8.1-.58 11.142 1.288a.777.777 0 01.255 1.09zm.106-2.85c-3.21-1.906-8.5-2.08-11.564-1.152a.933.933 0 11-.537-1.788c3.518-1.062 9.356-.86 13.06 1.34a.933.933 0 01-.96 1.6z";

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
      transition={{ delay: 0.9, duration: 0.55, ease: EASE }}
    >
      <div className="dc-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#5865F2" style={{ flexShrink: 0 }}>
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
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
                  <path d={SPOTIFY_PATH} />
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
//  Intro overlay (แสดงครั้งแรก)
// ────────────────────────────────────────
function IntroOverlay({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      className="intro-overlay"
      exit={{ opacity: 0, scale: 1.08 }}
      transition={{ duration: 0.7, ease: EASE }}
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
        transition={{ duration: 0.65, ease: EASE }}
      >
        <svg width="64" height="64" viewBox="0 0 24 24" fill="#1db954">
          <path d={SPOTIFY_PATH} />
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
//  Connecting overlay — circle-reveal transition played on login click,
//  right before the browser navigates off to Spotify's OAuth screen.
// ────────────────────────────────────────
function ConnectingOverlay({ origin }) {
  return (
    <motion.div
      className="connect-overlay"
      initial={{ clipPath: `circle(0px at ${origin.x}px ${origin.y}px)` }}
      animate={{ clipPath: `circle(160% at ${origin.x}px ${origin.y}px)` }}
      transition={{ duration: 0.75, ease: [0.76, 0, 0.24, 1] }}
    >
      <motion.div
        className="connect-content"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.4, ease: EASE }}
      >
        <motion.div
          className="connect-logo"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
        >
          <svg width="46" height="46" viewBox="0 0 24 24" fill="#0b0d10">
            <path d={SPOTIFY_PATH} />
          </svg>
        </motion.div>
        <div className="connect-text">กำลังเชื่อมต่อกับ Spotify...</div>
      </motion.div>
    </motion.div>
  );
}

// ────────────────────────────────────────
//  Mobile — feature not built yet, show a friendly placeholder instead
// ────────────────────────────────────────
function MobileUnsupported() {
  return (
    <div className="mob-screen">
      <div className="mob-bg">
        <motion.div
          className="mob-blob"
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.75, 0.5] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        className="mob-card"
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: EASE }}
      >
        <motion.div
          className="mob-icon"
          animate={{ rotate: [0, -8, 8, 0] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#1db954" strokeWidth="1.6">
            <rect x="7" y="2" width="10" height="20" rx="2" />
            <line x1="11" y1="18" x2="13" y2="18" />
          </svg>
          <motion.div
            className="mob-icon-slash"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.4, duration: 0.35, ease: EASE }}
          />
        </motion.div>

        <h1 className="mob-title">ยังไม่รองรับมือถือ</h1>
        <p className="mob-desc">
          ตอนนี้ Synced Lyrics ยังออกแบบมาสำหรับหน้าจอคอมพิวเตอร์เท่านั้น
          กรุณาเปิดผ่านเบราว์เซอร์บนคอมพิวเตอร์เพื่อประสบการณ์ที่ดีที่สุด
        </p>
        <div className="mob-tag">🖥️ กำลังพัฒนา UI สำหรับมือถือ</div>
      </motion.div>
    </div>
  );
}

// ────────────────────────────────────────
//  Feature data
// ────────────────────────────────────────
const FEATURES = [
  { icon: "🎵", text: "เนื้อเพลง Sync แบบเรียลไทม์" },
  { icon: "🎨", text: "พื้นหลังสีจากปกอัลบั้ม" },
  { icon: "⏱️", text: "แสดงคิวและ Progress Bar" },
  { icon: "🌤️", text: "นาฬิกาและสภาพอากาศ" },
  { icon: "🖥️", text: "เล่นเสียงผ่าน Browser โดยตรง" },
];

const ABOUT_FEATURES = [
  { icon: "🎵", title: "เนื้อเพลงเรียลไทม์", desc: "เนื้อเพลงเลื่อนตามจังหวะเพลงที่กำลังเล่นอยู่ในบัญชี Spotify ของคุณโดยอัตโนมัติ ไม่ต้องกดอะไรเพิ่ม" },
  { icon: "🎨", title: "พื้นหลังจากปกอัลบั้ม", desc: "สีพื้นหลังไล่เฉดตามปกอัลบั้มของเพลงที่กำลังเล่น เปลี่ยนบรรยากาศไปตามเพลงแบบสด ๆ" },
  { icon: "🔍", title: "ค้นหาและเล่นได้ทันที", desc: "กดปุ่มลับเพื่อเปิดหน้าค้นหาแบบเต็มจอ เลือกเพลงด้วยคีย์บอร์ดหรือเมาส์ก็ได้" },
  { icon: "🌤️", title: "นาฬิกาและสภาพอากาศ", desc: "แสดงเวลาและสภาพอากาศปัจจุบันแบบเนียน ๆ อยู่มุมจอ ไม่รบกวนสายตา" },
  { icon: "🖥️", title: "เล่นเสียงผ่านเบราว์เซอร์", desc: "ไม่ต้องเปิดแอป Spotify แยก ควบคุมและฟังเสียงได้จากเบราว์เซอร์โดยตรง" },
  { icon: "⚡", title: "ลื่นไหลทุกอนิเมชัน", desc: "ออกแบบด้วย Framer Motion ทุกการเปลี่ยนหน้าและปฏิสัมพันธ์ถูกปรับให้ลื่นไหลที่สุด" },
];

const STEPS = [
  { n: "01", title: "เชื่อมต่อ Spotify", desc: "ล็อกอินด้วยบัญชี Spotify ของคุณผ่านหน้านี้ ปลอดภัยด้วย OAuth มาตรฐาน" },
  { n: "02", title: "เปิดเพลงตามปกติ", desc: "เปิดเพลงในแอป Spotify เครื่องไหนก็ได้ ระบบจะดึงสถานะเพลงมาแสดงอัตโนมัติ" },
  { n: "03", title: "เพลิดเพลินกับเนื้อเพลง", desc: "เนื้อเพลงและพื้นหลังจะซิงก์ตามเพลงแบบเรียลไทม์ให้คุณดื่มด่ำไปกับดนตรี" },
];

const DISCORD_USER_ID = "902739412172046427";

// ────────────────────────────────────────
//  Main LoginScreen
// ────────────────────────────────────────
export default function LoginScreen() {
  const isMobile = useIsMobile();

  const [showIntro, setShowIntro] = useState(() => !sessionStorage.getItem("intro_seen"));
  const [connecting, setConnecting] = useState(false);
  const [connectOrigin, setConnectOrigin] = useState({ x: "50%", y: "50%" });
  const loginBtnRef = useRef(null);

  const handleIntroDone = () => {
    sessionStorage.setItem("intro_seen", "1");
    setShowIntro(false);
  };

  const handleLogin = () => {
    const rect = loginBtnRef.current?.getBoundingClientRect();
    if (rect) setConnectOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    setConnecting(true);
    // let the reveal animation play for a beat before the browser navigates away
    setTimeout(() => redirectToSpotifyLogin(), 850);
  };

  const scrollToAbout = () => {
    document.getElementById("lv2-about")?.scrollIntoView({ behavior: "smooth" });
  };

  if (isMobile) return <MobileUnsupported />;

  return (
    <div className="login-screen-v2">
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
          <motion.div key="intro" initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.6, ease: EASE }}>
            <IntroOverlay onDone={handleIntroDone} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {connecting && <ConnectingOverlay origin={connectOrigin} />}
      </AnimatePresence>

      <AnimatePresence>
        {!showIntro && (
          <motion.div
            className="lv2-scroll"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* ══════════ HERO ══════════ */}
            <section className="lv2-layout">
              <motion.div
                className="lv2-card"
                initial={{ opacity: 0, x: -40, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 0.65, ease: EASE }}
              >
                <div className="lv2-card-shimmer" />

                <motion.div
                  className="lv2-logo"
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.15, duration: 0.6, ease: EASE }}
                >
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <svg width="56" height="56" viewBox="0 0 24 24" fill="#1db954">
                      <path d={SPOTIFY_PATH} />
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
                  แสดงเนื้อเพลงแบบ Sync กับ Spotify แบบเรียลไทม์<br />
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
                  ref={loginBtnRef}
                  className="lv2-login-btn"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.85, duration: 0.5 }}
                  whileHover={{ scale: 1.03, boxShadow: "0 0 40px rgba(29,185,84,0.5)" }}
                  whileTap={{ scale: 0.94 }}
                  onClick={handleLogin}
                  disabled={connecting}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                    <path d={SPOTIFY_PATH} />
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
                  ต้องเปิดเพลงอยู่ใน Spotify · รองรับทุกแพลตฟอร์มบนคอมพิวเตอร์
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
                      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                    </svg>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div
                className="lv2-right"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.65, ease: EASE }}
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
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
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

              <motion.button
                className="lv2-scroll-hint"
                onClick={scrollToAbout}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: [0, 8, 0] }}
                transition={{ opacity: { delay: 1.4, duration: 0.5 }, y: { duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 1.4 } }}
                whileHover={{ opacity: 1, scale: 1.08 }}
              >
                <span>เลื่อนดูเพิ่มเติม</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </motion.button>
            </section>

            {/* ══════════ ABOUT ══════════ */}
            <section className="lv2-about" id="lv2-about">
              <motion.div
                className="about-heading"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.55, ease: EASE }}
              >
                <span className="about-eyebrow">เกี่ยวกับเว็บนี้</span>
                <h2>ทำไมต้อง Synced Lyrics</h2>
                <p>เว็บแอปเล็ก ๆ ที่ทำให้การฟังเพลงบน Spotify มีบรรยากาศมากขึ้น ด้วยเนื้อเพลงที่ซิงก์ตามจังหวะจริงและพื้นหลังที่มีชีวิตชีวา</p>
              </motion.div>

              <div className="about-grid">
                {ABOUT_FEATURES.map((f, i) => (
                  <motion.div
                    key={f.title}
                    className="about-card"
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.5, delay: (i % 3) * 0.08, ease: EASE }}
                    whileHover={{ y: -6, borderColor: "rgba(29,185,84,0.4)" }}
                  >
                    <span className="about-card-icon">{f.icon}</span>
                    <h3>{f.title}</h3>
                    <p>{f.desc}</p>
                  </motion.div>
                ))}
              </div>

              <motion.div
                className="about-steps"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5 }}
              >
                {STEPS.map((s, i) => (
                  <motion.div
                    key={s.n}
                    className="about-step"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.45, delay: i * 0.12, ease: EASE }}
                  >
                    <span className="about-step-n">{s.n}</span>
                    <div>
                      <h4>{s.title}</h4>
                      <p>{s.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div
                className="about-cta"
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                <h3>พร้อมเริ่มฟังเพลงแบบมีเนื้อเพลงหรือยัง?</h3>
                <motion.button
                  className="about-cta-btn"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogin}
                  disabled={connecting}
                >
                  เชื่อมต่อกับ Spotify ตอนนี้
                </motion.button>
              </motion.div>

              <footer className="about-footer">
                <span>Synced Lyrics v2.0</span>
                <span className="lv2-dot">·</span>
                <span>สร้างด้วย React · Framer Motion · Spotify API</span>
                <span className="lv2-dot">·</span>
                <span>© {new Date().getFullYear()}</span>
              </footer>
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .login-screen-v2 { position: relative; min-height: 100vh; background: #0b0d10; overflow: hidden; }

        .lv2-scroll { position: relative; z-index: 2; height: 100vh; overflow-y: auto; overflow-x: hidden; scroll-behavior: smooth; }

        .lv2-bg { position: fixed; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; }
        .lv2-blob { position: absolute; border-radius: 50%; filter: blur(90px); opacity: 0.35; }
        .lv2-blob-1 { width: 520px; height: 520px; top: -120px; left: -100px; background: #1db954; }
        .lv2-blob-2 { width: 460px; height: 460px; bottom: -140px; right: -80px; background: #5865F2; opacity: 0.22; }
        .lv2-blob-3 { width: 360px; height: 360px; top: 40%; left: 55%; background: #1ed760; opacity: 0.15; }
        .lv2-grid {
          position: absolute; inset: 0;
          background-image: linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
          background-size: 42px 42px;
          mask-image: radial-gradient(ellipse at 50% 0%, black 0%, transparent 75%);
        }

        /* ── Intro ── */
        .intro-overlay {
          position: fixed; inset: 0; z-index: 100;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          background: #0b0d10;
        }
        .intro-ring {
          position: absolute; width: 180px; height: 180px; border-radius: 50%;
          border: 1.5px solid rgba(29,185,84,0.5);
        }
        .intro-logo { position: relative; z-index: 1; margin-bottom: 20px; }
        .intro-title { font-size: 30px; font-weight: 700; color: #fff; letter-spacing: -0.02em; }
        .intro-sub { font-size: 14px; color: rgba(255,255,255,0.5); margin-top: 6px; }

        /* ── Connecting overlay ── */
        .connect-overlay {
          position: fixed; inset: 0; z-index: 300;
          background: radial-gradient(circle at center, #1db954 0%, #0e8f42 60%, #0b0d10 100%);
          display: flex; align-items: center; justify-content: center;
        }
        .connect-content { display: flex; flex-direction: column; align-items: center; gap: 16px; }
        .connect-logo {
          width: 74px; height: 74px; border-radius: 50%; background: #fff;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 50px rgba(255,255,255,0.5);
        }
        .connect-text { color: #fff; font-size: 16px; font-weight: 600; letter-spacing: 0.01em; }

        /* ── Hero layout ── */
        .lv2-layout {
          position: relative; min-height: 100vh;
          display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 48px;
          align-items: center; padding: 5vh 6vw; max-width: 1400px; margin: 0 auto;
        }

        .lv2-card {
          position: relative; overflow: hidden;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 28px; padding: 44px 40px;
          backdrop-filter: blur(20px);
        }
        .lv2-card-shimmer {
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent, #1db954, transparent);
        }

        .lv2-logo { position: relative; width: fit-content; margin-bottom: 22px; }
        .lv2-logo-ring { position: absolute; inset: -12px; border: 2px solid #1db954; border-radius: 50%; }

        .lv2-title { font-size: 42px; font-weight: 800; color: #fff; letter-spacing: -0.03em; margin: 0 0 10px; }
        .lv2-subtitle { font-size: 15.5px; line-height: 1.6; color: rgba(255,255,255,0.6); margin: 0 0 26px; }

        .lv2-features { display: flex; flex-direction: column; gap: 8px; margin-bottom: 30px; }
        .lv2-chip {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px; border-radius: 12px;
          background: rgba(255,255,255,0.035); border: 1px solid rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.8); font-size: 13.5px;
        }
        .lv2-chip-icon { font-size: 15px; }

        .lv2-login-btn {
          position: relative; overflow: hidden;
          display: flex; align-items: center; gap: 10px; justify-content: center;
          width: 100%; padding: 15px 20px; border: none; border-radius: 14px;
          background: #1db954; color: #06110a; font-size: 15.5px; font-weight: 700;
          cursor: pointer;
        }
        .lv2-login-btn:disabled { cursor: default; opacity: 0.85; }
        .lv2-btn-shine {
          position: absolute; top: 0; left: 0; width: 40%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent);
          transform: skewX(-20deg);
        }

        .lv2-hint { margin: 14px 0 0; font-size: 12px; color: rgba(255,255,255,0.4); text-align: center; }

        .lv2-note { position: absolute; pointer-events: none; }
        .lv2-note-0 { top: 20px; right: 40px; }
        .lv2-note-1 { top: 90px; right: 90px; }
        .lv2-note-2 { bottom: 60px; right: 24px; }
        .lv2-note-3 { bottom: 130px; right: 70px; }

        /* ── Right column ── */
        .lv2-right { display: flex; flex-direction: column; gap: 20px; }

        .dc-card {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px; padding: 20px; backdrop-filter: blur(20px);
        }
        .dc-header { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
        .dc-label { font-size: 12px; color: rgba(255,255,255,0.5); font-weight: 600; letter-spacing: 0.02em; }
        .dc-loading { display: flex; align-items: center; gap: 10px; color: rgba(255,255,255,0.5); font-size: 13px; }
        .dc-spinner { width: 15px; height: 15px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.2); border-top-color: #5865F2; }
        .dc-content { display: flex; gap: 14px; }
        .dc-avatar-wrap { position: relative; flex-shrink: 0; }
        .dc-avatar { width: 52px; height: 52px; border-radius: 50%; object-fit: cover; background: rgba(255,255,255,0.08); }
        .dc-status-dot { position: absolute; bottom: -2px; right: -2px; width: 15px; height: 15px; border-radius: 50%; border: 3px solid #111318; }
        .dc-info { min-width: 0; }
        .dc-username { color: #fff; font-weight: 700; font-size: 14.5px; }
        .dc-status-row { display: flex; align-items: center; gap: 6px; margin-top: 3px; }
        .dc-dot-inline { width: 7px; height: 7px; border-radius: 50%; }
        .dc-status-text { font-size: 12px; color: rgba(255,255,255,0.55); }
        .dc-spotify { display: flex; align-items: center; gap: 6px; margin-top: 8px; overflow: hidden; }
        .dc-spotify-track { font-size: 11.5px; color: rgba(255,255,255,0.6); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .dc-offline { color: rgba(255,255,255,0.4); font-size: 13px; }

        .lv2-creator {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px; padding: 20px; backdrop-filter: blur(20px);
        }
        .lv2-creator-title { font-size: 12px; color: rgba(255,255,255,0.5); font-weight: 600; margin-bottom: 12px; letter-spacing: 0.02em; }
        .lv2-creator-row { display: flex; align-items: center; gap: 12px; }
        .lv2-creator-avatar { width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .lv2-creator-name { color: #fff; font-weight: 700; font-size: 14px; }
        .lv2-creator-role { color: rgba(255,255,255,0.5); font-size: 12px; }
        .lv2-creator-tags { display: flex; flex-wrap: wrap; gap: 6px; margin: 14px 0 12px; }
        .lv2-tech-tag {
          font-size: 11px; padding: 4px 10px; border-radius: 999px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.6);
        }
        .lv2-version { font-size: 11px; color: rgba(255,255,255,0.35); display: flex; gap: 6px; }
        .lv2-dot { opacity: 0.5; }

        .lv2-waveform { display: flex; align-items: flex-end; gap: 3px; height: 40px; padding: 0 4px; }
        .lv2-bar { flex: 1; background: linear-gradient(180deg, #1db954, rgba(29,185,84,0.2)); border-radius: 2px; height: 100%; }

        .lv2-scroll-hint {
          position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%);
          display: flex; flex-direction: column; align-items: center; gap: 4px;
          background: none; border: none; color: rgba(255,255,255,0.45); font-size: 11.5px;
          cursor: pointer;
        }

        /* ── About section ── */
        .lv2-about { position: relative; max-width: 1100px; margin: 0 auto; padding: 4vh 6vw 8vh; }

        .about-heading { text-align: center; max-width: 560px; margin: 0 auto 48px; }
        .about-eyebrow { font-size: 12px; font-weight: 700; color: #1db954; letter-spacing: 0.08em; text-transform: uppercase; }
        .about-heading h2 { font-size: 32px; font-weight: 800; color: #fff; letter-spacing: -0.02em; margin: 10px 0 12px; }
        .about-heading p { font-size: 14.5px; color: rgba(255,255,255,0.55); line-height: 1.7; margin: 0; }

        .about-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 56px; }
        .about-card {
          background: rgba(255,255,255,0.035); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 18px; padding: 24px; transition: border-color 0.2s;
        }
        .about-card-icon { font-size: 24px; display: block; margin-bottom: 12px; }
        .about-card h3 { font-size: 15px; color: #fff; margin: 0 0 8px; font-weight: 700; }
        .about-card p { font-size: 13px; color: rgba(255,255,255,0.5); line-height: 1.6; margin: 0; }

        .about-steps { display: flex; flex-direction: column; gap: 22px; max-width: 640px; margin: 0 auto 56px; }
        .about-step { display: flex; gap: 18px; align-items: flex-start; }
        .about-step-n { font-size: 22px; font-weight: 800; color: rgba(29,185,84,0.5); flex-shrink: 0; width: 44px; }
        .about-step h4 { font-size: 15px; color: #fff; margin: 0 0 4px; font-weight: 700; }
        .about-step p { font-size: 13px; color: rgba(255,255,255,0.5); margin: 0; line-height: 1.6; }

        .about-cta {
          text-align: center; padding: 40px 24px; border-radius: 24px;
          background: linear-gradient(135deg, rgba(29,185,84,0.12), rgba(88,101,242,0.08));
          border: 1px solid rgba(29,185,84,0.2);
          margin-bottom: 40px;
        }
        .about-cta h3 { font-size: 19px; color: #fff; margin: 0 0 18px; font-weight: 700; }
        .about-cta-btn {
          padding: 13px 28px; border: none; border-radius: 12px;
          background: #1db954; color: #06110a; font-size: 14.5px; font-weight: 700; cursor: pointer;
        }

        .about-footer {
          display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;
          font-size: 11.5px; color: rgba(255,255,255,0.35);
        }

        /* ── Mobile unsupported ── */
        .mob-screen {
          position: relative; min-height: 100vh; display: flex; align-items: center; justify-content: center;
          background: #0b0d10; padding: 24px; overflow: hidden;
        }
        .mob-bg { position: absolute; inset: 0; }
        .mob-blob { position: absolute; top: 10%; left: 50%; transform: translateX(-50%); width: 300px; height: 300px; border-radius: 50%; background: #1db954; filter: blur(80px); opacity: 0.25; }
        .mob-card {
          position: relative; z-index: 1; text-align: center; max-width: 340px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px; padding: 36px 28px; backdrop-filter: blur(20px);
        }
        .mob-icon { position: relative; width: fit-content; margin: 0 auto 20px; }
        .mob-icon-slash {
          position: absolute; top: 50%; left: -4px; width: calc(100% + 8px); height: 2px;
          background: #f23f42; transform-origin: left; transform: translateY(-50%) rotate(45deg);
        }
        .mob-title { font-size: 20px; color: #fff; font-weight: 800; margin: 0 0 10px; }
        .mob-desc { font-size: 13.5px; color: rgba(255,255,255,0.55); line-height: 1.7; margin: 0 0 18px; }
        .mob-tag {
          display: inline-block; font-size: 11.5px; color: rgba(29,185,84,0.9);
          background: rgba(29,185,84,0.12); border: 1px solid rgba(29,185,84,0.25);
          padding: 6px 14px; border-radius: 999px;
        }

        @media (max-width: 1180px) {
          .lv2-layout { grid-template-columns: 1fr; padding-top: 8vh; }
          .about-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  );
}
