<template>
  <el-dialog
    :model-value="visible"
    title="选择屏幕/窗口"
    :modal="true"
    :append-to-body="true"
    :before-close="cancel"
    width="65%"
    custom-class="screen-window-select-dialog"
  >
    <div class="content">
      <h3>屏幕</h3>
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
      <h3>窗口</h3>
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
        <el-button type="primary" @click="start">开始分享</el-button>
        <el-button type="default" @click="cancel">取消</el-button>
      </span>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { ref, Ref } from 'vue';
import { ElMessage } from 'element-plus';
import { TRTCScreenCaptureSourceInfo } from '../../../tui-room-core';
import ScreenWindowPreviewer from './ScreenWindowPreviewer.vue';
import { MESSAGE_DURATION } from '../../../constants/message';

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
      message: '请选择要分享的屏幕或者窗口',
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
