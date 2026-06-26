import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * WebPlayer — Spotify Web Playback SDK
 *
 * Root cause ของเสียงหาย:
 * Chrome/Safari จะ auto-suspend AudioContext หลังจากไม่มี audio output ~10 วิ
 * setInterval + playSilence ไม่ work เพราะ browser ถือว่า interval callback
 * ไม่ใช่ "audio activity" พอที่จะป้องกัน suspend
 *
 * วิธีแก้ที่ถูก: ต่อ OscillatorNode (volume = 0) ไว้กับ destination ตลอดเวลา
 * ทำให้ AudioContext มี active audio graph → ไม่ถูก suspend เลย
 */
export default function WebPlayer({ animSpeed = 1 }) {
  const [status, setStatus] = useState("idle");
  const [deviceName] = useState("Music App Browser");
  const playerRef = useRef(null);
  const deviceIdRef = useRef(null);
  const audioCtxRef = useRef(null);
  const gainRef = useRef(null);      // GainNode volume=0 ต่อไว้ตลอด
  const oscRef = useRef(null);       // OscillatorNode ที่ run ตลอด
  const watchdogRef = useRef(null);  // fallback watchdog

  const getToken = () =>
    localStorage.getItem("spotify_access_token") ||
    sessionStorage.getItem("spotify_access_token");

  const transferPlayback = async (deviceId) => {
    const token = getToken();
    if (!token || !deviceId) return;
    try {
      await fetch("https://api.spotify.com/v1/me/player", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ device_ids: [deviceId], play: true }),
      });
    } catch (e) {
      console.error("Transfer error:", e);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // startAudioAnchor: สร้าง AudioContext + ต่อ silent oscillator
  // ไว้กับ destination ตลอด → ป้องกัน auto-suspend
  // ต้องเรียกจาก user gesture เท่านั้น (onClick)
  // ─────────────────────────────────────────────────────────────
  const startAudioAnchor = useCallback(async () => {
    // สร้าง AudioContext ใหม่ถ้ายังไม่มี
    if (!audioCtxRef.current) {
      try {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.warn("AudioContext not available:", e);
        return;
      }
    }

    const ctx = audioCtxRef.current;

    // Resume ถ้า suspended (ต้องอยู่ใน user gesture stack)
    if (ctx.state === "suspended") {
      try { await ctx.resume(); } catch (e) {}
    }

    // หยุด oscillator เก่าก่อน (ถ้ามี)
    if (oscRef.current) {
      try { oscRef.current.stop(); } catch (e) {}
      oscRef.current = null;
    }

    // GainNode volume = 0 (ไม่มีเสียงออก แต่ audio graph active)
    if (!gainRef.current) {
      gainRef.current = ctx.createGain();
      gainRef.current.gain.value = 0;
      gainRef.current.connect(ctx.destination);
    }

    // OscillatorNode วิ่งตลอด → ทำให้ context ไม่ถือว่า idle
    const osc = ctx.createOscillator();
    osc.frequency.value = 1; // 1Hz ต่ำมาก ไม่ได้ยิน
    osc.connect(gainRef.current);
    osc.start();
    oscRef.current = osc;

    // Watchdog: ตรวจทุก 3 วิ ถ้า suspended → resume ทันที
    if (watchdogRef.current) clearInterval(watchdogRef.current);
    watchdogRef.current = setInterval(async () => {
      const c = audioCtxRef.current;
      if (!c) return;
      if (c.state === "suspended") {
        try { await c.resume(); } catch (e) {}
      }
      // ping Spotify SDK ด้วย
      if (playerRef.current) {
        try { playerRef.current.activateElement(); } catch (e) {}
      }
    }, 3000);
  }, []);

  const stopAudioAnchor = useCallback(() => {
    if (watchdogRef.current) {
      clearInterval(watchdogRef.current);
      watchdogRef.current = null;
    }
    if (oscRef.current) {
      try { oscRef.current.stop(); } catch (e) {}
      oscRef.current = null;
    }
    if (gainRef.current) {
      try { gainRef.current.disconnect(); } catch (e) {}
      gainRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  }, []);

  // Resume เมื่อ tab กลับมา visible
  useEffect(() => {
    const onVisibility = async () => {
      if (document.visibilityState === "visible" && watchdogRef.current) {
        const ctx = audioCtxRef.current;
        if (ctx?.state === "suspended") {
          try { await ctx.resume(); } catch (e) {}
        }
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const initPlayer = () => {
    if (playerRef.current) return;
    const token = getToken();
    if (!token) { setStatus("error"); return; }
    setStatus("loading");

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: deviceName,
        getOAuthToken: (cb) => cb(getToken()),
        volume: 0.8,
      });

      player.addListener("ready", ({ device_id }) => {
        deviceIdRef.current = device_id;
        setStatus("ready");
      });
      player.addListener("not_ready", () => {
        setStatus("idle");
        stopAudioAnchor();
      });
      player.addListener("initialization_error", () => { setStatus("error"); stopAudioAnchor(); });
      player.addListener("authentication_error", () => { setStatus("error"); stopAudioAnchor(); });
      player.addListener("account_error", () => { setStatus("error"); stopAudioAnchor(); });
      player.addListener("player_state_changed", (state) => {
        if (state && !state.paused && !watchdogRef.current) {
          // เพลงเล่นแต่ anchor ไม่ได้ start → restart (edge case)
          startAudioAnchor();
        }
      });

      player.connect();
      playerRef.current = player;
    };

    if (!document.getElementById("spotify-sdk")) {
      const script = document.createElement("script");
      script.id = "spotify-sdk";
      script.src = "https://sdk.scdn.co/spotify-player.js";
      document.head.appendChild(script);
    } else if (window.Spotify) {
      window.onSpotifyWebPlaybackSDKReady();
    }
  };

  // startPlayback ต้องเรียกจาก onClick โดยตรง (user gesture)
  const startPlayback = async () => {
    // startAudioAnchor ต้องอยู่ใน synchronous user gesture path
    await startAudioAnchor();

    if (playerRef.current) {
      playerRef.current.activateElement();
      playerRef.current.resume().catch(() => {});
    }
    transferPlayback(deviceIdRef.current);
    setStatus("active");
  };

  const handleDisconnect = () => {
    stopAudioAnchor();
    if (playerRef.current) {
      playerRef.current.disconnect();
      playerRef.current = null;
      deviceIdRef.current = null;
    }
    setStatus("idle");
  };

  useEffect(() => {
    return () => { stopAudioAnchor(); };
  }, [stopAudioAnchor]);

  const dur = (b) => b / animSpeed;

  return (
    <div className="webplayer-wrap">
      <AnimatePresence mode="wait">
        {status === "idle" && (
          <motion.button key="idle" className="video-bg-btn webplayer-btn"
            onClick={initPlayer}
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: dur(0.25) }}
            title="เปิดใช้งานเล่นเสียงใน Browser"
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zm-8-1l6-5-6-5v10z"/>
            </svg>
            เว็บ
          </motion.button>
        )}
        {status === "loading" && (
          <motion.div key="loading" className="video-bg-btn webplayer-btn webplayer-loading"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: dur(0.2) }}
          >
            <motion.div className="webplayer-spinner"
              animate={{ rotate: 360 }}
              transition={{ duration: dur(1), repeat: Infinity, ease: "linear" }}
            />
            กำลังเชื่อมต่อ...
          </motion.div>
        )}
        {status === "ready" && (
          <motion.button key="ready" className="video-bg-btn webplayer-btn"
            style={{ borderColor: "#1db954", color: "#1db954" }}
            onClick={startPlayback}
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: dur(0.25) }}
            title="คลิกเพื่อเริ่มเล่นเสียง"
            whileHover={{ scale: 1.05, backgroundColor: "rgba(29,185,84,0.15)" }}
            whileTap={{ scale: 0.95 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            คลิกเพื่อเล่นเสียง
          </motion.button>
        )}
        {status === "active" && (
          <motion.button key="active" className="video-bg-btn webplayer-btn webplayer-active"
            onClick={handleDisconnect}
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: dur(0.25) }}
            title="กำลังเล่นใน Browser — คลิกเพื่อยกเลิก"
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: dur(1.2), repeat: Infinity, ease: "easeInOut" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="8" fill="currentColor"/>
              </svg>
            </motion.div>
            เว็บ (กำลังเล่น)
          </motion.button>
        )}
        {status === "error" && (
          <motion.button key="error" className="video-bg-btn webplayer-btn webplayer-error"
            onClick={() => setStatus("idle")}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: dur(0.2) }}
            title="ต้องการ Spotify Premium"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            ต้องการ Premium
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
