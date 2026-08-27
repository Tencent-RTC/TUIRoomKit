/**
 * WeChat mini-program camera / microphone permission primitives.
 *
 * This is the pure permission layer: it reads scopes, requests scopes and
 * shows the guidance modal. It must not touch roomEngine or stores —
 * orchestration lives in hooks/useWxMediaGuard.
 *
 * Reading and requesting are separate entry points on purpose: reading never
 * shows UI, so it is safe on paths that must not interrupt the user.
 */
import { ref } from 'vue';
import { isWeChat } from './environment';
import logger from './common/logger';

declare const uni: any;
declare const wx: any;

const logPrefix = '[wxPermission]';

const AUTH_SETTING_TIMEOUT = 2000;

export const PermissionScope = {
  RECORD: 'scope.record',
  CAMERA: 'scope.camera',
} as const;

export type MediaPermissionDevice = 'camera' | 'microphone';

/**
 * granted        already authorized
 * need-authorize never asked, wx.authorize can still show the native sheet
 * mini-program   user denied it, only openSetting can recover
 * system         WeChat itself has no OS-level permission
 */
export type PermissionLevel =
  | 'granted'
  | 'need-authorize'
  | 'mini-program'
  | 'system';

export type DeniedPermissionLevel = Exclude<PermissionLevel, 'granted'>;

export interface PermissionCheckResult {
  granted: boolean;
  level: PermissionLevel;
  device: MediaPermissionDevice;
}

export interface MediaAuthState {
  camera: boolean;
  microphone: boolean;
}

export interface PermissionPromptResult {
  confirmed: boolean;
}

export interface GuidePermissionResult {
  granted: boolean;
  cancelled: boolean;
}

/**
 * Last known WeChat media scopes. UI reads this; writers go through
 * getCurrentMediaAuth / peek / request so the toolbar stays in sync.
 */
export const mediaAuthState = ref<MediaAuthState>({
  camera: !isWeChat,
  microphone: !isWeChat,
});

export type TranslateFn = (key: string, params?: Record<string, any>) => string;

type ModalAction = 'none' | 'authorize' | 'open-setting';

interface DeniedModalConfig {
  tipKey: string;
  confirmKey: string;
  action: ModalAction;
  showCancel: boolean;
}

const DENIED_MODAL_CONFIG: Record<DeniedPermissionLevel, DeniedModalConfig> = {
  system: {
    tipKey:
      'WeChat does not have device permission, please enable it in system settings',
    confirmKey: 'I got it (short)',
    action: 'none',
    showCancel: false,
  },
  'need-authorize': {
    tipKey: 'Please tap to grant device permission',
    confirmKey: 'Authorize (short)',
    action: 'authorize',
    showCancel: true,
  },
  'mini-program': {
    tipKey:
      'You have denied device permission, please enable it in mini-program settings',
    confirmKey: 'Go to Settings (short)',
    action: 'open-setting',
    showCancel: true,
  },
};

function getWxApi(): any {
  if (typeof wx !== 'undefined' && wx.getSetting) {
    return wx;
  }
  if (typeof uni !== 'undefined' && uni.getSetting) {
    return uni;
  }
  return null;
}

function scopeOf(device: MediaPermissionDevice): string {
  return device === 'camera' ? PermissionScope.CAMERA : PermissionScope.RECORD;
}

function grantedResult(device: MediaPermissionDevice): PermissionCheckResult {
  return { granted: true, level: 'granted', device };
}

function deniedResult(
  device: MediaPermissionDevice,
  level: DeniedPermissionLevel
): PermissionCheckResult {
  return { granted: false, level, device };
}

/**
 * showModal rejects button labels longer than 4 characters. Locales own the
 * wording through the "(short)" keys; this only guards against an overlong
 * translation breaking the dialog.
 */
function wxModalButtonText(text: string): string {
  return text.slice(0, 4);
}

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  fallback: T | null
): Promise<T | null> {
  return new Promise(resolve => {
    const timer = setTimeout(() => resolve(fallback), ms);
    const settle = (value: T | null) => {
      clearTimeout(timer);
      resolve(value);
    };
    promise.then(settle).catch(() => settle(fallback));
  });
}

