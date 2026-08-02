import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchQueue } from "../utils/spotifyApi";

/**
 * QueueList — รายการเพลงถัดไป
 *
 * variant:
 *   "full" (ค่าเริ่มต้น) — สูงเต็มพื้นที่ที่พ่อแม่ให้มา (เหมาะกับหน้าคิวแบบเต็มจอ)
 *   "half" — สูงครึ่งจอ (50vh) ตัวเอง scroll ได้ในตัว เหมาะกับวางเป็นแผงข้างๆ
 *
 * ไม่มีพื้นหลัง/กรอบทึบใดๆ ทั้งสิ้น (โปร่งใสล้วน) ทุกอย่างเป็น inline <style>
 * ในไฟล์นี้เอง ไม่พึ่ง class ภายนอกที่เคยมีปัญหาสไตล์ตีกัน
 *
 * รายการจะแสดง "ทุกเพลง" ในคิว ไม่ตัดเหลือแค่บางส่วน — จุดที่เคยทำให้ดูเหมือน
 * โชว์แค่ ~5 เพลงคือ container การ scroll ไม่ได้ตั้ง min-height:0 ในโครง flex
 * เลยโดน parent บีบความสูงจนเห็นได้แค่ไม่กี่แถวโดยไม่ scroll ต่อ ตรงนี้แก้แล้ว
 */
