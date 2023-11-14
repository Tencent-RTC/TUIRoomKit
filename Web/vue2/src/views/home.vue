<template>
  <div class="home-container">
    <div class="header">
      <div class="left-header">
        <switch-theme class="header-item"></switch-theme>
      </div>
      <div class="right-header">
        <language-icon class="header-item language"></language-icon>
        <user-info
          class="header-item user-info"
          :user-id="userId"
          :user-name="userName"
          :avatar-url="userAvatar"
          @log-out="handleLogOut"
        ></user-info>
      </div>
    </div>
    <room-control
      ref="roomControlRef"
      :given-room-id="givenRoomId"
      :user-name="userName"
      @create-room="handleCreateRoom"
      @enter-room="handleEnterRoom"
      @update-user-name="handleUpdateUserName"
    ></room-control>
  </div>
</template>

<script>
import UserInfo from '@/TUIRoom/components/RoomHeader/UserInfo';
import LanguageIcon from '@/TUIRoom/components/common/Language.vue';
import SwitchTheme from '@/TUIRoom/components/common/SwitchTheme.vue';
import RoomControl from '@/TUIRoom/components/RoomHome/RoomControl';
import { getBasicInfo } from '@/config/basic-info-config';
import TUIRoomEngine from '@tencentcloud/tuiroom-engine-js';
import useGetRoomEngine from '@/TUIRoom/hooks/useRoomEngine';
import { isMobile } from '../TUIRoom/utils/useMediaValue';
import logger from '../TUIRoom/utils/common/logger';

const roomEngine = useGetRoomEngine();
export default {
  name: 'Home',
  components: {
    UserInfo,
    LanguageIcon,
    RoomControl,
    SwitchTheme,
  },
  data() {
    return {
      givenRoomId: '',
      basicInfo: null,
      userName: '',
      userAvatar: '',
      userId: '',
      isMobile,
    };
  },
  async mounted() {
    sessionStorage.removeItem('tuiRoom-roomInfo');
    sessionStorage.removeItem('tuiRoom-userInfo');
    this.givenRoomId = this.$route.query.roomId || '';

    if (sessionStorage.getItem('tuiRoom-userInfo')) {
      this.basicInfo = JSON.parse(sessionStorage.getItem('tuiRoom-userInfo'));
    } else {
      this.basicInfo = await getBasicInfo();
      this.basicInfo && sessionStorage.setItem('tuiRoom-userInfo', JSON.stringify(this.basicInfo));
    }
    this.userName = this.basicInfo.userName;
    this.userAvatar = this.basicInfo.userAvatar;
    this.userId = this.basicInfo.userId;
    const { sdkAppId, userId, userSig } = this.basicInfo;
    // 登录 TUIRoomEngine
    await TUIRoomEngine.login({ sdkAppId, userId, userSig });
  },
  methods: {
    setTUIRoomData(action, mode) {
      const roomParam = this.$refs.roomControlRef.getRoomParam();
      const roomData = {
        action,
        roomMode: mode || 'FreeToSpeak',
        roomParam,
      };
      sessionStorage.setItem('tuiRoom-roomInfo', JSON.stringify(roomData));
    },
    async checkRoomExistWhenCreateRoom(roomId) {
      let isRoomExist = false;
      const tim = roomEngine.instance?.getTIM();
      try {
        await tim.searchGroupByID(roomId);
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
    async handleCreateRoom(mode) {
      this.setTUIRoomData('createRoom', mode);
      const roomId = await this.generateRoomId();
      this.$router.push({ path: 'room', query: { roomId } });
    },
    // 处理点击【进入房间】
    async handleEnterRoom(roomId) {
      this.setTUIRoomData('enterRoom');
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
        logger.log('sessionStorage error', error);
      }
    },
  },
};
</script>

<style>
@import '../TUIRoom/assets/style/black-theme.scss';
@import '../TUIRoom/assets/style/white-theme.scss';

</style>

<style lang="scss" scoped>
.tui-theme-black .home-container {
  --background: var(--background-color-1);
}
.tui-theme-white .home-container {
  --background: url(../TUIRoom/assets/imgs/background-white.png);
}

.home-container {
  width: 100%;
  height: 100%;
  background: var(--background);
  background-size: cover;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: PingFang SC;
  color: var(--font-color-1);
  .header {
    width: 100%;
    position: absolute;
    top: 0;
    padding: 22px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    .left-header, .right-header {
      display: flex;
      align-items: center;
      .header-item {
        &:not(:first-child) {
          margin-left: 16px;
        }
      }
    }
  }
}
</style>
