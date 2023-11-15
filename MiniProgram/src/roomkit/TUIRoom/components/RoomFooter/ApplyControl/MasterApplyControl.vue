<template>
  <div class="apply-control-container">
    <icon-button
      ref="masterApplyControlRef"
      :title="t('Raise hand')"
      :icon="ApplyIcon"
      @click-icon="toggleApplySpeech"
    />
    <div v-if="hasApplyToAnchorUser && !showApplyUserList" class="attention master-attention">
      <svg-icon style="display: flex" :icon="ApplyIcon" class="apply-big-icon"></svg-icon>
      <span class="info">{{ applyToAnchorList.length }}</span>
    </div>
    <div
      v-if="showApplyUserList"
      ref="masterApplyListRef"
      :class="isMobile ? 'apply-list-container-h5':'apply-list-container'"
      :style="applyListContainerStyle"
    >
      <div class="title-container">
        <span class="title">{{ t('Apply to stage application') }}</span>
        <svg-icon style="display: flex" :icon="CloseIcon" class="close" @click="hideApplyList"></svg-icon>
      </div>
      <div class="apply-list">
        <div v-for="(item, index) in applyToAnchorList" :key="index" class="apply-item">
          <div class="user-info">
            <Avatar class="avatar-url" :img-src="item.avatarUrl"></Avatar>
            <span class="user-name" :title="item.userName || item.userId">{{ item.userName || item.userId }}</span>
          </div>
          <div class="control-container">
            <tui-button size="default" @click="handleUserApply(item.userId, true)">
              {{ t('Agree') }}
            </tui-button>
            <tui-button size="default" type="primary" @click="handleUserApply(item.userId, false)">
              {{ t('Reject') }}
            </tui-button>
          </div>
        </div>
      </div>
      <div class="apply-footer">
        <tui-button size="default" class="deny-all" @click="denyAllUserApply">{{ t('Reject All') }}</tui-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import Avatar from '../../common/Avatar.vue';
import IconButton from '../../common/base/IconButton.vue';
import ApplyIcon from '../../../assets/icons/ApplyIcon.svg';
import SvgIcon from '../../common/base/SvgIcon.vue';
import CloseIcon from '../../../assets/icons/CloseIcon.svg';
import TuiButton from '../../common/base/Button.vue';
import { useBasicStore } from '../../../stores/basic';
import { useRoomStore } from '../../../stores/room';
import { storeToRefs } from 'pinia';
import useMasterApplyControl from '../../../hooks/useMasterApplyControl';
import { useI18n } from '../../../locales';
import { isMobile }  from '../../../utils/useMediaValue';
import useZIndex from '../../../hooks/useZIndex';

const { t } = useI18n();
const { nextZIndex } = useZIndex();

const basicStore = useBasicStore();
const roomStore = useRoomStore();
const { handleUserApply, denyAllUserApply } = useMasterApplyControl();
const { showApplyUserList } = storeToRefs(basicStore);
const applyListContainerStyle = ref({});
const { isMaster, applyToAnchorList } = storeToRefs(roomStore);
const masterApplyControlRef = ref<InstanceType<typeof IconButton>>();
const masterApplyListRef = ref();

const hasApplyToAnchorUser = computed(() => applyToAnchorList.value.length > 0);


function toggleApplySpeech() {
  if (isMaster.value) {
    basicStore.setShowApplyUserList(!showApplyUserList.value);
  }
};

function hideApplyList() {
  basicStore.setShowApplyUserList(false);
}

watch(showApplyUserList, (val) => {
  if (val) {
    applyListContainerStyle.value = { zIndex: nextZIndex() };
  }
});

function handleDocumentClick(event: MouseEvent) {
  if (
    showApplyUserList.value
    && !masterApplyControlRef.value?.$el.contains(event.target)
    && !masterApplyListRef.value?.contains(event.target)
  ) {
    basicStore.setShowApplyUserList(false);
  }
}

onMounted(() => {
  document?.addEventListener('click', handleDocumentClick, true);
});

onBeforeUnmount(() => {
  document?.removeEventListener('click', handleDocumentClick, true);
});
</script>

