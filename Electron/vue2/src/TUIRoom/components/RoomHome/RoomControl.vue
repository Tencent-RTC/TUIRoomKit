<template>
  <div class="control-container">
    <div class="control-content">
      <img v-show="showLogo" class="logo" :src="logo">
      <!--
        *The roomId exists in the query
        *
        *query 中存在 roomId
      -->
      <div v-if="hasGivenRoomId" class="control-region">
        <span class="invite-title">{{ t('Join the room ?') }}</span>
        <span class="invite-info">{{ t('You are invited to room ') }}{{ `${givenRoomId} ` }}{{ t('Room') }}</span>
        <div class="button enter-given-room-button" @click="enterGivenRoom">
          <span class="title">{{ t('Join') }}</span>
        </div>
      </div>
      <!--
        *There is no roomId in the query
        *
        *query 中没有 roomId
      -->
      <div v-else class="control-region">
        <div
          type="primary"
          class="button create-room-button"
          @mouseenter="handleMouseEnter"
          @mouseleave="handleMouseLeave"
        >
          <div class="create-room">
            <svg-icon icon-name="add-icon"></svg-icon>
            <span class="title">{{ t('New Room') }}</span>
          </div>
          <div class="connect-region"></div>
          <div v-show="showCreateRoomOption" class="create-room-mode">
            <div class="create-room-option" @click="createRoom('FreeToSpeak')">
              <svg-icon class="icon" icon-name="free-speech-icon"></svg-icon>
              <span class="title">{{ t('Free Speech Room') }}</span>
            </div>
            <div class="create-room-option" @click="createRoom('SpeakAfterTakingSeat')">
              <svg-icon class="icon" icon-name="apply-speech-icon"></svg-icon>
              <span class="title">{{ t('Raise Hand Room') }}</span>
            </div>
          </div>
        </div>
        <div class="button join-room-button" type="primary" @click="enterRoom">
          <input v-model="roomId" class="input" :placeholder="t('Enter room ID')" maxlength="10" @click.stop="">
          <span class="title">{{ t('Join Room') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import logoCn from '../../assets/imgs/logo.png';
import logoEn from '../../assets/imgs/logo-en.png';
import SvgIcon from '../common/SvgIcon.vue';
import i18n from '../../../TUIRoom/locales/index';
import { useI18n } from '../../locales';

const props = withDefaults(defineProps<{
  showLogo?: boolean,
  givenRoomId: string | null,
}>(), {
  showLogo: true,
});

const hasGivenRoomId = computed(() => (typeof props.givenRoomId === 'string' && props.givenRoomId !== ''));

const logo = computed(() => (i18n.global.locale.value === 'zh-CN' ? logoCn : logoEn));
const roomId = ref('');
const showCreateRoomOption = ref(false);

const { t } = useI18n();

function handleMouseEnter() {
  showCreateRoomOption.value = true;
}

function handleMouseLeave() {
  showCreateRoomOption.value = false;
}

watch(roomId, (val) => {
  roomId.value = val.replace(/[^\d]/g, '');
});

const emit = defineEmits(['create-room', 'enter-room']);

function enterGivenRoom() {
  emit('enter-room', props.givenRoomId);
}

function createRoom(mode: string) {
  emit('create-room', mode);
}

function enterRoom() {
  if (!roomId.value) {
    return;
  }
  emit('enter-room', String(roomId.value));
}

</script>

<style lang="scss" scoped>
@import '../../assets/style/var.scss';
.control-container {
  width: 430px;
  height: 476px;
  border-radius: 20px;
  margin-left: 40px;
  position: relative;
  padding: 2px;
  background-image:linear-gradient(230deg, var(--background-image-color), rgba(61,143,255,0) 50%);
  box-shadow: 0px 12px 24px rgba(16, 34, 64, 0.05);
  .control-content {
    width: 100%;
    height: 100%;
    padding: 0 40px;
    border-radius: 20px;
    background: var(--control-content); 
  }
  .logo {
    position: absolute;
    top: 78px;
    left: 50%;
    width: 318px;
    transform: translate(-50%);
  }
  .control-region {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    justify-content: center;
  }
  .invite-title {
    display: inline-block;
    font-weight: 500;
    font-size: 28px;
    color: var(--invite-region);
    line-height: 34px;
    position: absolute;
    top: 183px;
  }
  .invite-info {
    display: inline-block;
    font-weight: 400;
    font-size: 20px;
    color: var(--invite-region);
    opacity: 0.6;
    line-height: 34px;
    position: absolute;
    top: 232px;
  }
  .button {
    width: 360px;
    height: 88px;
    background-image: linear-gradient(-45deg, #006EFF 0%, #0C59F2 100%);
    box-shadow: 0 2px 4px 0 rgba(0,0,0,0.20);
    border-radius: 8px;
    cursor: pointer;
    .title {
      font-size: 22px;
      color: #FFFFFF;
      line-height: 34px;
      margin-left: 9px;
    }
  }

  .enter-given-room-button {
    position: absolute;
    top: 338px;
    text-align: center;
    line-height: 88px;
  }

  .create-room-button {
    position: absolute;
    top: 214px;
    .create-room {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .create-room-mode {
      width: 100%;
      position: absolute;
      top: calc(100% + 4px);
      z-index: 10;
      background-color: var(--create-room-mode-color-bg);
      border: 1px solid rgba(255,255,255,0.10);
      box-shadow: 0 1px 10px 0 #091D3B;
      border-radius: 8px;
      padding: 4px 0;
    }
    .connect-region {
      width: 100%;
      height: 6px;
    }
    .create-room-option {
      height: 48px;
      padding-left: 32px;
      display: flex;
      justify-content: flex-start;
      align-items: center;
      &:hover {
        background-color: var(--create-room-option);
        .title {
          color: var(--create-room-option-color);
        }
        .icon {
          background-color: var(--create-room-option-icon-color);
        }
      }
      .icon {
        background-color: var(--create-room-option-icon);
      }
      .title {
        font-weight: 400;
        font-size: 14px;
        color: var(--title-color-font);
      }
    }
  }

  .join-room-button {
    position: absolute;
    bottom: 50px;
    padding: 2px;
    .input {
      width: 212px;
      height: 100%;
      background: var(--input-color);
      border-color: transparent;
      outline: none;
      border-radius: 8px;
      font-weight: 400;
      font-size: 22px;
      color: #676C80;
      line-height: 34px;
      padding: 0 20px;
    }
    .title {
      cursor: pointer;
      text-align: center;
      display: inline-block;
      width: 135px;
    }
  }
}
</style>
