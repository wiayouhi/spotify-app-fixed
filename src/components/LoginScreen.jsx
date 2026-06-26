import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { redirectToSpotifyLogin } from "../utils/spotifyAuth";

const DISCORD_USER_ID = "902739412172046427";
const LANYARD_WS = "wss://api.lanyard.rest/socket";

// ดึง Discord status ผ่าน Lanyard WebSocket
function useDiscordStatus(userId) {
  const [data, setData] = useState(null);
  const wsRef = useRef(null);
  const hbRef = useRef(null);

  useEffect(() => {
    let alive = true;

    function connect() {
      const ws = new WebSocket(LANYARD_WS);
      wsRef.current = ws;

      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.op === 1) {
          // Hello — start heartbeat
          hbRef.current = setInterval(() => {
            if (ws.readyState === 1) ws.send(JSON.stringify({ op: 3 }));
          }, msg.d.heartbeat_interval);
          // Subscribe
          ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: userId } }));
        }
        if (msg.op === 0) {
          if (alive) setData(msg.d);
        }
      };

      ws.onclose = () => {
        clearInterval(hbRef.current);
        if (alive) setTimeout(connect, 3000);
      };
      ws.onerror = () => ws.close();
    }

    connect();
    return () => {
      alive = false;
      clearInterval(hbRef.current);
      wsRef.current?.close();
    };
  }, [userId]);

  return data;
}

const STATUS_COLOR = {
  online:    "#23d18b",
  idle:      "#f4a83a",
  dnd:       "#f04747",
  offline:   "#747f8d",
};
const STATUS_LABEL = {
  online: "ออนไลน์",
  idle:   "ไม่อยู่",
  dnd:    "ห้ามรบกวน",
  offline:"ออฟไลน์",
};