function authFromSetting(
  authSetting: Record<string, boolean | undefined>
): MediaAuthState {
  return {
    camera: authSetting[PermissionScope.CAMERA] === true,
    microphone: authSetting[PermissionScope.RECORD] === true,
  };
}

function rememberAuth(authSetting: Record<string, boolean | undefined>) {
  mediaAuthState.value = authFromSetting(authSetting);
}

function getAuthSetting(): Promise<Record<
  string,
  boolean | undefined
> | null> {
  const request = new Promise<Record<string, boolean | undefined>>(resolve => {
    const api = getWxApi();
    if (!api?.getSetting) {
      resolve({});
      return;
    }
    api.getSetting({
      success(res: { authSetting?: Record<string, boolean | undefined> }) {
        resolve(res.authSetting || {});
      },
      fail() {
        resolve({});
      },
    });
  });
  return withTimeout(request, AUTH_SETTING_TIMEOUT, null).then(authSetting => {
    if (!authSetting) {
      logger.warn(`${logPrefix}getSetting timed out`);
      return null;
    }
    rememberAuth(authSetting);
    return authSetting;
  });
}

function authorizeScope(
  scope: string
): Promise<{ success: boolean; errMsg: string }> {
  return new Promise(resolve => {
    const api = getWxApi();
    if (!api?.authorize) {
      resolve({ success: false, errMsg: 'authorize unavailable' });
      return;
    }
    api.authorize({
      scope,
      success() {
        resolve({ success: true, errMsg: '' });
      },
      fail(err: { errMsg?: string }) {
        resolve({ success: false, errMsg: err.errMsg || '' });
      },
    });
  });
}

/**
 * WeChat requires the privacy agreement before wx.authorize, otherwise the
 * first camera / mic prompt can fail silently.
 */
function ensurePrivacyAgreed(): Promise<boolean> {
  return new Promise(resolve => {
    const api = getWxApi();
    if (!api?.requirePrivacyAuthorize) {
      resolve(true);
      return;
    }
    api.requirePrivacyAuthorize({
      success() {
        resolve(true);
      },
      fail(err: { errMsg?: string }) {
        logger.warn(`${logPrefix}requirePrivacyAuthorize failed:`, err?.errMsg);
        resolve(false);
      },
    });
  });
}

function isSystemLevelDenial(errMsg: string): boolean {
  const msg = (errMsg || '').toLowerCase();
  return (
    msg.includes('system permission') ||
    msg.includes('system denied') ||
    msg.includes('access denied because of system')
  );
}

export async function getCurrentMediaAuth(): Promise<MediaAuthState> {
  if (!isWeChat) {
    mediaAuthState.value = { camera: true, microphone: true };
    return mediaAuthState.value;
  }
  const authSetting = await getAuthSetting();
  if (!authSetting) {
    return mediaAuthState.value;
  }
  const auth = authFromSetting(authSetting);
  mediaAuthState.value = auth;
  return auth;
}

export function isDeviceAuthorized(
  auth: MediaAuthState,
  device: MediaPermissionDevice
): boolean {
  return device === 'camera' ? auth.camera : auth.microphone;
}

/**
 * Read the current scope state without triggering any WeChat dialog. Safe to
 * call outside a user tap.
 */
export async function peekDevicePermission(
  device: MediaPermissionDevice
): Promise<PermissionCheckResult> {
  if (!isWeChat) {
    return grantedResult(device);
  }
  const authSetting = await getAuthSetting();
  if (!authSetting) {
    return isDeviceAuthorized(mediaAuthState.value, device)
      ? grantedResult(device)
      : deniedResult(device, 'need-authorize');
  }
  const scope = scopeOf(device);
  if (authSetting[scope] === true) {
    return grantedResult(device);
  }
  return deniedResult(
    device,
    authSetting[scope] === false ? 'mini-program' : 'need-authorize'
  );
}

