// ────────────────────────────────────────
//  ⚠️ NOTE: มือถือยังไม่รองรับอย่างเป็นทางการ
//  ไฟล์นี้เป็น UI สำหรับมือถือที่แยกออกมาต่างหากจาก
//  LoginScreen.jsx (เดสก์ท็อป) ตามที่ขอ แต่ยังไม่ได้เชื่อม
//  เข้ากับ routing/breakpoint switcher จริงในโปรเจกต์
//  (ดูตัวอย่างการสลับหน้าจอตาม viewport ใน index.jsx)
//  ก่อนใช้งานจริงควรทดสอบบนอุปกรณ์จริงหลายขนาดหน้าจอ,
//  ทดสอบ safe-area (notch), และ performance ของ framer-motion
//  บนมือถือรุ่นล่าง ก่อน ship
// ────────────────────────────────────────
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { redirectToSpotifyLogin } from "../utils/spotifyAuth";
import "./LoginScreenMobile.css";

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

const FEATURES = [
  { icon: "🎵", text: "เนื้อเพลง Sync แบบเรียลไทม์" },
  { icon: "🎨", text: "พื้นหลังสีจากปกอัลบั้ม" },
  { icon: "⏱️", text: "แสดงคิวและ Progress Bar" },
  { icon: "🌤️", text: "นาฬิกาและสภาพอากาศ" },
  { icon: "🖥️", text: "เล่นเสียงผ่าน Browser โดยตรง" },
];

const ABOUT_CARDS = [
  { title: "ซิงก์ทุกจังหวะ", body: "เนื้อเพลงขยับตามเพลงที่กำลังเล่นแบบเรียลไทม์" },
  { title: "พื้นหลังมีชีวิต", body: "สีพื้นหลังดึงจากปกอัลบั้มที่กำลังฟังอยู่" },
  { title: "เล่นจากเบราว์เซอร์", body: "ควบคุมเพลงได้ทันทีไม่ต้องสลับแอป" },
  { title: "รู้เวลา รู้อากาศ", body: "นาฬิกาและสภาพอากาศแบบเรียลไทม์ในหน้าเดียว" },
];

const DISCORD_USER_ID = "902739412172046427";

function DiscordChipMobile({ userId }) {
  const { presence, loading } = useDiscordPresence(userId);
  if (loading) {
    return (
      <div className="m-dc-chip">
        <div className="m-dc-spinner" />
        <span>กำลังโหลดสถานะ Discord...</span>
      </div>
    );
  }
  if (!presence) {
    return <div className="m-dc-chip">ไม่สามารถดึงสถานะ Discord ได้</div>;
  }
  return (
    <div className="m-dc-chip">
      <div className="m-dc-avatar-wrap">
        <img
          src={`https://cdn.discordapp.com/avatars/${presence.discord_user.id}/${presence.discord_user.avatar}.webp?size=48`}
          alt=""
          className="m-dc-avatar"
          onError={(e) => { e.target.style.display = "none"; }}
        />
        <span className="m-dc-dot" style={{ background: statusColor(presence.discord_status) }} />
      </div>
      <div className="m-dc-text">
        <div className="m-dc-name">{presence.discord_user.display_name || presence.discord_user.username}</div>
        <div className="m-dc-status">
          {statusLabel(presence.discord_status)}
          {presence.spotify ? ` · ${presence.spotify.song}` : ""}
        </div>
      </div>
    </div>
  );
}

function IntroOverlayMobile({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div className="m-intro" exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <svg width="52" height="52" viewBox="0 0 24 24" fill="#1db954">
          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.622.622 0 01-.853.205c-2.336-1.426-5.275-1.75-8.743-.957a.623.623 0 11-.271-1.215c3.784-.863 7.037-.48 9.662 1.125a.622.622 0 01.205.842zm1.218-2.724a.777.777 0 01-1.066.255c-2.673-1.642-6.76-2.096-9.877-1.148a.777.777 0 11-.454-1.485c3.568-1.085 8.1-.58 11.142 1.288a.777.777 0 01.255 1.09zm.106-2.85c-3.21-1.906-8.5-2.08-11.564-1.152a.933.933 0 11-.537-1.788c3.518-1.062 9.356-.86 13.06 1.34a.933.933 0 01-.96 1.6z"/>
        </svg>
      </motion.div>
      <motion.div
        className="m-intro-title"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
      >
        Synced Lyrics
      </motion.div>
    </motion.div>
  );
}

