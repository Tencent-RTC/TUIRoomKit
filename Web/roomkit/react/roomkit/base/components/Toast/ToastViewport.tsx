import { getPlatform } from '@tencentcloud/universal-api';
import { useContext, useSyncExternalStore } from 'react';
import { IconError, IconInfo, IconSuccess, IconWarning } from '../../icons';
import { OVERLAY_CONTEXT_KEY } from '../../tokens';
import { getToastStore } from './store';
import type { ToastItem, ToastType } from './store';
import './ToastViewport.scss';

const EMPTY: ToastItem[] = [];
const noopSubscribe = () => () => undefined;
const getEmpty = () => EMPTY;

function iconOf(type: ToastType) {
  if (type === 'success') return IconSuccess;
  if (type === 'warning') return IconWarning;
  if (type === 'error') return IconError;
  return IconInfo;
}

export function ToastViewport() {
  const ctx = useContext(OVERLAY_CONTEXT_KEY);
  const store = ctx ? getToastStore(ctx) : null;
  const items = useSyncExternalStore(
    store?.subscribe ?? noopSubscribe,
    store?.getItems ?? getEmpty,
    store?.getItems ?? getEmpty,
  );

  if (!items.length) {
    return null;
  }

  const isH5 = getPlatform() !== 'pc';

  return (
    <div className={['rk-toast-viewport', isH5 ? 'is-h5' : ''].filter(Boolean).join(' ')}>
      {items.map((item) => {
        const Icon = iconOf(item.type);
        return (
          <div
            key={item.id}
            className={['rk-toast', isH5 ? 'is-h5' : ''].filter(Boolean).join(' ')}
            data-type={item.type}
            role="status"
          >
            {!isH5 && item.showIcon && <Icon className="rk-toast-icon" size={18} />}
            <span className="rk-toast-text">{item.message}</span>
          </div>
        );
      })}
    </div>
  );
}

export default ToastViewport;
