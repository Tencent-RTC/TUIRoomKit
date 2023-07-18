<template>
  <room-container
    ref="TUIRoomRef"
    @on-log-out="handleLogOut"
    @on-create-room="onCreateRoom"
    @on-enter-room="onEnterRoom"
    @on-exit-room="onExitRoom"
    @on-destroy-room="onDestroyRoom"
    @on-kicked-out-of-room="onKickedOutOfRoom"
    @on-kick-off-line="onKickedOffLine"
    @on-user-sig-expired="onUserSigExpired"
  ></room-container>
</template>

<script>
import RoomContainer from '@/TUIRoom/index.vue';
import { MessageBox } from 'element-ui';
export default {
  name: 'Room',
  components: { RoomContainer },
  data() {
    return {
      roomInfo: null,
      userInfo: null,
      roomId: 0,
    };
  },
  async mounted() {
    this.roomInfo = sessionStorage.getItem('tuiRoom-roomInfo');
    this.userInfo = sessionStorage.getItem('tuiRoom-userInfo');
    this.roomId = this.$route.query.roomId;

    if (!this.roomId) {
      this.$router.push({ path: 'home' });
      return;
    }
    if (!this.roomInfo) {
      this.$router.push({ path: 'home', query: { roomId: this.roomId } });
      return;
    }

    const { action, roomMode, roomParam } = JSON.parse(this.roomInfo);
    const { sdkAppId, userId, userSig, userName, avatarUrl } = JSON.parse(this.userInfo);
    try {
      await this.$refs.TUIRoomRef.init({
        sdkAppId,
        userId,
        userSig,
        userName,
        avatarUrl,
      });
      if (action === 'createRoom') {
        try {
          await this.$refs.TUIRoomRef.createRoom({ roomId: this.roomId, roomName: this.roomId, roomMode, roomParam });
        } catch (error) {
          const message = this.$t('Failed to enter the room.') + error.message;
          MessageBox.alert(message, this.$t('Note'), {
            customClass: 'custom-element-class',
            confirmButtonText: this.$t('Confirm'),
            callback: () => {
              this.$router.push({ path: 'home' });
            },
          });
        }
      } else if (action === 'enterRoom') {
        try {
          await this.$refs.TUIRoomRef.enterRoom({ roomId: this.roomId, roomParam });
        } catch (error) {
          const message = this.$t('Failed to enter the room.') + error.message;
          MessageBox.alert(message, this.$t('Note'), {
            customClass: 'custom-element-class',
            confirmButtonText: this.$t('Confirm'),
            callback: () => {
              this.$router.push({ path: 'home' });
            },
          });
        }
      }
    } catch (error) {
      const message = this.$t('Failed to enter the room.') + error.message;
      MessageBox.alert(message, this.$t('Note'), {
        customClass: 'custom-element-class',
        confirmButtonText: this.$t('Confirm'),
        callback: () => {
          sessionStorage.removeItem('tuiRoom-currentUserInfo');
          this.$router.push({ path: 'home' });
        },
      });
    }
  },
  methods: {
    // 处理用户点击页面左上角【退出登录】
    handleLogOut() {
      // 接入方处理 logout 方法
    },

    // 主持人创建房间回调
    onCreateRoom(info) {
      console.debug('onEnterRoom:', info);
    },

    // 普通成员进入房间回调
    onEnterRoom(info) {
      console.debug('onCreateRoom:', info);
    },

    // 主持人销毁房间回调
    onDestroyRoom(info) {
      console.debug('onDestroyRoom:', info);
      this.$router.replace({ path: '/home' });
    },

    // 普通成员退出房间回调
    onExitRoom(info) {
      console.debug('onExitRoom:', info);
      this.$router.replace({ path: '/home' });
    },

    /**
     * Ordinary members were kicked out of the room by the host
     * 普通成员被主持人踢出房间
    **/
    onKickedOutOfRoom(info) {
      console.debug('onKickedOutOfRoom:', info);
      sessionStorage.removeItem('tuiRoom-roomInfo');
      this.$router.replace({ path: '/home' });
    },

    /**
     * Users are kicked offline
     * 被踢下线
     */
    onKickedOffLine(info) {
      console.debug('onKickedOffLine:', info);
      sessionStorage.removeItem('tuiRoom-roomInfo');
      this.$router.replace({ path: '/home' });
    },

    /**
     * Ordinary members were kicked out of the room by the host
     * userSig 过期，需要获取新的 userSig
     */
    onUserSigExpired() {
      console.debug('onUserSigExpired');
      sessionStorage.removeItem('tuiRoom-roomInfo');
      sessionStorage.removeItem('tuiRoom-currentUserInfo');
      this.$router.replace({ path: '/home' });
    },
  },
};
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #B3B8C8;
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
