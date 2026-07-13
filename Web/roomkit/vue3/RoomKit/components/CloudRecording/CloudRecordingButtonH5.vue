<template>
  <IconButtonH5
    :title="isRecording ? t('CloudRecording.RecordingLabel') : t('CloudRecording.RecordLabel')"
    @click="handleRecordingClick"
  >
    <IconRecording v-if="isRecording" size="24" />
    <IconStartRecord v-else size="24" />
  </IconButtonH5>
</template>

<script setup lang="ts">
import { IconRecording, IconStartRecord, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import IconButtonH5 from '../base/IconButtonH5.vue';
import { useCloudRecordingAction } from './useCloudRecordingAction';

const { t } = useUIKit();
const { isRecording, handleRecordingClick } = useCloudRecordingAction();
</script>
