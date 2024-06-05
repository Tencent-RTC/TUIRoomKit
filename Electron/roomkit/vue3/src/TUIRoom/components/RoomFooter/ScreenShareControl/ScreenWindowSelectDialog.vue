<template>
  <div>
    <Dialog
      :model-value="visible"
      :title="t('Select a screen or window first')"
      :modal="true"
      :append-to-body="true"
      width="960px"
      @close="onClose"
    >
      <div class="screen-content">
        <div class="screen-title">{{ t('Screen') }}</div>
        <ul class="screen-list">
          <screen-window-previewer
            v-for="item in screenList"
            :key="item.sourceId"
            :data="item"
            :class="{ selected: item.sourceId === selected?.sourceId }"
            :title="item.sourceName"
            @click.native="onSelect(item)"
          />
        </ul>
        <div class="window-title">{{ t('Window') }}</div>
        <ul class="window-list">
          <screen-window-previewer
            v-for="item in windowList"
            :key="item.sourceId"
            :data="item"
            :class="{ selected: item.sourceId === selected?.sourceId }"
            :title="item.sourceName"
            @click.native="onSelect(item)"
          />
        </ul>
      </div>
      <template #footer>
        <Button size="default" @click.native="start">{{ t('Share') }}</Button>
      </template>
    </Dialog>
  </div>
</template>
<script setup lang="ts">
import { ref, Ref, watch } from 'vue';
import TUIMessage from '../../common/base/Message';
import { TRTCScreenCaptureSourceInfo } from '@tencentcloud/tuiroom-engine-electron';
import ScreenWindowPreviewer from './ScreenWindowPreviewer.vue';
import { MESSAGE_DURATION } from '../../../constants/message';
import { useI18n } from '../../../locales';
import Dialog from '../../common/base/Dialog/index.vue';
import Button from '../../common/base/Button.vue';

const { t } = useI18n();

interface Props {
  visible: boolean;
  screenList: Array<TRTCScreenCaptureSourceInfo>;
  windowList: Array<TRTCScreenCaptureSourceInfo>;
}

const props = defineProps<Props>();
const emit = defineEmits(['on-confirm', 'on-close']);

const selected: Ref<any> = ref(null);

watch(
  () => props.screenList.length,
  () => {
    if (props.screenList.length > 0) {
      onSelect(props.screenList[0]);
    }
  },
);

function onSelect(screenInfo: any) {
  selected.value = screenInfo;
}

function start() {
  if (selected?.value) {
    emit('on-confirm', selected.value);
  } else {
    TUIMessage({
      type: 'warning',
      message: t('Select a screen or window first'),
      duration: MESSAGE_DURATION.LONG,
    });
  }
}

function onClose() {
  emit('on-close', props.visible);
}
</script>

<style lang="scss" scoped>
.screen-content {
  height: auto;
  min-width: 200px;
  max-height: 500px;
  overflow: auto;
  &::-webkit-scrollbar {
    display: none;
  }
}
.screen-list,
.window-list {
  list-style: none;
  margin: 0;
  padding: 0;
  margin-bottom: 0;
}

.screen-title,
.window-title {
  color: #4f586b;
  font-size: 14px;
  font-weight: 400;
  margin-bottom: 12px;
}
.selected {
  color: #fff;
  background-color: #1c66e5;
}
ul {
  padding-left: 0;
}
</style>
