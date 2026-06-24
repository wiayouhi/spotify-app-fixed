import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useCallback, useState } from "react";

// Custom smooth scroll with spring-like easing (much better than browser's native smooth)
function useSmoothScroll(containerRef) {
  const targetScrollTop = useRef(0);
  const currentScrollTop = useRef(0);
  const rafId = useRef(null);
  const isAnimating = useRef(false);

  const animateScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const diff = targetScrollTop.current - currentScrollTop.current;
    // Stop when close enough
    if (Math.abs(diff) < 0.5) {
      container.scrollTop = targetScrollTop.current;
      currentScrollTop.current = targetScrollTop.current;
      isAnimating.current = false;
      return;
    }

    // Spring-like lerp: 0.08 = slow & smooth, 0.14 = faster
    const step = diff * 0.085;
    currentScrollTop.current += step;
    container.scrollTop = currentScrollTop.current;

    rafId.current = requestAnimationFrame(animateScroll);
  }, [containerRef]);

  const scrollTo = useCallback((top) => {
    const container = containerRef.current;
    if (!container) return;
    targetScrollTop.current = Math.max(0, top);
    // If scrolling to top, sync currentScrollTop with actual position
    currentScrollTop.current = container.scrollTop;

    if (!isAnimating.current) {
      isAnimating.current = true;
      rafId.current = requestAnimationFrame(animateScroll);
    }
  }, [animateScroll, containerRef]);

  const stop = useCallback(() => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    isAnimating.current = false;
    const container = containerRef.current;
    if (container) currentScrollTop.current = container.scrollTop;
  }, [containerRef]);

  return { scrollTo, stop };
}

