export interface WatermarkFont {
  color?: string;
  fontSize?: number;
  fontFamily?: string;
}

export async function createWatermarkPattern(options: {
  content?: string | string[];
  image?: string;
  rotate?: number;
  gap?: [number, number];
  font?: WatermarkFont;
  fallbackColor: string;
}) {
  const lines = Array.isArray(options.content) ? options.content : [options.content || ''];
  const gap = options.gap ?? [120, 80];
  const rotate = options.rotate ?? -22;
  const fontSize = options.font?.fontSize ?? 14;
  const fontFamily = options.font?.fontFamily ?? 'PingFang SC, sans-serif';
  const color = options.font?.color ?? options.fallbackColor;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const ratio = window.devicePixelRatio || 1;
  const tileW = 180 + gap[0];
  const tileH = 80 + gap[1];
  canvas.width = tileW * ratio;
  canvas.height = tileH * ratio;
  ctx.scale(ratio, ratio);
  ctx.translate(tileW / 2, tileH / 2);
  ctx.rotate((rotate * Math.PI) / 180);
  ctx.fillStyle = color;
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (options.image) {
    const img = await loadImage(options.image);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
  } else {
    lines.forEach((line, index) => {
      ctx.fillText(line, 0, (index - (lines.length - 1) / 2) * (fontSize + 4));
    });
  }

  try {
    return canvas.toDataURL();
  } catch {
    throw new Error('[RoomKit] Watermark canvas is tainted.');
  }
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`[RoomKit] Watermark image failed to load: ${src}`));
    img.src = src;
  });
}
