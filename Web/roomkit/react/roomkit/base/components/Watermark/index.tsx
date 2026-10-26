import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { useUIConfig } from '../../uiConfig';
import { createWatermarkPattern } from './useCanvasPattern';
import type { WatermarkFont } from './useCanvasPattern';
import './index.scss';

export interface TUIWatermarkProps extends Omit<HTMLAttributes<HTMLDivElement>, 'content'> {
  content?: string | string[];
  image?: string;
  rotate?: number;
  gap?: [number, number];
  font?: WatermarkFont;
  children?: ReactNode;
}

const DEFAULT_GAP: [number, number] = [120, 80];

export function TUIWatermark(props: TUIWatermarkProps) {
  const {
    content,
    image,
    rotate = -22,
    gap = DEFAULT_GAP,
    font,
    children,
    className,
    ...rest
  } = props;

  const { uiConfig } = useUIConfig();

  const [pattern, setPattern] = useState('');
  const renderTokenRef = useRef(0);

  const fallbackColor = uiConfig.theme === 'dark'
    ? 'color-mix(in srgb, white 12%, transparent)'
    : 'color-mix(in srgb, var(--rk-text-tertiary) 28%, transparent)';

  const layerStyle: CSSProperties = {
    backgroundImage: pattern ? `url(${pattern})` : undefined,
  };

  // The async render reads the latest inputs through this ref.
  const inputsRef = useRef({ content, image, rotate, gap, font, fallbackColor });
  inputsRef.current = { content, image, rotate, gap, font, fallbackColor };

  async function render() {
    renderTokenRef.current += 1;
    const { current } = renderTokenRef;
    const inputs = inputsRef.current;
    const base = {
      content: inputs.content,
      rotate: inputs.rotate,
      gap: inputs.gap,
      font: inputs.font,
      fallbackColor: inputs.fallbackColor,
    };
    try {
      const next = await createWatermarkPattern({ ...base, image: inputs.image });
      if (current !== renderTokenRef.current) {
        return;
      }
      setPattern(next);
    } catch (error) {
      console.warn('[RoomKit] Watermark image failed, falling back to text.', error);
      try {
        const next = await createWatermarkPattern(base);
        if (current !== renderTokenRef.current) {
          return;
        }
        setPattern(next);
      } catch {
        if (current !== renderTokenRef.current) {
          return;
        }
        setPattern('');
      }
    }
  }

  const contentKey = JSON.stringify(content ?? null);
  useEffect(() => {
    render();
  }, [contentKey, image, rotate, gap[0], gap[1], font?.color, font?.fontSize, font?.fontFamily, fallbackColor]);

  return (
    <div {...rest} className={['rk-watermark', className ?? ''].filter(Boolean).join(' ')}>
      {children}
      <div className="rk-watermark-layer" style={layerStyle} />
    </div>
  );
}

export default TUIWatermark;