export default function LyricsView({ status, synced, plain, currentLineIndex, trackId }) {
  const containerRef = useRef(null);
  const lineRefs = useRef({});
  const isUserScrolling = useRef(false);
  const userScrollTimer = useRef(null);
  const lastAutoScrollLine = useRef(-1);
  const currentIndexRef = useRef(currentLineIndex);
  const [viewMode, setViewMode] = useState("lyrics");

  const { scrollTo, stop } = useSmoothScroll(containerRef);

  useEffect(() => { currentIndexRef.current = currentLineIndex; }, [currentLineIndex]);

  const scrollToLine = useCallback((index, retryCount = 0) => {
    if (isUserScrolling.current) return;
    if (index < 0) return;
    if (index === lastAutoScrollLine.current && retryCount === 0) return;

    const container = containerRef.current;
    const lineEl = lineRefs.current[index];

    if (!container || !lineEl) {
      if (retryCount < 20) {
        requestAnimationFrame(() => scrollToLine(index, retryCount + 1));
      }
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const lineRect = lineEl.getBoundingClientRect();
    const targetTop =
      container.scrollTop +
      (lineRect.top - containerRect.top) -
      container.clientHeight / 2 +
      lineRect.height / 2;

    scrollTo(targetTop);
    lastAutoScrollLine.current = index;
  }, [scrollTo]);

  useEffect(() => {
    if (currentLineIndex >= 0) scrollToLine(currentLineIndex);
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
    // Reset scroll position immediately (no animation) when track changes
    const container = containerRef.current;
    if (container) {
      container.scrollTop = 0;
    }
    scrollTo(0);
  }, [trackId, scrollTo]);

  const hasContent = status === "found" && (synced || plain);

  if (!hasContent) {
    const stateMap = {
      loading: { icon: null, text: "กำลังค้นหาเนื้อเพลง...", spinner: true },
      not_found: { icon: "🎵", text: "ไม่พบเนื้อเพลงสำหรับเพลงนี้" },
      error: { icon: "⚠️", text: "เกิดข้อผิดพลาดในการโหลดเนื้อเพลง" },
      idle: { icon: "🎧", text: "เปิดเพลงใน Spotify เพื่อเริ่มต้น" },
    };
    const state = stateMap[status] || stateMap.idle;

    return (
      <div className="lyrics-empty-state">
        <div className="lyrics-empty-orbs">
          {[...Array(5)].map((_, i) => (
            <motion.div key={i} className="empty-orb" style={{ "--orb-i": i }}
              animate={{ y: [0, -20, 0], opacity: [0.3, 0.7, 0.3], scale: [1, 1.15, 1] }}
              transition={{ duration: 2.5 + i * 0.4, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
            />
          ))}
        </div>
        {state.spinner ? (
          <motion.div className="lyrics-spinner"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        ) : (
          <motion.span className="empty-icon"
            animate={{ scale: [1, 1.08, 1], rotate: [0, -5, 5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >{state.icon}</motion.span>
        )}
        <motion.span className="empty-text"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        >{state.text}</motion.span>
      </div>
    );
  }

  return (
    <div className="lyrics-view-root">
      {/* Toggle button */}
      <motion.button
        className="lyrics-toggle-btn"
        onClick={() => setViewMode(v => v === "lyrics" ? "fulltime" : "lyrics")}
        whileHover={{ scale: 1.06, background: "rgba(255,255,255,0.18)" }}
        whileTap={{ scale: 0.93 }}
        title={viewMode === "lyrics" ? "โหมดเต็มจอ" : "โหมดเนื้อเพลง"}
      >
        <AnimatePresence mode="wait">
          <motion.span key={viewMode}
            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
            transition={{ duration: 0.25, ease: "backOut" }}
          >
            {viewMode === "lyrics" ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/>
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
            transition={{ duration: 0.2 }}
          >{viewMode === "lyrics" ? "เวลา" : "เนื้อเพลง"}</motion.span>
        </AnimatePresence>
      </motion.button>

      <AnimatePresence mode="wait">
        {viewMode === "fulltime" ? (
          <motion.div key="fulltime" className="lyrics-fulltime-view"
            initial={{ opacity: 0, scale: 0.88, filter: "blur(16px)", y: 30 }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)", y: 0 }}
            exit={{ opacity: 0, scale: 1.06, filter: "blur(16px)", y: -30 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <FullTimeDisplay synced={synced} currentLineIndex={currentLineIndex} trackId={trackId} />
          </motion.div>
        ) : (
          <motion.div key="lyrics" className="lyrics-mode-wrap"
            initial={{ opacity: 0, scale: 0.94, filter: "blur(10px)", y: 20 }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)", y: 0 }}
            exit={{ opacity: 0, scale: 0.94, filter: "blur(10px)", y: -20 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
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
                    transition={{ duration: 0.4 }}
                  >
                    <div className="lyrics-spacer" />
                    {synced.map((line, i) => {
                      const distance = Math.abs(i - currentLineIndex);
                      const isActive = i === currentLineIndex;
                      const isPast = i < currentLineIndex;

                      return (
                        <motion.p
                          key={`${trackId}-${i}`}
                          ref={(el) => { if (el) lineRefs.current[i] = el; }}
                          className={`lyric-line ${isActive ? "active" : ""}`}
                          initial={false}
                          animate={{
                            opacity: isActive
                              ? 1
                              : isPast
                                ? Math.max(0.12, 0.45 - distance * 0.1)
                                : Math.max(0.18, 0.55 - distance * 0.12),
                            scale: isActive ? 1.06 : Math.max(0.88, 1 - distance * 0.025),
                            filter: isActive
                              ? "blur(0px)"
                              : `blur(${Math.min(distance * 0.6, 3)}px)`,
                            x: isActive ? 0 : isPast ? -6 : 4,
                            color: isActive ? "#ffffff" : "rgba(255,255,255,0.45)",
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 90,
                            damping: 20,
                            mass: 1.1,
                            // stagger feel: lines further away animate slightly delayed
                            delay: distance > 3 ? 0 : 0,
                          }}
                          style={{ transformOrigin: "left center" }}
                        >
                          {line.text || "\u00A0"}
                        </motion.p>
                      );
                    })}
                    <div className="lyrics-spacer" />
                  </motion.div>
                </AnimatePresence>
              </div>
            ) : (
              <div className="lyrics-scroll lyrics-plain">
                <AnimatePresence mode="wait">
                  <motion.div key={trackId}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
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

function FullTimeDisplay({ synced, currentLineIndex, trackId }) {
  const curr = synced?.[currentLineIndex];
  const prev = synced?.[currentLineIndex - 1];
  const next = synced?.[currentLineIndex + 1];
  const next2 = synced?.[currentLineIndex + 2];

  return (
    <div className="fulltime-display">
      {/* Ambient glow that pulses with each line change */}
      <motion.div
        key={`glow-${currentLineIndex}`}
        className="fulltime-glow"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: [0.4, 0.15], scale: [0.8, 1.6] }}
        transition={{ duration: 1.8, ease: "easeOut" }}
      />

      {/* Background ghost lyrics */}
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

      {/* prev */}
      <AnimatePresence mode="popLayout">
        {prev && (
          <motion.p key={`prev-${currentLineIndex}`} className="fulltime-prev"
            initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -16, scale: 0.93, filter: "blur(6px)" }}
            transition={{ type: "spring", stiffness: 160, damping: 24 }}
          >{prev.text}</motion.p>
        )}
      </AnimatePresence>

      {/* CURRENT — big & glowing */}
      <AnimatePresence mode="popLayout">
        <motion.p
          key={`curr-${currentLineIndex}-${trackId}`}
          className="fulltime-current"
          initial={{ opacity: 0, scale: 0.82, y: 28, filter: "blur(12px)", letterSpacing: "0.1em" }}
          animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)", letterSpacing: "-0.03em" }}
          exit={{ opacity: 0, scale: 1.1, y: -28, filter: "blur(12px)" }}
          transition={{ type: "spring", stiffness: 200, damping: 26, mass: 0.9 }}
        >
          {curr?.text || "\u00A0"}
        </motion.p>
      </AnimatePresence>

      {/* next */}
      <AnimatePresence mode="popLayout">
        {next && (
          <motion.p key={`next-${currentLineIndex}`} className="fulltime-next"
            initial={{ opacity: 0, y: -16, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 16, scale: 0.93, filter: "blur(6px)" }}
            transition={{ type: "spring", stiffness: 160, damping: 24 }}
          >{next.text}</motion.p>
        )}
      </AnimatePresence>

      {/* next+1 dimmer */}
      <AnimatePresence mode="popLayout">
        {next2 && (
          <motion.p key={`next2-${currentLineIndex}`} className="fulltime-next2"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >{next2.text}</motion.p>
        )}
      </AnimatePresence>

      {/* Pulse dots */}
      <div className="fulltime-dots">
        {[0, 1, 2].map((i) => (
          <motion.div key={i} className="fulltime-dot"
            animate={{ scale: [1, 1.6, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
          />
        ))}
      </div>
    </div>
  );
}
