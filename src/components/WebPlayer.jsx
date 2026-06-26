import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * WebPlayer — Spotify Web Playback SDK
 * Fix: เสียงหายหลัง 10 วิ → aggressive AudioContext keep-alive
 * - playSilence ทุก 5 วิ (ลดจาก 8)
 * - resume AudioContext ทันทีที่ state = suspended
 * - ฟัง visibilitychange เพื่อ resume เมื่อ tab กลับมา
 * - ฟัง window focus เพื่อ unlock AudioContext
 */
export default function WebPlayer({ animSpeed = 1 }) {
  const [status, setStatus] = useState("idle");
  const [deviceName] = useState("Music App Browser");
  const playerRef = useRef(null);
  const deviceIdRef = useRef(null);
  const keepAliveRef = useRef(null);
  const audioCtxRef = useRef(null);

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

  // ─────────────────────────────────────────────────────
  // Ensure AudioContext exists and is running
  // ─────────────────────────────────────────────────────
  const ensureAudioContext = useCallback(async () => {
    if (!audioCtxRef.current) {
      try {
        audioCtxRef.current = new (window.AudioContext ||
          window.webkitAudioContext)();
      } catch (e) {
        console.warn("AudioContext not available:", e);
        return false;
      }
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch (e) {
        // ignore
      }
    }
    return ctx.state === "running";
  }, []);

  const playSilence = useCallback(async () => {
    const ok = await ensureAudioContext();
    if (!ok) return;
    const ctx = audioCtxRef.current;
    try {
      // 0.2s silent buffer — longer than before so browser registers activity
      const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.2), ctx.sampleRate);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
    } catch (e) {
      // ignore
    }
    // Also ping Spotify player
    if (playerRef.current) {
      try {
        playerRef.current.activateElement();
      } catch (e) {
        // ignore
      }
    }
  }, [ensureAudioContext]);

  const stopKeepAlive = useCallback(() => {
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
  }, []);

  const startKeepAlive = useCallback(() => {
    stopKeepAlive();
    playSilence(); // immediate first ping
    // Every 5 seconds (was 8 — browser suspends context after ~10s of silence)
    keepAliveRef.current = setInterval(playSilence, 5000);
  }, [playSilence, stopKeepAlive]);

  // Resume AudioContext when tab becomes visible again
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible" && keepAliveRef.current) {
        ensureAudioContext();
        playSilence();
      }
    };
    const onFocus = () => {
      if (keepAliveRef.current) {
        ensureAudioContext();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
    };
  }, [ensureAudioContext, playSilence]);

  const initPlayer = () => {
    if (playerRef.current) return;
    const token = getToken();
    if (!token) {
      setStatus("error");
      return;
    }
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
        stopKeepAlive();
      });

      player.addListener("initialization_error", () => {
        setStatus("error");
        stopKeepAlive();
      });
      player.addListener("authentication_error", () => {
        setStatus("error");
        stopKeepAlive();
      });
      player.addListener("account_error", () => {
        setStatus("error");
        stopKeepAlive();
      });

      player.addListener("player_state_changed", (state) => {
        if (state && !state.paused) {
          if (!keepAliveRef.current) startKeepAlive();
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

  const startPlayback = async () => {
    // Unlock AudioContext on user gesture (required by browsers)
    await ensureAudioContext();

    if (playerRef.current) {
      playerRef.current.activateElement();
      playerRef.current.resume().catch(() => {});
    }
    transferPlayback(deviceIdRef.current);
    setStatus("active");
    startKeepAlive();
  };

  const handleDisconnect = () => {
    stopKeepAlive();
    if (playerRef.current) {
      playerRef.current.disconnect();
      playerRef.current = null;
      deviceIdRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setStatus("idle");
  };

  useEffect(() => {
    return () => {
      stopKeepAlive();
    };
  }, [stopKeepAlive]);

  const dur = (b) => b / animSpeed;

  return (
    <div className="webplayer-wrap">
      <AnimatePresence mode="wait">
        {status === "idle" && (
          <motion.button
            key="idle"
            className="video-bg-btn webplayer-btn"
            onClick={initPlayer}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: dur(0.25) }}
            title="เปิดใช้งานเล่นเสียงใน Browser"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zm-8-1l6-5-6-5v10z" />
            </svg>
            เว็บ
          </motion.button>
        )}
        {status === "loading" && (
          <motion.div
            key="loading"
            className="video-bg-btn webplayer-btn webplayer-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: dur(0.2) }}
          >
            <motion.div
              className="webplayer-spinner"
              animate={{ rotate: 360 }}
              transition={{ duration: dur(1), repeat: Infinity, ease: "linear" }}
            />
            กำลังเชื่อมต่อ...
          </motion.div>
        )}
        {status === "ready" && (
          <motion.button
            key="ready"
            className="video-bg-btn webplayer-btn"
            style={{ borderColor: "#1db954", color: "#1db954" }}
            onClick={startPlayback}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: dur(0.25) }}
            title="คลิกเพื่อเริ่มเล่นเสียง"
            whileHover={{ scale: 1.05, backgroundColor: "rgba(29,185,84,0.15)" }}
            whileTap={{ scale: 0.95 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            คลิกเพื่อเล่นเสียง
          </motion.button>
        )}
        {status === "active" && (
          <motion.button
            key="active"
            className="video-bg-btn webplayer-btn webplayer-active"
            onClick={handleDisconnect}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: dur(0.25) }}
            title="กำลังเล่นใน Browser — คลิกเพื่อยกเลิก"
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: dur(1.2), repeat: Infinity, ease: "easeInOut" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="8" fill="currentColor" />
              </svg>
            </motion.div>
            เว็บ (กำลังเล่น)
          </motion.button>
        )}
        {status === "error" && (
          <motion.button
            key="error"
            className="video-bg-btn webplayer-btn webplayer-error"
            onClick={() => setStatus("idle")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: dur(0.2) }}
            title="ต้องการ Spotify Premium"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            ต้องการ Premium
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
