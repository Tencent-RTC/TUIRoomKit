import { useEffect } from 'react';
import { useUIKit } from '@tencentcloud/uikit-base-component-react';
import { BuiltinWidget } from '../../adapter/type';
import { useRoomSidePanel } from '../../hooks/useRoomSidePanel';
import { RoomChat } from './RoomChat';

/**
 * Registration-only component: mounts the chat panel into the side panel store.
 * Returns null — the actual trigger button (`ChatButton`) must be placed
 * separately in a stable location so that layout changes do not unmount this
 * registrar and inadvertently close the panel via the cleanup function.
 */
export function ChatRegistrar() {
  const { t } = useUIKit();
  const { registerSidePanel } = useRoomSidePanel();

  useEffect(
    () => registerSidePanel({
      id: BuiltinWidget.RoomChatWidget,
      title: () => t('Chat.Title'),
      keepAlive: true,
      render: ({ isActive, keepAlive }) => (
        <RoomChat isActive={isActive} keepAlive={keepAlive} />
      ),
    }),
    [registerSidePanel, t],
  );

  return null;
}
