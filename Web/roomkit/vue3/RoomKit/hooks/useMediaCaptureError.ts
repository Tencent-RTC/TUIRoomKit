import { TUIErrorCode } from '@tencentcloud/tuiroom-engine-js';
import { TUIMessageBox, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { DeviceType, DeviceError } from 'tuikit-atomicx-vue3/room';

const _ua = navigator.userAgent;

function checkInsecureContext(): boolean {
  const { protocol, hostname } = window.location;
  if (protocol === 'https:' || protocol === 'file:') {
    return false;
  }
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return false;
  }
  return true;
}

/** Returns the OS privacy settings deep-link for the given device type, or '' if unsupported. */
function getPermissionSettingsUrl(deviceType: DeviceType): string {
  const isMac = /Macintosh|MacIntel/i.test(_ua) && !/iPhone|iPad/i.test(_ua);
  const isWindows = /Win32|Win64|Windows/i.test(_ua);

  if (isMac) {
    const privacyKeyMap: Partial<Record<DeviceType, string>> = {
      [DeviceType.Camera]: 'Privacy_Camera',
      [DeviceType.Microphone]: 'Privacy_Microphone',
      [DeviceType.ScreenShare]: 'Privacy_ScreenCapture',
    };
    return `x-apple.systempreferences:com.apple.preference.security?${privacyKeyMap[deviceType] ?? ''}`;
  }
  if (isWindows) {
    if (deviceType === DeviceType.Camera) {
      return 'ms-settings:privacy-webcam';
    }
    if (deviceType === DeviceType.Microphone) {
      return 'ms-settings:privacy-microphone';
    }
    return '';
  }
  return '';
}

const isInsecureContext = checkInsecureContext();
const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(_ua) && !/Windows Phone/i.test(_ua);

// Prevent stacking multiple simultaneous insecure-context dialogs.
let insecureContextDialogVisible = false;

function showInsecureContextDialog(t: (key: string) => string) {
  if (insecureContextDialogVisible) {
    return;
  }
  insecureContextDialogVisible = true;
  TUIMessageBox.alert({
    type: 'error',
    modal: false,
    title: t('MediaCapture.InsecureContextTitle'),
    content: t('MediaCapture.InsecureContextContent'),
    confirmText: t('MediaCapture.GotIt'),
    callback: () => {
      insecureContextDialogVisible = false;
    },
  });
}

const CAMERA_ERROR_MAP: Partial<Record<number, DeviceError>> = {
  [TUIErrorCode.ERR_CAMERA_START_FAILED]: DeviceError.NotSupportCapture,
  [TUIErrorCode.ERR_CAMERA_NOT_AUTHORIZED]: DeviceError.NoSystemPermission,
  [TUIErrorCode.ERR_CAMERA_OCCUPIED]: DeviceError.OccupiedError,
  [TUIErrorCode.ERR_CAMERA_DEVICE_EMPTY]: DeviceError.NoDeviceDetected,
};

const MICROPHONE_ERROR_MAP: Partial<Record<number, DeviceError>> = {
  [TUIErrorCode.ERR_MICROPHONE_START_FAILED]: DeviceError.NotSupportCapture,
  [TUIErrorCode.ERR_MICROPHONE_NOT_AUTHORIZED]: DeviceError.NoSystemPermission,
  [TUIErrorCode.ERR_MICROPHONE_OCCUPIED]: DeviceError.OccupiedError,
  [TUIErrorCode.ERR_MICROPHONE_DEVICE_EMPTY]: DeviceError.NoDeviceDetected,
};

const DEVICE_TYPE_PREFIX: Record<DeviceType, string> = {
  [DeviceType.Camera]: 'Camera',
  [DeviceType.Microphone]: 'Microphone',
  [DeviceType.ScreenShare]: 'ScreenShare',
};

