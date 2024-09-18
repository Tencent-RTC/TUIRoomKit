<template>
  <div :class="['invite-member', isMobile ? 'h5' : '']">
    <template v-for="(item, index) in scheduleInviteList">
      <div class="invite-member-container" v-if="item.isVisible" :key="index">
        <span class="invite-member-title">{{ t(item.title) }}</span>
        <span class="invite-member-content" :title="item.content">
          {{ item.content }}
        </span>
        <svg-icon
          class="copy"
          :icon="copyIcon"
          v-if="item.isShowCopyIcon"
          @click="onCopy(item.content)"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { defineProps, computed } from 'vue';
import useRoomInfo from '../../components/RoomHeader/RoomInfo/useRoomInfoHooks';
import copyIcon from '../common/icons/CopyIcon.vue';
import SvgIcon from '../common/base/SvgIcon.vue';
import { isMobile, isWeChat } from '../../utils/environment';
import { useI18n } from '../../locales';
import { getUrlWithRoomId } from '../../utils/utils';
const { t } = useI18n();

const props = defineProps<{
  scheduleInviteList?: {
    title: string;
    content: string;
    isShowCopyIcon: boolean;
    isVisible: boolean;
  }[];
  shareLinkData?: {
    roomId: string;
    [key: string]: unknown;
  };
}>();
const { onCopy } = useRoomInfo();

const scheduleInviteList = computed(() => {
  const roomId = props?.shareLinkData?.roomId;
  if (!roomId) return props.scheduleInviteList;
  return [
    {
      title: `${t('Room ID')}`,
      content: roomId,
      isShowCopyIcon: true,
      isVisible: true,
    },
    {
      title: `${t('Room Link')}`,
      content: getUrlWithRoomId(roomId),
      isShowCopyIcon: true,
      isVisible: !isWeChat,
    },
  ];
});
</script>
<style scoped lang="scss">
.invite-member {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 10px;

  .invite-member-container {
    display: flex;
    align-items: stretch;
    min-width: 400px;
    font-size: 14px;
    font-weight: 400;
    line-height: 20px;
    color: #4f586b;

    .invite-member-title {
      min-width: 80px;
      margin-right: 10px;
    }

    .invite-member-content {
      max-width: 360px;
      overflow: hidden;
      font-weight: 500;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .copy {
      width: 20px;
      height: 20px;
      margin-left: 8px;
      color: var(--active-color-1);
      cursor: pointer;
    }
  }
}

.invite-member.h5 {
  .invite-member-title {
    font-size: 14px;
    font-weight: 400;
    color: #8f9ab2;
  }

  .invite-member-container {
    min-width: auto;
  }
}
</style>
