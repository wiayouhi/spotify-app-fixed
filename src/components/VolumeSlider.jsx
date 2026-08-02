import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { fetchPlaybackState, setPlaybackVolume } from "../utils/spotifyApi";
import { useDevice } from "../context/DeviceContext";

const POLL_MS = 6000;

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

  const refresh = useCallback(async () => {
    const state = await fetchPlaybackState();
    if (!state?.device) return;
    setDeviceName(state.device.name);
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
      }, 150);
    },
    [targetDeviceId]
  );

  const applyFromClientY = (clientY) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));
    const v = Math.round(pct * 100);
    setVolume(v);
    setMuted(v === 0);
    sendVolume(v);
  };

  const handlePointerDown = (e) => {
    setDragging(true);
    applyFromClientY(e.clientY);
    const handleMove = (ev) => applyFromClientY(ev.clientY);
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

  // แอนิเมชั่น "ชีพจร" ตลอดเวลา (Pulse animation)
  const pulseAnimation = {
    opacity: volume > 0 ? [0.8, 1, 0.8] : 0.6,
    scaleX: volume > 0 ? [1, 1.05, 1] : 1,
    boxShadow: volume > 0 ? ["0 0 10px rgba(29, 185, 84, 0.5)", "0 0 20px rgba(29, 185, 84, 0.8)", "0 0 10px rgba(29, 185, 84, 0.5)"] : "none",
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  };

  return (
    <motion.div
      className="volume-slider-wrap-v"
      title={deviceName ? `กำลังเล่นที่: ${deviceName}` : "ปรับเสียง"}
      whileHover={{ scale: 1.03, boxShadow: "0 0 20px rgba(29, 185, 84, 0.5)" }} // ขยายขนาดและเพิ่มแสงเรืองเมื่อชี้เมาส์
    >
      <button className="volume-mute-btn-v" onClick={toggleMute} title={muted ? "เปิดเสียง" : "ปิดเสียง"}>
        {muted || volume === 0 ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.5 12A4.5 4.5 0 0 0 14 8v2.18l2.45 2.45c.03-.2.05-.42.05-.63zM19 12c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
          </svg>
        ) : volume < 50 ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.5 12A4.5 4.5 0 0 0 16 8v8a4.5 4.5 0 0 0 2.5-4zM3 9v6h4l5 5V4L7 9H3z" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          </svg>
        )}
      </button>

      <div className="volume-track-v" ref={trackRef} onPointerDown={handlePointerDown}>
        <div className="volume-track-bg-v" />
        <motion.div
          className="volume-track-fill-v"
          animate={{ height: `${muted ? 0 : volume}%`, ...pulseAnimation }} // เพิ่มชีพจร
          transition={{ duration: dragging ? 0 : dur(0.15) }}
        />
        <motion.div
          className="volume-thumb-v"
          animate={{ bottom: `${muted ? 0 : volume}%`, scale: dragging ? 1.4 : 1 }} // ขยาย thumb เมื่อลาก
          transition={{ duration: dragging ? 0 : dur(0.15) }}
        />
      </div>

      {isWebPlayerActive && <span className="volume-sync-badge-v" title="ซิงก์กับเว็บเบราว์เซอร์">เว็บ</span>}

      <style>{`
        .volume-slider-wrap-v {
          display: flex; flex-direction: column; align-items: center; gap: 12px;
          padding: 16px 12px;
          border-radius: 999px;
          background: linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%);
          box-shadow: inset 0 0 10px rgba(0,0,0,0.2), 0 0 15px rgba(29, 185, 84, 0.3);
          cursor: pointer;
        }

        .volume-mute-btn-v {
          width: 30px; height: 30px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          border-radius: 50%; border: none; background: rgba(255,255,255,0.03);
          color: rgba(255,255,255,0.75); cursor: pointer;
          transition: color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .volume-mute-btn-v:hover {
          color: #fff; background: rgba(255,255,255,0.12);
          box-shadow: 0 0 8px rgba(255,255,255,0.5);
        }

        .volume-track-v {
          position: relative;
          width: 18px; height: 140px;
          display: flex; flex-direction: column-reverse; align-items: center;
          cursor: ns-resize;
          touch-action: none;
        }
        .volume-track-bg-v {
          position: absolute; left: 50%; top: 0; bottom: 0;
          width: 6px; transform: translateX(-50%);
          border-radius: 3px; background: rgba(255,255,255,0.15);
          box-shadow: inset 0 0 5px rgba(0,0,0,0.3);
        }
        .volume-track-fill-v {
          position: absolute; left: 50%; bottom: 0;
          width: 6px; transform: translateX(-50%);
          border-radius: 3px; background: #1DB954;
          box-shadow: 0 0 15px rgba(29, 185, 84, 0.7);
        }
        .volume-thumb-v {
          position: absolute; left: 50%;
          width: 16px; height: 16px; margin-left: -8px; margin-bottom: -8px;
          border-radius: 50%; background: #fff;
          box-shadow: 0 0 10px rgba(0,0,0,0.6);
          transition: scale 0.1s;
        }

        .volume-sync-badge-v {
          font-size: 10px; font-weight: 600; color: #1DB954;
          background: rgba(29,185,84,0.16);
          padding: 2px 8px; border-radius: 999px;
          white-space: nowrap;
          box-shadow: 0 0 8px rgba(29, 185, 84, 0.3);
        }
      `}</style>
    </motion.div>
  );
}
