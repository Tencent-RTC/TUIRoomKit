<template>
  <div id="app">
    <pre-conference-view
      :user-info="userInfo"
      :room-id="givenRoomId"
      :enable-scheduled-conference="true"
      @on-create-room="handleCreateRoom"
      @on-enter-room="handleEnterRoom"
      @on-logout="handleLogOut"
      @on-update-user-name="handleUpdateUserName"
    ></pre-conference-view>
  </div>
</template>

<script>
import { PreConferenceView, conference, RoomEvent } from '@tencentcloud/roomkit-electron-vue2.7';
import { getBasicInfo } from '@/config/basic-info-config';
import { isMobile } from '@tencentcloud/roomkit-electron-vue2.7/es/utils/environment';
import i18n from '../locales/index';
import { getLanguage, getTheme } from  '../utils/utils';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue2';

export default {
  name: 'Home',
  components: {
    PreConferenceView,
  },
  data() {
    return {
      givenRoomId: '',
      userInfo: {
        userId: '',
        userName: '',
        userAvatar: '',
      },
      isMobile,
    };
  },
  async beforeMount() {
    sessionStorage.removeItem('tuiRoom-roomInfo');
    sessionStorage.removeItem('tuiRoom-userInfo');

    this.givenRoomId = this.$route.query.roomId || '';
    this.userInfo = getBasicInfo();
    this.theme = useUIKit();
    if (!this.userInfo) {
      return;
    }
    sessionStorage.setItem('tuiRoom-userInfo', JSON.stringify(this.userInfo));

    const { sdkAppId, userId, userSig, userName, avatarUrl } = this.userInfo;
    await conference.login({ sdkAppId, userId, userSig });
    await conference.setSelfInfo({ userName, avatarUrl });
  },
  mounted() {
    conference.setLanguage(getLanguage());
    !this.theme.value && conference.setTheme(getTheme());
    conference.on(RoomEvent.LANGUAGE_CHANGED, this.changeLanguage);
    conference.on(RoomEvent.THEME_CHANGED, this.changeTheme);
    conference.on(RoomEvent.CONFERENCE_INVITATION_ACCEPTED, this.handleAcceptedInvitation);
  },
  destroyed() {
    conference.off(RoomEvent.LANGUAGE_CHANGED,  this.changeLanguage);
    conference.off(RoomEvent.THEME_CHANGED,  this.changeTheme);
    conference.off(RoomEvent.CONFERENCE_INVITATION_ACCEPTED, this.handleAcceptedInvitation);
  },
  methods: {
    setTUIRoomData(action, roomOption) {
      sessionStorage.setItem('tuiRoom-roomInfo', JSON.stringify({
        action,
        ...roomOption,
      }));
    },
    async checkRoomExistWhenCreateRoom(roomId) {
      let isRoomExist = false;
      const tim = conference.getRoomEngine()?.getTIM();
      try {
        await tim?.searchGroupByID(roomId);
        isRoomExist = true;
      } catch (error) {
        // The room doesn't exist.
      }
      return isRoomExist;
    },
    // Generate room number when creating a room
    async generateRoomId() {
      const roomId = Math.ceil(Math.random() * 1000000);
      const isRoomExist = await this.checkRoomExistWhenCreateRoom(String(roomId));
      if (isRoomExist) {
        return await this.generateRoomId();
      }
      return roomId;
    },
    // Processing click on [Create Room]
    async handleCreateRoom(roomOption) {
      this.setTUIRoomData('createRoom', roomOption);
      const roomId = await this.generateRoomId();
      this.$router.push({ path: 'room', query: { roomId } });
    },
    // Processing click on [enter room]
    async handleEnterRoom(roomOption) {
      const { roomId } = roomOption;
      this.setTUIRoomData('enterRoom', roomOption);
      this.$router.push({
        path: 'room',
        query: {
          roomId,
        },
      });
    },
    // Processing user clicks [Logout] in the upper left corner of the page
    handleLogOut() {
      // The accessor handles the logout method
    },
    // Update userName modified by the user himself
    handleUpdateUserName(userName) {
      try {
        const storageUserInfo = JSON.parse(sessionStorage.getItem('tuiRoom-userInfo'));
        storageUserInfo.userName = userName;
        sessionStorage.setItem('tuiRoom-userInfo', JSON.stringify(storageUserInfo));
      } catch (error) {
        console.log('sessionStorage error', error);
      }
    },
    changeTheme(theme) {
      localStorage.setItem('tuiRoom-currentTheme', theme);
    },
    changeLanguage(language) {
      i18n.global.locale.value = language;
      localStorage.setItem('tuiRoom-language', language);
    },
    async handleAcceptedInvitation(roomId) {
      await this.handleEnterRoom({
        roomId,
        roomParam: {
          isOpenCamera: false,
          isOpenMicrophone: true,
        },
      });
    },
  },
};
</script>
