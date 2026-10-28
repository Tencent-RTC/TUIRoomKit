<template>
  <ToolbarButtonMobile
    v-if="sharerId"
    :label="active ? t('Whiteboard.ExitAnnotation') : t('Whiteboard.Annotation')"
    :active="active"
    :pressed="active"
    @click="toggleAnnotation"
  >
    <IconMark :size="20" />
  </ToolbarButtonMobile>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue';
import { useLoginState, useRoomParticipantState } from 'tuikit-atomicx-vue3/room';
import { IconMark, t } from '../../../base';
import ToolbarButtonMobile from '../../../layouts/ToolbarButtonMobile/ToolbarButtonMobile.vue';
import { useWhiteboardState } from '../WhiteboardState';
import '../Whiteboard.global.scss';

const emit = defineEmits<{
  /** Drawing on the share: the stage must hand its touches to the plugin and stay on the share page. */
  'update:active': [active: boolean];
}>();

// The phone only follows: drawing on someone else's board or screen share.
const { loginUserInfo } = useLoginState();
const { participantWithScreen } = useRoomParticipantState();
const { isAnnotationOn, isSessionActive, startAnnotation, stopAnnotation } = useWhiteboardState();

const sharerId = computed(() => {
  const userId = participantWithScreen.value?.userId ?? '';
  return userId !== loginUserInfo.value?.userId ? userId : '';
});
/** With a remote sharer present the state can only be following that sharer. */
const active = isAnnotationOn;

/* Raised while the start is still in flight, so the stage is already on the share page,
   playing it, by the time the SDK binds the annotation to that view. */
const drawing = computed(() => !!sharerId.value && isSessionActive.value);
watch(drawing, (value, previous) => {
  if (value || previous) {
    emit('update:active', value);
  }
}, { immediate: true });
onBeforeUnmount(() => {
  if (drawing.value) {
    emit('update:active', false);
  }
});

function toggleAnnotation() {
  const run = active.value ? stopAnnotation : startAnnotation;
  run().catch((error: unknown) => {
    console.warn('[AnnotationButtonMobile] toggle annotation failed:', error);
  });
}
</script>
