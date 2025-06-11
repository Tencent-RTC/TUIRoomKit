<template>
  <div>
    <Dialog
      v-model="showApplyUserList"
      :title="t('Member Onstage Application')"
      :modal="true"
      :show-close="true"
      :close-on-click-modal="true"
      :before-close="hideApplyList"
      width="500px"
      :append-to-room-container="true"
    >
      <div v-if="applyToAnchorUserCount" class="apply-list">
        <div class="apply-list-title">
          <span class="apply-list-name">{{ t('Members') }}</span>
          <span class="apply-list-operate">{{ t('Operate') }}</span>
        </div>
        <div
          v-for="item in applyToAnchorList"
          :key="item.userId"
          class="apply-item"
        >
          <div class="user-info">
            <Avatar class="avatar-url" :img-src="item.avatarUrl" />
            <span class="user-name" :title="roomService.getDisplayName(item)">{{
              roomService.getDisplayName(item)
            }}</span>
          </div>
          <div class="control-container">
            <TUIButton
              @click="handleUserApply(item.userId, true)"
              type="primary"
              style="min-width: 88px"
            >
              {{ t('Agree to the stage') }}
            </TUIButton>
            <TUIButton
              @click="handleUserApply(item.userId, false)"
              type="primary"
              style="min-width: 88px"
            >
              {{ t('Reject') }}
            </TUIButton>
          </div>
        </div>
      </div>
      <div v-else class="apply-nobody">
        <IconApplyStageLabel size="48" />
        <span class="apply-text">{{
          t('Currently no member has applied to go on stage')
        }}</span>
      </div>
      <template #footer>
        <TUIButton
          :disabled="applyToAnchorUserCount === 0"
          @click="handleAllUserApply(true)"
          type="primary"
          style="min-width: 88px"
        >
          {{ t('Agree All') }}
        </TUIButton>
        <TUIButton
          :disabled="applyToAnchorUserCount === 0"
          @click="handleAllUserApply(false)"
          type="primary"
          style="min-width: 88px"
        >
          {{ t('Reject All') }}
        </TUIButton>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { IconApplyStageLabel } from '@tencentcloud/uikit-base-component-vue3';
import useMasterApplyControl from '../../../../hooks/useMasterApplyControl';
import Avatar from '../../../common/Avatar.vue';
import Dialog from '../../../common/base/Dialog';
import { TUIButton } from '@tencentcloud/uikit-base-component-vue3';
import { roomService } from '../../../../services';

const {
  t,
  showApplyUserList,
  hideApplyList,
  applyToAnchorUserCount,
  applyToAnchorList,
  handleAllUserApply,
  handleUserApply,
} = useMasterApplyControl();
</script>

<style lang="scss" scoped>
.apply-control-container {
  position: relative;
}

.cancel-button {
  margin-left: 10px;
}

.apply-list {
  height: 290px;
  margin-top: 4px;
  overflow: scroll;

  &::-webkit-scrollbar {
    display: none;
  }

  .apply-list-title {
    display: flex;
    justify-content: space-between;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--stroke-color-module);

    .apply-list-name,
    .apply-list-operate {
      width: calc(100% - 310px);
      font-size: 14px;
      font-style: normal;
      font-weight: 500;
      line-height: 22px;
      color: var(--text-color-secondary);
    }
  }

  .apply-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 48px;
    margin-top: 8px;
    border-bottom: 1px solid var(--stroke-color-module);

    .user-info {
      display: flex;
      align-items: center;
      width: calc(100% - 176px);
      height: 100%;

      .avatar-url {
        width: 32px;
        height: 32px;
        border-radius: 50%;
      }

      .user-name {
        max-width: 180px;
        margin-left: 12px;
        overflow: hidden;
        font-size: 14px;
        font-weight: 400;
        line-height: 22px;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--text-color-secondary);
      }
    }

    .control-container {
      display: flex;
      justify-content: space-between;
    }
  }
}

.apply-nobody {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 290px;

  .apply-text {
    margin-top: 10px;
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    line-height: 22px;
    color: var(--uikit-color-gray-light-5);
  }
}
</style>
