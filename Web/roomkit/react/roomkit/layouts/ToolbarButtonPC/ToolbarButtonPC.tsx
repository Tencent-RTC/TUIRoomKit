import { useContext, useEffect, useRef, useState } from 'react';
import type { ButtonHTMLAttributes, ComponentType, ReactNode } from 'react';
import { IconChevronUp, TUIPopover, TUITooltip } from '../../base';
import type { IconProps } from '../../base';
import { OVERFLOW_ITEM_KEY } from '../OverflowToolbarPC/overflowItem';
import type { OverflowBehavior } from '../OverflowToolbarPC/overflowItem';
import './ToolbarButtonPC.scss';

export interface ToolbarButtonPCProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'disabled'> {
  label: string;
  icon?: string | ComponentType<IconProps>;
  /**
   * What picking this control from the overflow more-menu does, once it has collapsed there.
   * Defaults to its own click; a control whose click opens a dropdown passes its real action.
   */
  overflowBehavior?: OverflowBehavior;
  /** Accessible name for the menu trigger, defaults to the button label */
  menuLabel?: string;
  active?: boolean;
  danger?: boolean;
  leave?: boolean;
  disabled?: boolean;
  /** Looks unavailable but still emits click, so the handler can explain why */
  blocked?: boolean;
  loading?: boolean;
  /**
   * The device-fault notice: a "!" round tag hung on the icon's top-right
   * corner. Sizing of the badge reads the `--rk-fault-badge*` custom
   * properties so scenes can scale it per chip.
   */
  notice?: boolean;
  showTooltip?: boolean;
  /**
   * Drops the caret and its popover while keeping the toggle. Overlays teleport to the
   * TUIOverlayHost of the opener document, so a host that renders this button in a second
   * document — the picture-in-picture mini window — would open the menu out of sight.
   */
  hideMenu?: boolean;
  /** Resting direction of the caret glyph; the menu-open state always points the opposite way. */
  caretDirection?: 'up' | 'down';
  onClick?: () => void;
  iconSlot?: ReactNode;
  menuSlot?: (scope: { close: () => void }) => ReactNode;
}

export function ToolbarButtonPC(props: ToolbarButtonPCProps) {
  const {
    label,
    icon = undefined,
    overflowBehavior,
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
    caretDirection = 'up',
    onClick,
    iconSlot,
    menuSlot,
    className,
    ...attrs
  } = props;

  const [menuOpen, setMenuOpen] = useState(false);
  const hasMenu = menuSlot != null && !hideMenu;
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Outside an overflow toolbar (H5, the mini window) there is nothing to register with.
  const overflowRegistry = useContext(OVERFLOW_ITEM_KEY);
  const overflowItem = {
    label,
    icon: typeof icon === 'string' ? undefined : icon,
    disabled: disabled || loading,
    behavior: overflowBehavior ?? { select: () => onClick?.() },
  };
  const overflowItemRef = useRef(overflowItem);
  overflowItemRef.current = overflowItem;

  useEffect(() => {
    if (!overflowRegistry) {
      return undefined;
    }
    return overflowRegistry.register(() => (rootRef.current
      ? { el: rootRef.current, ...overflowItemRef.current }
      : null));
  }, [overflowRegistry]);

  useEffect(() => {
    overflowRegistry?.refresh();
  }, [overflowRegistry, label, icon, disabled, loading, overflowBehavior]);

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
        ref={rootRef}
        className={[
          'toolbar-button',
          active ? 'toolbar-button-active' : '',
          danger ? 'toolbar-button-danger' : '',
          leave ? 'toolbar-button-leave' : '',
          blocked ? 'toolbar-button-blocked' : '',
          hasMenu ? 'toolbar-button-with-menu' : '',
        ].filter(Boolean).join(' ')}
        data-menu-open={menuOpen ? '1' : undefined}
        data-caret-direction={caretDirection}
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
            {notice && <span className="toolbar-button-fault-badge" aria-hidden="true">!</span>}
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
