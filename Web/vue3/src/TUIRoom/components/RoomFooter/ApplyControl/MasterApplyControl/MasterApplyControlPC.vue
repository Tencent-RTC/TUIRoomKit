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
        <div v-for="item in applyToAnchorList" :key="item.userId" class="apply-item">
          <div class="user-info">
            <Avatar class="avatar-url" :img-src="item.avatarUrl"></Avatar>
            <span class="user-name" :title="item.userName || item.userId">{{ item.userName || item.userId }}</span>
          </div>
          <div class="control-container">
            <tui-button size="default" class="agree" @click="handleUserApply(item.userId, true)">
              {{ t('Agree to the stage') }}
            </tui-button>
            <tui-button size="default" class="reject" @click="handleUserApply(item.userId, false)">
              {{ t('Reject') }}
            </tui-button>
          </div>
        </div>
      </div>
      <div v-else class="apply-nobody">
        <svg-icon :icon="ApplyStageLabelIcon"></svg-icon>
        <span class="apply-text">{{ t('Currently no member has applied to go on stage') }}</span>
      </div>
      <template #footer>
        <tui-button size="default" :disabled="noUserApply" @click="handleAllUserApply(true)"> {{ t('Agree All') }} </tui-button>
        <tui-button class="cancel-button" size="default" :disabled="noUserApply" @click="handleAllUserApply(false)">
          {{ t('Reject All') }}
        </tui-button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import ApplyStageLabelIcon from '../../../common/icons/ApplyStageLabelIcon.vue';
import useMasterApplyControl from './useMasterApplyControlHooks';
import Avatar from '../../../common/Avatar.vue';
import Dialog from '../../../common/base/Dialog';
import SvgIcon from '../../../common/base/SvgIcon.vue';
import TuiButton from '../../../common/base/Button.vue';

const {
  t,
  showApplyUserList,
  hideApplyList,
  applyToAnchorUserCount,
  applyToAnchorList,
  handleAllUserApply,
  handleUserApply,
  noUserApply,
} = useMasterApplyControl();
</script>

<style lang="scss" scoped>
.apply-control-container {
  position: relative;
}
.cancel-button {
  margin-left: 10px;
  background-color: #f0f3fa;
  border: 1px solid #f0f3fa;
  color: #4f586b;
  &:hover {
    background-color: #f0f3fa;
    border: 1px solid #f0f3fa;
  }
}
.apply-list {
  height: 290px;
  overflow: scroll;
  margin-top: 4px;
  &::-webkit-scrollbar {
    display: none;
  }
  .apply-list-title {
    display: flex;
    justify-content: space-between;
    border-bottom: 1px solid #f0f3fa;
    padding-bottom: 10px;
    .apply-list-name,
    .apply-list-operate {
      width: calc(100% - 310px);
      color: #4f586b;
      font-size: 14px;
      font-style: normal;
      font-weight: 500;
      line-height: 22px;
    }
  }
  .apply-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 48px;
    margin-top: 8px;
    border-bottom: 1px solid #f0f3fa;
    .user-info {
      width: calc(100% - 176px);
      height: 100%;
      display: flex;
      align-items: center;
      .avatar-url {
        width: 32px;
        height: 32px;
        border-radius: 50%;
      }
      .user-name {
        font-weight: 400;
        font-size: 14px;
        color: #4f586b;
        line-height: 22px;
        margin-left: 12px;
        max-width: 180px;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
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
        background-color: #f0f3fa;
        border: 1px solid #f0f3fa;
        color: #4f586b;
      }
    }
  }
}
.apply-nobody {
  height: 290px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  .apply-text {
    color: #8f9ab2;
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    line-height: 22px;
    margin-top: 10px;
  }
}
</style>
