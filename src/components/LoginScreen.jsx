import { motion, AnimatePresence } from "framer-motion";
import { redirectToSpotifyLogin } from "../utils/spotifyAuth";

export default function LoginScreen() {
  return (
    <div className="login-screen">
      {/* Ambient blobs */}
      <div className="login-blobs">
        <motion.div className="login-blob login-blob-1"
          animate={{ scale: [1, 1.15, 1], x: [0, 20, 0], y: [0, -10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div className="login-blob login-blob-2"
          animate={{ scale: [1, 1.2, 1], x: [0, -15, 0], y: [0, 15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.div className="login-blob login-blob-3"
          animate={{ scale: [1, 1.1, 1], rotate: [0, 15, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="login-card"
      >
        {/* Logo */}
        <motion.div
          className="login-logo"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <svg width="52" height="52" viewBox="0 0 24 24" fill="var(--accent, #1db954)">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.622.622 0 01-.853.205c-2.336-1.426-5.275-1.75-8.743-.957a.623.623 0 11-.271-1.215c3.784-.863 7.037-.48 9.662 1.125a.622.622 0 01.205.842zm1.218-2.724a.777.777 0 01-1.066.255c-2.673-1.642-6.76-2.096-9.877-1.148a.777.777 0 11-.454-1.485c3.568-1.085 8.1-.58 11.142 1.288a.777.777 0 01.255 1.09zm.106-2.85c-3.21-1.906-8.5-2.08-11.564-1.152a.933.933 0 11-.537-1.788c3.518-1.062 9.356-.86 13.06 1.34a.933.933 0 01-.96 1.6z"/>
          </svg>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
        >
          Synced Lyrics
        </motion.h1>

        <motion.p
          className="login-subtitle"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
        >
          เชื่อมต่อ Spotify ของคุณเพื่อแสดงเนื้อเพลงแบบเรียลไทม์
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          whileHover={{ scale: 1.04, boxShadow: "0 0 30px rgba(29,185,84,0.45)" }}
          whileTap={{ scale: 0.97 }}
          className="spotify-login-btn"
          onClick={redirectToSpotifyLogin}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.622.622 0 01-.853.205c-2.336-1.426-5.275-1.75-8.743-.957a.623.623 0 11-.271-1.215c3.784-.863 7.037-.48 9.662 1.125a.622.622 0 01.205.842zm1.218-2.724a.777.777 0 01-1.066.255c-2.673-1.642-6.76-2.096-9.877-1.148a.777.777 0 11-.454-1.485c3.568-1.085 8.1-.58 11.142 1.288a.777.777 0 01.255 1.09zm.106-2.85c-3.21-1.906-8.5-2.08-11.564-1.152a.933.933 0 11-.537-1.788c3.518-1.062 9.356-.86 13.06 1.34a.933.933 0 01-.96 1.6z"/>
          </svg>
          เชื่อมต่อกับ Spotify
        </motion.button>

        <motion.p
          className="login-hint"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          ต้องเปิดเพลงอยู่ใน Spotify (แอปไหนก็ได้ที่ล็อกอินบัญชีเดียวกัน)
        </motion.p>

        {/* Floating music notes */}
        {[0,1,2].map((i) => (
          <motion.div key={i} className={`login-note login-note-${i}`}
            animate={{ y: [0, -20, 0], opacity: [0.4, 0.8, 0.4], rotate: [0, 8, -8, 0] }}
            transition={{ duration: 3 + i, repeat: Infinity, delay: i * 1.2, ease: "easeInOut" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(29,185,84,0.7)">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