function DiscordBadge({ userId }) {
  const d = useDiscordStatus(userId);
  const status = d?.discord_status || "offline";
  const user   = d?.discord_user;
  const activity = d?.activities?.find(a => a.type === 0); // Playing game
  const spotify  = d?.listening_to_spotify ? d?.spotify : null;

  return (
    <motion.div
      className="discord-badge"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.1, duration: 0.5 }}
    >
      <div className="discord-avatar-wrap">
        {user?.avatar ? (
          <img
            src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp?size=64`}
            alt={user.username}
            className="discord-avatar"
          />
        ) : (
          <div className="discord-avatar discord-avatar-placeholder">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="rgba(255,255,255,0.5)">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.113 18.1.132 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
            </svg>
          </div>
        )}
        <span
          className="discord-status-dot"
          style={{ background: STATUS_COLOR[status] || STATUS_COLOR.offline }}
        />
      </div>
      <div className="discord-info">
        <div className="discord-name">
          {user ? `@${user.global_name || user.username}` : "กำลังโหลด..."}
          <span className="discord-status-text" style={{ color: STATUS_COLOR[status] }}>
            {STATUS_LABEL[status] || "ออฟไลน์"}
          </span>
        </div>
        {spotify && (
          <div className="discord-activity spotify-activity">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="#1db954">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.622.622 0 01-.853.205c-2.336-1.426-5.275-1.75-8.743-.957a.623.623 0 11-.271-1.215c3.784-.863 7.037-.48 9.662 1.125a.622.622 0 01.205.842zm1.218-2.724a.777.777 0 01-1.066.255c-2.673-1.642-6.76-2.096-9.877-1.148a.777.777 0 11-.454-1.485c3.568-1.085 8.1-.58 11.142 1.288a.777.777 0 01.255 1.09zm.106-2.85c-3.21-1.906-8.5-2.08-11.564-1.152a.933.933 0 11-.537-1.788c3.518-1.062 9.356-.86 13.06 1.34a.933.933 0 01-.96 1.6z"/>
            </svg>
            กำลังฟัง: <b>{spotify.song}</b> — {spotify.artist}
          </div>
        )}
        {!spotify && activity && (
          <div className="discord-activity">
            🎮 {activity.name}
          </div>
        )}
        {!spotify && !activity && status !== "offline" && (
          <div className="discord-activity" style={{ opacity: 0.5 }}>ไม่มีกิจกรรมในขณะนี้</div>
        )}
      </div>
    </motion.div>
  );
}

// Intro overlay — แสดงครั้งแรก แล้วค่อยๆ หาย
function IntroOverlay({ onDone }) {
  return (
    <motion.div
      className="intro-overlay"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      {/* Animated rings */}
      <motion.div className="intro-ring intro-ring-1"
        animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.1, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div className="intro-ring intro-ring-2"
        animate={{ scale: [1, 1.6, 1], opacity: [0.3, 0.05, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />

      <motion.div className="intro-logo"
        initial={{ scale: 0, rotate: -30, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <svg width="72" height="72" viewBox="0 0 24 24" fill="#1db954">
          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.622.622 0 01-.853.205c-2.336-1.426-5.275-1.75-8.743-.957a.623.623 0 11-.271-1.215c3.784-.863 7.037-.48 9.662 1.125a.622.622 0 01.205.842zm1.218-2.724a.777.777 0 01-1.066.255c-2.673-1.642-6.76-2.096-9.877-1.148a.777.777 0 11-.454-1.485c3.568-1.085 8.1-.58 11.142 1.288a.777.777 0 01.255 1.09zm.106-2.85c-3.21-1.906-8.5-2.08-11.564-1.152a.933.933 0 11-.537-1.788c3.518-1.062 9.356-.86 13.06 1.34a.933.933 0 01-.96 1.6z"/>
        </svg>
      </motion.div>

      <motion.h1 className="intro-title"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.6 }}
      >
        Synced Lyrics
      </motion.h1>

      <motion.p className="intro-sub"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.5 }}
      >
        เนื้อเพลงเรียลไทม์ · สวยงาม · ครบครัน
      </motion.p>

      <motion.button
        className="intro-enter-btn"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.9, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(29,185,84,0.5)" }}
        whileTap={{ scale: 0.97 }}
        onClick={onDone}
      >
        เริ่มต้นใช้งาน
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </motion.button>

      {/* Floating notes */}
      {[...Array(5)].map((_, i) => (
        <motion.div key={i}
          style={{
            position: "absolute",
            left: `${15 + i * 18}%`,
            bottom: `${10 + (i % 3) * 12}%`,
            opacity: 0,
          }}
          animate={{ y: [-0, -80, -160], opacity: [0, 0.6, 0] }}
          transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.7, ease: "easeOut" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(29,185,84,0.8)">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
        </motion.div>
      ))}
    </motion.div>
  );
}

// Features list
const FEATURES = [
  { icon: "🎵", label: "เนื้อเพลง Synced", desc: "ซิงค์กับเพลงแบบเรียลไทม์" },
  { icon: "🎨", label: "สีจาก Album Art", desc: "ธีมเปลี่ยนตาม Album" },
  { icon: "📺", label: "MV พื้นหลัง", desc: "ดู Music Video คลอ" },
  { icon: "⏰", label: "นาฬิกา & สภาพอากาศ", desc: "ครบในหน้าเดียว" },
];

export default function LoginScreen() {
  const [showIntro, setShowIntro] = useState(() => {
    return !sessionStorage.getItem("intro_seen");
  });

  const handleIntroDone = () => {
    sessionStorage.setItem("intro_seen", "1");
    setShowIntro(false);
  };

  return (
    <>
      <AnimatePresence>
        {showIntro && <IntroOverlay onDone={handleIntroDone} />}
      </AnimatePresence>

      <AnimatePresence>
        {!showIntro && (
          <motion.div
            className="login-screen login-screen-v2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            {/* Ambient blobs */}
            <div className="login-blobs">
              <motion.div className="login-blob login-blob-1"
                animate={{ scale: [1, 1.15, 1], x: [0, 30, 0], y: [0, -20, 0] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div className="login-blob login-blob-2"
                animate={{ scale: [1, 1.2, 1], x: [0, -20, 0], y: [0, 25, 0] }}
                transition={{ duration: 13, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              />
              <motion.div className="login-blob login-blob-3"
                animate={{ scale: [1, 1.1, 1], rotate: [0, 20, 0] }}
                transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 5 }}
              />
              <motion.div className="login-blob login-blob-4"
                animate={{ scale: [1, 1.3, 1], x: [0, 15, -15, 0] }}
                transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 3 }}
              />
            </div>

            {/* Scanline + grid overlay */}
            <div className="login-grid-overlay" />

            <div className="login-layout">
              {/* LEFT — Branding + Features */}
              <motion.div className="login-left"
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="login-brand">
                  <motion.div className="login-logo-big"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <svg width="56" height="56" viewBox="0 0 24 24" fill="#1db954">
                      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.622.622 0 01-.853.205c-2.336-1.426-5.275-1.75-8.743-.957a.623.623 0 11-.271-1.215c3.784-.863 7.037-.48 9.662 1.125a.622.622 0 01.205.842zm1.218-2.724a.777.777 0 01-1.066.255c-2.673-1.642-6.76-2.096-9.877-1.148a.777.777 0 11-.454-1.485c3.568-1.085 8.1-.58 11.142 1.288a.777.777 0 01.255 1.09zm.106-2.85c-3.21-1.906-8.5-2.08-11.564-1.152a.933.933 0 11-.537-1.788c3.518-1.062 9.356-.86 13.06 1.34a.933.933 0 01-.96 1.6z"/>
                    </svg>
                  </motion.div>
                  <div>
                    <h1 className="login-brand-name">Synced Lyrics</h1>
                    <p className="login-brand-tagline">ประสบการณ์ฟังเพลงระดับ Next-Level</p>
                  </div>
                </div>

                {/* Feature grid */}
                <div className="login-features">
                  {FEATURES.map((f, i) => (
                    <motion.div key={f.label} className="login-feature-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                      whileHover={{ scale: 1.03, borderColor: "rgba(29,185,84,0.4)" }}
                    >
                      <span className="feature-icon">{f.icon}</span>
                      <div>
                        <div className="feature-label">{f.label}</div>
                        <div className="feature-desc">{f.desc}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Discord status */}
                <DiscordBadge userId={DISCORD_USER_ID} />

                {/* Credit */}
                <motion.div className="login-credit"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.4, duration: 0.5 }}
                >
                  <span>จัดทำโดย</span>
                  <a
                    href={`https://discord.com/users/${DISCORD_USER_ID}`}
                    target="_blank"
                    rel="noreferrer"
                    className="credit-link"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.113 18.1.132 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                    </svg>
                    ผู้พัฒนา
                  </a>
                  <span className="credit-dot">·</span>
                  <span className="credit-ver">v2.0</span>
                </motion.div>
              </motion.div>

              {/* RIGHT — Login card */}
              <motion.div className="login-right"
                initial={{ opacity: 0, x: 40, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="login-card-v2">
                  {/* Card glow border */}
                  <div className="card-glow-border" />

                  <motion.div className="card-header"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                  >
                    <div className="card-step-badge">STEP 01</div>
                    <h2 className="card-title">เชื่อมต่อ Spotify</h2>
                    <p className="card-subtitle">
                      เข้าสู่ระบบด้วยบัญชี Spotify ของคุณ<br/>
                      เพื่อเริ่มแสดงเนื้อเพลงแบบ Sync
                    </p>
                  </motion.div>

                  {/* Visual - waveform animation */}
                  <motion.div className="card-visual"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                  >
                    {[...Array(12)].map((_, i) => (
                      <motion.div key={i} className="waveform-bar"
                        animate={{ scaleY: [0.2, 1, 0.3, 0.8, 0.2] }}
                        transition={{
                          duration: 1.5 + (i % 3) * 0.3,
                          repeat: Infinity,
                          delay: i * 0.1,
                          ease: "easeInOut"
                        }}
                      />
                    ))}
                  </motion.div>

                  {/* Requirements */}
                  <motion.div className="card-requirements"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                  >
                    <div className="req-item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#1db954"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                      มีบัญชี Spotify (ฟรีหรือ Premium)
                    </div>
                    <div className="req-item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#1db954"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                      เปิดเพลงใน Spotify แอปไว้ก่อน
                    </div>
                    <div className="req-item req-item-premium">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#f4a83a"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>
                      ต้องการ Premium สำหรับเล่นเสียงในเบราว์เซอร์
                    </div>
                  </motion.div>

                  {/* Login button */}
                  <motion.button
                    className="spotify-login-btn-v2"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                    whileHover={{ scale: 1.03, boxShadow: "0 0 40px rgba(29,185,84,0.5)" }}
                    whileTap={{ scale: 0.97 }}
                    onClick={redirectToSpotifyLogin}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.622.622 0 01-.853.205c-2.336-1.426-5.275-1.75-8.743-.957a.623.623 0 11-.271-1.215c3.784-.863 7.037-.48 9.662 1.125a.622.622 0 01.205.842zm1.218-2.724a.777.777 0 01-1.066.255c-2.673-1.642-6.76-2.096-9.877-1.148a.777.777 0 11-.454-1.485c3.568-1.085 8.1-.58 11.142 1.288a.777.777 0 01.255 1.09zm.106-2.85c-3.21-1.906-8.5-2.08-11.564-1.152a.933.933 0 11-.537-1.788c3.518-1.062 9.356-.86 13.06 1.34a.933.933 0 01-.96 1.6z"/>
                    </svg>
                    เข้าสู่ระบบด้วย Spotify
                    <motion.div className="btn-arrow"
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >→</motion.div>
                  </motion.button>

                  <motion.p className="card-privacy-note"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.85 }}
                  >
                    🔒 เราไม่เก็บข้อมูลส่วนตัวของคุณ — token เก็บในเครื่องคุณเท่านั้น
                  </motion.p>

                  {/* Floating music notes */}
                  {[0, 1, 2].map((i) => (
                    <motion.div key={i} className={`login-note login-note-${i}`}
                      animate={{ y: [0, -24, 0], opacity: [0.3, 0.7, 0.3], rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 3 + i, repeat: Infinity, delay: i * 1.5, ease: "easeInOut" }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(29,185,84,0.6)">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                      </svg>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
