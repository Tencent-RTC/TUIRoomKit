import {
  computed,
  effectScope,
  h,
  ref,
  render,
  watch,
} from 'vue';
import { TUIErrorCode } from '@tencentcloud/tuiroom-engine-js';
import { DeviceError, DeviceType, useDeviceState } from 'tuikit-atomicx-vue3/room';
import { TUIToast } from '../../base';
import { t } from '../../i18n';
import { ensureAppendHost } from '../../base/command/appendTo';
import DeviceFaultDialog from './DeviceFaultDialog.vue';

export type DeviceFaultKind =
  | 'insecure'
  | 'browser-blocked'
  | 'system-blocked'
  | 'no-device'
  | 'occupied'
  | 'start-failed';

/** Which device the copy talks about; `both` is a camera and microphone failing together. */
export type DeviceFaultTarget = 'camera' | 'microphone' | 'both' | 'screen';

export interface DeviceFaultAction {
  labelKey: string;
  run: () => void;
}

export interface DeviceFaultView {
  kind: DeviceFaultKind;
  target: DeviceFaultTarget;
  titleKey: string;
  bodyKey: string;
  actions: DeviceFaultAction[];
}

const { userAgent } = navigator;
const isMac = /Macintosh|MacIntel/i.test(userAgent) && !/iPhone|iPad/i.test(userAgent);
const isWindows = /Win32|Win64|Windows/i.test(userAgent);

export function checkInsecureContext(): boolean {
  const { protocol, hostname } = window.location;
  if (protocol === 'https:' || protocol === 'file:') {
    return false;
  }
  return hostname !== 'localhost' && hostname !== '127.0.0.1';
}

/** The OS privacy pane deep link for the target, or '' where the platform has none. */
function getPermissionSettingsUrl(target: DeviceFaultTarget): string {
  if (isMac) {
    const pane: Record<DeviceFaultTarget, string> = {
      camera: 'Privacy_Camera',
      microphone: 'Privacy_Microphone',
      screen: 'Privacy_ScreenCapture',
      both: 'Privacy_Camera',
    };
    return `x-apple.systempreferences:com.apple.preference.security?${pane[target]}`;
  }
  if (isWindows) {
    if (target === 'microphone') {
      return 'ms-settings:privacy-microphone';
    }
    if (target === 'camera' || target === 'both') {
      return 'ms-settings:privacy-webcam';
    }
  }
  return '';
}

/** Queries the browser permission state; 'unsupported' when the Permissions API is missing. */
async function queryBrowserPermission(
  target: 'camera' | 'microphone',
): Promise<PermissionState | 'unsupported'> {
  try {
    const status = await navigator.permissions.query({ name: target as PermissionName });
    return status.state;
  } catch {
    return 'unsupported';
  }
}

const CAMERA_ERROR_CODES = {
  startFailed: TUIErrorCode.ERR_CAMERA_START_FAILED,
  notAuthorized: TUIErrorCode.ERR_CAMERA_NOT_AUTHORIZED,
  occupied: TUIErrorCode.ERR_CAMERA_OCCUPIED,
  deviceEmpty: TUIErrorCode.ERR_CAMERA_DEVICE_EMPTY,
};

const MICROPHONE_ERROR_CODES = {
  startFailed: TUIErrorCode.ERR_MICROPHONE_START_FAILED,
  notAuthorized: TUIErrorCode.ERR_MICROPHONE_NOT_AUTHORIZED,
  occupied: TUIErrorCode.ERR_MICROPHONE_OCCUPIED,
  deviceEmpty: TUIErrorCode.ERR_MICROPHONE_DEVICE_EMPTY,
};

function readError(error: unknown) {
  return (error ?? {}) as { code?: number; name?: string; message?: string };
}

/**
 * The engine reports a capture failure through its own error codes, and passes the
 * browser's DOMException through untranslated when it has none, so both are read here.
 */
