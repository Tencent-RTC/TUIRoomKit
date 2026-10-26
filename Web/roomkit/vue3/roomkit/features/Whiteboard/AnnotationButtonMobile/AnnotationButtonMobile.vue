<template>
  <ToolbarButtonMobile
    v-if="sharerId"
    :label="t('Whiteboard.Annotation')"
    :active="active"
    :pressed="active"
    @click="toggle"
  >
    <IconMark :size="20" />
  </ToolbarButtonMobile>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useLoginState, useRoomParticipantState } from 'tuikit-atomicx-vue3/room';
import { IconMark, t } from '../../../base';
import { useWhiteboardState } from '../WhiteboardState';
import ToolbarButtonMobile from '../../../layouts/ToolbarButtonMobile/ToolbarButtonMobile.vue';

// The phone only follows: drawing on someone else's board or screen share.
const { loginUserInfo } = useLoginState();
const { participantWithScreen } = useRoomParticipantState();
const { isAnnotationOn, startAnnotation, stopAnnotation } = useWhiteboardState();

const sharerId = computed(() => {
  const userId = participantWithScreen.value?.userId ?? '';
  return userId !== loginUserInfo.value?.userId ? userId : '';
});
/** With a remote sharer present the state can only be following that sharer. */
const active = isAnnotationOn;

async function toggle() {
  await (active.value ? stopAnnotation() : startAnnotation());
}
</script>
