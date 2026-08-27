/**
 * Single entry point for "make this device usable on WeChat".
 *
 * Every caller — toolbar buttons, post-enter setup, onError recovery and the
 * page-show resync — goes through ensureDeviceUsable, which owns the whole
 * sequence: read permission, guide the user, recreate live-pusher, open the
 * device. Keeping it in one place is what stops the four flows from drifting
 * apart.
 */
import { isWeChat } from '../utils/environment';
import {
  MediaAuthState,
  MediaPermissionDevice,
  TranslateFn,
  getCurrentMediaAuth,
  guideDevicePermission,
  isDeviceAuthorized,
} from '../utils/wxPermission';
import { createSerialRunner } from '../utils/serialTask';
import {
  canMountLocalPusher,
  recreateAndRestoreLocalPusher,
  recreateLocalPusher,
  shouldRecreateLocalPusher,
} from './useLocalPusher';
import { useBasicStore } from '../stores/basic';
import { useRoomStore } from '../stores/room';
import useGetRoomEngine from './useRoomEngine';
import logger from '../utils/common/logger';

const logPrefix = '[wxMediaGuard]';

/**
 * A forced recreate that does not fix capture would otherwise loop: opening
 * the device fails, onError fires, and we recreate again.
 */
const FORCE_RECREATE_COOLDOWN = 5000;

export interface EnsureDeviceOptions {
  /**
   * The user asked for this device, so go straight to wx.authorize instead of
   * explaining ourselves in a modal first. wx.authorize itself does not need a
   * user tap; only wx.openSetting does, and that runs from a modal button.
   */
  userGesture?: boolean;
  /** Open the device once it is usable. Callers that open it themselves omit this. */
  open?: boolean;
  /**
   * Recreate live-pusher even when permission never changed. Used by error
   * recovery, where capture is broken although the scope is granted.
   */
  forceRecreate?: boolean;
}

const runSerial = createSerialRunner();

let lastForceRecreateAt = 0;

/**
 * A WeChat modal blocks the JS bridge while it is open. Opening one during
 * enterRoom can stop TRTC from ever delivering its callbacks, so enterRoom
 * never settles and the entering overlay stays up forever. TRTC also reports
 * a denied scope through onError while entering, which is exactly when this
 * would happen — those prompts are deferred to ensureMediaAfterEnter.
 */
let isEnteringRoom = false;

export function setRoomEntering(entering: boolean) {
  isEnteringRoom = entering;
}

async function resolvePermission(
  device: MediaPermissionDevice,
  t: TranslateFn,
  userGesture: boolean
): Promise<boolean> {
  const { granted } = await guideDevicePermission(device, t, userGesture);
  return granted;
}

/**
 * Keep walking the user through authorize / settings until the scope is
 * granted or they cancel. System-level denial is terminal — WeChat cannot
 * open OS settings for us.
 */
async function resolvePermissionUntilGranted(
  device: MediaPermissionDevice,
  t: TranslateFn,
  userGesture: boolean
): Promise<boolean> {
  let gesture = userGesture;
  while (true) {
    const { granted, cancelled } = await guideDevicePermission(
      device,
      t,
      gesture
    );
    if (granted) {
      return true;
    }
    if (cancelled) {
      return false;
    }
    gesture = false;
  }
}

async function syncPusherWithAuth(
  auth: MediaAuthState,
  forceRecreate: boolean
): Promise<boolean> {
  if (!canMountLocalPusher.value) {
    await recreateLocalPusher(auth);
    return true;
  }
  if (shouldRecreateLocalPusher(auth)) {
    await recreateAndRestoreLocalPusher(auth);
    return true;
  }
  if (!forceRecreate) {
    return true;
  }
  const now = Date.now();
  if (now - lastForceRecreateAt < FORCE_RECREATE_COOLDOWN) {
    logger.warn(`${logPrefix}skip forced recreate, still in cooldown`);
    return false;
  }
  lastForceRecreateAt = now;
  await recreateAndRestoreLocalPusher(auth);
  return true;
}

function openDevice(device: MediaPermissionDevice) {
  const roomEngine = useGetRoomEngine();
  const basicStore = useBasicStore();
  // Not awaited: on WeChat openLocalCamera can start the preview and never
  // resolve, which would stall whoever is waiting on the guard.
  if (device === 'microphone') {
    roomEngine.instance
      ?.unmuteLocalAudio()
      .then(() => {
        if (basicStore.isOpenMic) {
          return;
        }
        roomEngine.instance?.openLocalMicrophone();
        basicStore.setIsOpenMic(true);
      })
      .catch((error: unknown) => {
        logger.error(`${logPrefix}open microphone failed:`, error);
      });
    return;
  }
  roomEngine.instance
    ?.openLocalCamera({ isFrontCamera: basicStore.isFrontCamera })
    .catch((error: unknown) => {
      logger.error(`${logPrefix}open camera failed:`, error);
    });
}