function classifyCaptureError(
  error: unknown,
  target: 'camera' | 'microphone',
  browserPermission: PermissionState | 'unsupported',
): DeviceFaultKind | null {
  const { code, name } = readError(error);
  const codes = target === 'camera' ? CAMERA_ERROR_CODES : MICROPHONE_ERROR_CODES;

  if (code === codes.notAuthorized || name === 'NotAllowedError' || name === 'SecurityError') {
    /* Granted and still failing means the OS blocked the browser itself; anything else
       means this page has not been allowed yet. */
    return browserPermission === 'granted' ? 'system-blocked' : 'browser-blocked';
  }
  if (code === codes.occupied || name === 'NotReadableError' || name === 'AbortError') {
    return 'occupied';
  }
  if (code === codes.deviceEmpty || name === 'NotFoundError' || name === 'OverconstrainedError') {
    return 'no-device';
  }
  if (code === codes.startFailed) {
    return 'start-failed';
  }
  return null;
}

/**
 * A share is granted per call through the picker rather than held as a site permission,
 * so there is no browser state to consult: a refusal that survives the picker came from
 * the OS, and a picker the user closed is not a fault at all.
 */
function classifyShareError(error: unknown): DeviceFaultKind | null {
  const { name, message } = readError(error);
  if (name === 'NotReadableError') {
    return 'system-blocked';
  }
  if (name === 'NotAllowedError' && message?.includes('Permission denied by system')) {
    return 'system-blocked';
  }
  if (name === 'NotSupportedError') {
    return 'start-failed';
  }
  return null;
}

/**
 * Turns the error a failed start threw into the fault the dialog explains. Returns null
 * for the failures the device is not to blame for — a closed picker, a rate limit, a room
 * rule — which stay the caller's to report.
 */
export function classifyDeviceFault(
  error: unknown,
  target: 'camera' | 'microphone' | 'screen',
  page: { insecure: boolean; browserPermission: PermissionState | 'unsupported' },
): DeviceFaultKind | null {
  const kind = target === 'screen'
    ? classifyShareError(error)
    : classifyCaptureError(error, target, page.browserPermission);
  if (kind === null) {
    return null;
  }
  // An insecure page is the reason behind all of them, so it outranks what it caused.
  return page.insecure ? 'insecure' : kind;
}

/* The fault state is one for the whole page, so the buttons can act on it directly. */
const cameraFault = ref<DeviceFaultKind>();
const microphoneFault = ref<DeviceFaultKind>();
const screenFault = ref<DeviceFaultKind>();
const faultDialogOpen = ref(false);
const errorTitle = ref('');
const errorDesc = ref('');

/**
 * The one fault the dialog speaks about. A share fault answers something the user just
 * asked for, so it takes the dialog ahead of a camera or microphone fault that the tile is
 * already reporting. With both devices down the camera's kind words the pair.
 */
const activeFault = computed<{ kind: DeviceFaultKind; target: DeviceFaultTarget } | null>(() => {
  if (screenFault.value) {
    return { kind: screenFault.value, target: 'screen' };
  }
  if (cameraFault.value && microphoneFault.value) {
    return { kind: cameraFault.value, target: 'both' };
  }
  if (cameraFault.value) {
    return { kind: cameraFault.value, target: 'camera' };
  }
  if (microphoneFault.value) {
    return { kind: microphoneFault.value, target: 'microphone' };
  }
  return null;
});

function closeDialog() {
  faultDialogOpen.value = false;
}

/* Leaves the dialog open: the user has to come back from the settings pane and act on
   it again, and its body is the instruction for doing so. */
function openSystemSettings() {
  const url = getPermissionSettingsUrl(activeFault.value?.target ?? 'both');
  if (url) {
    window.open(url);
    return;
  }
  // Platforms without a deep link open nothing, so say so rather than look broken.
  TUIToast.info(t('Device.Fault.OpenSettingsToast'));
}

function reloadPage() {
  window.location.reload();
}

