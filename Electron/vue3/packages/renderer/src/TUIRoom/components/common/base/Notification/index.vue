<template>
  <teleport name="tui-notification-fade" :to="targetName" :disabled="teleportDisable">
    <div
      v-show="visible"
      :class="['tui-notification', type]" :style="overlayContainerStyle"
    >
      <div v-if="isMobile" class="tui-notification-container-mobile">
        <svg-icon :icon="ApplyTipsIcon" class="tui-notification-mobile-icon"></svg-icon>
        <span class="tui-notification-mobile-content">{{ message }}</span>
        <div v-tap="handleAgree" class="tui-notification-mobile-check">{{ confirmButtonText }}</div>
      </div>
      <div v-else class="tui-notification-container">
        <div class="tui-notification-header">
          <div class="tui-notification-title">{{ message }}</div>
          <div class="close">
            <svg-icon :size="16" :icon="CloseIcon" @click="handleClose"></svg-icon>
          </div>
        </div>
        <div class="tui-notification-footer">
          <tui-button size="default" @click="handleAgree">{{ confirmButtonText }}</tui-button>
          <tui-button size="default" type="primary" class="button" @click="handleReject">
            {{ cancelButtonText }}
          </tui-button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted, computed } from 'vue';
import TuiButton from '../Button.vue';
import SvgIcon from '../SvgIcon.vue';
import CloseIcon from '../../icons/CloseIcon.vue';
import useZIndex from '../../../../hooks/useZIndex';
import { isMobile } from '../../../../utils/environment';
import ApplyTipsIcon from '../../icons/ApplyTipsIcon.vue';
import vTap from '../../../../directives/vTap';

const visible = ref(false);
const teleportDisable = computed(() => !props.appendToBody);
const overlayContainerStyle = ref({});
const { nextZIndex } = useZIndex();

type BeforeCloseFn = () => void;

interface Props {
  type?: string;
  message: string;
  confirm?: BeforeCloseFn | null;
  cancel?: BeforeCloseFn | null;
  confirmButtonText?: string;
  cancelButtonText?: string;
  remove: Function;
  appendToBody?: boolean;
  appendToRoomContainer?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'success',
  message: '',
  confirmButtonText: '',
  cancelButtonText: '',
  confirm: null,
  cancel: null,
  remove: () => {},
  appendToBody: false,
  appendToRoomContainer: false,
});

const emit = defineEmits(['close']);

watch(visible, (val) => {
  if (val) {
    overlayContainerStyle.value = { zIndex: nextZIndex() };
    setTimeout(() => {
      handleClose();
    }, 5000);
  }
});

const targetName = computed(() => {
  if (props.appendToRoomContainer) {
    return '#roomContainer';
  }
  return 'body';
});
function handleClose() {
  visible.value = false;
  props.remove();
  emit('close');
}

function handleAgree() {
  if (props.confirm) {
    props.confirm();
  }
  handleClose();
}

function handleReject() {
  if (props.cancel) {
    props.cancel();
  }
  handleClose();
}

function onOpen() {
  visible.value = true;
}

onMounted(async () => {
  onOpen();
});
</script>

<style lang="scss" scoped>
.tui-notification {
  .tui-notification-container-mobile {
    position: fixed;
    top: 8%;
    width: 95%;
    margin: 0 10px;
    height: 44px;
    background-color: #fff;
    border-radius: 10px;
    display: flex;
    text-align: center;
    .tui-notification-mobile-icon {
      color: #000000;
      padding: 0 10px;
      margin-left: 4px;
    }
    .tui-notification-mobile-content {
      font-weight: 400;
      font-size: 15px;
      line-height: 44px;
      color: #181820;
      margin: 0 auto 0 4px;
    }
    .tui-notification-mobile-check {
      background-color: #1C66E5;
      color: #FFFFFF;
      border-radius: 10px;
      margin: 6px 10px 6px 0;
      padding: 0 12px;
      line-height: 34px;
    }
  }
  .tui-notification-container {
    width: 400px;
    background-color: var(--white-color);
    position: fixed;
    top: 7%;
    right: 1%;
    display: flex;
    flex-direction: column;
    border-radius: 20px;
    filter: drop-shadow(0px 0px 1px rgba(5, 5, 5, 0.1)) drop-shadow(0px 3px 8px rgba(233, 240, 251, 0.5));
    .tui-notification-header {
      height: 64px;
      position: relative;
      display: flex;
      padding: 0 24px;
      color: var(--title-color);
      font-weight: 500;
      align-items: center;
      .tui-notification-title {
        max-width: 300px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
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
        color: #4f586b;
        cursor: pointer;
      }
    }
  }
  .tui-notification-footer {
    padding: 20px 30px;
    display: flex;
    justify-content: flex-end;
    .button {
      margin-left: 12px;
    }
  }
}

</style>
