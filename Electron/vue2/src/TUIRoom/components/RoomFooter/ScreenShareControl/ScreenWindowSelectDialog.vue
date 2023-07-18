<template>
  <div>
    <Dialog
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
              @click.native="onSelect(item)"
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
              @click.native="onSelect(item)"
            />
          </ul>
        </div>
        <template #footer>
          <span>
            <el-button type="primary" @click.native="start">{{ t('Share') }}</el-button>
            <el-button type="default" @click.native="cancel">{{ t('Cancel') }}</el-button>
          </span>
        </template>
    </Dialog>
  </div> 
</template>
<script setup lang="ts">
import { ref, Ref } from 'vue';
import { ElMessage } from '../../../elementComp/index';
import { TRTCScreenCaptureSourceInfo } from '@tencentcloud/tuiroom-engine-electron';
import ScreenWindowPreviewer from './ScreenWindowPreviewer.vue';
import { MESSAGE_DURATION } from '../../../constants/message';
import { useI18n } from '../../../locales';
import Dialog from '../../../elementComp/Dialog/index.vue';

const { t } = useI18n();

interface Props {
  visible: boolean;
  screenList: Array<TRTCScreenCaptureSourceInfo>;
  windowList: Array<TRTCScreenCaptureSourceInfo>;
}

// eslint-disable-next-line vue/no-setup-props-destructure
const { visible, screenList, windowList } = defineProps<Props>();
const emit = defineEmits(['on-confirm', 'on-cancel']);

const selected: Ref<any> = ref(null);

function onSelect(screenInfo: any) {
  selected.value = screenInfo;
}

function start() {
  if (selected?.value) {
    emit('on-confirm', selected.value);
  } else {
    ElMessage({
      type: 'warning',
      message: t('Select a screen or window first'),
      duration: MESSAGE_DURATION.LONG,
    });
  }
}

function cancel() {
  emit('on-cancel');
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

}
  .selected {
    background-color: transparent;
    color: var(--selected-screen-share-dialog);
    box-shadow: 2px 2px 10px 2px $activeStateColor;
  }
</style>