/**
 * Ask WeChat for the scope, showing the native sheet on the first ask. Use
 * peekDevicePermission instead when the caller must not interrupt the user.
 */
export async function requestDevicePermission(
  device: MediaPermissionDevice
): Promise<PermissionCheckResult> {
  if (!isWeChat) {
    return grantedResult(device);
  }
  const peeked = await peekDevicePermission(device);
  if (peeked.granted || peeked.level === 'mini-program') {
    return peeked;
  }
  if (!(await ensurePrivacyAgreed())) {
    return deniedResult(device, 'need-authorize');
  }
  const scope = scopeOf(device);
  const result = await authorizeScope(scope);
  if (result.success) {
    await getCurrentMediaAuth();
    return grantedResult(device);
  }
  if (isSystemLevelDenial(result.errMsg)) {
    return deniedResult(device, 'system');
  }
  const after = await getAuthSetting();
  return deniedResult(
    device,
    after?.[scope] === false ? 'mini-program' : 'need-authorize'
  );
}

/**
 * The action must be fired synchronously from the modal callback, otherwise
 * WeChat no longer treats it as a user gesture and silently ignores it.
 *
 * wx.authorize itself does not need the tap. Privacy must still run first,
 * otherwise the native sheet can fail silently — the same rule as
 * requestDevicePermission.
 */
function runModalAction(
  api: any,
  action: ModalAction,
  device: MediaPermissionDevice,
  done: () => void
) {
  if (action === 'authorize' && api.authorize) {
    void ensurePrivacyAgreed().then(agreed => {
      if (!agreed) {
        done();
        return;
      }
      api.authorize({ scope: scopeOf(device), complete: done });
    });
    return;
  }
  if (action === 'open-setting' && api.openSetting) {
    api.openSetting({ complete: done });
    return;
  }
  done();
}

/**
 * Show a tappable dialog that walks the user to the right place for the given
 * denial level. Callers re-read the auth state afterwards rather than trusting
 * the dialog result. `confirmed` is whether the user tapped the action button.
 */
export function promptDevicePermission(
  result: PermissionCheckResult,
  t: TranslateFn
): Promise<PermissionPromptResult> {
  return new Promise(resolve => {
    const api = getWxApi();
    if (result.granted || !api?.showModal) {
      resolve({ confirmed: false });
      return;
    }
    const config = DENIED_MODAL_CONFIG[result.level as DeniedPermissionLevel];
    api.showModal({
      title: t('Permission prompt'),
      content: t(config.tipKey, { deviceType: t(result.device) }),
      showCancel: config.showCancel,
      confirmText: wxModalButtonText(t(config.confirmKey)),
      cancelText: wxModalButtonText(t('Cancel (short)')),
      success(modalRes: { confirm?: boolean }) {
        if (!modalRes.confirm) {
          resolve({ confirmed: false });
          return;
        }
        runModalAction(api, config.action, result.device, () => {
          resolve({ confirmed: true });
        });
      },
      fail(err: { errMsg?: string }) {
        logger.warn(`${logPrefix}showModal failed:`, err?.errMsg);
        resolve({ confirmed: false });
      },
    });
  });
}

/**
 * Read or request the scope, then show the matching guide if it is still
 * denied. Used by the in-room guard and the pre-room toggles.
 *
 * `cancelled` means the user dismissed the guide, or the denial can only be
 * fixed in system settings. Callers that must keep trying should loop while
 * `!granted && !cancelled`.
 */
export async function guideDevicePermission(
  device: MediaPermissionDevice,
  t: TranslateFn,
  userGesture: boolean
): Promise<GuidePermissionResult> {
  const result = userGesture
    ? await requestDevicePermission(device)
    : await peekDevicePermission(device);
  if (result.granted) {
    return { granted: true, cancelled: false };
  }
  const { confirmed } = await promptDevicePermission(result, t);
  const auth = await getCurrentMediaAuth();
  const granted = isDeviceAuthorized(auth, device);
  if (granted) {
    return { granted: true, cancelled: false };
  }
  const cancelled = !confirmed || result.level === 'system';
  return { granted: false, cancelled };
}
