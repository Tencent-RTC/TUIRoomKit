import { useState } from 'react';
import type { ComponentType, HTMLAttributes, ReactNode } from 'react';
import { TUIPopover, TUITooltip } from '../base';
import type { IconProps, Placement } from '../base';
import './TopbarButton.scss';

export interface TopbarButtonProps extends HTMLAttributes<HTMLDivElement> {
  /** Shown when the default slot is empty */
  icon?: ComponentType<IconProps>;
  /** Names the chip for the tooltip and for screen readers; icon-only chips need it */
  label?: string;
  active?: boolean;
  placement?: Placement;
  children?: ReactNode;
  dropdownSlot?: (scope: { close: () => void }) => ReactNode;
}

export function TopbarButton(props: TopbarButtonProps) {
  const {
    icon: Icon = undefined,
    label = '',
    active = false,
    placement = 'bottom-start',
    children,
    dropdownSlot,
    className,
    ...attrs
  } = props;

  const [open, setOpen] = useState(false);

  /** Handed to the dropdown slot so its own close affordance can dismiss the panel */
  function close() {
    setOpen(false);
  }

  return (
    // An open menu already names the button, and the tip would cover its first row.
    <TUITooltip content={label} disabled={!label || active || open} placement="bottom">
      <TUIPopover
        open={open}
        onUpdateOpen={setOpen}
        placement={placement}
        padded={false}
        disabled={dropdownSlot == null}
        contentSlot={dropdownSlot?.({ close })}
      >
        <div
          className={['topbar-button', active || open ? 'topbar-button-active' : '', className ?? ''].filter(Boolean).join(' ')}
          aria-label={label || undefined}
          {...attrs}
        >
          {children ?? (Icon ? <Icon size={15} /> : null)}
        </div>
      </TUIPopover>
    </TUITooltip>
  );
}

export default TopbarButton;
