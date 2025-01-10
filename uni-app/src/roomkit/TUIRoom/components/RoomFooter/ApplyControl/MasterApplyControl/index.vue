<template>
  <div v-if="sidebarName === 'apply'" class="apply-control-container">
    <div v-if="applyToAnchorUserCount" class="apply-list-mobile">
      <div v-for="item in applyToAnchorList" :key="item.userId" class="apply-item">
        <div class="user-info">
          <Avatar class="avatar-url" :img-src="item.avatarUrl"></Avatar>
          <div class="stage-info">
            <text class="user-name" :title="item.userName || item.userId">{{ item.userName || item.userId }}</text>
            <text class="apply-tip">{{ t('Apply for the stage') }}</text>
          </div>
        </div>
        <div class="control-container">
          <div class="reject-button" @click="handleUserApply(item.userId, false)">
            <text class="reject-text">{{ t('Reject') }}</text>
          </div>
          <div class="agree-button" @click="handleUserApply(item.userId, true)">
            <text class="agree-text">{{ t('Agree') }}</text>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="apply-control-nobody">
      <svg-icon style="display: flex" :icon="ApplyStageLabelIcon"></svg-icon>
      <text class="apply-text">{{ t('Currently no member has applied to go on stage') }}</text>
    </div>
    <div class="apply-list-footer">
      <text class="action-button" :class="{ 'disabled': noUserApply }" @click="handleAllUserApply(false)">
        {{ t('Reject All') }}
      </text>
      <text class="action-button agree" :class="{ 'disabled': noUserApply }" @click="handleAllUserApply(true)">
        {{ t('Agree All') }}
      </text>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import Avatar from '../../../common/Avatar.vue';
import ApplyStageLabelIcon from '../../../../assets/icons/ApplyStageLabelIcon.png';
import useMasterApplyControl from './useMasterApplyControlHooks';
import SvgIcon from '../../../common/base/SvgIcon.vue';
import { useBasicStore } from '../../../../stores/basic';
const basicStore = useBasicStore();
const { sidebarName } = storeToRefs(basicStore);

const {
  t,
  applyToAnchorList,
  handleAllUserApply,
  handleUserApply,
  applyToAnchorUserCount,
  noUserApply,
} = useMasterApplyControl();

</script>

<style lang="scss" scoped>
.apply-control-container {
  position: relative;
  height: 1440rpx;
  display: flex;
  flex-direction: column;
  .apply-list-mobile {
    padding: 0 16px;
    margin-top: 4px;
    .apply-item {
      display: flex;
      align-items: center;
      width: 750rpx;
      height: 48px;
      padding-bottom: 8px;
      margin-top: 20px;
      flex-direction: row;
      position: relative;
      .user-info {
        display: flex;
        flex-direction: row;
        .avatar-url {
          width: 40px;
          height: 40px;
          border-radius: 50%;
        }
        .stage-info {
          display: flex;
          align-items: center;
          flex-direction: row;
          margin-left: 12px;
          .user-name {
            font-weight: 500;
            font-size: 16px;
            color: #4F586B;
            text-overflow: ellipsis;
            overflow: hidden;
          }
          .apply-tip {
            font-size: 14px;
            font-weight: 400;
            color: #4F586B;
          }
        }
      }
      .control-container {
        position: absolute;
        right: 30px;
        display: flex;
        flex-direction: row;
        .agree-button,
        .reject-button {
          width: 48px;
          height: 28px;
          border-radius: 6px;
          display: flex;
          justify-content: center;
          align-items: center;
          font-weight: 400;
          background-color:  #F0F3FA;
        }
        .agree-button {
          background-color: #1C66E5;
          margin-left: 8px;
        }
        .reject-text {
          color: #4F586B;
        }
        .agree-text {
          color: #FFFFFF;
        }
      }
      &::after {
        position: absolute;
        left: 14%;
        bottom: 0;
        width: 85%;
        height: 1px;
        background-color: #EAEFF8;
      }
    }
  }
  .apply-control-nobody {
		width: 750rpx;
		height: 200px;
		align-items: center;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
  }
  .apply-list-footer {
		width: 750rpx;
		align-items: center;
		position: absolute;
		justify-content: space-around;
		flex-direction: row;
		bottom: 60px;
    position: fixed;
    .action-button {
      width: 167px;
      background-color:  #F0F3FA;
      color: #4F586B;
      text-align: center;
      border-radius: 8px;
      padding: 10px 0;
    }
    .action-button.agree {
      margin-left: 10px;
      background-color: #1C66E5;
      color: #FFFFFF;
    }
  }
}
</style>
