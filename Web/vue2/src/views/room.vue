<template>
  <room-container
    ref="TUIRoomRef"
    @on-log-out="handleLogOut"
    @on-create-room="onCreateRoom"
    @on-enter-room="onEnterRoom"
    @on-exit-room="onExitRoom"
    @on-destroy-room="onDestroyRoom"
    @on-kick-off="onKickOff"
  ></room-container>
</template>

<script>
import RoomContainer from '@/TUIRoom/index.vue';
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
    if (!this.roomId || !this.roomInfo) {
      this.$router.push({ path: 'home' });
    }

    const { action, roomMode, roomParam } = JSON.parse(this.roomInfo);
    const { sdkAppId, userId, userSig, shareUserId, shareUserSig, userName, userAvatar } = JSON.parse(this.userInfo);
    await this.$refs.TUIRoomRef.init({
      sdkAppId,
      userId,
      userSig,
      userName,
      userAvatar,
      shareUserId,
      shareUserSig,
    });
    if (action === 'createRoom') {
      await this.$refs.TUIRoomRef.createRoom(Number(this.roomId), roomMode, roomParam);
    } else if (action === 'enterRoom') {
      await this.$refs.TUIRoomRef.enterRoom(Number(this.roomId), roomParam);
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

    // 普通成员被主持人踢出房间
    onKickOff(info) {
      console.debug('onKickOff:', info);
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
