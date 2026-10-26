import { useRef } from 'react';
import type { MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { useModality } from '../../headless/useModality';
import { useOverlay } from '../../headless/useOverlay';
import './index.scss';

export interface ActionSheetAction {
  label: string;
  hint?: string;
  /** Ends the meeting for everyone. Painted in the danger color. */
  danger?: boolean;
  /** The dismiss row. Selecting it only closes the sheet. */
  cancel?: boolean;
  disabled?: boolean;
}

export interface TUIActionSheetProps {
  open: boolean;
  groups: ActionSheetAction[][];
  mask?: boolean;
  closeOnOverlay?: boolean;
  closeOnEsc?: boolean;
  /** Close after any row, including actions that are not cancel. */
  closeOnSelect?: boolean;
  onUpdateOpen?: (open: boolean) => void;
  onSelect?: (action: ActionSheetAction) => void;
  onClose?: () => void;
}

export function TUIActionSheet(props: TUIActionSheetProps) {
  const {
    open,
    groups,
    mask = true,
    closeOnOverlay = true,
    closeOnEsc = true,
    closeOnSelect = true,
    onUpdateOpen,
    onSelect,
    onClose,
  } = props;

  const panelRef = useRef<HTMLDivElement | null>(null);

  function requestClose() {
    onUpdateOpen?.(false);
    onClose?.();
  }

  const { host, zIndex, ctx } = useOverlay({
    lane: 'dialog',
    open,
    closeOnOutside: false,
    closeOnEsc,
    modal: true,
    onClose: requestClose,
  }, [panelRef]);

  useModality(open, panelRef, ctx?.root);

  function onOverlay(event: MouseEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    if (!closeOnOverlay) return;
    requestClose();
  }

  function selectAction(action: ActionSheetAction) {
    if (action.disabled) return;
    onSelect?.(action);
    if (action.cancel || closeOnSelect) {
      requestClose();
    }
  }

  if (!host || !open) return null;

  return createPortal(
    <div
      className={['rk-action-sheet-mask', mask ? '' : 'rk-action-sheet-mask-bare'].filter(Boolean).join(' ')}
      style={{ zIndex }}
      onClick={onOverlay}
    >
      <div
        ref={panelRef}
        className="rk-action-sheet"
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        {groups.map((group, groupIndex) => (
          <div key={groupIndex} className="rk-action-sheet-group">
            {group.map((action, index) => (
              <button
                key={`${groupIndex}-${index}`}
                className={[
                  'rk-action-sheet-item',
                  action.danger ? 'is-danger' : '',
                  action.cancel ? 'is-cancel' : '',
                ].filter(Boolean).join(' ')}
                type="button"
                disabled={action.disabled}
                onClick={() => selectAction(action)}
              >
                <span>{action.label}</span>
                {action.hint ? <small>{action.hint}</small> : null}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>,
    host,
  );
}

export default TUIActionSheet;
