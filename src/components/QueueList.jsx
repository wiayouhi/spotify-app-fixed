import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchQueue } from "../utils/spotifyApi";

export default function QueueList({ currentTrackId }) {
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    let interval = setInterval(async () => {
      const q = await fetchQueue();
      const uniqueQueue = q.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
      setQueue(uniqueQueue);
    }, 5000); // พลูคิวทุกๆ 5 วินาที
    
    // โหลดครั้งแรก
    fetchQueue().then((q) => {
      const uniqueQueue = q.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
      setQueue(uniqueQueue);
    });

    return () => clearInterval(interval);
  }, [currentTrackId]);

  if (!queue || queue.length === 0) return null;

  return (
    // แอนิเมชันตอนเปิด-ปิดตัวกล่องคิวครึ่งจอ
    <motion.div 
      className="queue-fullscreen-half"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="queue-header-sticky">
        <h3 className="queue-title">รายการต่อไป</h3>
        <span className="queue-count">{queue.length} บทเพลง</span>
      </div>

      <div className="queue-scroll-area">
        {/* mode="popLayout" ช่วยให้ไอเทมที่เหลือขยับตำแหน่งสไลด์ขึ้นมาได้เนียนตาขึ้นระหว่างตัวเก่าพังลง */}
        <AnimatePresence mode="popLayout">
          {queue.map((track, index) => (
            <motion.div
              key={track.id} // เปลี่ยนเป็นใช้ id อย่างเดียวเพื่อให้ AnimatePresence ตรวจจับการ ลบ/ย้าย แถวได้แม่นยำ
              layout // สำคัญมาก: ทำให้เกิด Smooth Layout Transition เวลาคิวเปลี่ยน
              className="queue-item-row"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -50, scale: 0.95 }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 30,
                delay: index < 10 ? index * 0.03 : 0 // สตักเกอร์เฉพาะ 10 ชิ้นแรกไม่ให้โหลดช้าเกินไป
              }}
            >
              <div className="queue-index-number">{(index + 1).toString().padStart(2, '0')}</div>
              
              {track.albumArt && (
                <div className="queue-art-wrapper">
                  <img src={track.albumArt} alt="" className="queue-art-img" />
                </div>
              )}
              
              <div className="queue-meta-info">
                <span className="queue-track-name">{track.name}</span>
                <span className="queue-artist-name">{track.artists}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}