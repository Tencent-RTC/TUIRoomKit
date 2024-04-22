<template>
  <div id="app">
    <pre-conference-view
      :user-info="userInfo"
      :room-id="givenRoomId"
      @on-create-room="handleCreateRoom"
      @on-enter-room="handleEnterRoom"
      @on-logout="handleLogOut"
      @on-update-user-name="handleUpdateUserName"
    ></pre-conference-view>
  </div>
</template>

<script>
import { PreConferenceView, conference } from '@tencentcloud/roomkit-web-vue2.7';
import { getBasicInfo } from '@/config/basic-info-config';
import TUIRoomEngine from '@tencentcloud/tuiroom-engine-js';
import { isMobile } from '@tencentcloud/roomkit-web-vue2.7/es/utils/environment';

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
  async mounted() {
    sessionStorage.removeItem('tuiRoom-roomInfo');
    sessionStorage.removeItem('tuiRoom-userInfo');
    this.givenRoomId = this.$route.query.roomId || '';

    if (sessionStorage.getItem('tuiRoom-userInfo')) {
      this.userInfo = JSON.parse(sessionStorage.getItem('tuiRoom-userInfo'));
    } else {
      this.userInfo = await getBasicInfo();
      this.userInfo && sessionStorage.setItem('tuiRoom-userInfo', JSON.stringify(this.userInfo));
    }
    const { sdkAppId, userId, userSig } = this.userInfo;
    // 登录 TUIRoomEngine
    await TUIRoomEngine.login({ sdkAppId, userId, userSig });
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
        // 房间不存在
      }
      return isRoomExist;
    },
    // 创建房间时生成房间号
    async generateRoomId() {
      const roomId = Math.ceil(Math.random() * 1000000);
      const isRoomExist = await this.checkRoomExistWhenCreateRoom(String(roomId));
      if (isRoomExist) {
        return await this.generateRoomId();
      }
      return roomId;
    },
    // 处理点击【创建房间】
    async handleCreateRoom(roomOption) {
      this.setTUIRoomData('createRoom', roomOption);
      const roomId = await this.generateRoomId();
      this.$router.push({ path: 'room', query: { roomId } });
    },
    // 处理点击【进入房间】
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
    // 处理用户点击页面左上角【退出登录】
    handleLogOut() {
      // 接入方处理 logout 方法
    },
    // 更新用户自己修改的userName
    handleUpdateUserName(userName) {
      try {
        const storageUserInfo = JSON.parse(sessionStorage.getItem('tuiRoom-userInfo'));
        storageUserInfo.userName = userName;
        sessionStorage.setItem('tuiRoom-userInfo', JSON.stringify(storageUserInfo));
      } catch (error) {
        console.log('sessionStorage error', error);
      }
    },
  },
};
</script>
