<!--
  * Name: Dialog
  * @param title String required [title of dialog]
  * @param modelValue Boolean [Controls whether a dialog is displayed]
  * @param modal Boolean [dialog Whether there is a mask layer]
  * @param width number | string [Width of the dialog]
  * @param beforeClose (done: DoneFn) => void; [dialog Callback function before closing]
  * @param closeOnClickModal Boolean [Whether or not clicking on the mask layer to close the dialog is supported]
  * @param showClose Boolean [Whether to show the close button]
  * @param appendToBody Boolean [Whether to append into body element]
  * Usage:
  * Use <Dialog title="there is title" v-model="showDialog"></Dialog> in template
  *
  * 名称: Dialog
  * @param title String required [dialog 的标题]
  * @param modelValue Boolean [控制是否显示 dialog]
  * @param modal Boolean [dialog 是否有遮罩层]
  * @param width number | string [dialog 的宽度]
  * @param beforeClose (done: DoneFn) => void; [dialog 关闭前的回调函数]
  * @param closeOnClickModal Boolean [是否支持点击遮罩层关闭 dialog]
  * @param showClose Boolean [是否展示关闭按钮]
  * @param appendToBody Boolean [是否插入到 body 中]
  * 使用方式：
  * 在 template 中使用 <Dialog title="there is title" v-model="showDialog"></Dialog>
-->
<template>
  <teleport to="body" :disabled="teleportDisable">
    <div
      v-if="visible"
      class="overlay-container"
      :class="[modal && 'overlay']"
      @click="handleOverlayClick"
    >
      <div class="tui-dialog-container" :style="drawerContainerStyle">
        <div class="tui-dialog-header">
          <div class="tui-dialog-header-title">
            {{ title }}
          </div>
          <template v-if="$slots.title">
            <slot name="title"></slot>
          </template>
          <div v-if="showClose" class="close">
            <svg-icon :size="16" @click="handleClose">
              <close-icon></close-icon>
            </svg-icon>
          </div>
        </div>
        <div class="tui-dialog-content">
          <slot></slot>
        </div>
        <template v-if="$slots.footer">
          <div class="tui-dialog-footer">
            <slot name="footer"></slot>
          </div>
        </template>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import SvgIcon from './SvgIcon.vue';
import CloseIcon from '../icons/CloseIcon.vue';
import { addSuffix } from '../../../utils/utils';

type DoneFn = () => void;
type BeforeCloseFn = (done: DoneFn) => void;

interface Props {
  title?: string,
  modelValue: boolean,
  modal?: boolean,
  width?: string | number,
  beforeClose?: BeforeCloseFn | null;
  closeOnClickModal?: boolean,
  showClose?: boolean,
  appendToBody?: boolean,
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  modelValue: false,
  modal: false,
  beforeClose: null,
  closeOnClickModal: true,
  width: undefined,
  showClose: true,
  appendToBody: false,
});

const emit = defineEmits(['update:modelValue', 'close']);

const teleportDisable = computed(() => !props.appendToBody);

const visible = ref(false);

const drawerContainerStyle = computed(() => {
  let style = '';
  if (props.width) {
    style += `--tui-dialog-width: ${addSuffix(props.width)}`;
  }
  return style;
});

watch(() => props.modelValue, (val) => {
  visible.value = val;
});

function doClose() {
  visible.value = false;
  emit('close');
  emit('update:modelValue', false);
}

function handleClose() {
  if (props.beforeClose) {
    props.beforeClose(doClose);
  } else {
    doClose();
  };
};

function handleOverlayClick(event: any) {
  if (!props.closeOnClickModal) {
    return;
  }
  if (event.target !== event.currentTarget) {
    return;
  }
  handleClose();
}

</script>

<style lang="scss" scoped>
.overlay-container {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 2007;
  &.overlay {
    background-color: rgba(15, 16, 20, 0.60);
  }
}

.tui-dialog-container {
  background-color: #FFFFFF;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  border-radius: 20px;
  width: var(--tui-dialog-width, 50%);
  overflow: hidden;
  box-shadow: 0px 3px 1px #E9F0FB;
  .tui-dialog-header {
    height: 64px;
    position: relative;
    display: flex;
    padding: 0 24px;
    align-items: center;
    box-shadow: 0px 1px 0px rgba(230, 236, 245, 0.80);
    .tui-dialog-header-title {
      font-size: 16px;
      font-style: normal;
      font-weight: 600;
      line-height: 24px;
      color: #0F1014;
    }
    .close {
      width: 32px;
      height: 32px;
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      right: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      color: #4F586B;
      cursor: pointer;
    }
  }
  .tui-dialog-content {
    flex: 1;
    padding: 20px 24px;
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    line-height: 22px;
    color: #4F586B;
  }
  .tui-dialog-footer {
    padding: 20px 30px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