<style lang="scss">
.apply-control-container {
  position: relative;
  .attention {
    background: rgba(19,124,253,0.96);
    box-shadow: 0 4px 16px 0 rgba(47,48,164,0.10);
    position: absolute;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    top: -6px;
    left: 50%;
    transform: translate(-50%, -100%);
    &::after {
      content: '';
      display: block;
      border: 4px solid transparent;
      border-top-color: rgba(19,124,253,0.96);
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
    }
  }
  .master-attention {
    display: flex;
    flex-direction: column;
    padding: 4px;
    .apply-big-icon {
      width: 40px;
      height: 40px;
      justify-content: center;
      color: #FFFFFF;
    }
    .info {
      color: #FFFFFF;
      font-size: 14px;
    }
  }
  .apply-list-container{
    width: 470px;
    height: 286px;
    background: var(--apply-list-container-bg-color);
    box-shadow: 0 1px 10px 0 rgba(0,0,0,0.30);
    position: absolute;
    top: -6px;
    left: 50%;
    transform: translate(-50%, -100%);
    padding: 12px 20px;
    color: #CFD4E6;
    .title-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      .title {
        font-weight: 500;
        font-size: 16px;
        color: var(--apply-list-container-color);
      }
      .close {
        cursor: pointer;
      }
    }
    .apply-list {
      height: 190px;
      overflow: scroll;
      margin-top: 4px;
      &::-webkit-scrollbar {
        display: none;
      }
      .apply-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 48px;
        margin-top: 8px;
        .user-info {
          width: calc(100% - 176px);
          height: 100%;
          display: flex;
          align-items: center;
          .avatar-url {
            width: 48px;
            height: 48px;
            border-radius: 50%;
          }
          .user-name {
            font-weight: 500;
            font-size: 14px;
            color: #7C85A6;
            line-height: 22px;
            margin-left: 9px;
            max-width: 180px;
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
          }
        }
        .control-container {
          display: flex;
          justify-content: space-between;
          button:last-child {
            margin-left: 10px;
          }
        }
      }
    }
    .apply-footer {
      margin-top: 8px;
      .deny-all {
        float: right;
      }
    }
  }
  .apply-list-container-h5 {
    width: 80vw;
    height: 30vh;
    border-radius: 13px;
    display: flex;
    flex-direction: column;
    background: var(--apply-list-container-bg-color);
    box-shadow: 0 1px 10px 0 rgba(0,0,0,0.30);
    position: absolute;
    top: -6px;
    left: 50%;
    transform: translate(-50%, -100%);
    padding: 12px 20px;
    color: #CFD4E6;
    .title-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      .title {
        font-weight: 500;
        font-size: 16px;
        color: var(--apply-list-container-color);
      }
      .close {
        cursor: pointer;
      }
    }
    .apply-list {
      max-height: 72%;
      overflow: scroll;
      margin-top: 4px;
      flex: 1;
      &::-webkit-scrollbar {
        display: none;
      }
      .apply-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 48px;
        margin-top: 8px;
        .user-info {
          height: 100%;
          display: flex;
          align-items: center;
          .avatar-url {
            width: 48px;
            height: 48px;
            border-radius: 50%;
          }
          .user-name {
            font-weight: 500;
            font-size: 14px;
            color: #7C85A6;
            line-height: 22px;
            margin-left: 9px;
            max-width: 180px;
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
          }
        }
        .control-container {
          display: flex;
          justify-content: space-between;
        }
      }
    }
    .apply-footer {
      height: 40px;
      margin-top: auto;
      .button {
        width: 100%;
        background: var(--apply-container-background-outline-h5);
        border-radius: 8px;
        padding: 0;
      }
      .deny-all {
        padding: 8px;
      }
    }
    .button {
      border-radius: 2px;
      padding: 4px 15px;
      font-family: PingFangSC-Regular;
      font-weight: 400;
      font-size: 14px;
      text-align: center;
      cursor: pointer;
    }
    .primary {
      background-image: linear-gradient(235deg, #1883FF 0%, #0062F5 100%);
      border-radius: 8px;
      color: var(--apply-container-primary);
      margin-right: 5px;
    }
    .outline {
      border-radius: 8px;
      background: var(--apply-container-background-outline-h5);
      border: none;
      color: var(--apply-container-outline-h5);
    }
  }
}
</style>