function LoginTransitionMobile() {
  return (
    <motion.div
      className="m-login-transition"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="m-transition-disc"
        initial={{ scale: 0, rotate: 0 }}
        animate={{ scale: 1, rotate: 360 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      />
      <p>กำลังพาไปที่ Spotify...</p>
    </motion.div>
  );
}

export default function LoginScreenMobile() {
  const [showIntro, setShowIntro] = useState(() => !sessionStorage.getItem("intro_seen"));
  const [transitioning, setTransitioning] = useState(false);

  const handleIntroDone = () => {
    sessionStorage.setItem("intro_seen", "1");
    setShowIntro(false);
  };

  const handleLogin = () => {
    setTransitioning(true);
    setTimeout(() => redirectToSpotifyLogin(), 550);
  };

  return (
    <div className="login-screen-mobile">
      <div className="m-bg">
        <motion.div className="m-blob m-blob-1"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div className="m-blob m-blob-2"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        />
      </div>

      <AnimatePresence>
        {showIntro && <IntroOverlayMobile key="intro" onDone={handleIntroDone} />}
      </AnimatePresence>
      <AnimatePresence>
        {transitioning && <LoginTransitionMobile key="t" />}
      </AnimatePresence>

      {!showIntro && (
        <motion.div
          className="m-scroll"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <section className="m-hero">
            <motion.div
              className="m-logo"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <svg width="44" height="44" viewBox="0 0 24 24" fill="#1db954">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.622.622 0 01-.853.205c-2.336-1.426-5.275-1.75-8.743-.957a.623.623 0 11-.271-1.215c3.784-.863 7.037-.48 9.662 1.125a.622.622 0 01.205.842zm1.218-2.724a.777.777 0 01-1.066.255c-2.673-1.642-6.76-2.096-9.877-1.148a.777.777 0 11-.454-1.485c3.568-1.085 8.1-.58 11.142 1.288a.777.777 0 01.255 1.09zm.106-2.85c-3.21-1.906-8.5-2.08-11.564-1.152a.933.933 0 11-.537-1.788c3.518-1.062 9.356-.86 13.06 1.34a.933.933 0 01-.96 1.6z"/>
              </svg>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
            >
              Synced Lyrics
            </motion.h1>
            <motion.p
              className="m-subtitle"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
            >
              เนื้อเพลง Sync กับ Spotify แบบเรียลไทม์ พื้นหลังไล่สีจากปกอัลบั้ม
            </motion.p>

            <motion.div
              className="m-feature-scroll"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.4 }}
            >
              {FEATURES.map((f, i) => (
                <div key={i} className="m-chip">
                  <span>{f.icon}</span>
                  <span>{f.text}</span>
                </div>
              ))}
            </motion.div>

            <motion.button
              className="m-login-btn"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleLogin}
            >
              เชื่อมต่อกับ Spotify
            </motion.button>
            <p className="m-hint">ต้องเปิดเพลงอยู่ใน Spotify</p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              <DiscordChipMobile userId={DISCORD_USER_ID} />
            </motion.div>
          </section>

          <section className="m-about">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5 }}
            >
              <span className="m-about-eyebrow">เกี่ยวกับเว็บนี้</span>
              <h2>ฟังเพลงและอ่านเนื้อเพลงพร้อมกัน</h2>
              <div className="m-about-list">
                {ABOUT_CARDS.map((c, i) => (
                  <motion.div
                    key={c.title}
                    className="m-about-card"
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                  >
                    <h3>{c.title}</h3>
                    <p>{c.body}</p>
                  </motion.div>
                ))}
              </div>
              <p className="m-footer-note">Synced Lyrics v2.0 · © {new Date().getFullYear()}</p>
            </motion.div>
          </section>
        </motion.div>
      )}
    </div>
  );
}
