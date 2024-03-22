<template>
  <div class="header-container">
    <div class="left-container">
      <switch-theme class="header-item"></switch-theme>
      <layout-control class="header-item"></layout-control>
      <network-info class="header-item"></network-info>
    </div>
    <div class="center-container">
      <room-info class="header-item"></room-info>
    </div>
    <div class="right-container">
      <language v-show="showHeaderInfo" class="header-item"></language>
      <user-info
        v-show="showHeaderInfo"
        class="header-item"
        :user-id="userId"
        :user-name="userName"
        :avatar-url="avatarUrl"
        @log-out="$emit('log-out')"
      ></user-info>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import UserInfo from '../UserInfo/index.vue';
import Language from '../../common/Language.vue';
import SwitchTheme from '../../common/SwitchTheme.vue';
import RoomInfo from '../RoomInfo/index.vue';
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
  width: 100%;
  height: 100%;
  padding-left: 9px;
  padding-right: 24px;
  position: relative;
  display: flex;
  justify-content: space-between;
  .left-container {
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    padding-left: 24px;
    .header-item:not(:first-child) {
      margin-left: 1rem;
    }
  }
  .center-container {
    position: absolute;
    left: 50%;
    height: 100%;
    display: flex;
    align-items: center;
    transform: translateX(-50%);
  }
  .right-container {
    position: absolute;
    top: 0;
    right: 0;
    height: 100%;
    float: right;
    padding-right: 24px;
    display: flex;
    align-items: center;
    .header-item:not(:last-child) {
      margin-right: 1rem;
    }

    .end-control-container {
      display: none;
    }
  }
}
</style>
