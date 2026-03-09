<template>
  <IconButton
    :title="!isRaised ? t('RaiseHands.Raise') : t('RaiseHands.Lower')"
    :class="['raise-hands-button', { 'raise-hands-button-raised': isRaised }]"
    @click="handleClick"
  >
    <IconApplyLittle v-if="!isRaised" :size="24" />
    <IconApplyActive v-else :size="24" />
  </IconButton>
</template>
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { useUIKit, IconApplyLittle, IconApplyActive, TUIToast } from '@tencentcloud/uikit-base-component-vue3';
import { RoomParticipantEvent, DeviceType, useRoomParticipantState, useLoginState, RoomUser } from 'tuikit-atomicx-vue3/room';
import IconButton from '../base/IconButton.vue';

const { t } = useUIKit();
const { loginUserInfo } = useLoginState();
const { requestToOpenDevice, cancelOpenDeviceRequest, subscribeEvent, unsubscribeEvent } = useRoomParticipantState();

const isRaised = ref(false);
const handleClick = async () => {
  const tempRaised = isRaised.value;
  try {
    if (isRaised.value) {
      await cancelOpenDeviceRequest({ device: DeviceType.Microphone });
      isRaised.value = false;
    } else {
      await requestToOpenDevice({ device: DeviceType.Microphone, timeout: 30 });
      isRaised.value = true;
    }
  } catch (_error) {
    isRaised.value = tempRaised;
    TUIToast.error({
      message: t('RaiseHands.Failed'),
    });
  }
};

const onDeviceRequestApproved = () => {
  isRaised.value = false;
};
const onDeviceRequestRejected = () => {
  isRaised.value = false;
};
const onDeviceRequestTimeout = () => {
  isRaised.value = false;
};
const onAudiencePromotedToParticipant = async ({ userInfo }: { userInfo: RoomUser }) => {
  if (userInfo.userId === loginUserInfo.value?.userId) {
    try {
      await cancelOpenDeviceRequest({ device: DeviceType.Microphone });
    } catch (_error) {
      console.warn('cancelOpenDeviceRequest failed', _error);
    }
  }
};

onMounted(() => {
  subscribeEvent(RoomParticipantEvent.onDeviceRequestApproved, onDeviceRequestApproved);
  subscribeEvent(RoomParticipantEvent.onDeviceRequestRejected, onDeviceRequestRejected);
  subscribeEvent(RoomParticipantEvent.onDeviceRequestTimeout, onDeviceRequestTimeout);
  subscribeEvent(RoomParticipantEvent.onAudiencePromotedToParticipant, onAudiencePromotedToParticipant);
});

onUnmounted(() => {
  unsubscribeEvent(RoomParticipantEvent.onDeviceRequestApproved, onDeviceRequestApproved);
  unsubscribeEvent(RoomParticipantEvent.onDeviceRequestRejected, onDeviceRequestRejected);
  unsubscribeEvent(RoomParticipantEvent.onDeviceRequestTimeout, onDeviceRequestTimeout);
  unsubscribeEvent(RoomParticipantEvent.onAudiencePromotedToParticipant, onAudiencePromotedToParticipant);
});
</script>

<style lang="scss" scoped>
.raise-hands-button-raised {
    color: var(--button-color-primary-active);
}
</style>