export default function QueueList({ currentTrackId, animSpeed = 1, variant = "full" }) {
  const [queue, setQueue] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const dur = (b) => b / animSpeed;

  const loadQueue = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const q = await fetchQueue();
      // Deduplicate by id, keep ALL tracks
      const seen = new Set();
      const unique = q.filter((t) => {
        if (seen.has(t.id)) return false;
        seen.add(t.id);
        return true;
      });
      setQueue(unique);
    } catch (e) {
      console.error("Queue fetch error", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadQueue(false);
    const interval = setInterval(() => loadQueue(true), 5000);
    return () => clearInterval(interval);
  }, [currentTrackId]);

  const rootClass = `queue-root queue-root--${variant}`;

  if (!queue || queue.length === 0) {
    return (
      <div className={rootClass}>
        <motion.div
          className="queue-empty-state"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: dur(0.4) }}
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.06, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="rgba(255,255,255,0.25)">
              <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
            </svg>
          </motion.div>
          <span>ไม่มีรายการในคิว</span>
        </motion.div>
        <QueueListStyles />
      </div>
    );
  }

  return (
    <motion.div
      className={rootClass}
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60 }}
      transition={{ duration: dur(0.5), ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Header */}
      <div className="queue-header-sticky">
        <div className="queue-header-left">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="rgba(255,255,255,0.8)">
            <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
          </svg>
          <h3 className="queue-title">รายการต่อไป</h3>
        </div>
        <div className="queue-header-right">
          <span className="queue-count">{queue.length} บทเพลง</span>
          <motion.button
            className="queue-refresh-btn"
            onClick={() => loadQueue(false)}
            animate={isRefreshing ? { rotate: 360 } : {}}
            transition={isRefreshing ? { duration: dur(0.8), repeat: Infinity, ease: "linear" } : {}}
            title="รีเฟรชคิว"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
          </motion.button>
        </div>
      </div>

      {/* List — shows every track in the queue, scrolls internally */}
      <div className="queue-scroll-area">
        <AnimatePresence mode="popLayout">
          {queue.map((track, index) => (
            <motion.div
              key={track.id}
              layout
              className="queue-item-row"
              initial={{ opacity: 0, x: 40, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -40, scale: 0.94 }}
              transition={{
                type: "spring",
                stiffness: 300 * animSpeed,
                damping: 30,
                delay: index < 12 ? index * (0.03 / animSpeed) : 0,
              }}
              whileHover={{ backgroundColor: "rgba(255,255,255,0.06)", x: 3 }}
            >
              <div className="queue-index-number">
                {(index + 1).toString().padStart(2, "0")}
              </div>

              {track.albumArt && (
                <motion.div className="queue-art-wrapper" whileHover={{ scale: 1.08 }}>
                  <img src={track.albumArt} alt="" className="queue-art-img" />
                  <div className="queue-art-overlay">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </motion.div>
              )}

              <div className="queue-meta-info">
                <span className="queue-track-name">{track.name}</span>
                <span className="queue-artist-name">{track.artists}</span>
              </div>

              {/* Duration if available */}
              {track.durationMs && (
                <span className="queue-duration">
                  {Math.floor(track.durationMs / 60000)}:{String(Math.floor((track.durationMs % 60000) / 1000)).padStart(2,"0")}
                </span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div style={{ height: "2rem" }} />
      </div>

      <QueueListStyles />
    </motion.div>
  );
}

function QueueListStyles() {
  return (
    <style>{`
      /* ทุกอย่างโปร่งใสล้วน ไม่มีกล่อง/ขอบ/พื้นหลังทึบ */
      .queue-root {
        display: flex;
        flex-direction: column;
        width: 100%;
        min-height: 0;
        background: transparent;
        box-sizing: border-box;
        color: #fff;
      }
      /* เต็มจอ: กินความสูงทั้งหมดที่ parent ให้มา */
      .queue-root--full {
        height: 100%;
      }
      /* ครึ่งจอ: จำกัดความสูงไว้ที่ 50vh แล้ว scroll ในตัวเอง */
      .queue-root--half {
        height: 50vh;
        max-height: 50vh;
      }

      .queue-empty-state {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        color: rgba(255, 255, 255, 0.45);
        font-size: 14px;
        min-height: 200px;
      }

      .queue-header-sticky {
        position: sticky;
        top: 0;
        z-index: 2;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 4px 4px 12px;
        background: transparent;
        flex-shrink: 0;
      }
      .queue-header-left {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .queue-title {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.92);
      }
      .queue-header-right {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .queue-count {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.5);
      }
      .queue-refresh-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        border: none;
        background: rgba(255, 255, 255, 0.06);
        color: rgba(255, 255, 255, 0.75);
        cursor: pointer;
        transition: background 0.2s ease, color 0.2s ease;
      }
      .queue-refresh-btn:hover {
        background: rgba(255, 255, 255, 0.14);
        color: #fff;
      }

      /* คีย์สำคัญที่ทำให้ก่อนหน้านี้เห็นแค่ ~5 เพลง: flex child ต้องมี
         min-height:0 ถึงจะยอม scroll แทนการโดนบีบความสูงจน content เกินโดนตัด */
      .queue-scroll-area {
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;
        overflow-x: hidden;
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding-right: 4px;
      }
      .queue-scroll-area::-webkit-scrollbar {
        width: 6px;
      }
      .queue-scroll-area::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.15);
        border-radius: 999px;
      }
      .queue-scroll-area::-webkit-scrollbar-track {
        background: transparent;
      }

      .queue-item-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 10px;
        border-radius: 10px;
        background: transparent;
        cursor: default;
      }

      .queue-index-number {
        flex-shrink: 0;
        width: 20px;
        text-align: center;
        font-size: 12px;
        font-variant-numeric: tabular-nums;
        color: rgba(255, 255, 255, 0.4);
      }

      .queue-art-wrapper {
        position: relative;
        flex-shrink: 0;
        width: 40px;
        height: 40px;
        border-radius: 6px;
        overflow: hidden;
      }
      .queue-art-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .queue-art-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.35);
        opacity: 0;
        transition: opacity 0.2s ease;
      }
      .queue-art-wrapper:hover .queue-art-overlay {
        opacity: 1;
      }

      .queue-meta-info {
        flex: 1 1 auto;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .queue-track-name {
        font-size: 13.5px;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.92);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .queue-artist-name {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.5);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .queue-duration {
        flex-shrink: 0;
        font-size: 12px;
        font-variant-numeric: tabular-nums;
        color: rgba(255, 255, 255, 0.45);
      }

      @media (prefers-reduced-motion: reduce) {
        .queue-refresh-btn, .queue-art-overlay {
          transition: none !important;
        }
      }
    `}</style>
  );
}
