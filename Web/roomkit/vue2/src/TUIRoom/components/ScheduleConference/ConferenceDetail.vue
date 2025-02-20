<template>
  <div :class="['detail-container', isMobile ? 'h5' : '']">
    <template v-for="(item, index) in props.scheduleRoomDetailList">
      <div v-if="item.isVisible" :class="['detail-content']" :key="index">
        <span class="detail-title">{{ t(item.title) }}</span>
        <span class="detail-info">
          <span class="detail-item" :title="item.content">{{
            item.content
          }}</span>
          <span
            v-if="item.isShowCopyIcon"
            class="copy-container"
            @click="onCopy(item.content)"
          >
            <svg-icon class="copy" :icon="copyIcon" />
          </span>
          <div
            v-if="item.isShowStatus"
            :class="[
              'detail-status',
              getStatusTextAndClass(item.status).className,
            ]"
          >
            {{ t(getStatusTextAndClass(item.status).text) }}
          </div>
        </span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
import useRoomInfo from '../../components/RoomHeader/RoomInfo/useRoomInfoHooks';
import copyIcon from '../common/icons/CopyIcon.vue';
import SvgIcon from '../common/base/SvgIcon.vue';
import { isMobile } from '../../utils/environment';
import {
  TUIConferenceStatus,
  TUIConferenceInfo,
} from '@tencentcloud/tuiroom-engine-js';
import { useI18n } from '../../locales';
const { t } = useI18n();

type StatusMapType = {
  [key: number]: {
    text: string;
    className: string;
  };
};

const statusMap: StatusMapType = {
  [TUIConferenceStatus.kConferenceStatusRunning]: {
    text: 'Ongoing',
    className: 'status-running',
  },
};
const props = defineProps<{
  conferenceInfo: TUIConferenceInfo;
  scheduleRoomDetailList: {
    title: string;
    content: string;
    isShowCopyIcon: boolean;
    status: TUIConferenceStatus | null;
    isShowStatus: boolean;
    isVisible: boolean;
  }[];
}>();
const { onCopy } = useRoomInfo();

const getStatusTextAndClass = (status?: TUIConferenceStatus | null) => {
  if (!status) return { text: '', className: '' };
  return statusMap[status] || { text: '', className: '' };
};
</script>

<style scoped lang="scss">
.detail-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-content {
  display: flex;
  align-items: stretch;
  min-width: 300px;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: var(--text-color-secondary);

  .detail-title {
    width: 84px;
    margin-right: 12px;
    color: var(--text-color-primary);
  }

  .detail-info {
    display: flex;
    flex: 1;
    flex-direction: row;
    align-items: center;
    overflow: auto;
    text-wrap: nowrap;
    white-space: nowrap;
  }

  .detail-item {
    max-width: 360px;
    overflow: hidden;
    font-weight: 500;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .copy-container {
    display: flex;
    margin-left: 6px;
    cursor: pointer;
    color: var(--text-color-link);

    .copy {
      width: 20px;
      height: 20px;
    }
  }

  .detail-status {
    margin-left: 10px;
  }
}

.h5.detail-container {
  padding: 16px 5%;

  .detail-content {
    font-size: 16px;
    font-weight: 400;
  }

  .detail-info {
    justify-content: flex-end;
    color: var(--text-color-primary);
  }

  .detail-item {
    font-weight: 400;
  }
}

.status-not-start {
  color: var(--text-color-button-disable);
}

.status-running {
  color: var(--text-color-link);
}

.status-finished {
  color: var(--uikit-color-gray-7);
}
</style>
