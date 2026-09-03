import { TUIErrorCode } from '@tencentcloud/tuiroom-engine-js';
import { MessageBox, i18next } from '@tencentcloud/uikit-base-component-react';
import { DeviceError, DeviceType } from 'tuikit-atomicx-react/room';

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

let insecureContextDialogVisible = false;

function showInsecureContextDialog() {
  if (insecureContextDialogVisible) {
    return;
  }
  insecureContextDialogVisible = true;
  MessageBox.alert({
    type: 'error',
    modal: true,
    title: i18next.t('MediaCapture.InsecureContextTitle'),
    content: i18next.t('MediaCapture.InsecureContextContent'),
    confirmText: i18next.t('MediaCapture.GotIt'),
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

function inferDeviceError(error: unknown, deviceType: DeviceType): DeviceError | null {
  const err = error as { code?: number; name?: string; message?: string } | undefined;
  const code = err?.code;

  if (deviceType === DeviceType.Camera) {
    const mapped = code !== undefined ? CAMERA_ERROR_MAP[code] : undefined;
    if (mapped) {
      return mapped;
    }
  } else if (deviceType === DeviceType.Microphone) {
    const mapped = code !== undefined ? MICROPHONE_ERROR_MAP[code] : undefined;
    if (mapped) {
      return mapped;
    }
  } else if (deviceType === DeviceType.ScreenShare) {
    if (err?.name === 'NotReadableError') {
      return DeviceError.NoSystemPermission;
    }
    if (err?.name === 'NotAllowedError' && err.message?.includes('Permission denied by system')) {
      return DeviceError.NoSystemPermission;
    }
    return null;
  }

  // Fallback: TRTC layer wraps getUserMedia errors with numeric codes (e.g. 5302)
  // that don't match TUIErrorCode.ERR_*_NOT_AUTHORIZED, but the error message
  // still carries the browser native reason. Match against those for camera/mic.
  const message = err?.message ?? '';
  if (
    err?.name === 'NotAllowedError'
    || /Permission denied|NotAllowedError|not allowed/i.test(message)
  ) {
    return DeviceError.NoSystemPermission;
  }
  if (err?.name === 'NotReadableError' || /NotReadableError|OccupiedError/i.test(message)) {
    return DeviceError.OccupiedError;
  }
  if (err?.name === 'NotFoundError' || /NotFoundError|no device/i.test(message)) {
    return DeviceError.NoDeviceDetected;
  }

  return null;
}

function showCaptureErrorDialog(deviceType: DeviceType, deviceError: DeviceError) {
  const prefix = DEVICE_TYPE_PREFIX[deviceType];
  let titleKey: string;
  let contentKey: string;

  switch (deviceError) {
    case DeviceError.NoSystemPermission:
      titleKey = `${prefix}.NoSystemPermissionTitle`;
      contentKey = isMobileDevice
        ? `${prefix}.NoSystemPermissionMobile`
        : `${prefix}.NoSystemPermission`;
      break;
    case DeviceError.NotSupportCapture:
      titleKey = `${prefix}.NotSupportCaptureTitle`;
      contentKey = `${prefix}.NotSupportCapture`;
      break;
    case DeviceError.OccupiedError:
      titleKey = `${prefix}.OccupiedErrorTitle`;
      contentKey = `${prefix}.OccupiedError`;
      break;
    case DeviceError.NoDeviceDetected:
      titleKey = `${prefix}.NoDeviceDetectedTitle`;
      contentKey = `${prefix}.NoDeviceDetected`;
      break;
    default:
      titleKey = `${prefix}.UnknownError`;
      contentKey = `${prefix}.UnknownError`;
  }

  if (deviceError === DeviceError.NoSystemPermission) {
    if (isMobileDevice) {
      MessageBox.confirm({
        type: 'error',
        modal: true,
        title: i18next.t(titleKey),
        content: i18next.t(contentKey),
        confirmText: i18next.t('MediaCapture.RefreshPage'),
        cancelText: i18next.t('Room.Cancel'),
        callback: (action?: string) => {
          if (action === 'confirm') {
            window.location.reload();
          }
        },
      });
    } else {
      const settingsUrl = getPermissionSettingsUrl(deviceType);
      if (settingsUrl) {
        MessageBox.confirm({
          type: 'error',
          modal: true,
          title: i18next.t(titleKey),
          content: i18next.t(contentKey),
          confirmText: i18next.t('MediaCapture.GoToSystemSettings'),
          cancelText: i18next.t('Room.Cancel'),
          callback: (action?: string) => {
            if (action === 'confirm') {
              window.open(settingsUrl);
            }
          },
        });
      } else {
        MessageBox.alert({
          type: 'error',
          modal: true,
          title: i18next.t(titleKey),
          content: i18next.t(contentKey),
          confirmText: i18next.t('MediaCapture.GotIt'),
        });
      }
    }
    return;
  }

  if (deviceError === DeviceError.NotSupportCapture) {
    MessageBox.confirm({
      type: 'error',
      modal: true,
      title: i18next.t(titleKey),
      content: i18next.t(contentKey),
      confirmText: i18next.t('MediaCapture.RefreshPage'),
      cancelText: i18next.t('Room.Cancel'),
      callback: (action?: string) => {
        if (action === 'confirm') {
          window.location.reload();
        }
      },
    });
    return;
  }

  MessageBox.alert({
    type: 'error',
    modal: true,
    title: i18next.t(titleKey),
    content: i18next.t(contentKey),
    confirmText: i18next.t('MediaCapture.GotIt'),
  });
}

function showPermissionGuideDialog(deviceType: DeviceType.Camera | DeviceType.Microphone) {
  const prefix = DEVICE_TYPE_PREFIX[deviceType];

  if (isMobileDevice) {
    MessageBox.confirm({
      type: 'error',
      modal: true,
      title: i18next.t(`${prefix}.PermissionBlockedTitle`),
      content: i18next.t(`${prefix}.PermissionBlockedMobile`),
      confirmText: i18next.t('MediaCapture.RefreshPage'),
      cancelText: i18next.t('Room.Cancel'),
      callback: (action?: string) => {
        if (action === 'confirm') {
          window.location.reload();
        }
      },
    });
    return;
  }

  const settingsUrl = getPermissionSettingsUrl(deviceType);
  if (settingsUrl) {
    MessageBox.confirm({
      type: 'error',
      modal: true,
      title: i18next.t(`${prefix}.PermissionBlockedTitle`),
      content: i18next.t(`${prefix}.PermissionBlocked`),
      confirmText: i18next.t('MediaCapture.RefreshPage'),
      cancelText: i18next.t('MediaCapture.GoToSystemSettings'),
      callback: (action?: string) => {
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
    MessageBox.confirm({
      type: 'error',
      modal: true,
      title: i18next.t(`${prefix}.PermissionBlockedTitle`),
      content: i18next.t(`${prefix}.PermissionBlocked`),
      confirmText: i18next.t('MediaCapture.RefreshPage'),
      cancelText: i18next.t('Room.Cancel'),
      callback: (action?: string) => {
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

export function handleMediaCaptureError({ error, deviceType }: MediaCaptureErrorOptions): void {
  if (isInsecureContext && !navigator.mediaDevices) {
    showInsecureContextDialog();
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

export function useMediaCaptureError() {
  return { handleMediaCaptureError };
}
