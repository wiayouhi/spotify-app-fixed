import { useState, useEffect } from "react";
import { isLoggedIn, clearTokens } from "./utils/spotifyAuth";
import { useSpotifyNowPlaying } from "./hooks/useSpotifyNowPlaying";
import { useLyrics } from "./hooks/useLyrics";
import { useAlbumColors } from "./hooks/useAlbumColors";

import AnimatedBackground from "./components/AnimatedBackground";
import AlbumArt from "./components/AlbumArt";
import TrackInfo from "./components/TrackInfo";
import LyricsView from "./components/LyricsView";
import LyricsTicker from "./components/LyricsTicker";
import LoginScreen from "./components/LoginScreen";
import AuthCallback from "./components/AuthCallback";
import ProgressBar from "./components/ProgressBar";
import SearchBar from "./components/SearchBar";
import VideoBackground from "./components/VideoBackground";
import Clock from "./components/Clock";
import PlayerControls from "./components/PlayerControls";
import QueueList from "./components/QueueList";
import MiniNextTrack from "./components/MiniNextTrack";
import WeatherWidget from "./components/WeatherWidget";
import SettingsPanel from "./components/SettingsPanel";
import WebPlayer from "./components/WebPlayer";
import { motion, AnimatePresence } from "framer-motion";

import "./styles/app.css";

const DEFAULT_SETTINGS = {
  clockFormat: "hhmm",
  clockShowDate: false,
  clockGlow: true,
  clockSize: 1.0,
  animEnabled: true,
  showLyricsTicker: true,
  showLyricsPanel: true,
};

