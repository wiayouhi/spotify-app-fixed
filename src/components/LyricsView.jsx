import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useCallback, useState } from "react";

/* ─────────── Custom smooth scroll (spring physics, iOS-style) ─────────── */
function useSmoothScroll(containerRef) {
  const targetScrollTop = useRef(0);
  const currentScrollTop = useRef(0);
  const velocity = useRef(0);
  const rafId = useRef(null);
  const isAnimating = useRef(false);
  const lastTime = useRef(0);

  // Smooth, slightly-overdamped spring — glides instead of snapping, iOS momentum feel
  const STIFFNESS = 150;
  const DAMPING = 28;
  const MASS = 1.1;

  const animateScroll = useCallback((time) => {
    const container = containerRef.current;
    if (!container) return;

    if (!lastTime.current) lastTime.current = time;
    let dt = (time - lastTime.current) / 1000;
    lastTime.current = time;
    dt = Math.min(dt, 1 / 30); // clamp so tab-switches / frame drops don't jolt the spring

    const displacement = currentScrollTop.current - targetScrollTop.current;
    const springForce = -STIFFNESS * displacement;
    const dampingForce = -DAMPING * velocity.current;
    const acceleration = (springForce + dampingForce) / MASS;

    velocity.current += acceleration * dt;
    currentScrollTop.current += velocity.current * dt;
    container.scrollTop = currentScrollTop.current;

    const settled = Math.abs(displacement) < 0.3 && Math.abs(velocity.current) < 0.3;
    if (settled) {
      container.scrollTop = targetScrollTop.current;
      currentScrollTop.current = targetScrollTop.current;
      velocity.current = 0;
      isAnimating.current = false;
      lastTime.current = 0;
      return;
    }
    rafId.current = requestAnimationFrame(animateScroll);
  }, [containerRef]);

  const scrollTo = useCallback((top) => {
    const container = containerRef.current;
    if (!container) return;
    targetScrollTop.current = Math.max(0, top);
    currentScrollTop.current = container.scrollTop;
    if (!isAnimating.current) {
      isAnimating.current = true;
      lastTime.current = 0;
      rafId.current = requestAnimationFrame(animateScroll);
    }
  }, [animateScroll, containerRef]);

  const stop = useCallback(() => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    isAnimating.current = false;
    velocity.current = 0;
    lastTime.current = 0;
    const container = containerRef.current;
    if (container) currentScrollTop.current = container.scrollTop;
  }, [containerRef]);

  return { scrollTo, stop };
}

/* ─────────── No-lyrics artwork ─────────── */
function NoLyricsArt({ reason, animSpeed = 1 }) {
  const dur = (b) => b / animSpeed;

  const configs = {
    not_found: {
      title: "ไม่พบเนื้อเพลง",
      sub: "ไม่มีเนื้อเพลงสำหรับบทเพลงนี้",
    },
    idle: {
      title: "ยังไม่ได้เล่นเพลง",
      sub: "เปิดเพลงใน Spotify เพื่อเริ่มต้น",
    },
    error: {
      title: "เกิดข้อผิดพลาด",
      sub: "ไม่สามารถโหลดเนื้อเพลงได้",
    },
    hidden: {
      title: "เนื้อเพลงถูกซ่อน",
      sub: "เปิดจากแถบตั้งค่าด้านบน",
    },
  };
  const cfg = configs[reason] || configs.idle;

  return (
    <motion.div
      className="no-lyrics-art"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: dur(0.5), ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Concentric rings */}
      <div className="no-lyrics-rings">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={`no-lyrics-ring ring-${i}`}
            animate={{ scale: [1, 1.04, 1], opacity: [0.15, 0.35, 0.15] }}
            transition={{ duration: dur(3 + i * 0.8), repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
          />
        ))}
      </div>

      {/* Center icon */}
      <motion.div
        className="no-lyrics-icon"
        animate={{ y: [0, -6, 0], rotate: [0, -3, 3, 0] }}
        transition={{ duration: dur(4), repeat: Infinity, ease: "easeInOut" }}
      >
        {reason === "hidden" ? (
          <svg width="40" height="40" viewBox="0 0 24 24" fill="rgba(255,255,255,0.4)">
            <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.804 11.804 0 0 0 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
          </svg>
        ) : reason === "error" ? (
          <svg width="40" height="40" viewBox="0 0 24 24" fill="rgba(255,100,100,0.5)">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
        ) : (
          <svg width="40" height="40" viewBox="0 0 24 24" fill="rgba(255,255,255,0.35)">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
        )}
      </motion.div>

      {/* Text */}
      <motion.div className="no-lyrics-text"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: dur(0.4) }}
      >
        <div className="no-lyrics-title">{cfg.title}</div>
        <div className="no-lyrics-sub">{cfg.sub}</div>
      </motion.div>

      {/* Floating dots */}
      <div className="no-lyrics-dots">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div key={i} className="no-lyrics-dot"
            style={{ "--di": i }}
            animate={{ y: [0, -14, 0], opacity: [0.2, 0.6, 0.2], scale: [1, 1.2, 1] }}
            transition={{ duration: dur(2 + i * 0.4), repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
          />
        ))}
      </div>
    </motion.div>
  );
}

