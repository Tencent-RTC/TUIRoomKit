import { useContext, useEffect, useState, useSyncExternalStore } from 'react';
import { useI18n } from '../../i18n';
import { OVERLAY_CONTEXT_KEY } from '../../tokens';
import { getMessageBoxStore } from './store';
import type { MessageBoxItem } from './store';
import TUIDialog from '../Dialog/index';

const EMPTY: MessageBoxItem[] = [];
const noopSubscribe = () => () => undefined;
const getEmpty = () => EMPTY;

export function MessageBoxHost() {
  const { t } = useI18n();
  const ctx = useContext(OVERLAY_CONTEXT_KEY);
  const store = ctx ? getMessageBoxStore(ctx) : null;
  const items = useSyncExternalStore(
    store?.subscribe ?? noopSubscribe,
    store?.getItems ?? getEmpty,
    store?.getItems ?? getEmpty,
  );
  const [openMap, setOpenMap] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setOpenMap((prev) => {
      let next = prev;
      items.forEach((item) => {
        if (next[item.id] === undefined) {
          next = { ...next, [item.id]: true };
        }
      });
      return next;
    });
  }, [items]);

  function handleClose(id: number, action: 'confirm' | 'cancel' | 'close') {
    setOpenMap(prev => ({ ...prev, [id]: false }));
    setTimeout(() => store?.close(id, action), 200);
  }

  return (
    <>
      {items.map(item => (
        <TUIDialog
          key={item.id}
          open={openMap[item.id] !== false}
          title={item.options.title}
          closable={item.options.closable === true}
          closeOnOverlay={item.options.closeOnOverlay !== false}
          closeOnEsc={item.options.closeOnEsc !== false}
          confirmText={item.options.confirmText ?? t('Confirm')}
          confirmVariant={item.mode === 'danger' ? 'danger' : 'primary'}
          cancelText={item.mode === 'alert' ? '' : (item.options.cancelText ?? t('Cancel'))}
          onUpdateOpen={(open: boolean) => {
            if (!open) handleClose(item.id, 'close');
          }}
          onConfirm={() => handleClose(item.id, 'confirm')}
          onCancel={() => handleClose(item.id, 'cancel')}
          onClose={() => handleClose(item.id, 'close')}
        >
          {item.options.message}
        </TUIDialog>
      ))}
    </>
  );
}

export default MessageBoxHost;
