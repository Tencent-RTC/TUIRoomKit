import { useEffect, useState } from 'react';
import type { KeyboardEvent } from 'react';
import {
  Dialog,
  Input,
  Toast,
  useUIKit,
} from '@tencentcloud/uikit-base-component-react';
import { useRoomState } from 'tuikit-atomicx-react/room';

export interface PasswordDialogH5Props {
  visible: boolean;
  roomId: string;
  onCancel?: () => void;
  onError?: (error: unknown) => void;
  onSuccess?: (data: { roomId: string; password: string }) => void;
  onVisibleChange?: (visible: boolean) => void;
}

// Vue reference: PasswordDialogH5/index.vue (102 lines).
export function PasswordDialogH5({
  visible,
  roomId,
  onCancel,
  onError,
  onSuccess,
  onVisibleChange,
}: PasswordDialogH5Props) {
  const { t } = useUIKit();
  const { joinRoom } = useRoomState();

  const [password, setPassword] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!visible) {
      setPassword('');
    }
  }, [visible]);

  const closeDialog = () => {
    onVisibleChange?.(false);
  };

  const handleConfirm = async () => {
    if (!password) {
      Toast.error({ message: t('Room.EnterPassword') });
      return;
    }
    if (isJoining) {
      return;
    }
    try {
      setIsJoining(true);
      await joinRoom({ roomId, password });
      closeDialog();
      onSuccess?.({ roomId, password });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to join room with password:', error);
      onError?.(error);
    } finally {
      setIsJoining(false);
    }
  };

  const handleCancel = () => {
    if (isJoining) {
      return;
    }
    closeDialog();
    onCancel?.();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    }
  };

  return (
    <Dialog
      visible={visible}
      title={t('Room.EnterPassword')}
      showClose={false}
      modal={false}
      confirmDisabled={isJoining}
      cancelDisabled={isJoining}
      onConfirm={() => handleConfirm()}
      onCancel={handleCancel}
    >
      <Input
        type="number"
        value={password}
        showPassword
        maxLength={6}
        disabled={isJoining}
        placeholder={t('Room.EnterPasswordPlaceholder')}
        onChange={e => setPassword(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </Dialog>
  );
}
