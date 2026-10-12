export function pinOverlayMenu(menu: HTMLElement) {
  const host = menu.parentElement;
  if (!host) {
    return;
  }
  const anchor = (
    menu.classList.contains('sch-attendee-menu')
      ? host.querySelector('.sch-participant-input')
      : host.querySelector('button')
  ) as HTMLElement | null;
  if (!anchor) {
    return;
  }
  const rect = anchor.getBoundingClientRect();
  const isCal = menu.classList.contains('sch-cal');
  const width = isCal ? Math.min(292, window.innerWidth - 16) : rect.width;
  const left = Math.min(Math.max(8, rect.left), Math.max(8, window.innerWidth - width - 8));
  const gap = 4;
  let maxH = isCal ? 360 : 280;
  if (menu.classList.contains('sch-attendee-menu')) {
    maxH = 240;
  }
  const spaceBelow = window.innerHeight - rect.bottom - gap - 8;
  const spaceAbove = rect.top - gap - 8;
  const openUp = spaceBelow < 160 && spaceAbove > spaceBelow;
  const height = Math.max(80, Math.min(maxH, openUp ? spaceAbove : spaceBelow));
  applyMenuBox(menu, {
    position: 'fixed',
    left: `${left}px`,
    right: 'auto',
    width: `${width}px`,
    zIndex: '80',
    maxHeight: `${height}px`,
    visibility: 'visible',
    top: openUp ? 'auto' : `${rect.bottom + gap}px`,
    bottom: openUp ? `${window.innerHeight - rect.top + gap}px` : 'auto',
  });
}

function applyMenuBox(el: HTMLElement, next: Record<string, string>) {
  Object.keys(next).forEach((key) => {
    el.style.setProperty(cssProp(key), next[key]);
  });
}

function cssProp(camel: string) {
  return camel.replace(/[A-Z]/g, ch => `-${ch.toLowerCase()}`);
}

export function scrollActiveMenuItem(menu: HTMLElement | undefined | null) {
  const active = menu?.querySelector<HTMLElement>('.is-active');
  if (!menu || !active) {
    return;
  }
  const top = Math.max(0, active.offsetTop - menu.clientHeight / 2 + active.offsetHeight / 2);
  menu.scrollTo({ top });
}
