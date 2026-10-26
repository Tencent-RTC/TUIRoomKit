import { createElement, useId, useMemo } from 'react';
import type { ComponentType, CSSProperties, HTMLAttributes, MouseEvent } from 'react';

export interface IconProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'color'> {
  size?: number | string;
  color?: string;
  spin?: boolean;
  onClick?: (e: MouseEvent<HTMLSpanElement>) => void;
}

/** SVG attributes arrive in markup spelling (`stroke-width`); React expects camelCase. */
function toSvgProps(extra?: Record<string, string>): Record<string, string> {
  if (!extra) {
    return {};
  }
  const result: Record<string, string> = {};
  Object.entries(extra).forEach(([key, value]) => {
    const name = key.includes('-') ? key.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()) : key;
    result[name] = value;
  });
  return result;
}

export function svgFromHtml(
  name: string,
  viewBox: string,
  html: string,
  extra?: Record<string, string>,
): ComponentType<IconProps> {
  const svgProps = toSvgProps(extra);

  function OfficialIcon(props: IconProps) {
    const { size, color, spin, className, style, ...rest } = props;
    const rawId = useId();
    const inner = useMemo(() => {
      const uid = `rk${name}${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
      return html
        .replace(/\bid="([^"]+)"/g, (_, id) => `id="${uid}-${id}"`)
        .replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${uid}-${id})`);
    }, [rawId]);

    const iconStyle: CSSProperties = {
      width: toCssSize(size),
      height: toCssSize(size),
      color,
      ...style,
    };

    return createElement(
      'span',
      {
        ...rest,
        className: ['rk-icon', spin ? 'rk-icon-spin' : '', className ?? ''].filter(Boolean).join(' '),
        style: iconStyle,
      },
      createElement('svg', {
        viewBox,
        'fill': 'none',
        'xmlns': 'http://www.w3.org/2000/svg',
        'aria-hidden': 'true',
        ...svgProps,
        'dangerouslySetInnerHTML': { __html: inner },
      }),
    );
  }
  OfficialIcon.displayName = name;
  return OfficialIcon;
}

function toCssSize(value?: number | string) {
  if (value == null) {
    return undefined;
  }
  return typeof value === 'number' ? `${value}px` : value;
}
