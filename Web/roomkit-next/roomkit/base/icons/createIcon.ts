import { defineComponent, h, mergeProps } from 'vue';
import type { PropType } from 'vue';

export const iconProps = {
  size: { type: [Number, String] as PropType<number | string>, default: undefined },
  color: { type: String, default: undefined },
  spin: { type: Boolean, default: false },
};

let iconUid = 0;

export function svgFromHtml(
  name: string,
  viewBox: string,
  html: string,
  extra?: Record<string, string>,
) {
  return defineComponent({
    name,
    inheritAttrs: false,
    props: iconProps,
    emits: ['click'],
    setup(props, { emit, attrs }) {
      iconUid += 1;
      const uid = `rk${name}${iconUid}`;
      const inner = html
        .replace(/\bid="([^"]+)"/g, (_, id) => `id="${uid}-${id}"`)
        .replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${uid}-${id})`);
      return () => h('span', mergeProps(attrs, {
        class: ['rk-icon', { 'rk-icon-spin': props.spin }],
        style: {
          width: toCssSize(props.size),
          height: toCssSize(props.size),
          color: props.color,
        },
        onClick: (e: MouseEvent) => emit('click', e),
      }), [
        h('svg', {
          viewBox,
          'fill': 'none',
          'xmlns': 'http://www.w3.org/2000/svg',
          'aria-hidden': 'true',
          ...extra,
          'innerHTML': inner,
        }),
      ]);
    },
  });
}

function toCssSize(value?: number | string) {
  if (value == null) {
    return undefined;
  }
  return typeof value === 'number' ? `${value}px` : value;
}