const KEEP_CLOSED: DeviceFaultAction = { labelKey: 'Device.Fault.KeepClosed', run: closeDialog };
const CONTINUE_CAM: DeviceFaultAction = { labelKey: 'Device.Fault.ContinueCamOff', run: closeDialog };
const CONTINUE_MIC: DeviceFaultAction = { labelKey: 'Device.Fault.ContinueMicOff', run: closeDialog };
const OPEN_SETTINGS: DeviceFaultAction = { labelKey: 'Device.Fault.OpenSystemSettings', run: openSystemSettings };
const REFRESH: DeviceFaultAction = { labelKey: 'Device.Fault.Refresh', run: reloadPage };
const JOIN_WATCH: DeviceFaultAction = { labelKey: 'Device.Fault.JoinWatchOnly', run: closeDialog };
const CLOSE: DeviceFaultAction = { labelKey: 'Device.Fault.GotIt', run: closeDialog };

interface FaultCopy {
  titleKey: string;
  bodyKey: string;
  actions: DeviceFaultAction[];
}

/** An insecure page blocks every device the same way, so one entry serves all targets. */
const INSECURE_COPY: FaultCopy = {
  titleKey: 'Device.Fault.InsecureTitle',
  bodyKey: 'Device.Fault.InsecureDialogBody',
  actions: [CLOSE],
};

/**
 * Stands in for the share faults the engine cannot actually report — it has no notion of
 * a missing or occupied screen, and a share is never blocked at the site-permission
 * level. Reached only if that ever changes, so it says no more than it knows.
 */
const SHARE_FAILED_COPY: FaultCopy = {
  titleKey: 'Device.Fault.ScreenFailedTitle',
  bodyKey: 'Device.Fault.ScreenFailedDialogBody',
  actions: [CLOSE],
};

