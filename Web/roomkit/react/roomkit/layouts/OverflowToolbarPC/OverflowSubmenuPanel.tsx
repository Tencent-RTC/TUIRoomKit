import { useEffect, useRef } from 'react';
import { IconChevron, IconInfo } from '../../base';
import type { OverflowSubmenu } from './overflowItem';
import './OverflowSubmenuPanel.scss';

export interface OverflowSubmenuPanelProps {
  submenu: OverflowSubmenu;
  onBack?: () => void;
  onClose?: () => void;
}

export function OverflowSubmenuPanel(props: OverflowSubmenuPanelProps) {
  const { submenu, onBack, onClose } = props;
  const backRef = useRef<HTMLButtonElement | null>(null);

  // Keyboard focus follows the drill so Escape and Tab stay inside the menu.
  useEffect(() => {
    backRef.current?.focus();
  }, []);

  function run(command?: string) {
    if (command && submenu.run(command)) {
      onClose?.();
    }
  }

  return (
    <div className="overflow-menu-sub">
      <button
        ref={backRef}
        className="overflow-menu-back"
        type="button"
        onClick={() => onBack?.()}
      >
        <IconChevron className="overflow-menu-back-icon" size={12} />
        <span>{submenu.title}</span>
      </button>
      <div className="overflow-menu-sub-split" />
      {submenu.note && (
        <div className="overflow-menu-sub-note" role="note">
          <IconInfo size={14} />
          <span>{submenu.note}</span>
        </div>
      )}
      {submenu.items.map((item, index) => {
        const key = item.command ?? `split-${index}`;
        if (item.divider) {
          return <div key={key} className="overflow-menu-sub-split" />;
        }
        const ItemIcon = item.icon;
        return (
          <button
            key={key}
            className={['overflow-menu-sub-item', item.checked ? 'is-checked' : ''].filter(Boolean).join(' ')}
            type="button"
            disabled={item.disabled}
            onClick={() => run(item.command)}
          >
            {ItemIcon && <ItemIcon size={14} />}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default OverflowSubmenuPanel;
