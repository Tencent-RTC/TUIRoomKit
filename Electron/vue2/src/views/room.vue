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
import TUIMessageBox from '@/TUIRoom/components/common/base/MessageBox';
import logger from '../TUIRoom/utils/common/logger';
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

    const { action, roomMode, roomParam, hasCreated } = JSON.parse(this.roomInfo);
    const { sdkAppId, userId, userSig, userName, avatarUrl } = JSON.parse(this.userInfo);
    try {
      await this.$refs.TUIRoomRef.init({
        sdkAppId,
        userId,
        userSig,
        userName,
        avatarUrl,
      });
      if (action === 'createRoom' && !hasCreated) {
        try {
          await this.$refs.TUIRoomRef.createRoom({ roomId: this.roomId, roomName: this.roomId, roomMode, roomParam });
          const newRoomInfo = {
            action, roomId: this.roomId, roomName: this.roomId, roomMode, roomParam, hasCreated: true,
          };
          sessionStorage.setItem('tuiRoom-roomInfo', JSON.stringify(newRoomInfo));
        } catch (error) {
          const message = this.$t('Failed to enter the room.') + error.message;
          TUIMessageBox({
            title: this.$t('Note'),
            message,
            confirmButtonText: this.$t('Sure'),
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
          TUIMessageBox({
            title: this.$t('Note'),
            message,
            confirmButtonText: this.$t('Sure'),
            callback: () => {
              this.$router.push({ path: 'home' });
            },
          });
        }
      }
    } catch (error) {
      const message = this.$t('Failed to enter the room.') + error.message;
      TUIMessageBox({
        title: this.$t('Note'),
        message,
        confirmButtonText: this.$t('Sure'),
        callback: () => {
          sessionStorage.removeItem('tuiRoom-currentUserInfo');
          this.$router.push({ path: 'home' });
        },
      });
    }
  },
  methods: {
    handleLogOut() {
    },

    onCreateRoom(info) {
      logger.debug('onEnterRoom:', info);
    },

    onEnterRoom(info) {
      logger.debug('onCreateRoom:', info);
    },

    onDestroyRoom(info) {
      logger.debug('onDestroyRoom:', info);
      this.$router.replace({ path: '/home' });
    },

    onExitRoom(info) {
      logger.debug('onExitRoom:', info);
      this.$router.replace({ path: '/home' });
    },

    /**
     * Ordinary members were kicked out of the room by the host
     **/
    onKickedOutOfRoom(info) {
      logger.debug('onKickedOutOfRoom:', info);
      sessionStorage.removeItem('tuiRoom-roomInfo');
      this.$router.replace({ path: '/home' });
    },

    /**
     * Users are kicked offline
     */
    onKickedOffLine(info) {
      logger.debug('onKickedOffLine:', info);
      sessionStorage.removeItem('tuiRoom-roomInfo');
      this.$router.replace({ path: '/home' });
    },

    /**
     * Ordinary members were kicked out of the room by the host
     */
    onUserSigExpired() {
      logger.debug('onUserSigExpired');
      sessionStorage.removeItem('tuiRoom-roomInfo');
      sessionStorage.removeItem('tuiRoom-currentUserInfo');
      this.$router.replace({ path: '/home' });
    },
  },
};
</script>

<style lang="scss">
#app {
  font-family: PingFang SC;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #b3b8c8;
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
