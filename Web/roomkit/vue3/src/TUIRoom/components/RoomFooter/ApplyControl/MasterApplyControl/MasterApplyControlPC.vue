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
            <tui-button
              size="default"
              class="agree"
              @click="handleUserApply(item.userId, true)"
            >
              {{ t('Agree to the stage') }}
            </tui-button>
            <tui-button
              size="default"
              class="reject"
              @click="handleUserApply(item.userId, false)"
            >
              {{ t('Reject') }}
            </tui-button>
          </div>
        </div>
      </div>
      <div v-else class="apply-nobody">
        <svg-icon :icon="ApplyStageLabelIcon" />
        <span class="apply-text">{{
          t('Currently no member has applied to go on stage')
        }}</span>
      </div>
      <template #footer>
        <tui-button
          size="default"
          :disabled="applyToAnchorUserCount === 0"
          @click="handleAllUserApply(true)"
        >
          {{ t('Agree All') }}
        </tui-button>
        <tui-button
          class="cancel-button"
          size="default"
          :disabled="applyToAnchorUserCount === 0"
          @click="handleAllUserApply(false)"
        >
          {{ t('Reject All') }}
        </tui-button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import ApplyStageLabelIcon from '../../../common/icons/ApplyStageLabelIcon.vue';
import useMasterApplyControl from '../../../../hooks/useMasterApplyControl';
import Avatar from '../../../common/Avatar.vue';
import Dialog from '../../../common/base/Dialog';
import SvgIcon from '../../../common/base/SvgIcon.vue';
import TuiButton from '../../../common/base/Button.vue';
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
  color: #4f586b;
  background-color: #f0f3fa;
  border: 1px solid #f0f3fa;

  &:hover {
    background-color: #f0f3fa;
    border: 1px solid #f0f3fa;
  }
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
    border-bottom: 1px solid #f0f3fa;

    .apply-list-name,
    .apply-list-operate {
      width: calc(100% - 310px);
      font-size: 14px;
      font-style: normal;
      font-weight: 500;
      line-height: 22px;
      color: #4f586b;
    }
  }

  .apply-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 48px;
    margin-top: 8px;
    border-bottom: 1px solid #f0f3fa;

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
        color: #4f586b;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .control-container {
      display: flex;
      justify-content: space-between;

      .agree,
      .reject {
        padding: 2px 12px;
      }

      .reject {
        margin-left: 8px;
        color: #4f586b;
        background-color: #f0f3fa;
        border: 1px solid #f0f3fa;
      }
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
    color: #8f9ab2;
  }
}
</style>