/* ─────────── Main LyricsView ─────────── */
export default function LyricsView({
  status, synced, plain, currentLineIndex, trackId,
  showPanel = true, animSpeed = 1, songEnded = false,
}) {
  const containerRef = useRef(null);
  const lineRefs = useRef({});
  const isUserScrolling = useRef(false);
  const userScrollTimer = useRef(null);
  const lastAutoScrollLine = useRef(-1);
  const currentIndexRef = useRef(currentLineIndex);
  const prevLineIndexRef = useRef(currentLineIndex);
  const [viewMode, setViewMode] = useState("lyrics");

  const dur = (b) => b / animSpeed;
  const { scrollTo, stop } = useSmoothScroll(containerRef);

  useEffect(() => { currentIndexRef.current = currentLineIndex; }, [currentLineIndex]);

  const scrollToLine = useCallback((index, retryCount = 0) => {
    if (isUserScrolling.current) return;
    if (index < 0) return;
    if (index === lastAutoScrollLine.current && retryCount === 0) return;
    const container = containerRef.current;
    const lineEl = lineRefs.current[index];
    if (!container || !lineEl) {
      if (retryCount < 60) requestAnimationFrame(() => scrollToLine(index, retryCount + 1));
      return;
    }
    const containerRect = container.getBoundingClientRect();
    const lineRect = lineEl.getBoundingClientRect();
    const targetTop = container.scrollTop + (lineRect.top - containerRect.top) - container.clientHeight / 2 + lineRect.height / 2;
    scrollTo(targetTop);
    lastAutoScrollLine.current = index;
  }, [scrollTo]);

  useEffect(() => {
    if (currentLineIndex >= 0) scrollToLine(currentLineIndex);
    // track direction/step so we can stagger the line-by-line cascade
    prevLineIndexRef.current = currentLineIndex;
  }, [currentLineIndex, scrollToLine]);

  const handleUserScroll = useCallback(() => {
    stop();
    isUserScrolling.current = true;
    clearTimeout(userScrollTimer.current);
    userScrollTimer.current = setTimeout(() => {
      isUserScrolling.current = false;
      lastAutoScrollLine.current = -1;
      scrollToLine(currentIndexRef.current);
    }, 3000);
  }, [scrollToLine, stop]);

  useEffect(() => {
    lineRefs.current = {};
    lastAutoScrollLine.current = -1;
    isUserScrolling.current = false;
    clearTimeout(userScrollTimer.current);
    const container = containerRef.current;
    if (container) container.scrollTop = 0;
    scrollTo(0);
  }, [trackId, scrollTo]);

  const hasContent = status === "found" && (synced || plain);

  // If panel is hidden → show "hidden" state
  if (!showPanel) {
    return (
      <AnimatePresence mode="wait">
        <NoLyricsArt key="hidden" reason="hidden" animSpeed={animSpeed} />
      </AnimatePresence>
    );
  }

  // Loading / not found / error / idle
  if (!hasContent) {
    return (
      <AnimatePresence mode="wait">
        {status === "loading" ? (
          <motion.div
            key="loading"
            className="lyrics-empty-state"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div className="no-lyrics-rings">
              {[0, 1, 2].map((i) => (
                <motion.div key={i} className={`no-lyrics-ring ring-${i}`}
                  animate={{ scale: [1, 1.04, 1], opacity: [0.15, 0.35, 0.15] }}
                  transition={{ duration: dur(3 + i * 0.8), repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
                />
              ))}
            </div>
            <motion.div className="lyrics-spinner"
              animate={{ rotate: 360 }}
              transition={{ duration: dur(1), repeat: Infinity, ease: "linear" }}
            />
            <motion.span className="empty-text"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            >
              กำลังค้นหาเนื้อเพลง...
            </motion.span>
          </motion.div>
        ) : (
          <NoLyricsArt key={status} reason={status} animSpeed={animSpeed} />
        )}
      </AnimatePresence>
    );
  }

  return (
    <div className="lyrics-view-root">
      {/* Mode toggle button */}
      <motion.button
        className="lyrics-toggle-btn"
        onClick={() => setViewMode((v) => (v === "lyrics" ? "fulltime" : "lyrics"))}
        whileHover={{ scale: 1.06, background: "rgba(255,255,255,0.18)" }}
        whileTap={{ scale: 0.93 }}
        title={viewMode === "lyrics" ? "โหมดใหญ่" : "โหมดเนื้อเพลง"}
      >
        <AnimatePresence mode="wait">
          <motion.span key={viewMode}
            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
            transition={{ duration: dur(0.25), ease: "backOut" }}
          >
            {viewMode === "lyrics" ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            )}
          </motion.span>
        </AnimatePresence>
        <AnimatePresence mode="wait">
          <motion.span key={viewMode + "-label"} className="toggle-label"
            initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }}
            transition={{ duration: dur(0.2) }}
          >
            {viewMode === "lyrics" ? "โหมดใหญ่" : "เนื้อเพลง"}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      {/* Content */}
      <AnimatePresence mode="wait">
        {viewMode === "fulltime" ? (
          <motion.div key="fulltime" className="lyrics-fulltime-view"
            initial={{ opacity: 0, scale: 0.88, filter: "blur(16px)", y: 30 }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)", y: 0 }}
            exit={{ opacity: 0, scale: 1.06, filter: "blur(16px)", y: -30 }}
            transition={{ duration: dur(0.55), ease: [0.16, 1, 0.3, 1] }}
          >
            <FullTimeDisplay synced={synced} currentLineIndex={currentLineIndex} trackId={trackId} animSpeed={animSpeed} songEnded={songEnded} />
          </motion.div>
        ) : (
          <motion.div key="lyrics" className="lyrics-mode-wrap"
            initial={{ opacity: 0, scale: 0.94, filter: "blur(10px)", y: 20 }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)", y: 0 }}
            exit={{ opacity: 0, scale: 0.94, filter: "blur(10px)", y: -20 }}
            transition={{ duration: dur(0.5), ease: [0.16, 1, 0.3, 1] }}
            style={{ height: "100%", width: "100%" }}
          >
            {synced ? (
              <div
                className="lyrics-scroll"
                ref={containerRef}
                onWheel={handleUserScroll}
                onTouchMove={handleUserScroll}
                onTouchStart={handleUserScroll}
              >
                <AnimatePresence mode="wait">
                  <motion.div key={trackId} className="lyrics-lines"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: dur(0.4) }}
                  >
                    <div className="lyrics-spacer" />

                    {/* Intro — shown before the first line has started */}
                    <AnimatePresence>
                      {currentLineIndex === -1 && !songEnded && (
                        <motion.div
                          key="lyrics-intro"
                          className="lyrics-intro"
                          initial={{ opacity: 0, y: 24, scale: 0.9, filter: "blur(12px)" }}
                          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                          exit={{ opacity: 0, y: -18, scale: 0.94, filter: "blur(8px)" }}
                          transition={{ type: "spring", stiffness: 160 * animSpeed, damping: 26, mass: 1 }}
                          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "24px 0" }}
                        >
                          <div className="lyrics-intro-dots" style={{ display: "flex", gap: 8 }}>
                            {[0, 1, 2].map((i) => (
                              <motion.span
                                key={i}
                                className="lyrics-intro-dot"
                                animate={{ opacity: [0.25, 1, 0.25], scale: [0.8, 1.15, 0.8] }}
                                transition={{ duration: dur(1.4), repeat: Infinity, delay: i * 0.22, ease: "easeInOut" }}
                                style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.6)" }}
                              />
                            ))}
                          </div>
                          <span className="lyrics-intro-text" style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", letterSpacing: "0.02em" }}>
                            เพลงกำลังจะเริ่ม
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {synced.map((line, i) => {
                      const distance = Math.abs(i - currentLineIndex);
                      const isActive = i === currentLineIndex;
                      const isPast = i < currentLineIndex;
                      // Stagger each line's transition by its distance from the active
                      // line so the whole block advances one row at a time, cascading
                      // outward and settling smoothly — the "iOS picker" feel without
                      // being snappy about it.
                      const cascadeDelay = Math.min(distance * 0.045, 0.32);
                      return (
                        <motion.p
                          key={`${trackId}-${i}`}
                          layout
                          ref={(el) => { if (el) lineRefs.current[i] = el; }}
                          className={`lyric-line ${isActive ? "active" : ""}`}
                          initial={false}
                          animate={{
                            opacity: isActive ? 1 : isPast ? Math.max(0.12, 0.45 - distance * 0.1) : Math.max(0.18, 0.55 - distance * 0.12),
                            scale: isActive ? 1.06 : Math.max(0.88, 1 - distance * 0.025),
                            filter: isActive ? "blur(0px)" : `blur(${Math.min(distance * 0.6, 3)}px)`,
                            x: isActive ? 0 : isPast ? -6 : 4,
                            color: isActive ? "#ffffff" : "rgba(255,255,255,0.45)",
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 200 * animSpeed,
                            damping: 32,
                            mass: 1,
                            delay: cascadeDelay,
                            layout: { type: "spring", stiffness: 190 * animSpeed, damping: 34, mass: 1, delay: cascadeDelay },
                          }}
                          style={{ transformOrigin: "left center" }}
                        >
                          {line.text || "\u00A0"}
                        </motion.p>
                      );
                    })}

                    {/* Outro — shown once the song/lyrics have finished */}
                    <AnimatePresence>
                      {songEnded && (
                        <motion.div
                          key="lyrics-outro"
                          className="lyrics-outro"
                          initial={{ opacity: 0, y: 24, scale: 0.9, filter: "blur(12px)" }}
                          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                          exit={{ opacity: 0, y: -18, scale: 0.94, filter: "blur(8px)" }}
                          transition={{ type: "spring", stiffness: 160 * animSpeed, damping: 26, mass: 1, delay: 0.1 }}
                          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "24px 0", position: "relative" }}
                        >
                          <motion.div
                            className="lyrics-outro-glow"
                            animate={{ opacity: [0.5, 0.15, 0.5], scale: [1, 1.15, 1] }}
                            transition={{ duration: dur(2.4), repeat: Infinity, ease: "easeInOut" }}
                            style={{
                              position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                              width: 80, height: 80, borderRadius: "50%",
                              background: "radial-gradient(circle, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 70%)",
                            }}
                          />
                          <span className="lyrics-outro-text" style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", letterSpacing: "0.02em", position: "relative" }}>
                            จบเนื้อเพลง
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="lyrics-spacer" />
                  </motion.div>
                </AnimatePresence>
              </div>
            ) : (
              <div className="lyrics-scroll lyrics-plain">
                <AnimatePresence mode="wait">
                  <motion.div key={trackId}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: dur(0.5) }}
                  >
                    {plain.split("\n").map((line, i) => (
                      <p key={i} className="lyric-line plain">{line || "\u00A0"}</p>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────── FullTime karaoke view ─────────── */
function FullTimeDisplay({ synced, currentLineIndex, trackId, animSpeed = 1, songEnded = false }) {
  const curr = synced?.[currentLineIndex];
  const prev = synced?.[currentLineIndex - 1];
  const next = synced?.[currentLineIndex + 1];
  const next2 = synced?.[currentLineIndex + 2];
  const dur = (b) => b / animSpeed;
  const isIntro = currentLineIndex === -1 && !songEnded;

  return (
    <div className="fulltime-display">
      {/* Intro / outro overlay — fades the karaoke lines out and shows a status line */}
      <AnimatePresence>
        {(isIntro || songEnded) && (
          <motion.div
            key={isIntro ? "fulltime-intro" : "fulltime-outro"}
            initial={{ opacity: 0, scale: 0.92, filter: "blur(14px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
            transition={{ type: "spring", stiffness: 150 * animSpeed, damping: 24, mass: 1 }}
            style={{
              position: "absolute", inset: 0, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 12, zIndex: 2,
            }}
          >
            {isIntro ? (
              <div style={{ display: "flex", gap: 8 }}>
                {[0, 1, 2].map((i) => (
                  <motion.span key={i}
                    animate={{ opacity: [0.25, 1, 0.25], scale: [0.8, 1.15, 0.8] }}
                    transition={{ duration: dur(1.4), repeat: Infinity, delay: i * 0.22, ease: "easeInOut" }}
                    style={{ width: 9, height: 9, borderRadius: "50%", background: "rgba(255,255,255,0.6)" }}
                  />
                ))}
              </div>
            ) : (
              <motion.div
                animate={{ opacity: [0.5, 0.15, 0.5], scale: [1, 1.15, 1] }}
                transition={{ duration: dur(2.4), repeat: Infinity, ease: "easeInOut" }}
                style={{
                  width: 90, height: 90, borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 70%)",
                }}
              />
            )}
            <span style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", letterSpacing: "0.02em" }}>
              {isIntro ? "เพลงกำลังจะเริ่ม" : "จบเนื้อเพลง"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={{ opacity: isIntro || songEnded ? 0 : 1 }}
        transition={{ duration: dur(0.4), ease: "easeOut" }}
        style={{ display: "contents" }}
      >
      <motion.div
        key={`glow-${currentLineIndex}`}
        className="fulltime-glow"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: [0.4, 0.15], scale: [0.8, 1.6] }}
        transition={{ duration: dur(1.8), ease: "easeOut" }}
      />

      <div className="fulltime-bg-words">
        {synced?.slice(Math.max(0, currentLineIndex - 2), currentLineIndex + 5).map((line, i) => (
          <motion.span key={`bg-${trackId}-${currentLineIndex}-${i}`}
            className="bg-word"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.04 + i * 0.008 }}
            style={{ "--wi": i }}
          >{line.text}</motion.span>
        ))}
      </div>

      <AnimatePresence mode="popLayout">
        {prev && (
          <motion.p key={`prev-${currentLineIndex}`} className="fulltime-prev"
            initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -16, scale: 0.93, filter: "blur(6px)" }}
            transition={{ type: "spring", stiffness: 260 * animSpeed, damping: 28, mass: 0.7 }}
          >{prev.text}</motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence mode="popLayout">
        <motion.p
          key={`curr-${currentLineIndex}-${trackId}`}
          className="fulltime-current"
          initial={{ opacity: 0, scale: 0.82, y: 28, filter: "blur(12px)", letterSpacing: "0.1em" }}
          animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)", letterSpacing: "-0.03em" }}
          exit={{ opacity: 0, scale: 1.1, y: -28, filter: "blur(12px)" }}
          transition={{ type: "spring", stiffness: 300 * animSpeed, damping: 30, mass: 0.75 }}
        >
          {curr?.text || "\u00A0"}
        </motion.p>
      </AnimatePresence>

      <AnimatePresence mode="popLayout">
        {next && (
          <motion.p key={`next-${currentLineIndex}`} className="fulltime-next"
            initial={{ opacity: 0, y: -16, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 16, scale: 0.93, filter: "blur(6px)" }}
            transition={{ type: "spring", stiffness: 260 * animSpeed, damping: 28, mass: 0.7, delay: 0.02 }}
          >{next.text}</motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence mode="popLayout">
        {next2 && (
          <motion.p key={`next2-${currentLineIndex}`} className="fulltime-next2"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: dur(0.3), ease: "easeOut", delay: 0.04 }}
          >{next2.text}</motion.p>
        )}
      </AnimatePresence>

      <div className="fulltime-dots">
        {[0, 1, 2].map((i) => (
          <motion.div key={i} className="fulltime-dot"
            animate={{ scale: [1, 1.6, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: dur(1.4), repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
          />
        ))}
      </div>
      </motion.div>
    </div>
  );
}