/**
 * Resolves to whether the device ended up usable. Callers should not open the
 * device themselves when this returns false.
 */
export function ensureDeviceUsable(
  device: MediaPermissionDevice,
  t: TranslateFn,
  options: EnsureDeviceOptions = {}
): Promise<boolean> {
  if (!isWeChat) {
    return Promise.resolve(true);
  }
  return runSerial(async () => {
    if (isEnteringRoom) {
      logger.warn(`${logPrefix}skip ${device} prompt while entering room`);
      return false;
    }
    const granted = await resolvePermission(device, t, !!options.userGesture);
    if (!granted) {
      return false;
    }
    const auth = await getCurrentMediaAuth();
    const ready = await syncPusherWithAuth(auth, !!options.forceRecreate);
    if (!ready) {
      return false;
    }
    if (options.open) {
      openDevice(device);
    }
    return true;
  });
}

/**
 * Settle the scopes before live-pusher is created and before we enter.
 *
 * live-pusher captures the auth state at creation time and cannot start at all
 * without the record scope. TRTC then reports "Not allowed to use microphone"
 * and TUIRoomEngine.enterRoom never settles, so the user is stuck on the
 * entering overlay with no way out. Asking first is what keeps that from
 * happening — and it lets the pusher be created once, with the final answer,
 * instead of being torn down again right after the room is up.
 *
 * Resolves to the auth state the caller should create the pusher with. The mic
 * can still come back denied if the user cancels the guide; entering the room
 * is the caller's decision.
 */
export function ensureMediaBeforeEnter(
  need: Partial<MediaAuthState>,
  t: TranslateFn
): Promise<MediaAuthState> {
  if (!isWeChat) {
    return Promise.resolve({ camera: true, microphone: true });
  }
  return runSerial(async () => {
    // Requested even when the user joins muted, because live-pusher needs it.
    // Loop so "go to settings" can succeed without kicking the user home.
    await resolvePermissionUntilGranted('microphone', t, true);
    if (need.camera) {
      await resolvePermissionUntilGranted('camera', t, true);
    }
    return getCurrentMediaAuth();
  });
}

/**
 * Open whatever the room was asked to open. Runs after ROOM_START / ROOM_JOIN,
 * so the entering overlay is already gone if a scope still needs a prompt.
 */
export async function ensureMediaAfterEnter(
  need: Partial<MediaAuthState>,
  t: TranslateFn
) {
  const devices: MediaPermissionDevice[] = ['microphone', 'camera'];
  for (const device of devices) {
    if (need[device]) {
      await ensureDeviceUsable(device, t, { open: true });
    }
  }
}

/**
 * The user may have flipped a scope in the WeChat settings page while the room
 * was in the background. Grants (and camera revoke) remount live-pusher.
 * Microphone revoke cannot remount: live-pusher cannot start without record,
 * so capture is closed and the toolbar shows unauthorized instead.
 */
export async function syncLocalPusherOnPageShow() {
  if (!isWeChat) {
    return;
  }
  const auth = await getCurrentMediaAuth();
  if (!canMountLocalPusher.value) {
    return;
  }
  if (shouldRecreateLocalPusher(auth)) {
    logger.log(`${logPrefix}auth changed on page show, recreate pusher`);
    await recreateAndRestoreLocalPusher(auth);
    return;
  }
  await closeRevokedLocalMedia(auth);
}

async function closeRevokedLocalMedia(auth: MediaAuthState) {
  const roomEngine = useGetRoomEngine();
  const basicStore = useBasicStore();
  const roomStore = useRoomStore();
  if (!isDeviceAuthorized(auth, 'microphone') && basicStore.isOpenMic) {
    try {
      await roomEngine.instance?.muteLocalAudio();
      basicStore.setIsOpenMic(false);
    } catch (error) {
      logger.warn(`${logPrefix}mute revoked microphone failed:`, error);
    }
  }
  if (
    !isDeviceAuthorized(auth, 'camera') &&
    roomStore.localUser.hasVideoStream
  ) {
    try {
      await roomEngine.instance?.closeLocalCamera();
    } catch (error) {
      logger.warn(`${logPrefix}close revoked camera failed:`, error);
    }
  }
}
