/**
 * WeChat live-pusher mount / recreate lifecycle.
 *
 * Native live-pusher captures the auth state at creation time. After the user
 * grants camera or mic permission the component must be destroyed and created
 * again before openLocalCamera / openLocalMicrophone can take effect.
 *
 * Destroying trtc-pusher makes TRTC-WX call exitRoom, so after remounting we
 * enter the TRTC room again — otherwise preview looks black and the stream is
 * never published ("skip publish notify, not in room").
 *
 * Permission decisions do not belong here; hooks/useWxMediaGuard orchestrates
 * permission and pusher together.
 */
import { nextTick, ref } from 'vue';
import {
  TRTCAppScene,
  TRTCRoleType,
  TRTCVideoEncParam,
  TRTCVideoResolution,
} from '@tencentcloud/tuiroom-engine-wx';
import { isWeChat } from '../utils/environment';
import { MediaAuthState } from '../utils/wxPermission';
import { createSerialRunner } from '../utils/serialTask';
import { useBasicStore } from '../stores/basic';
import { useRoomStore } from '../stores/room';
import useGetRoomEngine from './useRoomEngine';
import logger from '../utils/common/logger';

const logPrefix = '[useLocalPusher]';

const TRTC_ENTER_ROOM_TIMEOUT = 2000;

export const localPusherEpoch = ref(0);
export const canMountLocalPusher = ref(!isWeChat);

let pusherCreatedWith: MediaAuthState = {
  camera: !isWeChat,
  microphone: !isWeChat,
};

let trtcNeedsReenter = false;

/**
 * Pusher operations mutate shared module state and remount a native
 * component, so they are queued instead of dropped. Dropping a concurrent
 * call would make the caller believe the pusher was recreated when it was not,
 * and the user would be left with a black preview.
 */
const runExclusive = createSerialRunner();

const smallParam = new TRTCVideoEncParam();
smallParam.videoResolution = TRTCVideoResolution.TRTCVideoResolution_640_360;
smallParam.videoFps = 10;
smallParam.videoBitrate = 550;

export function resetLocalPusherState() {
  localPusherEpoch.value = 0;
  canMountLocalPusher.value = !isWeChat;
  pusherCreatedWith = {
    camera: !isWeChat,
    microphone: !isWeChat,
  };
  trtcNeedsReenter = false;
}

export function allowMountLocalPusher(auth: MediaAuthState) {
  pusherCreatedWith = { ...auth };
  canMountLocalPusher.value = true;
}

export function shouldRecreateLocalPusher(auth: MediaAuthState): boolean {
  if (!isWeChat || !canMountLocalPusher.value) {
    return false;
  }
  // live-pusher cannot start without the record scope. A mid-call mic revoke
  // must not remount with microphone:false — the guard closes capture instead.
  if (!auth.microphone && pusherCreatedWith.microphone) {
    return false;
  }
  return (
    auth.camera !== pusherCreatedWith.camera ||
    auth.microphone !== pusherCreatedWith.microphone
  );
}

/**
 * Give the renderer a chance to unmount and remount the native component.
 * Two ticks: one for the v-if teardown, one for the keyed remount.
 */
export async function waitForPusherRemount() {
  await nextTick();
  await nextTick();
}

function waitForTrtcEnterRoom(trtcCloud: any): Promise<void> {
  return new Promise(resolve => {
    const finish = () => {
      clearTimeout(timer);
      trtcCloud.off?.('onEnterRoom', finish);
      resolve();
    };
    const timer = setTimeout(finish, TRTC_ENTER_ROOM_TIMEOUT);
    trtcCloud.on?.('onEnterRoom', finish);
  });
}

async function reenterTrtcRoomIfNeeded() {
  if (!trtcNeedsReenter) {
    return;
  }
  trtcNeedsReenter = false;
  const roomEngine = useGetRoomEngine();
  const basicStore = useBasicStore();
  if (!basicStore.roomId || !basicStore.userSig) {
    return;
  }
  const trtcCloud = roomEngine.instance?.getTRTCCloud();
  if (!trtcCloud?.enterRoom) {
    logger.warn(`${logPrefix}trtcCloud.enterRoom unavailable`);
    return;
  }
  try {
    await nextTick();
    const entered = waitForTrtcEnterRoom(trtcCloud);
    await trtcCloud.enterRoom(
      {
        sdkAppId: basicStore.sdkAppId,
        userId: basicStore.userId,
        userSig: basicStore.userSig,
        roomId: 0,
        strRoomId: String(basicStore.roomId),
        role: TRTCRoleType.TRTCRoleAnchor,
      },
      TRTCAppScene.TRTCAppSceneLIVE
    );
    await entered;
    trtcCloud.switchRole?.(TRTCRoleType.TRTCRoleAnchor);
    trtcCloud.enableSmallVideoStream?.(true, smallParam);
    logger.log(`${logPrefix}re-entered TRTC room after pusher recreate`);
  } catch (error) {
    logger.warn(`${logPrefix}reenter TRTC room failed:`, error);
  }
}

async function doRecreateLocalPusher(auth: MediaAuthState) {
  if (canMountLocalPusher.value && useBasicStore().roomId) {
    trtcNeedsReenter = true;
  }
  canMountLocalPusher.value = false;
  await nextTick();
  localPusherEpoch.value += 1;
  pusherCreatedWith = { ...auth };
  canMountLocalPusher.value = true;
  await waitForPusherRemount();
  await reenterTrtcRoomIfNeeded();
  logger.log(`${logPrefix}recreated live-pusher`, auth);
}

async function closeLocalMedia() {
  const roomEngine = useGetRoomEngine();
  try {
    await roomEngine.instance?.closeLocalCamera();
  } catch (error) {
    logger.warn(`${logPrefix}closeLocalCamera failed:`, error);
  }
  try {
    await roomEngine.instance?.closeLocalMicrophone();
  } catch (error) {
    logger.warn(`${logPrefix}closeLocalMicrophone failed:`, error);
  }
}

async function restoreLocalMedia(
  auth: MediaAuthState,
  options: { restoreCamera: boolean; restoreMicrophone: boolean }
) {
  const roomEngine = useGetRoomEngine();
  const basicStore = useBasicStore();
  if (options.restoreMicrophone && auth.microphone) {
    try {
      await roomEngine.instance?.unmuteLocalAudio();
      await roomEngine.instance?.openLocalMicrophone();
      basicStore.setIsOpenMic(true);
    } catch (error) {
      logger.warn(`${logPrefix}restore microphone failed:`, error);
    }
  }
  if (options.restoreCamera && auth.camera) {
    try {
      await roomEngine.instance?.openLocalCamera({
        isFrontCamera: basicStore.isFrontCamera,
      });
    } catch (error) {
      logger.warn(`${logPrefix}restore camera failed:`, error);
    }
  }
}

export function recreateLocalPusher(auth: MediaAuthState): Promise<void> {
  return runExclusive(() => doRecreateLocalPusher(auth));
}

/**
 * Recreate the pusher and bring back whichever streams were live before, so a
 * mid-call permission change does not silently mute or blank the user.
 */
export function recreateAndRestoreLocalPusher(
  auth: MediaAuthState
): Promise<void> {
  return runExclusive(async () => {
    const roomStore = useRoomStore();
    const basicStore = useBasicStore();
    const restoreCamera = !!roomStore.localUser.hasVideoStream;
    const restoreMicrophone =
      !!roomStore.localUser.hasAudioStream || basicStore.isOpenMic;
    await closeLocalMedia();
    await doRecreateLocalPusher(auth);
    await restoreLocalMedia(auth, { restoreCamera, restoreMicrophone });
  });
}
