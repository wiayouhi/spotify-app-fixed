// Extracts dominant colors from an album art image using a canvas.
// Used to drive the animated blur/gradient background.

export function extractColors(imageUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const size = 50; // downscale for speed, color accuracy doesn't need full res
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, size, size);

        const { data } = ctx.getImageData(0, 0, size, size);
        const buckets = {};

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          if (a < 200) continue;

          // Bucket similar colors together to find dominant clusters.
          const key = `${Math.round(r / 24)}-${Math.round(g / 24)}-${Math.round(
            b / 24
          )}`;
          if (!buckets[key]) {
            buckets[key] = { r: 0, g: 0, b: 0, count: 0 };
          }
          buckets[key].r += r;
          buckets[key].g += g;
          buckets[key].b += b;
          buckets[key].count += 1;
        }

        const sorted = Object.values(buckets).sort((a, b) => b.count - a.count);

        const toRgb = (c) =>
          `rgb(${Math.round(c.r / c.count)}, ${Math.round(
            c.g / c.count
          )}, ${Math.round(c.b / c.count)})`;

        const toHsl = (c) => rgbToHsl(c.r / c.count, c.g / c.count, c.b / c.count);

        // Pick a vibrant primary + a darker secondary for contrast/depth.
        const vibrant = sorted.find((c) => {
          const hsl = toHsl(c);
          return hsl.s > 0.25 && hsl.l > 0.15 && hsl.l < 0.85;
        }) || sorted[0];

        const dark = sorted.find((c) => toHsl(c).l < 0.35) || sorted[sorted.length - 1] || sorted[0];

        resolve({
          primary: vibrant ? toRgb(vibrant) : "rgb(40,40,60)",
          secondary: dark ? toRgb(dark) : "rgb(10,10,20)",
          palette: sorted.slice(0, 5).map(toRgb),
        });
      } catch {
        resolve(fallbackColors());
      }
    };

    img.onerror = () => resolve(fallbackColors());
    img.src = imageUrl;
  });
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h, s, l };
}

function fallbackColors() {
  return {
    primary: "rgb(60, 50, 90)",
    secondary: "rgb(15, 15, 25)",
    palette: ["rgb(60,50,90)", "rgb(15,15,25)"],
  };
}