/** Queries the browser-level permission state. Returns 'unsupported' when the Permissions API is unavailable. */
async function queryBrowserPermission(
  deviceType: DeviceType.Camera | DeviceType.Microphone,
): Promise<PermissionState | 'unsupported'> {
  const permName = deviceType === DeviceType.Camera ? 'camera' : 'microphone';
  try {
    const status = await navigator.permissions.query({ name: permName as PermissionName });
    return status.state;
  } catch {
    return 'unsupported';
  }
}

/**
 * Maps a raw engine error to a DeviceError for the given device type.
 * Returns null when the error is not a system-blocking capture error
 * (e.g. user-cancelled, rate-limit) — handle those in the caller.
 */
function inferDeviceError(error: unknown, deviceType: DeviceType): DeviceError | null {
  const err = error as { code?: number; name?: string; message?: string } | undefined;
  const code = err?.code;

  if (deviceType === DeviceType.Camera) {
    return code !== undefined ? (CAMERA_ERROR_MAP[code] ?? null) : null;
  }
  if (deviceType === DeviceType.Microphone) {
    return code !== undefined ? (MICROPHONE_ERROR_MAP[code] ?? null) : null;
  }
  if (deviceType === DeviceType.ScreenShare) {
    if (err?.name === 'NotReadableError') {
      return DeviceError.NoSystemPermission;
    }
    if (err?.name === 'NotAllowedError' && err.message?.includes('Permission denied by system')) {
      return DeviceError.NoSystemPermission;
    }
  }

  return null;
}

function showCaptureErrorDialog(deviceType: DeviceType, deviceError: DeviceError) {
  const { t } = useUIKit();
  const prefix = DEVICE_TYPE_PREFIX[deviceType];
  let title: string;
  let content: string;

  switch (deviceError) {
    case DeviceError.NoSystemPermission:
      title = `${prefix}.NoSystemPermissionTitle`;
      content = isMobileDevice ? `${prefix}.NoSystemPermissionMobile` : `${prefix}.NoSystemPermission`;
      break;
    case DeviceError.NotSupportCapture:
      title = `${prefix}.NotSupportCaptureTitle`;
      content = `${prefix}.NotSupportCapture`;
      break;
    case DeviceError.OccupiedError:
      title = `${prefix}.OccupiedErrorTitle`;
      content = `${prefix}.OccupiedError`;
      break;
    case DeviceError.NoDeviceDetected:
      title = `${prefix}.NoDeviceDetectedTitle`;
      content = `${prefix}.NoDeviceDetected`;
      break;
    default:
      title = `${prefix}.UnknownError`;
      content = `${prefix}.UnknownError`;
  }

  if (deviceError === DeviceError.NoSystemPermission) {
    if (isMobileDevice) {
      TUIMessageBox.confirm({
        type: 'error',
        modal: false,
        title: t(title),
        content: t(content),
        confirmText: t('MediaCapture.RefreshPage'),
        cancelText: t('Room.Cancel'),
        callback: (action: string | undefined) => {
          if (action === 'confirm') {
            window.location.reload();
          }
        },
      });
    } else {
      const settingsUrl = getPermissionSettingsUrl(deviceType);
      if (settingsUrl) {
        TUIMessageBox.confirm({
          type: 'error',
          modal: false,
          title: t(title),
          content: t(content),
          confirmText: t('MediaCapture.GoToSystemSettings'),
          cancelText: t('Room.Cancel'),
          callback: (action: string | undefined) => {
            if (action === 'confirm') {
              window.open(settingsUrl);
            }
          },
        });
      } else {
        TUIMessageBox.alert({
          type: 'error',
          modal: false,
          title: t(title),
          content: t(content),
          confirmText: t('MediaCapture.GotIt'),
        });
      }
    }
    return;
  }

  if (deviceError === DeviceError.NotSupportCapture) {
    TUIMessageBox.confirm({
      type: 'error',
      modal: false,
      title: t(title),
      content: t(content),
      confirmText: t('MediaCapture.RefreshPage'),
      cancelText: t('Room.Cancel'),
      callback: (action: string | undefined) => {
        if (action === 'confirm') {
          window.location.reload();
        }
      },
    });
    return;
  }

  TUIMessageBox.alert({
    type: 'error',
    modal: false,
    title: t(title),
    content: t(content),
    confirmText: t('MediaCapture.GotIt'),
  });
}

