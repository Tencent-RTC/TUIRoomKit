import { h, render, markRaw } from 'vue';
import { TUIToast, TOAST_TYPE, IconEditNameCard, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useRoomParticipantState } from 'tuikit-atomicx-vue3/room';
import ChangeNameCardDialog from './changeNameCardDialog.vue';
import type { RoomParticipant } from 'tuikit-atomicx-vue3';

export function calculateByteLength(str: string) {
  let byteLength = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code <= 0x7f) {
      byteLength += 1;
    } else if (code <= 0x7ff) {
      byteLength += 2;
    } else if (code <= 0xffff) {
      byteLength += 3;
    } else {
      byteLength += 4;
    }
  }
  return byteLength;
}

const { t } = useUIKit();
const { updateParticipantNameCard } = useRoomParticipantState();
export function useNameCardAction({ targetParticipant }: { targetParticipant: RoomParticipant }) {
  const nameCardCheck = (inputUserName: string) => {
    const result = calculateByteLength(inputUserName) <= 32;
    if (!result) {
      TUIToast({
        type: TOAST_TYPE.WARNING,
        message: t('ParticipantList.NameMaxLength'),
      });
    }
    return result;
  };

  async function handleChangeUserNameCard(inputUserName: string) {
    if (!nameCardCheck(inputUserName)) {
      return Promise.reject(new Error('The user name cannot exceed 32 characters'));
    }
    try {
      await updateParticipantNameCard({
        userId: targetParticipant.userId,
        nameCard: inputUserName,
      });
      TUIToast({
        type: TOAST_TYPE.SUCCESS,
        message: t('ParticipantList.NameChangeSuccess'),
        // duration: MESSAGE_DURATION.NORMAL,
      });
    } catch (error) {
      TUIToast({
        type: TOAST_TYPE.ERROR,
        message: t('ParticipantList.ChangeNameFailed'),
        duration: 5000,
      });
    }
    return Promise.resolve();
  }

  function renderChangeNameCardDialog() {
    const Component = ChangeNameCardDialog;
    const vNode = h(Component, {
      userInfo: targetParticipant,
      confirmFunction: handleChangeUserNameCard,
    });
    const div = document.createElement('div');
    render(vNode, div);
    // TODO: 处理 appendId 的设置问题
    document.getElementById('roomPage')?.appendChild(div);
  }

  return {
    key: 'changeUserNameCard',
    icon: markRaw(IconEditNameCard),
    label: t('ParticipantList.ChangeName'),
    handler: renderChangeNameCardDialog,
  };
}
