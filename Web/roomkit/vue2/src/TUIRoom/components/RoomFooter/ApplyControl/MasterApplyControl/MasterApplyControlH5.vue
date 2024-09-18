<template>
  <div class="apply-control-container">
    <div v-if="applyToAnchorUserCount" class="apply-list-mobile">
      <div
        v-for="item in applyToAnchorList"
        :key="item.userId"
        class="apply-item"
      >
        <div class="user-info">
          <Avatar class="avatar-url" :img-src="item.avatarUrl" />
          <div class="stage-info">
            <span class="user-name" :title="roomService.getDisplayName(item)">{{
              roomService.getDisplayName(item)
            }}</span>
            <span class="apply-tip">{{ t('Apply for the stage') }}</span>
          </div>
        </div>
        <div class="control-container">
          <div
            class="reject-button"
            @click="handleUserApply(item.userId, false)"
          >
            {{ t('Reject') }}
          </div>
          <div class="agree-button" @click="handleUserApply(item.userId, true)">
            {{ t('Agree') }}
          </div>
        </div>
      </div>
    </div>
    <div v-else class="apply-control-nobody">
      <svg-icon :icon="ApplyStageLabelIcon" />
      <span class="apply-text">{{
        t('Currently no member has applied to go on stage')
      }}</span>
    </div>
    <div class="apply-list-footer">
      <div
        class="action-button"
        :class="{ disabled: applyToAnchorUserCount === 0 }"
        @click="handleAllUserApply(false)"
      >
        {{ t('Reject All') }}
      </div>
      <div
        class="action-button agree"
        :class="{ disabled: applyToAnchorUserCount === 0 }"
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
  display: flex;
  flex-direction: column;
  height: 100%;

  .apply-list-mobile {
    padding: 0 16px;
    margin-top: 4px;
    overflow: scroll;

    &::-webkit-scrollbar {
      display: none;
    }

    .apply-item {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 48px;
      padding-bottom: 8px;
      margin-top: 20px;

      .user-info {
        display: flex;
        align-items: center;
        width: calc(100% - 176px);
        height: 100%;

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
            max-width: 180px;
            overflow: hidden;
            font-size: 16px;
            font-weight: 500;
            color: var(--font-color-1);
            text-overflow: ellipsis;
            white-space: nowrap;
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
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 28px;
          font-weight: 400;
          color: var(--font-color-1);
          background-color: var(--background-color-3);
          border-radius: 6px;
        }

        .agree-button {
          margin-left: 8px;
          color: var(--white-color);
          background-color: var(--active-color-1);
        }
      }

      &::after {
        position: absolute;
        bottom: 0;
        left: 14%;
        width: 85%;
        height: 1px;
        content: '';
        background-color: var(--stroke-color-2);
      }
    }
  }

  .apply-control-nobody {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 290px;
  }

  .apply-list-footer {
    position: absolute;
    bottom: 0;
    display: flex;
    justify-content: space-around;
    width: 100%;

    .action-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 167px;
      height: 40px;
      color: var(--font-color-1);
      cursor: pointer;
      background-color: var(--background-color-3);
      border-radius: 8px;
    }

    .action-button.agree {
      margin-left: 10px;
      color: var(--white-color);
      background-color: var(--active-color-1);
    }

    .action-button.disabled {
      pointer-events: none;
      cursor: not-allowed;
      opacity: 0.4;
    }
  }
}
</style>