const COPY: Record<DeviceFaultKind, Record<DeviceFaultTarget, FaultCopy>> = {
  'insecure': {
    both: INSECURE_COPY,
    camera: INSECURE_COPY,
    microphone: INSECURE_COPY,
    screen: INSECURE_COPY,
  },
  'browser-blocked': {
    both: {
      titleKey: 'Device.Fault.BrowserBothTitle',
      bodyKey: 'Device.Fault.BrowserBothDialogBody',
      // The body sends the user to the site settings, and the grant only lands on reload.
      actions: [REFRESH, KEEP_CLOSED],
    },
    camera: {
      titleKey: 'Device.Fault.BrowserTitle',
      bodyKey: 'Device.Fault.BrowserDialogBody',
      actions: [REFRESH, CONTINUE_CAM],
    },
    microphone: {
      titleKey: 'Device.Fault.BrowserTitle',
      bodyKey: 'Device.Fault.BrowserDialogBody',
      actions: [REFRESH, CONTINUE_MIC],
    },
    screen: SHARE_FAILED_COPY,
  },
  /* macOS applies a privacy grant on the next launch, so a reload there fails the same way. */
  'system-blocked': {
    both: {
      titleKey: 'Device.Fault.SystemBothTitle',
      bodyKey: isMac
        ? 'Device.Fault.SystemBothRestartDialogBody'
        : 'Device.Fault.SystemBothDialogBody',
      actions: isMac
        ? [OPEN_SETTINGS, KEEP_CLOSED]
        : [OPEN_SETTINGS, REFRESH, KEEP_CLOSED],
    },
    camera: {
      titleKey: 'Device.Fault.SystemTitle',
      bodyKey: isMac
        ? 'Device.Fault.SystemRestartDialogBody'
        : 'Device.Fault.SystemDialogBody',
      actions: isMac
        ? [OPEN_SETTINGS, CONTINUE_CAM]
        : [OPEN_SETTINGS, REFRESH, CONTINUE_CAM],
    },
    microphone: {
      titleKey: 'Device.Fault.SystemTitle',
      bodyKey: isMac
        ? 'Device.Fault.SystemRestartDialogBody'
        : 'Device.Fault.SystemDialogBody',
      actions: isMac
        ? [OPEN_SETTINGS, CONTINUE_MIC]
        : [OPEN_SETTINGS, REFRESH, CONTINUE_MIC],
    },
    /* No reload offered: granting screen recording on macOS only takes effect after the
       browser itself restarts, so a refresh would leave the share failing the same way. */
    screen: {
      titleKey: 'Device.Fault.ScreenSystemTitle',
      bodyKey: 'Device.Fault.ScreenSystemDialogBody',
      actions: [OPEN_SETTINGS, CLOSE],
    },
  },
  'no-device': {
    both: {
      titleKey: 'Device.Fault.NoDeviceBothTitle',
      bodyKey: 'Device.Fault.NoDeviceBothDialogBody',
      actions: [JOIN_WATCH],
    },
    camera: {
      titleKey: 'Device.Fault.NoDeviceTitle',
      bodyKey: 'Device.Fault.NoDeviceCamDialogBody',
      actions: [CONTINUE_CAM],
    },
    microphone: {
      titleKey: 'Device.Fault.NoDeviceTitle',
      bodyKey: 'Device.Fault.NoDeviceMicDialogBody',
      actions: [CONTINUE_MIC],
    },
    screen: SHARE_FAILED_COPY,
  },
  'occupied': {
    both: {
      titleKey: 'Device.Fault.OccupiedBothTitle',
      bodyKey: 'Device.Fault.OccupiedBothDialogBody',
      actions: [REFRESH, KEEP_CLOSED],
    },
    camera: {
      titleKey: 'Device.Fault.OccupiedTitle',
      bodyKey: 'Device.Fault.OccupiedDialogBody',
      actions: [REFRESH, CONTINUE_CAM],
    },
    microphone: {
      titleKey: 'Device.Fault.OccupiedTitle',
      bodyKey: 'Device.Fault.OccupiedDialogBody',
      actions: [REFRESH, CONTINUE_MIC],
    },
    screen: SHARE_FAILED_COPY,
  },
  'start-failed': {
    both: {
      titleKey: 'Device.Fault.StartFailedBothTitle',
      bodyKey: 'Device.Fault.StartFailedDialogBody',
      actions: [REFRESH, KEEP_CLOSED],
    },
    camera: {
      titleKey: 'Device.Fault.StartFailedTitle',
      bodyKey: 'Device.Fault.StartFailedDialogBody',
      actions: [REFRESH, CONTINUE_CAM],
    },
    microphone: {
      titleKey: 'Device.Fault.StartFailedTitle',
      bodyKey: 'Device.Fault.StartFailedDialogBody',
      actions: [REFRESH, CONTINUE_MIC],
    },
    /* The only non-permission share failure the engine reports is an unsupported browser,
       which a reload cannot change. */
    screen: {
      titleKey: 'Device.Fault.ScreenUnsupportedTitle',
      bodyKey: 'Device.Fault.ScreenUnsupportedDialogBody',
      actions: [CLOSE],
    },
  },
};

export function resolveDeviceFaultView(
  kind: DeviceFaultKind,
  target: DeviceFaultTarget,
): DeviceFaultView {
  return { kind, target, ...COPY[kind][target] };
}

/**
 * One string serves the camera and the microphone, so the device name is filled in here.
 * `device` reads as prose; `devicePane` is the label the OS puts on its privacy pane.
 */
function faultText(key: string, target: DeviceFaultTarget): string {
  const mic = target === 'microphone';
  return t(key, {
    device: t(mic ? 'Device.Fault.NameMic' : 'Device.Fault.NameCam'),
    devicePane: t(mic ? 'Device.Fault.PaneMic' : 'Device.Fault.PaneCam'),
  });
}

const dialogView = computed(() => {
  const fault = activeFault.value;
  return fault ? resolveDeviceFaultView(fault.kind, fault.target) : null;
});

function openFaultDialog() {
  const faultView = dialogView.value;
  if (!faultView) {
    return;
  }
  errorTitle.value = faultText(faultView.titleKey, faultView.target);
  errorDesc.value = faultText(faultView.bodyKey, faultView.target);
  faultDialogOpen.value = true;
}

