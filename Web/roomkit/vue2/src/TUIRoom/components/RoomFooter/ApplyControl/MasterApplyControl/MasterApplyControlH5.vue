<template>
  <div class="apply-control-container">
    <div v-if="applyToAnchorUserCount" class="apply-list-mobile">
      <div v-for="item in applyToAnchorList" :key="item.userId" class="apply-item">
        <div class="user-info">
          <Avatar class="avatar-url" :img-src="item.avatarUrl"></Avatar>
          <div class="stage-info">
            <span class="user-name" :title="roomService.getDisplayName(item)">{{ roomService.getDisplayName(item) }}</span>
            <span class="apply-tip">{{ t('Apply for the stage') }}</span>
          </div>
        </div>
        <div class="control-container">
          <div class="reject-button" @click="handleUserApply(item.userId, false)">{{ t('Reject') }}</div>
          <div class="agree-button" @click="handleUserApply(item.userId, true)">{{ t('Agree') }}</div>
        </div>
      </div>
    </div>
    <div v-else class="apply-control-nobody">
      <svg-icon :icon="ApplyStageLabelIcon"></svg-icon>
      <span class="apply-text">{{ t('Currently no member has applied to go on stage') }}</span>
    </div>
    <div class="apply-list-footer">
      <div
        class="action-button"
        :class="{ 'disabled': applyToAnchorUserCount === 0 }"
        @click="handleAllUserApply(false)"
      >
        {{ t('Reject All') }}
      </div>
      <div
        class="action-button agree"
        :class="{ 'disabled': applyToAnchorUserCount === 0 }"
        @click="handleAllUserApply(true)"
      >
        {{ t('Agree All') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Avatar from '../../../common/Avatar.vue';
import ApplyStageLabelIcon from '../../../common/icons/ApplyStageLabelIcon.vue';
import useMasterApplyControl from '../../../../hooks/useMasterApplyControl';
import SvgIcon from '../../../common/base/SvgIcon.vue';
import { roomService } from '../../../../services';

const {
  t,
  applyToAnchorList,
  handleAllUserApply,
  handleUserApply,
  applyToAnchorUserCount,
} = useMasterApplyControl();

</script>

<style lang="scss" scoped>
.apply-control-container {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  .apply-list-mobile {
    overflow: scroll;
    padding: 0 16px;
    margin-top: 4px;
    &::-webkit-scrollbar {
      display: none;
    }
    .apply-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 48px;
      padding-bottom: 8px;
      margin-top: 20px;
      position: relative;
      .user-info {
        width: calc(100% - 176px);
        height: 100%;
        display: flex;
        align-items: center;
        .avatar-url {
          width: 40px;
          height: 40px;
          border-radius: 50%;
        }
        .stage-info {
          display: flex;
          flex-direction: column;
          margin-left: 12px;
          .user-name {
            font-weight: 500;
            font-size: 16px;
            color: var(--font-color-1);
            max-width: 180px;
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
          }
          .apply-tip {
            font-size: 14px;
            font-weight: 400;
            color: var(--font-color-8);
          }
        }
      }
      .control-container {
        display: flex;
        .agree-button,
        .reject-button {
          width: 48px;
          height: 28px;
          border-radius: 6px;
          display: flex;
          justify-content: center;
          align-items: center;
          font-weight: 400;
          background-color: var(--background-color-3);
          color: var(--font-color-1);
        }
        .agree-button {
          background-color: var(--active-color-1);
          color: var(--white-color);
          margin-left: 8px;
        }
      }
      &::after {
        content: '';
        position: absolute;
        left: 14%;
        bottom: 0;
        width: 85%;
        height: 1px;
        background-color: var(--stroke-color-2);
      }
    }
  }
  .apply-control-nobody {
    height: 290px;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
  }
  .apply-list-footer {
    width: 100%;
    display: flex;
    justify-content: space-around;
    position: absolute;
    bottom: 0;
    .action-button {
      width: 167px;
      height: 40px;
      background-color: var(--background-color-3);
      color: var(--font-color-1);
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 8px;
      cursor: pointer;
    }
    .action-button.agree {
      margin-left: 10px;
      background-color: var(--active-color-1);
      color: var(--white-color);
    }
    .action-button.disabled {
      cursor: not-allowed;
      pointer-events: none;
      opacity: 0.4;
    }
  }
}
</style>
