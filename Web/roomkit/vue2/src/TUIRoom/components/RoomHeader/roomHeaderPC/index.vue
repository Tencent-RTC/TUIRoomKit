<template>
  <div class="header-container">
    <div class="left-container">
      <switch-theme class="header-item" />
      <layout-control class="header-item" />
      <network-info class="header-item" />
    </div>
    <div class="center-container">
      <room-info class="header-item" />
    </div>
    <div class="right-container">
      <language v-show="showHeaderInfo" class="header-item" />
      <user-info
        v-show="showHeaderInfo"
        class="header-item"
        :user-id="userId"
        :user-name="userName"
        :avatar-url="avatarUrl"
        @log-out="$emit('log-out')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import UserInfo from '../UserInfo';
import Language from '../../common/Language.vue';
import SwitchTheme from '../../common/SwitchTheme.vue';
import RoomInfo from '../RoomInfo';
import LayoutControl from './LayoutControl.vue';
import NetworkInfo from './NetworkInfo.vue';
import { useBasicStore } from '../../../stores/basic';
import { storeToRefs } from 'pinia';

const basicStore = useBasicStore();

const { userId, userName, avatarUrl } = storeToRefs(basicStore);

const showHeaderInfo = inject('showHeaderInfo', true);

defineEmits(['log-out']);
</script>

<style lang="scss" scoped>
.header-container {
  position: relative;
  display: flex;
  justify-content: space-between;
  width: 100%;
  height: 100%;
  padding-right: 24px;
  padding-left: 9px;

  .left-container {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    height: 100%;
    padding-left: 24px;

    .header-item:not(:first-child) {
      margin-left: 1rem;
    }
  }

  .center-container {
    position: absolute;
    left: 50%;
    display: flex;
    align-items: center;
    height: 100%;
    transform: translateX(-50%);
  }

  .right-container {
    position: absolute;
    top: 0;
    right: 0;
    display: flex;
    align-items: center;
    float: right;
    height: 100%;
    padding-right: 24px;

    .header-item:not(:last-child) {
      margin-right: 1rem;
    }

    .end-control-container {
      display: none;
    }
  }
}
</style>