/**
 * Shows a permission guide dialog when the browser state is denied/unsupported.
 * Guides the user to refresh the page and check system settings.
 *
 * Desktop: "Refresh Page" (primary) + "Go to System Settings" (secondary).
 * Mobile: unified guide with "Refresh Page" CTA.
 */
function showPermissionGuideDialog(deviceType: DeviceType.Camera | DeviceType.Microphone) {
  const { t } = useUIKit();
  const prefix = DEVICE_TYPE_PREFIX[deviceType];

  if (isMobileDevice) {
    TUIMessageBox.confirm({
      type: 'error',
      modal: false,
      title: t(`${prefix}.PermissionBlockedTitle`),
      content: t(`${prefix}.PermissionBlockedMobile`),
      confirmText: t('MediaCapture.RefreshPage'),
      cancelText: t('Room.Cancel'),
      callback: (action: string | undefined) => {
        if (action === 'confirm') {
          window.location.reload();
        }
      },
    });
    return;
  }

  const settingsUrl = getPermissionSettingsUrl(deviceType);
  if (settingsUrl) {
    TUIMessageBox.confirm({
      type: 'error',
      modal: false,
      title: t(`${prefix}.PermissionBlockedTitle`),
      content: t(`${prefix}.PermissionBlocked`),
      confirmText: t('MediaCapture.RefreshPage'),
      cancelText: t('MediaCapture.GoToSystemSettings'),
      callback: (action: string | undefined) => {
        if (action === 'confirm') {
          window.location.reload();
          return;
        }
        if (action === 'cancel') {
          window.open(settingsUrl);
        }
      },
    });
  } else {
    TUIMessageBox.confirm({
      type: 'error',
      modal: false,
      title: t(`${prefix}.PermissionBlockedTitle`),
      content: t(`${prefix}.PermissionBlocked`),
      confirmText: t('MediaCapture.RefreshPage'),
      cancelText: t('Room.Cancel'),
      callback: (action: string | undefined) => {
        if (action === 'confirm') {
          window.location.reload();
        }
      },
    });
  }
}

export interface MediaCaptureErrorOptions {
  error: unknown;
  deviceType: DeviceType;
}

/**
 * Handles a raw capture error by showing the appropriate dialog.
 *
 * Non-system-blocking errors (rate-limit, room-permission, user-cancelled)
 * return null from inferDeviceError and are silently ignored — handle them
 * with TUIToast in the caller before invoking this function.
 *
 * For camera/mic, the browser permission state is queried asynchronously:
 *   - 'denied' or unsupported → ambiguous two-step guide
 *   - 'granted' | 'prompt'   → confirmed OS denial, point to system settings
 */
export function handleMediaCaptureError({ error, deviceType }: MediaCaptureErrorOptions): void {
  const { t } = useUIKit();

  if (isInsecureContext && !navigator.mediaDevices) {
    showInsecureContextDialog(t);
    return;
  }

  const deviceError = inferDeviceError(error, deviceType);
  if (deviceError === null) {
    return;
  }

  if (
    deviceError === DeviceError.NoSystemPermission
    && (deviceType === DeviceType.Camera || deviceType === DeviceType.Microphone)
  ) {
    queryBrowserPermission(deviceType).then((browserState) => {
      // eslint-disable-next-line no-console
      console.debug(
        `[MediaCaptureError] deviceType=${DeviceType[deviceType]}`,
        `| deviceError=${DeviceError[deviceError] ?? deviceError}`,
        `| browser-permission=${browserState}`,
        `| platform=${isMobileDevice ? 'Mobile' : 'Desktop'}`,
        error,
      );
      if (browserState === 'denied' || browserState === 'unsupported') {
        showPermissionGuideDialog(deviceType);
      } else {
        showCaptureErrorDialog(deviceType, DeviceError.NoSystemPermission);
      }
    });
    return;
  }

  showCaptureErrorDialog(deviceType, deviceError);
}
