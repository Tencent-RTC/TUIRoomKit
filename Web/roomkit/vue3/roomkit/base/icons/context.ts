import { computed, defineComponent, h, inject, mergeProps, provide, unref } from 'vue';
import type { Component, ComputedRef, InjectionKey, MaybeRef, VNode } from 'vue';
import { iconProps } from './createIcon';
import type { IconName, IconOverrides } from './names';

export const ICON_CONTEXT_KEY: InjectionKey<ComputedRef<IconOverrides>> = Symbol('rk-icons');

export function resolveIcon(
  name: IconName,
  fallback: Component,
  overrides?: IconOverrides,
): Component {
  return overrides?.[name] ?? fallback;
}

export function useIcon(name: IconName, fallback: Component): ComputedRef<Component> {
  const overrides = inject(ICON_CONTEXT_KEY, null);
  return computed(() => resolveIcon(name, fallback, overrides?.value));
}

/** Merge icon overrides into the current RoomKitProvider tree. Call from setup. */
export function provideIcons(icons: MaybeRef<IconOverrides | undefined>) {
  const parent = inject(ICON_CONTEXT_KEY, null);
  const merged = computed<IconOverrides>(() => ({
    ...(parent?.value ?? {}),
    ...(unref(icons) ?? {}),
  }));
  provide(ICON_CONTEXT_KEY, merged);
  return merged;
}

export function defineIcon(componentName: string, name: IconName, official: Component): Component {
  const facade: Component = defineComponent({
    name: componentName,
    inheritAttrs: false,
    props: iconProps,
    setup(props, { attrs, slots }) {
      const Resolved = useIcon(name, official);
      return (): VNode => {
        const Comp: Component = Resolved.value === facade ? official : Resolved.value;
        return h(Comp, mergeProps(attrs, {
          size: props.size,
          color: props.color,
          spin: props.spin,
        }), slots);
      };
    },
  });
  return facade;
}
