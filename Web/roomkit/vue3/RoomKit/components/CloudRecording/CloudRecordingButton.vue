<template>
  <icon-button
    :title="isRecording ? t('CloudRecording.RecordingLabel') : t('CloudRecording.RecordLabel')"
    :is-active="isRecording"
    @click-icon="handleRecordingClick"
  >
    <IconRecording v-if="isRecording" size="24" />
    <IconStartRecord v-else size="24" />
  </icon-button>
</template>

<script setup lang="ts">
import { IconRecording, IconStartRecord, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import IconButton from '../base/IconButton.vue';
import { useCloudRecordingAction } from './useCloudRecordingAction';

const { t } = useUIKit();
const { isRecording, handleRecordingClick } = useCloudRecordingAction();
</script>
