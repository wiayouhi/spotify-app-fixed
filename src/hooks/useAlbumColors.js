import { useEffect, useState } from "react";
import { extractColors } from "../utils/colorExtractor";

export function useAlbumColors(albumArtUrl) {
  const [colors, setColors] = useState({
    primary: "rgb(40, 40, 60)",
    secondary: "rgb(10, 10, 20)",
    palette: [],
  });

  useEffect(() => {
    if (!albumArtUrl) return;

    let cancelled = false;
    extractColors(albumArtUrl).then((result) => {
      if (!cancelled) setColors(result);
    });

    return () => {
      cancelled = true;
    };
  }, [albumArtUrl]);

  return colors;
}
