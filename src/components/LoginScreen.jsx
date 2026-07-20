import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { redirectToSpotifyLogin } from "../utils/spotifyAuth";
import "./LoginScreen.css"; // อย่าลืมสร้างและ import ไฟล์ CSS นี้

// ────────────────────────────────────────
//  Discord Presence Hook
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
//  Discord Status Card Component
// ────────────────────────────────────────
function DiscordCard({ userId }) {
  const { presence, loading } = useDiscordPresence(userId);

  return (
    <motion.div
      className="glass-card discord-card"
      whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}
    >
      <div className="dc-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#5865F2">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
        </svg>
        <span className="dc-label">สถานะผู้พัฒนา</span>
      </div>

      {loading ? (
        <div className="dc-loading">กำลังโหลดข้อมูล...</div>
      ) : presence ? (
        <div className="dc-content">
          <div className="dc-avatar-wrap">
            <img
              src={`https://cdn.discordapp.com/avatars/${presence.discord_user.id}/${presence.discord_user.avatar}.webp?size=128`}
              alt="avatar"
              className="dc-avatar"
            />
            <motion.div
              className="dc-status-dot"
              style={{ background: statusColor(presence.discord_status) }}
              animate={{ scale: presence.discord_status === "online" ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <div className="dc-info">
            <div className="dc-username">
              {presence.discord_user.display_name || presence.discord_user.username}
            </div>
            <div className="dc-status-text" style={{ color: statusColor(presence.discord_status) }}>
              {statusLabel(presence.discord_status)}
            </div>
            {presence.spotify && (
              <div className="dc-spotify">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#1db954">
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.622.622 0 01-.853.205c-2.336-1.426-5.275-1.75-8.743-.957a.623.623 0 11-.271-1.215c3.784-.863 7.037-.48 9.662 1.125a.622.622 0 01.205.842zm1.218-2.724a.777.777 0 01-1.066.255c-2.673-1.642-6.76-2.096-9.877-1.148a.777.777 0 11-.454-1.485c3.568-1.085 8.1-.58 11.142 1.288a.777.777 0 01.255 1.09zm.106-2.85c-3.21-1.906-8.5-2.08-11.564-1.152a.933.933 0 11-.537-1.788c3.518-1.062 9.356-.86 13.06 1.34a.933.933 0 01-.96 1.6z"/>
                </svg>
                <span>กำลังฟัง {presence.spotify.song}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="dc-offline">ออฟไลน์</div>
      )}
    </motion.div>
  );
}

// ────────────────────────────────────────
//  Mobile Not Supported UI
// ────────────────────────────────────────
function MobileNotSupported() {
  return (
    <div className="mobile-unsupported">
      <motion.div 
        className="mobile-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <svg width="80" height="80" viewBox="0 0 24 24" fill="#1db954" className="mb-icon">
          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
        </svg>
        <h2>ยังไม่รองรับบนมือถือ</h2>
        <p>ฟีเจอร์นี้ออกแบบมาเพื่อใช้งานบนคอมพิวเตอร์<br/>โปรดเปิดเว็บไซต์นี้ผ่าน Desktop</p>
      </motion.div>
    </div>
  );
}

// ────────────────────────────────────────
//  Main Component
// ────────────────────────────────────────
const DISCORD_USER_ID = "902739412172046427"; // ใส่ไอดีของคุณ

export default function LoginScreen() {
  const [isMobile, setIsMobile] = useState(false);
  const [showIntro, setShowIntro] = useState(!sessionStorage.getItem("intro_seen"));
  const [isRedirecting, setIsRedirecting] = useState(false);

  // เช็คขนาดหน้าจอ
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Intro Timer
  useEffect(() => {
    if (showIntro && !isMobile) {
      const t = setTimeout(() => {
        sessionStorage.setItem("intro_seen", "1");
        setShowIntro(false);
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [showIntro, isMobile]);

  const handleLoginClick = () => {
    setIsRedirecting(true);
    // อนิเมชันรอ 1.5 วินาที ก่อน Redirect จริง
    setTimeout(() => {
      redirectToSpotifyLogin();
    }, 1500);
  };

  if (isMobile) {
    return <MobileNotSupported />;
  }

  return (
    <div className="login-wrapper">
      {/* Animated Background */}
      <div className="animated-bg">
        <motion.div className="blob blob-1" animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} />
        <motion.div className="blob blob-2" animate={{ scale: [1, 1.5, 1], rotate: [0, -90, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} />
        <div className="noise-overlay" />
      </div>

      <AnimatePresence mode="wait">
        {/* 1. Intro Screen */}
        {showIntro && (
          <motion.div
            key="intro"
            className="intro-screen"
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 15, delay: 0.2 }}
            >
              <svg width="80" height="80" viewBox="0 0 24 24" fill="#1db954">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zM9.5 16.5L9.5 7.5 16.5 12 9.5 16.5z"/>
              </svg>
            </motion.div>
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Synced Lyrics
            </motion.h1>
          </motion.div>
        )}

        {/* 2. Transition Overlay (เมื่อกดปุ่มล็อกอิน) */}
        {isRedirecting && (
          <motion.div
            key="redirecting"
            className="redirecting-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div 
              className="redirect-ring"
              animate={{ scale: [0, 5], opacity: [1, 0] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            <h2>กำลังเชื่อมต่อกับ Spotify...</h2>
          </motion.div>
        )}

        {/* 3. Main Content (Scrollable Snap) */}
        {!showIntro && !isRedirecting && (
          <motion.div 
            key="main"
            className="main-scroll-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            {/* Section 1: Hero & Login */}
            <section className="snap-section hero-section">
              <div className="hero-content">
                <motion.div 
                  className="hero-left"
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  <h1 className="hero-title">
                    เนื้อเพลงแบบ <span>Real-time</span>
                  </h1>
                  <p className="hero-subtitle">
                    ยกระดับการฟังเพลงบน Spotify ของคุณด้วยเนื้อเพลงที่ซิงค์ตรงจังหวะ 
                    พร้อมพื้นหลังที่เปลี่ยนสีตามปกอัลบั้มโดยอัตโนมัติ
                  </p>

                  <motion.button
                    className="spotify-login-btn"
                    whileHover={{ scale: 1.05, boxShadow: "0px 0px 30px rgba(29, 185, 84, 0.5)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLoginClick}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.622.622 0 01-.853.205c-2.336-1.426-5.275-1.75-8.743-.957a.623.623 0 11-.271-1.215c3.784-.863 7.037-.48 9.662 1.125a.622.622 0 01.205.842zm1.218-2.724a.777.777 0 01-1.066.255c-2.673-1.642-6.76-2.096-9.877-1.148a.777.777 0 11-.454-1.485c3.568-1.085 8.1-.58 11.142 1.288a.777.777 0 01.255 1.09zm.106-2.85c-3.21-1.906-8.5-2.08-11.564-1.152a.933.933 0 11-.537-1.788c3.518-1.062 9.356-.86 13.06 1.34a.933.933 0 01-.96 1.6z"/>
                    </svg>
                    เชื่อมต่อกับ Spotify
                  </motion.button>
                  
                  <div className="scroll-indicator">
                    <span>เลื่อนเพื่อดูข้อมูลเพิ่มเติม</span>
                    <motion.div 
                      animate={{ y: [0, 10, 0] }} 
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      ↓
                    </motion.div>
                  </div>
                </motion.div>

                <motion.div 
                  className="hero-right"
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  <DiscordCard userId={DISCORD_USER_ID} />
                </motion.div>
              </div>
            </section>

            {/* Section 2: About / Features */}
            <section className="snap-section about-section">
              <div className="about-content">
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  ฟีเจอร์หลักของเว็บไซต์
                </motion.h2>
                
                <div className="features-grid">
                  {[
                    { icon: "🎵", title: "ซิงค์เนื้อเพลงเป๊ะ", desc: "เนื้อเพลงเลื่อนตามจังหวะเพลงแบบเรียลไทม์" },
                    { icon: "🎨", title: "สีสันอัตโนมัติ", desc: "พื้นหลังดึงโทนสีหลักจากปกอัลบั้มที่คุณกำลังฟัง" },
                    { icon: "⚡", title: "รวดเร็ว & เบา", desc: "ทำงานผ่าน Web API ไม่กินทรัพยากรเครื่อง" },
                    { icon: "📱", title: "สถานะ Discord", desc: "แสดงสถานะการเล่นเพลงและออนไลน์ของคุณ" }
                  ].map((feat, i) => (
                    <motion.div 
                      key={i} 
                      className="glass-card feature-card"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <div className="feat-icon">{feat.icon}</div>
                      <h3>{feat.title}</h3>
                      <p>{feat.desc}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="footer-info">
                  <p>พัฒนาโดย <strong>นายทะเบียน</strong></p>
                  <div className="tech-tags">
                    <span>React</span>
                    <span>Framer Motion</span>
                    <span>Spotify API</span>
                  </div>
                </div>
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
