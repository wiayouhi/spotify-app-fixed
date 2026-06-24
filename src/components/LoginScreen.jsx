import { motion } from "framer-motion";
import { redirectToSpotifyLogin } from "../utils/spotifyAuth";

export default function LoginScreen() {
  return (
    <div className="login-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="login-card"
      >
        <div className="login-logo">♪</div>
        <h1>Synced Lyrics</h1>
        <p>เชื่อมต่อ Spotify ของคุณเพื่อแสดงเนื้อเพลงแบบเรียลไทม์</p>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className="spotify-login-btn"
          onClick={redirectToSpotifyLogin}
        >
          เชื่อมต่อกับ Spotify
        </motion.button>
        <p className="login-hint">
          ต้องเปิดเพลงอยู่ใน Spotify (แอปไหนก็ได้ที่ล็อกอินบัญชีเดียวกัน)
        </p>
      </motion.div>
    </div>
  );
}
