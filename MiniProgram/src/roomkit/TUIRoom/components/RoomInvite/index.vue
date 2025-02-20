<template>
  <div class="invite-container">
    <div class="invite-container-main">
      <ActionSheep
        :visible="sidebarName === 'invite'"
        @close="handleCloseActionSheet"
      >
        <div class="invite-item-container">
          <div
            v-for="(item, index) in invitationFeatureDetails"
            :key="index"
            class="invite-item"
            @tap="() => item.function()"
          >
            <svg-icon style="display: flex" class="icon" :icon="item.icon" />
            <span class="invite-title">{{ t(item.text) }}</span>
          </div>
        </div>
      </ActionSheep>
      <ActionSheep
        :visible="isShowRoomShareForm"
        @input="isShowRoomShareForm = $event"
      >
        <div
          v-for="item in displayedInviteInfoList"
          :key="item.title"
          class="invite-content-main"
        >
          <span class="invite-title">{{ t(item.title) }}</span>
          <span class="invite-content">{{ item.content }}</span>
          <svg-icon
            style="display: flex"
            v-if="item.isShowCopyIcon"
            @tap="() => onCopy(item.content)"
            :icon="CopyIcon"
            class="copy"
          />
        </div>
        <div class="invite-content-bottom">
          <span class="invite-bottom" @tap="() => copyRoomIdAndRoomLink()">
            {{ t('Copy the conference number and link') }}
          </span>
        </div>
      </ActionSheep>
    </div>
    <Contacts
      :visible="showContacts"
      :contacts="contacts"
      :disabled-list="remoteEnteredUserList"
      @input="showContacts = $event"
      @confirm="contactsConfirm"
      :isMobile="true"
    />
  </div>
</template>

<script setup lang="ts">
import SvgIcon from '../common/base/SvgIcon.vue';
import useRoomInviteControl from './useRoomInviteHooks';
import ActionSheep from '../common/base/ActionSheep.vue';
import Contacts from '../ScheduleConference/Contacts.vue';
import CopyIcon from '../../assets/icons/CopyIcon.svg';

const {
  t,
  invitationFeatureDetails,
  showContacts,
  contactsConfirm,
  contacts,
  remoteEnteredUserList,
  isShowRoomShareForm,
  copyRoomIdAndRoomLink,
  displayedInviteInfoList,
  onCopy,
  sidebarName,
} = useRoomInviteControl();

function handleCloseActionSheet() {
  sidebarName.value = '';
}
</script>

<style lang="scss" scoped>
span {
  align-self: center;
  margin: 0 5px;
  font-size: 14px;
  font-weight: 400;
  line-height: 17px;
}

.invite-container-main {
  .invite-title-main {
    display: flex;
    justify-content: center;
    padding: 20px;
  }

  .invite-item-container {
    padding: 10px;
  }

  .invite-item {
    display: flex;
    align-items: center;
    padding: 5px 0;
  }

  .icon {
    display: flex;
    align-items: center;
    width: 20px;
    height: 20px;
    margin: 0 5px;
  }
}

.invite-content-main {
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 90%;
  height: 13%;
  padding: 0 0 0 25px;
  margin-bottom: 10px;

  .invite-title {
    width: 23%;
    font-family: 'PingFang SC';
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    line-height: 20px;
    white-space: nowrap;
    color: var(--text-color-secondary);
  }

  .invite-content {
    width: 64%;
    overflow: hidden;
    font-size: 14px;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--text-color-primary);
  }

  .copy {
    width: 20px;
    height: 20px;
    margin-left: 30px;
    color: var(--text-color-link);
  }
}

.invite-content-bottom {
  display: flex;
  justify-content: center;
}

.invite-bottom {
  display: block;
  width: 80%;
  padding: 5px 0;
  font-family: 'PingFang SC';
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 17px;
  text-align: center;
  border-radius: 10px;
  background-color: var(--button-color-primary-default);
  color: var(--text-color-primary);
}
</style>
