<template>
  <conference-main-view display-mode="permanent"></conference-main-view>
</template>

<script>
import { ConferenceMainView, conference, RoomEvent } from '@tencentcloud/roomkit-web-vue2.7';

let isExpectedJump = false;

export default {
  name: 'Room',
  components: { ConferenceMainView },
  beforeRouteLeave(to, from, next) {
    if (!isExpectedJump) {
      const message = this.isMaster
        ? this.$t('This action causes the room to be disbanded, does it continue?')
        : this.$t('This action causes the room to be exited, does it continue?');
      if (window.confirm(message)) {
        if (this.isMaster) {
          conference.dismiss();
        } else {
          conference.leave();
        }
        next();
      } else {
        next(false);
      }
    } else {
      next();
      isExpectedJump = false;
    }
  },
  data() {
    return {
      roomInfo: null,
      userInfo: null,
      roomId: 0,
      isMaster: false,
    };
  },
  async mounted() {
    this.roomInfo = sessionStorage.getItem('tuiRoom-roomInfo');
    this.userInfo = sessionStorage.getItem('tuiRoom-userInfo');
    this.roomId = this.$route.query.roomId;

    if (!this.roomId) {
      this.goToPage({ action: 'replace', path: 'home' });
      return;
    }
    if (!this.roomInfo) {
      this.goToPage({ action: 'replace', path: 'home',  query: { roomId: this.roomId } });
      return;
    }

    const { action, isSeatEnabled, roomParam, hasCreated } = JSON.parse(this.roomInfo);
    const { sdkAppId, userId, userSig, userName, avatarUrl } = JSON.parse(this.userInfo);
    if (action === 'createRoom') {
      this.isMaster = true;
    }
    try {
      conference.on(RoomEvent.ROOM_DISMISS, this.backToHome);
      conference.on(RoomEvent.ROOM_LEAVE, this.backToHome);
      conference.on(RoomEvent.KICKED_OUT, this.backToHome);
      conference.on(RoomEvent.ROOM_ERROR, this.backToHome);
      conference.on(RoomEvent.KICKED_OFFLINE, this.backToHome);
      conference.on(RoomEvent.USER_SIG_EXPIRED, this.backToHomeAndClearUserInfo);
      conference.on(RoomEvent.USER_LOGOUT, this.backToHomeAndClearUserInfo);
      await conference.login({ sdkAppId, userId, userSig });
      await conference.setSelfInfo({ userName, avatarUrl });
      if (action === 'createRoom' && !hasCreated) {
        await conference.start(this.roomId, {
          roomName: this.roomId,
          isSeatEnabled,
          ...roomParam,
        });
        const newRoomInfo = {
          action, roomId: this.roomId, roomName: this.roomId, isSeatEnabled, roomParam, hasCreated: true,
        };
        sessionStorage.setItem('tuiRoom-roomInfo', JSON.stringify(newRoomInfo));
      } else {
        await conference.join(this.roomId, roomParam);
      }
    } catch (error) {
      sessionStorage.removeItem('tuiRoom-currentUserInfo');
    }
  },
  destroyed() {
    conference.on(RoomEvent.ROOM_DISMISS, this.backToHome);
    conference.on(RoomEvent.ROOM_LEAVE, this.backToHome);
    conference.on(RoomEvent.KICKED_OUT, this.backToHome);
    conference.on(RoomEvent.ROOM_ERROR, this.backToHome);
    conference.on(RoomEvent.KICKED_OFFLINE, this.backToHome);
    conference.on(RoomEvent.USER_SIG_EXPIRED, this.backToHomeAndClearUserInfo);
    conference.on(RoomEvent.USER_LOGOUT, this.backToHomeAndClearUserInfo);
  },
  methods: {
    backToPage(page, shouldClearUserInfo) {
      sessionStorage.removeItem('tuiRoom-roomInfo');
      shouldClearUserInfo && sessionStorage.removeItem('tuiRoom-currentUserInfo');
      this.goToPage({ action: 'replace', path: page });
    },
    backToHome() {
      this.backToPage('home', false);
    },
    backToHomeAndClearUserInfo() {
      this.backToPage('home', true);
    },
    goToPage({ action, path, query }) {
      if (this.$route.name === path) {
        return;
      }
      isExpectedJump = true;
      this.$router[action]({ path, query }).catch((error) => {
        console.warn('vue-router error:', error);
      });
    },
  },
};
</script>

<style lang="scss">
#app {
  font-family: PingFang SC;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
