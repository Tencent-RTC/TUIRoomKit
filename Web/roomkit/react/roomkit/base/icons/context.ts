import { createContext, createElement, useContext, useMemo } from 'react';
import type { ComponentType, ReactNode } from 'react';
import type { IconProps } from './createIcon';
import type { IconName, IconOverrides } from './names';

export const IconContext = createContext<IconOverrides | null>(null);

export function resolveIcon(
  name: IconName,
  fallback: ComponentType<IconProps>,
  overrides?: IconOverrides | null,
): ComponentType<IconProps> {
  return overrides?.[name] ?? fallback;
}

export function useIcon(name: IconName, fallback: ComponentType<IconProps>): ComponentType<IconProps> {
  const overrides = useContext(IconContext);
  return resolveIcon(name, fallback, overrides);
}

export interface ProvideIconsProps {
  /** Icon overrides merged over the ones provided by ancestors. */
  icons?: IconOverrides;
  children?: ReactNode;
}

/** Merge icon overrides into the current RoomKitProvider tree. */
export function ProvideIcons({ icons, children }: ProvideIconsProps) {
  const parent = useContext(IconContext);
  const merged = useMemo<IconOverrides>(() => ({
    ...(parent ?? {}),
    ...(icons ?? {}),
  }), [parent, icons]);
  return createElement(IconContext.Provider, { value: merged }, children);
}

export function defineIcon(
  componentName: string,
  name: IconName,
  official: ComponentType<IconProps>,
): ComponentType<IconProps> {
  function Facade(props: IconProps): ReturnType<typeof createElement> {
    const resolved = useIcon(name, official);
    const Comp: ComponentType<IconProps> = resolved === Facade ? official : resolved;
    return createElement(Comp, props);
  }
  Facade.displayName = componentName;
  return Facade;
}
