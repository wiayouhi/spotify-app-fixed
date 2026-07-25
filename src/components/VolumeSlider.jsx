import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { fetchPlaybackState, setPlaybackVolume } from "../utils/spotifyApi";
import { useDevice } from "../context/DeviceContext";

const POLL_MS = 6000;

/**
 * VolumeSlider — ปรับเสียง + ซิงกับอุปกรณ์ที่กำลังเล่นอยู่จริง
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
  const lastSentRef = useRef(70);
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
      setVolume(state.device.volumePercent);
      lastSentRef.current = state.device.volumePercent;
      setMuted(state.device.volumePercent === 0);
    }
  }, [dragging]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, POLL_MS);
    return () => clearInterval(t);
  }, [refresh]);

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
      sendVolume(restore);
    } else {
      setVolume(0);
      setMuted(true);
      sendVolume(0);
    }
  };

  return (
    <div className="volume-slider-wrap" title={deviceName ? `กำลังเล่นที่: ${deviceName}` : "ปรับเสียง"}>
      <button className="volume-mute-btn" onClick={toggleMute} title={muted ? "เปิดเสียง" : "ปิดเสียง"}>
        {muted || volume === 0 ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.5 12A4.5 4.5 0 0 0 14 8v2.18l2.45 2.45c.03-.2.05-.42.05-.63zM19 12c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
          </svg>
        ) : volume < 50 ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.5 12A4.5 4.5 0 0 0 16 8v8a4.5 4.5 0 0 0 2.5-4zM3 9v6h4l5 5V4L7 9H3z"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
        )}
      </button>

      <div className="volume-track" ref={trackRef} onPointerDown={handlePointerDown}>
        <div className="volume-track-bg" />
        <motion.div
          className="volume-track-fill"
          animate={{ width: `${muted ? 0 : volume}%` }}
          transition={{ duration: dragging ? 0 : dur(0.15) }}
        />
        <motion.div
          className="volume-thumb"
          animate={{ left: `${muted ? 0 : volume}%`, scale: dragging ? 1.25 : 1 }}
          transition={{ duration: dragging ? 0 : dur(0.15) }}
        />
      </div>

      {isWebPlayerActive && <span className="volume-sync-badge" title="ซิงก์กับเว็บเบราว์เซอร์">เว็บ</span>}

      <style>{`
        .volume-slider-wrap {
          display: flex; align-items: center; gap: 8px;
          padding: 4px 10px 4px 4px;
          border-radius: 999px;
          background: rgba(255,255,255,0.06);
        }
        .volume-mute-btn {
          width: 26px; height: 26px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          border-radius: 50%; border: none; background: transparent;
          color: rgba(255,255,255,0.75); cursor: pointer;
        }
        .volume-mute-btn:hover { color: #fff; background: rgba(255,255,255,0.1); }

        .volume-track {
          position: relative;
          width: 84px; height: 14px;
          display: flex; align-items: center;
          cursor: pointer;
          touch-action: none;
        }
        .volume-track-bg {
          position: absolute; left: 0; right: 0; top: 50%;
          height: 4px; transform: translateY(-50%);
          border-radius: 2px; background: rgba(255,255,255,0.18);
        }
        .volume-track-fill {
          position: absolute; left: 0; top: 50%;
          height: 4px; transform: translateY(-50%);
          border-radius: 2px; background: #1DB954;
        }
        .volume-thumb {
          position: absolute; top: 50%;
          width: 11px; height: 11px; margin-left: -5.5px;
          transform: translateY(-50%);
          border-radius: 50%; background: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.4);
        }

        .volume-sync-badge {
          font-size: 10px; font-weight: 600; color: #1DB954;
          background: rgba(29,185,84,0.16);
          padding: 2px 7px; border-radius: 999px;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}
