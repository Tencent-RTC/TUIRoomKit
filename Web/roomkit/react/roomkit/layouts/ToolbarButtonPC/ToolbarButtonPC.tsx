import { useState } from 'react';
import type { ButtonHTMLAttributes, ComponentType, ReactNode } from 'react';
import { IconChevronUp, IconUnSupport, TUIPopover, TUITooltip } from '../../base';
import type { IconProps } from '../../base';
import './ToolbarButtonPC.scss';

export interface ToolbarButtonPCProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'disabled'> {
  label: string;
  icon?: string | ComponentType<IconProps>;
  /** Accessible name for the menu trigger, defaults to the button label */
  menuLabel?: string;
  active?: boolean;
  danger?: boolean;
  leave?: boolean;
  disabled?: boolean;
  /** Looks unavailable but still emits click, so the handler can explain why */
  blocked?: boolean;
  loading?: boolean;
  notice?: boolean;
  showTooltip?: boolean;
  /**
   * Drops the caret and its popover while keeping the toggle. Overlays teleport to the
   * TUIOverlayHost of the opener document, so a host that renders this button in a second
   * document — the picture-in-picture mini window — would open the menu out of sight.
   */
  hideMenu?: boolean;
  onClick?: () => void;
  iconSlot?: ReactNode;
  menuSlot?: (scope: { close: () => void }) => ReactNode;
}

export function ToolbarButtonPC(props: ToolbarButtonPCProps) {
  const {
    label,
    icon = undefined,
    menuLabel = '',
    active = false,
    danger = false,
    leave = false,
    disabled = false,
    blocked = false,
    loading = false,
    notice = false,
    showTooltip = true,
    hideMenu = false,
    onClick,
    iconSlot,
    menuSlot,
    className,
    ...attrs
  } = props;

  const [menuOpen, setMenuOpen] = useState(false);
  const hasMenu = menuSlot != null && !hideMenu;

  /** Handed to the menu slot so an item that navigates elsewhere can dismiss the popover */
  function closeMenu() {
    setMenuOpen(false);
  }

  const Icon = icon && typeof icon !== 'string' ? icon : null;
  const defaultIcon = Icon ? <Icon size={22} /> : (icon as string | undefined);

  return (
    // An open menu already names the button, and the tip would cover its first row.
    <TUITooltip content={label} disabled={!showTooltip || menuOpen}>
      <div
        className={[
          'toolbar-button',
          active ? 'toolbar-button-active' : '',
          danger ? 'toolbar-button-danger' : '',
          leave ? 'toolbar-button-leave' : '',
          blocked ? 'toolbar-button-blocked' : '',
          hasMenu ? 'toolbar-button-with-menu' : '',
        ].filter(Boolean).join(' ')}
        data-menu-open={menuOpen ? '1' : undefined}
      >
        <button
          className={['toolbar-button-main', className ?? ''].filter(Boolean).join(' ')}
          type="button"
          aria-label={label}
          disabled={disabled || loading}
          {...attrs}
          onClick={() => onClick?.()}
        >
          <span className="toolbar-button-icon">
            {iconSlot ?? defaultIcon}
            {notice && <IconUnSupport className="toolbar-button-notice" size={12} />}
          </span>
        </button>

        {hasMenu && (
          <TUIPopover
            open={menuOpen}
            onUpdateOpen={setMenuOpen}
            placement="top"
            offset={12}
            padded={false}
            disabled={disabled}
            contentSlot={menuSlot({ close: closeMenu })}
          >
            <button
              className="toolbar-button-caret"
              type="button"
              aria-label={menuLabel || label}
              aria-expanded={menuOpen}
              disabled={disabled}
            >
              <IconChevronUp size={10} />
            </button>
          </TUIPopover>
        )}
      </div>
    </TUITooltip>
  );
}

export default ToolbarButtonPC;