function MainApp() {
  const { track, isPlaying, progressMs, authError, loading } = useSpotifyNowPlaying();
  const lyrics = useLyrics(track, progressMs);
  const colors = useAlbumColors(track?.albumArt);

  const [showQueue, setShowQueue] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [appViewMode, setAppViewMode] = useState("music"); // "music" | "clock"
  const [showSettings, setShowSettings] = useState(false);
  const [animSpeed, setAnimSpeed] = useState(1);

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("app_settings");
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Persist settings
  useEffect(() => {
    localStorage.setItem("app_settings", JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => console.error(err));
    } else {
      document.exitFullscreen?.();
    }
  };

  const dur = (b) => (settings.animEnabled ? b / animSpeed : 0);

  if (authError) {
    clearTokens();
    return <LoginScreen />;
  }

  return (
    <div className="app-shell">
      <AnimatedBackground colors={colors} trackId={track?.id} />
      <VideoBackground track={track} />

      {/* Settings Panel */}
      <SettingsPanel
        open={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSettingsChange={setSettings}
        animSpeed={animSpeed}
        onAnimSpeedChange={setAnimSpeed}
      />

      {/* ── Top bar ── */}
      <div className="top-bar">
        <span className="app-logo">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="var(--text-primary, #fff)">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.622.622 0 01-.853.205c-2.336-1.426-5.275-1.75-8.743-.957a.623.623 0 11-.271-1.215c3.784-.863 7.037-.48 9.662 1.125a.622.622 0 01.205.842zm1.218-2.724a.777.777 0 01-1.066.255c-2.673-1.642-6.76-2.096-9.877-1.148a.777.777 0 11-.454-1.485c3.568-1.085 8.1-.58 11.142 1.288a.777.777 0 01.255 1.09zm.106-2.85c-3.21-1.906-8.5-2.08-11.564-1.152a.933.933 0 11-.537-1.788c3.518-1.062 9.356-.86 13.06 1.34a.933.933 0 01-.96 1.6z"/>
          </svg>
        </span>

        {/* Clock + Weather (centre-left group) */}
        <div className="top-bar-center">
          <Clock config={settings} animSpeed={settings.animEnabled ? animSpeed : 999} />
          <WeatherWidget animSpeed={settings.animEnabled ? animSpeed : 999} />
        </div>

        <div className="top-bar-actions">
          <SearchBar />

          {/* Lyrics toggle */}
          <motion.button
            className={`video-bg-btn ${settings.showLyricsPanel ? "active" : ""}`}
            onClick={() => setSettings((s) => ({ ...s, showLyricsPanel: !s.showLyricsPanel }))}
            title={settings.showLyricsPanel ? "ซ่อนเนื้อเพลง" : "แสดงเนื้อเพลง"}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 10h11v2H3zm0-4h11v2H3zm0 8h7v2H3zm13-1l5 4-5 4V13z"/>
            </svg>
            เนื้อเพลง
          </motion.button>

          {/* Clock / Music toggle */}
          <motion.button
            className={`video-bg-btn ${appViewMode === "clock" ? "active" : ""}`}
            onClick={() => setAppViewMode((v) => (v === "music" ? "clock" : "music"))}
            title={appViewMode === "music" ? "โหมดนาฬิกา" : "โหมดเพลง"}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {appViewMode === "music" ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            )}
            {appViewMode === "music" ? "นาฬิกา" : "เพลง"}
          </motion.button>

          {/* Queue button */}
          <motion.button
            className={`video-bg-btn ${showQueue ? "active" : ""}`}
            onClick={() => setShowQueue(!showQueue)}
            title="รายการต่อไป"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
            </svg>
            คิวเพลง
          </motion.button>

          {/* Web Player */}
          <WebPlayer animSpeed={settings.animEnabled ? animSpeed : 999} />

          {/* Fullscreen */}
          <motion.button
            className="search-btn"
            onClick={toggleFullscreen}
            title="เต็มจอ"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isFullscreen ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
              </svg>
            )}
          </motion.button>

          {/* Settings */}
          <motion.button
            className={`search-btn ${showSettings ? "settings-btn-active" : ""}`}
            onClick={() => setShowSettings((v) => !v)}
            title="ตั้งค่า"
            whileHover={{ scale: 1.1, rotate: 30 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
            </svg>
          </motion.button>
        </div>
      </div>

      {/* ── Main Content ── */}
      <motion.div
        className="app-content"
        layout
        transition={{ type: "spring", stiffness: 80, damping: 20 }}
      >
        {loading ? (
          <div className="lyrics-state" style={{ gridColumn: "1 / -1" }}>
            <motion.div className="lyrics-spinner"
              animate={{ rotate: 360 }}
              transition={{ duration: dur(1), repeat: Infinity, ease: "linear" }}
            />
            <span>กำลังโหลดข้อมูลเพลง...</span>
          </div>
        ) : appViewMode === "clock" ? (
          <AnimatePresence mode="wait">
            <motion.div
              key="clock-full"
              className="clock-fullview"
              style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "2rem" }}
              initial={{ opacity: 0, scale: 0.9, filter: "blur(12px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.9, filter: "blur(12px)" }}
              transition={{ duration: dur(0.5), ease: [0.16, 1, 0.3, 1] }}
            >
              <ClockFullView track={track} isPlaying={isPlaying} progressMs={progressMs} animSpeed={settings.animEnabled ? animSpeed : 999} />
            </motion.div>
          </AnimatePresence>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key="music-view"
              style={{ display: "contents" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: dur(0.4) }}
            >
              {/* Left pane */}
              <motion.div
                className="left-pane"
                layout
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: dur(0.5), ease: [0.16, 1, 0.3, 1] }}
              >
                <AlbumArt track={track} isPlaying={isPlaying} />
                <motion.div className="track-details-wrap" layout>
                  <TrackInfo track={track} />

                  {/* Lyrics Ticker */}
                  <LyricsTicker
                    synced={lyrics.synced}
                    plain={lyrics.plain}
                    currentLineIndex={lyrics.currentLineIndex}
                    trackId={track?.id}
                    show={settings.showLyricsTicker && lyrics.status === "found"}
                    animSpeed={settings.animEnabled ? animSpeed : 999}
                  />

                  <ProgressBar
                    progressMs={progressMs}
                    durationMs={track?.durationMs}
                    isPlaying={isPlaying}
                  />
                  <PlayerControls isPlaying={isPlaying} />
                  {!showQueue && <MiniNextTrack currentTrackId={track?.id} />}
                </motion.div>
              </motion.div>

              {/* Right pane */}
              <motion.div
                className="right-pane"
                layout
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: dur(0.5), ease: [0.16, 1, 0.3, 1] }}
              >
                <AnimatePresence mode="wait">
                  {showQueue ? (
                    <motion.div
                      key="queue"
                      initial={{ opacity: 0, x: 40, scale: 0.97 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -40, scale: 0.97 }}
                      transition={{ duration: dur(0.4), ease: [0.16, 1, 0.3, 1] }}
                      className="queue-wrapper"
                    >
                      <QueueList currentTrackId={track?.id} animSpeed={settings.animEnabled ? animSpeed : 999} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="lyrics"
                      className="lyrics-wrapper"
                      initial={{ opacity: 0, x: 40, scale: 0.97 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -40, scale: 0.97 }}
                      transition={{ duration: dur(0.4), ease: [0.16, 1, 0.3, 1] }}
                      style={{ height: "100%", width: "100%" }}
                    >
                      <LyricsView
                        status={lyrics.status}
                        synced={lyrics.synced}
                        plain={lyrics.plain}
                        currentLineIndex={lyrics.currentLineIndex}
                        trackId={track?.id}
                        showPanel={settings.showLyricsPanel}
                        animSpeed={settings.animEnabled ? animSpeed : 999}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
}

/* ─────────── Clock full view ─────────── */
function ClockFullView({ track, isPlaying, progressMs, animSpeed = 1 }) {
  const [time, setTime] = useState(new Date());
  const dur = (b) => b / animSpeed;

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = time.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const dateStr = time.toLocaleDateString("th-TH", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const formatMs = (ms) => {
    if (!ms && ms !== 0) return "--:--";
    const s = Math.floor(ms / 1000);
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  };

  const progress = track?.durationMs ? Math.min(1, progressMs / track.durationMs) : 0;

  return (
    <motion.div className="clock-full-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: dur(0.6), ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Decorative ring */}
      <motion.div className="clock-full-ring"
        animate={{ rotate: 360, opacity: [0.3, 0.5, 0.3] }}
        transition={{ rotate: { duration: 20, repeat: Infinity, ease: "linear" }, opacity: { duration: 4, repeat: Infinity, ease: "easeInOut" } }}
      />
      <motion.div className="clock-full-ring clock-full-ring-2"
        animate={{ rotate: -360 }}
        transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
      />

      {/* Time digits — each digit animates individually */}
      <motion.div className="clock-full-time"
        key={timeStr.slice(0, 5)}
        animate={{ opacity: 1 }}
      >
        {timeStr}
      </motion.div>
      <div className="clock-full-date">{dateStr}</div>

      {/* Now playing card */}
      {track && (
        <motion.div className="clock-now-playing"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: dur(0.2), duration: dur(0.5) }}
        >
          {track.albumArt && (
            <motion.img
              src={track.albumArt}
              alt="album"
              className="clock-album-thumb"
              animate={{ rotate: isPlaying ? [0, 360] : 0 }}
              transition={isPlaying ? { duration: dur(12), repeat: Infinity, ease: "linear" } : {}}
            />
          )}
          <div className="clock-track-info">
            <div className="clock-track-name">{track.name}</div>
            <div className="clock-track-artist">{track.artist}</div>
            <div className="clock-progress-wrap">
              <div className="clock-progress-bar">
                <motion.div className="clock-progress-fill"
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 0.5, ease: "linear" }}
                />
              </div>
              <div className="clock-progress-time">
                {formatMs(progressMs)} / {formatMs(track.durationMs)}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ─────────── Root App ─────────── */
export default function App() {
  const [route, setRoute] = useState(
    window.location.search.includes("code=") ? "callback" : "main"
  );
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());

  useEffect(() => {
    if (window.location.search.includes("error=")) setRoute("callback");
  }, []);

  if (route === "callback") {
    return <AuthCallback onComplete={() => { setLoggedIn(true); setRoute("main"); }} />;
  }
  if (!loggedIn) return <LoginScreen />;
  return <MainApp />;
}
