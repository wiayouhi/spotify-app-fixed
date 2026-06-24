import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

async function findYouTubeVideo(track, artist) {
  const query = encodeURIComponent(`${track} ${artist} official music video`);
  try {
    const res = await fetch(
      `https://inv.nadeko.net/api/v1/search?q=${query}&type=video&fields=videoId,title&page=1`
    );
    if (!res.ok) throw new Error();
    const data = await res.json();
    return data?.[0]?.videoId || null;
  } catch {
    return null;
  }
}

export default function VideoBackground({ track }) {
  const [videoId, setVideoId] = useState(null);

  useEffect(() => {
    if (!track) {
      setVideoId(null);
      return;
    }
    let cancelled = false;
    setVideoId(null);
    findYouTubeVideo(track.name, track.artists).then((id) => {
      if (cancelled) return;
      if (id) setVideoId(id);
    });
    return () => { cancelled = true; };
  }, [track?.id]);

  return (
    <AnimatePresence>
      {videoId && (
        <motion.div
          key={videoId}
          className="video-bg-wrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        >
          <iframe
            className="video-bg-iframe"
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3`}
            allow="autoplay; encrypted-media"
            allowFullScreen
            title="Music Video"
          />
          <div className="video-bg-overlay" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
