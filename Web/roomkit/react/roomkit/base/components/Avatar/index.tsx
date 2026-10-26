import { useState } from 'react';
import type { HTMLAttributes } from 'react';
import './index.scss';

export interface TUIAvatarProps extends HTMLAttributes<HTMLSpanElement> {
  src?: string;
  alt?: string;
  size?: number;
}

export function TUIAvatar(props: TUIAvatarProps) {
  const { src = '', alt = '', size = 32, className, style, ...rest } = props;

  const [failed, setFailed] = useState(false);
  const [prevSrc, setPrevSrc] = useState(src);
  if (prevSrc !== src) {
    setPrevSrc(src);
    setFailed(false);
  }

  const imageSrc = !failed && src ? src : '';
  const initial = alt.trim().slice(0, 1).toUpperCase();

  function onError() {
    setFailed(true);
  }

  return (
    <span
      {...rest}
      className={['rk-avatar', className ?? ''].filter(Boolean).join(' ')}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        fontSize: `${Math.round(size * 0.4)}px`,
        ...style,
      }}
      aria-label={alt || undefined}
    >
      {imageSrc
        ? (
          <img
            src={imageSrc}
            alt={alt}
            onError={onError}
          />
        )
        : (
          <span>{initial}</span>
        )}
    </span>
  );
}

export default TUIAvatar;
