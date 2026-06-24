import { useState, useEffect } from "react";
import { isLoggedIn, clearTokens } from "./utils/spotifyAuth";
import { useSpotifyNowPlaying } from "./hooks/useSpotifyNowPlaying";
import { useLyrics } from "./hooks/useLyrics";
import { useAlbumColors } from "./hooks/useAlbumColors";

import AnimatedBackground from "./components/AnimatedBackground";
import AlbumArt from "./components/AlbumArt";
import TrackInfo from "./components/TrackInfo";
import LyricsView from "./components/LyricsView";
import LoginScreen from "./components/LoginScreen";
import AuthCallback from "./components/AuthCallback";
import ProgressBar from "./components/ProgressBar";
import SearchBar from "./components/SearchBar";
import VideoBackground from "./components/VideoBackground";
import Clock from "./components/Clock";
import PlayerControls from "./components/PlayerControls";
import QueueList from "./components/QueueList";
import MiniNextTrack from "./components/MiniNextTrack";
import { motion, AnimatePresence } from "framer-motion";

import "./styles/app.css";

function MainApp() {
  const { track, isPlaying, progressMs, authError, loading } = useSpotifyNowPlaying();
  const lyrics = useLyrics(track, progressMs);
  const colors = useAlbumColors(track?.albumArt);
  const [showQueue, setShowQueue] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [appViewMode, setAppViewMode] = useState("music"); // "music" | "clock"

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen?.();
    }
  };

  if (authError) {
    clearTokens();
    return <LoginScreen />;
  }

  // Show right pane always (either queue, lyrics, or empty/no-track state)
  const showRightPane = !showQueue ? true : true;

  return (
    <div className="app-shell">
      <AnimatedBackground colors={colors} trackId={track?.id} />
      <VideoBackground track={track} />

      {/* Top bar */}
      <div className="top-bar">
        <span className="app-logo">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="var(--text-primary)">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.622.622 0 01-.853.205c-2.336-1.426-5.275-1.75-8.743-.957a.623.623 0 11-.271-1.215c3.784-.863 7.037-.48 9.662 1.125a.622.622 0 01.205.842zm1.218-2.724a.777.777 0 01-1.066.255c-2.673-1.642-6.76-2.096-9.877-1.148a.777.777 0 11-.454-1.485c3.568-1.085 8.1-.58 11.142 1.288a.777.777 0 01.255 1.09zm.106-2.85c-3.21-1.906-8.5-2.08-11.564-1.152a.933.933 0 11-.537-1.788c3.518-1.062 9.356-.86 13.06 1.34a.933.933 0 01-.96 1.6z"/>
          </svg>
        </span>
        <Clock />
        <div className="top-bar-actions">
          <SearchBar />
          <button
            className={`video-bg-btn ${appViewMode === "clock" ? "active" : ""}`}
            onClick={() => setAppViewMode(v => v === "music" ? "clock" : "music")}
            title={appViewMode === "music" ? "โหมดนาฬิกา" : "โหมดเพลง"}
          >
            {appViewMode === "music" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            )}
            {appViewMode === "music" ? "นาฬิกา" : "เพลง"}
          </button>
          <button
            className={`video-bg-btn ${showQueue ? "active" : ""}`}
            onClick={() => setShowQueue(!showQueue)}
            title="รายการต่อไป"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
            </svg>
            คิวเพลง
          </button>
          <button className="search-btn" onClick={toggleFullscreen} title="เต็มจอ">
            {isFullscreen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      <motion.div
        className="app-content"
        layout
        transition={{ type: "spring", stiffness: 80, damping: 20 }}
      >
        {loading ? (
          <div className="lyrics-state" style={{ gridColumn: "1 / -1" }}>
            <div className="lyrics-spinner" />
            <span>กำลังโหลดข้อมูลเพลง...</span>
          </div>
        ) : appViewMode === "clock" ? (
          /* ── Clock full view ── */
          <motion.div
            key="clock-full"
            className="clock-fullview"
            style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "2rem" }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <ClockFullView track={track} isPlaying={isPlaying} progressMs={progressMs} />
          </motion.div>
        ) : (
          <>
            <motion.div className="left-pane" layout>
              <AlbumArt track={track} isPlaying={isPlaying} />
              <motion.div className="track-details-wrap" layout>
                <TrackInfo track={track} />
                <ProgressBar
                  progressMs={progressMs}
                  durationMs={track?.durationMs}
                  isPlaying={isPlaying}
                />
                <PlayerControls isPlaying={isPlaying} />
                {!showQueue && <MiniNextTrack currentTrackId={track?.id} />}
              </motion.div>
            </motion.div>

            <motion.div className="right-pane" layout>
              <AnimatePresence mode="wait">
                {showQueue ? (
                  <motion.div
                    key="queue"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="queue-wrapper"
                  >
                    <QueueList currentTrackId={track?.id} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="lyrics"
                    className="lyrics-wrapper"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <LyricsView
                      status={lyrics.status}
                      synced={lyrics.synced}
                      plain={lyrics.plain}
                      currentLineIndex={lyrics.currentLineIndex}
                      trackId={track?.id}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
}

function ClockFullView({ track, isPlaying, progressMs }) {
  const [time, setTime] = useState(new Date());
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
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Big clock */}
      <motion.div className="clock-full-time"
        key={timeStr.slice(0, 5)}
        animate={{ opacity: 1 }}
      >
        {timeStr}
      </motion.div>
      <div className="clock-full-date">{dateStr}</div>

      {/* Now playing mini card */}
      {track && (
        <motion.div className="clock-now-playing"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {track.albumArt && (
            <motion.img
              src={track.albumArt}
              alt="album"
              className="clock-album-thumb"
              animate={{ rotate: isPlaying ? [0, 360] : 0 }}
              transition={isPlaying ? { duration: 12, repeat: Infinity, ease: "linear" } : {}}
            />
          )}
          <div className="clock-track-info">
            <div className="clock-track-name">{track.name}</div>
            <div className="clock-track-artist">{track.artist}</div>
            {/* Progress bar */}
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


export default function App() {
  const [route, setRoute] = useState(
    window.location.search.includes("code=") ? "callback" : "main"
  );
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());

  useEffect(() => {
    if (window.location.search.includes("error=")) setRoute("callback");
  }, []);

  if (route === "callback") {
    return (
      <AuthCallback onComplete={() => { setLoggedIn(true); setRoute("main"); }} />
    );
  }
  if (!loggedIn) return <LoginScreen />;
  return <MainApp />;
}
