<template>
  <el-dialog
    :model-value="visible"
    :title="t('Select a screen or window first')"
    :modal="true"
    :append-to-body="true"
    :before-close="cancel"
    width="65%"
    custom-class="screen-window-select-dialog custom-element-class"
  >
    <div class="content">
      <h3>{{ t('Screen') }}</h3>
      <ul class="screen-list">
        <screen-window-previewer
          v-for="item in screenList"
          :key="item.sourceId"
          :data="item"
          :class="{ selected: item.sourceId === selected?.sourceId}"
          :title="item.sourceName"
          @click="onSelect(item)"
        />
      </ul>
      <h3>{{ t('Window') }}</h3>
      <ul class="window-list">
        <screen-window-previewer
          v-for="item in windowList"
          :key="item.sourceId"
          :data="item"
          :class="{ selected: item.sourceId === selected?.sourceId}"
          :title="item.sourceName"
          @click="onSelect(item)"
        />
      </ul>
    </div>
    <template #footer>
      <span>
        <el-button type="primary" @click="start">{{ t('Share') }}</el-button>
        <el-button type="default" @click="cancel">{{ t('Cancel') }}</el-button>
      </span>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { ref, Ref } from 'vue';
import { ElMessage } from 'element-plus';
import { TRTCScreenCaptureSourceInfo } from '@tencentcloud/tuiroom-engine-electron';
import ScreenWindowPreviewer from './ScreenWindowPreviewer.vue';
import { MESSAGE_DURATION } from '../../../constants/message';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface Props {
  visible: boolean;
  screenList: Array<TRTCScreenCaptureSourceInfo>;
  windowList: Array<TRTCScreenCaptureSourceInfo>;
}

// eslint-disable-next-line vue/no-setup-props-destructure
const { visible, screenList, windowList } = defineProps<Props>();

const emit = defineEmits(['onConfirm', 'onCancel']);

const selected: Ref<any> = ref(null);

function onSelect(screenInfo: any) {
  selected.value = screenInfo;
}

function start() {
  if (selected?.value) {
    emit('onConfirm', selected.value);
  } else {
    ElMessage({
      type: 'warning',
      message: t('Select a screen or window first'),
      duration: MESSAGE_DURATION.LONG,
    });
  }
}

function cancel() {
  emit('onCancel');
}
</script>

<style lang="scss">
@import '../../../assets/style/var.scss';
@import '../../../assets/style/element-custom.scss';

.screen-window-select-dialog {
  .el-dialog__body {
    padding: 0;
  }

  .content {
    height: auto;
    min-width: 200px;
    max-height: 500px;
    overflow: auto;
    padding: 0 20px;
  }
  .screen-list, .window-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .selected {
    background-color: $activeStateColor;
    color: $primaryColor;
  }
}
</style>
