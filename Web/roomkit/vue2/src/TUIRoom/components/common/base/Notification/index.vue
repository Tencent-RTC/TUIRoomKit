<template>
  <div v-show="visible" class="tui-notification">
    <div
      v-if="isMobile"
      class="tui-notification-container-mobile"
      :style="overlayContainerStyle"
    >
      <svg-icon :icon="ApplyTipsIcon" class="tui-notification-mobile-icon" />
      <span class="tui-notification-mobile-content">{{ message }}</span>
      <div class="tui-notification-mobile-check" @click="handleAgree">
        {{ confirmButtonText }}
      </div>
    </div>
    <div
      v-else
      class="tui-notification-container"
      :style="overlayContainerStyle"
    >
      <div class="tui-notification-header">
        <div class="tui-notification-title">{{ message }}</div>
        <div class="close">
          <svg-icon :size="16" :icon="CloseIcon" @click="handleClose" />
        </div>
      </div>
      <div class="tui-notification-footer">
        <tui-button size="default" @click="handleAgree">{{
          confirmButtonText
        }}</tui-button>
        <tui-button
          size="default"
          type="primary"
          class="button"
          @click="handleReject"
        >
          {{ cancelButtonText }}
        </tui-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted } from 'vue';
import TuiButton from '../Button.vue';
import SvgIcon from '../SvgIcon.vue';
import CloseIcon from '../../icons/CloseIcon.vue';
import useZIndex from '../../../../hooks/useZIndex';
import { isMobile } from '../../../../utils/environment';
import ApplyTipsIcon from '../../icons/ApplyTipsIcon.vue';

const visible = ref(false);
const overlayContainerStyle = ref({});
const { nextZIndex } = useZIndex();

type BeforeCloseFn = () => void;

interface Props {
  message: string;
  confirm?: BeforeCloseFn | null;
  cancel?: BeforeCloseFn | null;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  message: '',
  confirmButtonText: '',
  cancelButtonText: '',
  confirm: null,
  cancel: null,
});

const emit = defineEmits(['close']);

watch(visible, val => {
  if (val) {
    overlayContainerStyle.value = { zIndex: nextZIndex() };
  }
});

function handleClose() {
  visible.value = false;
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
    display: flex;
    width: 95%;
    height: 44px;
    margin: 0 10px;
    text-align: center;
    background-color: #fff;
    border-radius: 10px;

    .tui-notification-mobile-icon {
      padding: 0 10px;
      margin-left: 4px;
      color: #000;
    }

    .tui-notification-mobile-content {
      margin: 0 auto 0 4px;
      font-size: 15px;
      font-weight: 400;
      line-height: 44px;
      color: #181820;
    }

    .tui-notification-mobile-check {
      padding: 0 12px;
      margin: 6px 10px 6px 0;
      line-height: 34px;
      color: #fff;
      background-color: #1c66e5;
      border-radius: 10px;
    }
  }

  .tui-notification-container {
    position: fixed;
    top: 7%;
    right: 1%;
    display: flex;
    flex-direction: column;
    width: 400px;
    background-color: var(--white-color);
    filter: drop-shadow(0 0 1px rgba(5, 5, 5, 0.1))
      drop-shadow(0 3px 8px rgba(233, 240, 251, 0.5));
    border-radius: 20px;

    .tui-notification-header {
      position: relative;
      display: flex;
      align-items: center;
      height: 64px;
      padding: 0 24px;
      font-weight: 500;
      color: var(--title-color);

      .tui-notification-title {
        max-width: 300px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .close {
        position: absolute;
        top: 50%;
        right: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        color: #4f586b;
        cursor: pointer;
        transform: translateY(-50%);
      }
    }
  }

  .tui-notification-footer {
    display: flex;
    justify-content: flex-end;
    padding: 20px 30px;

    .button {
      margin-left: 12px;
    }
  }
}
</style>
