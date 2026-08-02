import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchPlaybackState, setPlaybackVolume } from "../utils/spotifyApi";
import { useDevice } from "../context/DeviceContext";

const POLL_MS = 2000; // was 6000 — polled too slowly to feel "live" when volume changes on another device

/**
 * VolumeSlider — ปรับเสียง + ซิงกับอุปกรณ์ที่กำลังเล่นอยู่จริง
 * ดีไซน์ใหม่: แถบยาวแนวนอนโปร่งใส (glass bar) อยู่ล่างสุด มีอนิเมชั่นตอน
 * hover / ลาก / mount-unmount
 *
 * "ซิงกับอุปกรณ์" หมายถึง 2 ทาง:
 * 1) ลากสไลเดอร์ในเว็บ → สั่งปรับเสียงไปที่อุปกรณ์เป้าหมาย (เว็บถ้า active,
 *    ไม่งั้นก็อุปกรณ์ที่ Spotify ถืออยู่ว่า active เช่นมือถือ/desktop app)
 * 2) ถ้าไปปรับเสียงจากอุปกรณ์อื่น (เช่นบนมือถือ) ค่าที่เห็นในเว็บจะอัปเดตตาม
 *    เพราะ poll สถานะอุปกรณ์เป็นระยะ
 */
export default function VolumeSlider({ animSpeed = 1 }) {
  const { targetDeviceId, isWebPlayerActive } = useDevice();
  const [volume, setVolume] = useState(70);
  const [deviceName, setDeviceName] = useState(null);
  const [muted, setMuted] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [syncFlash, setSyncFlash] = useState(null); // { id, direction: 'up' | 'down' }
  const lastSentRef = useRef(70);
  const knownVolumeRef = useRef(70); // ค่าที่เว็บนี้รู้ล่าสุด ใช้เทียบว่ามีใครไปเปลี่ยนจากที่อื่นไหม
  const trackRef = useRef(null);
  const debounceRef = useRef(null);

  const dur = (b) => b / animSpeed;

  // ─── Poll ปัจจุบัน: ดึง volume/ชื่ออุปกรณ์จริงจาก Spotify ───
  const refresh = useCallback(async () => {
    const state = await fetchPlaybackState();
    if (!state?.device) return;
    setDeviceName(state.device.name);
    // อย่าเขียนทับค่าที่ผู้ใช้กำลังลากอยู่ในมือ
    if (!dragging && typeof state.device.volumePercent === "number") {
      const newVol = state.device.volumePercent;
      const prevVol = knownVolumeRef.current;
      // ถ้าค่าที่ได้ต่างจากที่เรารู้ล่าสุด และไม่ใช่ค่าที่เว็บนี้เพิ่งส่งไปเอง
      // แปลว่ามีการปรับเสียงจากอุปกรณ์อื่น → จุดไฟ "dynamic lighting" บอกเลย
      if (newVol !== prevVol && newVol !== lastSentRef.current) {
        setSyncFlash({ id: Date.now(), direction: newVol > prevVol ? "up" : "down" });
      }
      setVolume(newVol);
      knownVolumeRef.current = newVol;
      lastSentRef.current = newVol;
      setMuted(newVol === 0);
    }
  }, [dragging]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, POLL_MS);
    return () => clearInterval(t);
  }, [refresh]);

  // เก็บไฟ sync ไว้แป๊บเดียวแล้วดับเอง
  useEffect(() => {
    if (!syncFlash) return;
    const t = setTimeout(() => setSyncFlash(null), dur(1100));
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncFlash]);

  const sendVolume = useCallback(
    (v) => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        lastSentRef.current = v;
        setPlaybackVolume(v, targetDeviceId);
      }, 150); // debounce กันยิง API รัวๆ ตอนลาก
    },
    [targetDeviceId]
  );

  const applyFromClientX = (clientX) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const v = Math.round(pct * 100);
    setVolume(v);
    setMuted(v === 0);
    knownVolumeRef.current = v;
    sendVolume(v);
  };

  const handlePointerDown = (e) => {
    setDragging(true);
    applyFromClientX(e.clientX);
    const handleMove = (ev) => applyFromClientX(ev.clientX);
    const handleUp = () => {
      setDragging(false);
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  const toggleMute = () => {
    if (muted) {
      const restore = lastSentRef.current > 0 ? lastSentRef.current : 70;
      setVolume(restore);
      setMuted(false);
      knownVolumeRef.current = restore;
      sendVolume(restore);
    } else {
      setVolume(0);
      setMuted(true);
      knownVolumeRef.current = 0;
      sendVolume(0);
    }
  };

  const active = dragging || hovering;
  const shownVolume = muted ? 0 : volume;

  return (
    <AnimatePresence>
      <motion.div
        className="volume-bar"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 28 }}
        transition={{ duration: dur(0.45), ease: [0.16, 1, 0.3, 1] }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        title={deviceName ? `กำลังเล่นที่: ${deviceName}` : "ปรับเสียง"}
      >
        {/* ─── Dynamic lighting: วาบไฟตอนมีการปรับเสียงจากอุปกรณ์อื่น ─── */}
        <AnimatePresence>
          {syncFlash && (
            <motion.div
              key={syncFlash.id}
              className={`volume-sync-light ${syncFlash.direction}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.7, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: dur(1.1), times: [0, 0.25, 0.6, 1], ease: "easeOut" }}
            />
          )}
        </AnimatePresence>

        <motion.button
          className="volume-mute-btn"
          onClick={toggleMute}
          title={muted ? "เปิดเสียง" : "ปิดเสียง"}
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: dur(0.15) }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={muted || volume === 0 ? "muted" : volume < 50 ? "low" : "high"}
              initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.6, rotate: 8 }}
              transition={{ duration: dur(0.18) }}
              className="volume-icon"
            >
              {muted || volume === 0 ? (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.5 12A4.5 4.5 0 0 0 14 8v2.18l2.45 2.45c.03-.2.05-.42.05-.63zM19 12c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                </svg>
              ) : volume < 50 ? (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.5 12A4.5 4.5 0 0 0 16 8v8a4.5 4.5 0 0 0 2.5-4zM3 9v6h4l5 5V4L7 9H3z"/>
                </svg>
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                </svg>
              )}
            </motion.span>
          </AnimatePresence>
        </motion.button>

        <div
          className="volume-track"
          ref={trackRef}
          onPointerDown={handlePointerDown}
        >
          {/* volume-rail: กล่องอ้างอิงตำแหน่งคงที่ สูง 4px เป๊ะ ไม่ถูก transform ใดๆแตะเลย
              จุดวงกลมยึดตำแหน่งกับกล่องนี้โดยตรง เลยไม่มีทางหลุดจากเส้นอีก */}
          <div className="volume-rail">
            {/* volume-rail-line: ตัวที่ขยายหนาตอน hover ด้วย scaleY (แยกออกมาต่างหาก
                เพื่อไม่ให้จุดวงกลมโดนสเกลตามไปด้วยจนเพี้ยนรูป) */}
            <motion.div
              className="volume-rail-line"
              animate={{ scaleY: active ? 1.8 : 1 }}
              transition={{ duration: dur(0.2), ease: "easeOut" }}
            >
              <div className="volume-rail-bg" />
              <motion.div
                className="volume-rail-fill"
                animate={{ width: `${shownVolume}%` }}
                transition={{ duration: dragging ? 0 : dur(0.25), ease: "easeOut" }}
              >
                {/* ประกายวิ่งต่อเนื่องบนแถบเสียง — เคลื่อนไหวตลอดเวลา */}
                <div className="volume-rail-shimmer" />
                {/* วาบไฟวิ่งผ่านตอนถูกซิงจากอุปกรณ์อื่น */}
                <AnimatePresence>
                  {syncFlash && (
                    <motion.div
                      key={syncFlash.id}
                      className={`volume-rail-sweep ${syncFlash.direction}`}
                      initial={{ x: "-120%" }}
                      animate={{ x: "220%" }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: dur(0.9), ease: "easeOut" }}
                    />
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>

            {/* จุดวงกลม — top:50% ของกล่อง .volume-rail สูง 4px คงที่ + margin ลบครึ่งขนาดตัวเอง
                (ไม่ใช้ transform จัดตำแหน่งเด็ดขาด เพราะ framer เขียนทับ transform เองทุกครั้งที่ animate scale)
                ปกติไม่มีขอบ/ไฟรอบตัวเลย — ขอบสีจะโผล่ขึ้นมาเฉพาะตอน syncFlash (มีคนปรับเสียงจาก
                อุปกรณ์อื่น) เท่านั้น ผ่าน boxShadow ด้านล่าง แล้วก็จะหายไปเองตาม syncFlash */}
            <motion.div
              className="volume-thumb"
              animate={{
                left: `${shownVolume}%`,
                scale: dragging ? 1.35 : active ? 1.1 : 0.9,
              }}
              style={{
                boxShadow:
                  syncFlash?.direction === "up"
                    ? "0 0 0 6px rgba(29,185,84,0.35), 0 2px 8px rgba(0,0,0,0.45)"
                    : syncFlash?.direction === "down"
                    ? "0 0 0 6px rgba(255,159,67,0.35), 0 2px 8px rgba(0,0,0,0.45)"
                    : undefined,
              }}
              transition={{
                left: { duration: dragging ? 0 : dur(0.25), ease: "easeOut" },
                scale: { duration: dur(0.2), ease: "easeOut" },
                boxShadow: { duration: dur(0.3) },
              }}
            >
              {/* ลมหายใจเบาๆ ต่อเนื่อง ให้รู้สึกว่า widget ยังมีชีวิตอยู่ */}
              <motion.span
                className="volume-thumb-pulse"
                animate={{ scale: [1, 1.9, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: dur(2.2), repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
          </div>
        </div>

        <motion.span
          className="volume-value"
          animate={{ opacity: active ? 1 : 0.55 }}
          transition={{ duration: dur(0.2) }}
        >
          {shownVolume}%
        </motion.span>

        <AnimatePresence>
          {isWebPlayerActive && (
            <motion.span
              className="volume-sync-badge"
              title="ซิงก์กับเว็บเบราว์เซอร์"
              initial={{ opacity: 0, scale: 0.8, x: -6 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: -6 }}
              transition={{ duration: dur(0.25) }}
            >
              เว็บ
            </motion.span>
          )}
        </AnimatePresence>

        <style>{`
          .volume-bar {
            position: relative;
            display: flex;
            align-items: center;
            gap: 14px;
            width: 100%;
            padding: 10px 18px;
            box-sizing: border-box;
            border-radius: 16px;
            overflow: hidden;
            background: linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.07),
              rgba(255, 255, 255, 0.03)
            );
            backdrop-filter: blur(18px) saturate(140%);
            -webkit-backdrop-filter: blur(18px) saturate(140%);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.28),
              inset 0 1px 0 rgba(255, 255, 255, 0.06);
            transition: background 0.25s ease, box-shadow 0.25s ease;
          }
          .volume-bar:hover {
            background: linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.1),
              rgba(255, 255, 255, 0.04)
            );
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.34),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
          }

          /* วาบไฟทั้งแถบ ตอนมีการปรับเสียงมาจากอุปกรณ์อื่น */
          .volume-sync-light {
            position: absolute;
            inset: 0;
            pointer-events: none;
            mix-blend-mode: screen;
          }
          .volume-sync-light.up {
            background: radial-gradient(
              120% 140% at 15% 50%,
              rgba(29, 185, 84, 0.35),
              transparent 60%
            );
          }
          .volume-sync-light.down {
            background: radial-gradient(
              120% 140% at 15% 50%,
              rgba(255, 159, 67, 0.32),
              transparent 60%
            );
          }

          .volume-mute-btn {
            flex-shrink: 0;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            border: none;
            background: rgba(255, 255, 255, 0.05);
            color: rgba(255, 255, 255, 0.78);
            cursor: pointer;
            overflow: hidden;
            transition: background 0.2s ease, color 0.2s ease;
          }
          .volume-mute-btn:hover {
            color: #ffffff;
            background: rgba(255, 255, 255, 0.16);
          }
          .volume-icon {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .volume-track {
            position: relative;
            flex: 1 1 auto;
            min-width: 0;
            height: 24px;
            display: flex;
            align-items: center;
            cursor: pointer;
            touch-action: none;
          }

          /* กล่องอ้างอิงตำแหน่ง สูง 4px คงที่ตลอด ไม่มี transform ใดๆ แตะเลย
             จุดวงกลมยึดตำแหน่งกับกล่องนี้โดยตรง */
          .volume-rail {
            position: relative;
            width: 100%;
            height: 4px;
          }
          /* ตัวเส้นที่มองเห็น ขยายหนาด้วย scaleY ตอน hover แยกออกจากกล่องอ้างอิงด้านบน
             เพื่อไม่ให้จุดวงกลม(ซึ่งอยู่นอก div นี้)โดนสเกลตามไปด้วย */
          .volume-rail-line {
            position: absolute;
            inset: 0;
            border-radius: 999px;
            transform-origin: center;
          }
          .volume-rail-bg {
            position: absolute;
            inset: 0;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.14);
          }
          .volume-rail-fill {
            position: absolute;
            left: 0;
            top: 0;
            height: 100%;
            border-radius: 999px;
            overflow: hidden;
            background: #ffffff;
            box-shadow: 0 0 6px rgba(255, 255, 255, 0.25);
          }

          /* ประกายวิ่งเบาๆ ต่อเนื่องตลอดเวลาบนเส้นเสียง */
          .volume-rail-shimmer {
            position: absolute;
            inset: 0;
            background: linear-gradient(
              100deg,
              transparent 20%,
              rgba(255, 255, 255, 0.55) 50%,
              transparent 80%
            );
            background-size: 250% 100%;
            animation: shimmer-move 2.6s linear infinite;
            mix-blend-mode: overlay;
          }
          @keyframes shimmer-move {
            0% { background-position: 140% 0; }
            100% { background-position: -140% 0; }
          }

          /* ไฟวิ่งผ่านเส้น ตอนเสียงถูกซิงจากอุปกรณ์อื่น */
          .volume-rail-sweep {
            position: absolute;
            top: -6px;
            bottom: -6px;
            width: 40%;
            filter: blur(2px);
          }
          .volume-rail-sweep.up {
            background: linear-gradient(
              90deg,
              transparent,
              rgba(255, 255, 255, 0.9),
              transparent
            );
          }
          .volume-rail-sweep.down {
            background: linear-gradient(
              90deg,
              transparent,
              rgba(255, 200, 140, 0.85),
              transparent
            );
          }

          /* จุดวงกลม: จัดกึ่งกลางเส้นด้วย translate(-50%, -50%) แม่นยำทุกขนาด
             ปกติมีแค่เงาดำบางๆ ไม่มีขอบสีล้อมรอบ — ขอบสีจะถูกเซ็ตผ่าน inline
             style เฉพาะตอน syncFlash เท่านั้น (ดู .volume-thumb ใน JSX ด้านบน) */
          .volume-thumb {
            position: absolute;
            top: 50%;
            left: 0;
            width: 14px;
            height: 14px;
            margin-top: -7px;
            margin-left: -7px;
            border-radius: 50%;
            background: #fff;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.45);
          }
          .volume-thumb-pulse {
            position: absolute;
            inset: 0;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.7);
          }

          .volume-value {
            flex-shrink: 0;
            width: 34px;
            text-align: right;
            font-size: 12px;
            font-variant-numeric: tabular-nums;
            color: rgba(255, 255, 255, 0.7);
          }

          .volume-sync-badge {
            flex-shrink: 0;
            font-size: 10px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.85);
            background: rgba(255, 255, 255, 0.14);
            padding: 3px 9px;
            border-radius: 999px;
            white-space: nowrap;
          }

          @media (prefers-reduced-motion: reduce) {
            .volume-bar,
            .volume-mute-btn,
            .volume-rail-line,
            .volume-rail-fill,
            .volume-rail-shimmer,
            .volume-rail-sweep,
            .volume-thumb,
            .volume-thumb-pulse,
            .volume-value,
            .volume-sync-badge,
            .volume-sync-light {
              transition: none !important;
              animation: none !important;
            }
          }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
}
