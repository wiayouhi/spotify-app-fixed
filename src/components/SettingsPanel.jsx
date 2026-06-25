import { motion, AnimatePresence } from "framer-motion";
import { clearTokens } from "../utils/spotifyAuth";

const CLOCK_FORMATS = [
  { id: "hhmm", label: "HH:MM", fn: (d) => d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false }) },
  { id: "hhmmss", label: "HH:MM:SS", fn: (d) => d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }) },
  { id: "12h", label: "12 ชั่วโมง", fn: (d) => d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }) },
];

export default function SettingsPanel({ open, onClose, settings, onSettingsChange, animSpeed, onAnimSpeedChange }) {
  const dur = (b) => b / animSpeed;

  const set = (key, val) => onSettingsChange({ ...settings, [key]: val });

  const handleLogout = () => {
    clearTokens();
    window.location.reload();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="settings-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: dur(0.25) }}
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            className="settings-panel"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ duration: dur(0.42), ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="settings-header">
              <div className="settings-title-row">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                </svg>
                <span>ตั้งค่า</span>
              </div>
              <button className="settings-close-btn" onClick={onClose}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>

            <div className="settings-body">
              {/* ─── Clock Section ─── */}
              <div className="settings-section">
                <div className="settings-section-label">นาฬิกา</div>

                <div className="settings-row">
                  <span className="settings-row-label">รูปแบบ</span>
                  <div className="settings-toggle-group">
                    {CLOCK_FORMATS.map((f) => (
                      <button
                        key={f.id}
                        className={`settings-chip ${settings.clockFormat === f.id ? "active" : ""}`}
                        onClick={() => set("clockFormat", f.id)}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="settings-row">
                  <span className="settings-row-label">แสดงวันที่</span>
                  <button
                    className={`settings-toggle ${settings.clockShowDate ? "active" : ""}`}
                    onClick={() => set("clockShowDate", !settings.clockShowDate)}
                  >
                    <motion.div className="settings-toggle-thumb" layout transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                  </button>
                </div>

                <div className="settings-row">
                  <span className="settings-row-label">Glow Effect</span>
                  <button
                    className={`settings-toggle ${settings.clockGlow ? "active" : ""}`}
                    onClick={() => set("clockGlow", !settings.clockGlow)}
                  >
                    <motion.div className="settings-toggle-thumb" layout transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                  </button>
                </div>

                <div className="settings-row">
                  <span className="settings-row-label">ขนาด</span>
                  <div className="settings-slider-wrap">
                    <input
                      type="range" min="0.7" max="1.6" step="0.1"
                      value={settings.clockSize}
                      className="settings-slider"
                      onChange={(e) => set("clockSize", parseFloat(e.target.value))}
                    />
                    <span className="settings-slider-val">{settings.clockSize}x</span>
                  </div>
                </div>
              </div>

              {/* ─── Animation Section ─── */}
              <div className="settings-section">
                <div className="settings-section-label">แอนิเมชัน</div>

                <div className="settings-row">
                  <span className="settings-row-label">เปิดแอนิเมชัน</span>
                  <button
                    className={`settings-toggle ${settings.animEnabled ? "active" : ""}`}
                    onClick={() => set("animEnabled", !settings.animEnabled)}
                  >
                    <motion.div className="settings-toggle-thumb" layout transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                  </button>
                </div>

                <div className="settings-row">
                  <span className="settings-row-label">ความเร็ว</span>
                  <div className="settings-slider-wrap">
                    <input
                      type="range" min="0.5" max="3" step="0.25"
                      value={animSpeed}
                      className="settings-slider"
                      onChange={(e) => onAnimSpeedChange(parseFloat(e.target.value))}
                      disabled={!settings.animEnabled}
                    />
                    <span className="settings-slider-val">{animSpeed}x</span>
                  </div>
                </div>
              </div>

              {/* ─── Display Section ─── */}
              <div className="settings-section">
                <div className="settings-section-label">การแสดงผล</div>

                <div className="settings-row">
                  <span className="settings-row-label">Ticker เนื้อเพลง</span>
                  <button
                    className={`settings-toggle ${settings.showLyricsTicker ? "active" : ""}`}
                    onClick={() => set("showLyricsTicker", !settings.showLyricsTicker)}
                  >
                    <motion.div className="settings-toggle-thumb" layout transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                  </button>
                </div>

                <div className="settings-row">
                  <span className="settings-row-label">แสดงเนื้อเพลง</span>
                  <button
                    className={`settings-toggle ${settings.showLyricsPanel ? "active" : ""}`}
                    onClick={() => set("showLyricsPanel", !settings.showLyricsPanel)}
                  >
                    <motion.div className="settings-toggle-thumb" layout transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                  </button>
                </div>
              </div>

              {/* ─── Account Section ─── */}
              <div className="settings-section">
                <div className="settings-section-label">บัญชี</div>
                <motion.button
                  className="settings-logout-btn"
                  onClick={handleLogout}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                  </svg>
                  ออกจากระบบ
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
