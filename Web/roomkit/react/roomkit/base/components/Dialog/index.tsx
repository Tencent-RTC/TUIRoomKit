import { getPlatform } from '@tencentcloud/universal-api';
import { useRef } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useModality } from '../../headless/useModality';
import { useOverlay } from '../../headless/useOverlay';
import { IconClose } from '../../icons';
import TUIButton from '../Button/index';
import { useVisibleCenter } from '../../headless/useVisibleCenter';
import './index.scss';

export interface TUIDialogProps {
  open: boolean;
  title?: string;
  width?: number | string;
  closable?: boolean;
  closeOnOverlay?: boolean;
  closeOnEsc?: boolean;
  mask?: boolean;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger';
  confirmDisabled?: boolean;
  cancelDisabled?: boolean;
  confirmLoading?: boolean;
  headerSlot?: ReactNode;
  footerSlot?: ReactNode;
  children?: ReactNode;
  onUpdateOpen?: (open: boolean) => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export function TUIDialog(props: TUIDialogProps) {
  const {
    open,
    title,
    width,
    closable = true,
    closeOnOverlay = true,
    closeOnEsc = true,
    mask = true,
    confirmText = 'OK',
    cancelText = 'Cancel',
    confirmVariant = 'primary',
    confirmDisabled,
    cancelDisabled,
    confirmLoading,
    headerSlot,
    footerSlot,
    children,
    onUpdateOpen,
    onConfirm,
    onCancel: onCancelProp,
    onClose: onCloseProp,
  } = props;

  const panelRef = useRef<HTMLDivElement | null>(null);
  const { host, zIndex, ctx } = useOverlay({
    lane: 'dialog',
    open,
    closeOnOutside: false,
    closeOnEsc,
    modal: true,
    onClose: () => onClose(),
  }, [panelRef]);

  useModality(open, panelRef, ctx?.root);
  const { x, y } = useVisibleCenter(host, panelRef, open);

  const panelWidth = width == null
    ? '360px'
    : (typeof width === 'number' ? `${width}px` : width);
  const isH5 = getPlatform() !== 'pc';

  function onClose() {
    onUpdateOpen?.(false);
    onCloseProp?.();
  }

  function onCancel() {
    onCancelProp?.();
    onClose();
  }

  function onOverlay(event: MouseEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    if (!closeOnOverlay) return;
    onClose();
  }

  if (!host) return null;

  return createPortal(
    open
      ? (
        <div
          className={['rk-dialog-mask', !mask ? 'rk-dialog-mask-bare' : '', isH5 ? 'is-h5' : ''].filter(Boolean).join(' ')}
          style={{ zIndex }}
          onClick={onOverlay}
        >
          <div
            ref={panelRef}
            className={['rk-dialog', isH5 ? 'is-h5' : ''].filter(Boolean).join(' ')}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            style={{ width: panelWidth, left: `${x}px`, top: `${y}px` }}
          >
            <div className="rk-dialog-header">
              {headerSlot != null
                ? headerSlot
                : (
                  <>
                    <h3 className="rk-dialog-title">
                      {title}
                    </h3>
                    {closable && (
                      <button
                        className="rk-dialog-close"
                        type="button"
                        aria-label="Close"
                        onClick={onClose}
                      >
                        <IconClose />
                      </button>
                    )}
                  </>
                )}
            </div>
            <div className="rk-dialog-body">
              {children}
            </div>
            <div className="rk-dialog-footer">
              {footerSlot != null
                ? footerSlot
                : (
                  <>
                    {cancelText !== '' && (
                      <TUIButton
                        variant="secondary"
                        disabled={cancelDisabled}
                        onClick={onCancel}
                      >
                        {cancelText}
                      </TUIButton>
                    )}
                    {confirmText !== '' && (
                      <TUIButton
                        variant={confirmVariant}
                        disabled={confirmDisabled}
                        loading={confirmLoading}
                        onClick={() => onConfirm?.()}
                      >
                        {confirmText}
                      </TUIButton>
                    )}
                  </>
                )}
            </div>
          </div>
        </div>
      )
      : null,
    host,
  );
}

export default TUIDialog;