/**
 * Called from the catch of a failed open or test. Classification comes only from the
 * thrown error — the same path the previous kit used — so a refusal the engine never
 * wrote into lastError is still reported, and an unrecognised error is left alone.
 */
async function handleDeviceError(
  deviceType: DeviceType.Camera | DeviceType.Microphone,
  error: unknown,
) {
  const target = deviceType === DeviceType.Camera ? 'camera' : 'microphone';
  const kind = classifyDeviceFault(error, target, {
    insecure: checkInsecureContext(),
    browserPermission: await queryBrowserPermission(target),
  });
  if (kind === null) {
    return;
  }
  if (target === 'camera') {
    cameraFault.value = kind;
  } else {
    microphoneFault.value = kind;
  }
  openFaultDialog();
}

/**
 * Reports whether the error was a capture fault worth a dialog. A cancelled picker, a
 * rate limit, or a room rule is not, and stays the caller's to surface.
 */
function handleScreenShareError(error: unknown): boolean {
  const kind = classifyDeviceFault(error, 'screen', {
    insecure: checkInsecureContext(),
    browserPermission: 'unsupported',
  });
  if (kind === null) {
    return false;
  }
  screenFault.value = kind;
  openFaultDialog();
  return true;
}

/**
 * A start that finally works ends the fault. The lastError watchers cannot do it alone:
 * a fault raised while lastError stayed clean never changes that ref, so nothing fires.
 */
function clearDeviceFault(deviceType: DeviceType.Camera | DeviceType.Microphone) {
  if (deviceType === DeviceType.Camera) {
    cameraFault.value = undefined;
  } else {
    microphoneFault.value = undefined;
  }
  if (cameraFault.value || microphoneFault.value || screenFault.value) {
    return;
  }
  errorTitle.value = '';
  errorDesc.value = '';
  faultDialogOpen.value = false;
}

let dialogContainer: HTMLElement | null = null;
function renderDialog() {
  if (!faultDialogOpen.value || !dialogView.value) {
    if (dialogContainer) {
      render(null, dialogContainer);
    }
    return;
  }
  /* The dialog belongs to no room or page, so it goes to a host on the body. That host
     is a RoomKitProvider of its own, which is what carries the theme tokens. */
  const host = ensureAppendHost(document.body).host.value;
  if (!host) {
    return;
  }
  dialogContainer ??= document.createElement('div');
  const vnode = h(DeviceFaultDialog, {
    open: true,
    faultView: dialogView.value,
    host,
    title: errorTitle.value,
    description: errorDesc.value,
    close: closeDialog,
  });
  render(vnode, dialogContainer);
}

/* The only part that has to run inside a component: the device state comes from there. */
function startWatching() {
  const { cameraLastError, microphoneLastError } = useDeviceState();

  // No device state backs a share fault, so closing the dialog is what ends it.
  watch(faultDialogOpen, (open) => {
    if (!open) {
      screenFault.value = undefined;
    }
  });

  /* lastError recovering only clears the matching fault; opening a dialog still goes
     through handleDeviceError with the thrown error from the caller's catch. */
  watch(cameraLastError, (error) => {
    if (error === DeviceError.NoError) {
      clearDeviceFault(DeviceType.Camera);
    }
  });
  watch(microphoneLastError, (error) => {
    if (error === DeviceError.NoError) {
      clearDeviceFault(DeviceType.Microphone);
    }
  });

  watch([faultDialogOpen, dialogView, errorTitle, errorDesc], renderDialog, { immediate: true });
}

const deviceFault = {
  errorTitle,
  errorDesc,
  cameraFault,
  microphoneFault,
  handleDeviceError,
  clearDeviceFault,
  handleScreenShareError,
};

export type DeviceFaultController = typeof deviceFault;

let watching = false;

export function useDeviceFault(): DeviceFaultController {
  if (!watching) {
    watching = true;
    // Detached, so the watchers outlive whichever component happened to call first.
    effectScope(true).run(startWatching);
  }
  return deviceFault;
}
