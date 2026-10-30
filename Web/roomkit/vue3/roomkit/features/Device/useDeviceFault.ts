import {
  effectScope,
  h,
  ref,
  render,
  watch,
} from 'vue';
import { TUIErrorCode } from '@tencentcloud/tuiroom-engine-js';
import { getPlatform } from '@tencentcloud/universal-api';
import { DeviceError, DeviceType, useDeviceState } from 'tuikit-atomicx-vue3/room';
import { TUIToast, t, resolveOverlayHost } from '../../base';
import DeviceFaultDialog from './DeviceFaultDialog.vue';
import DeviceFaultSheet from './DeviceFaultSheet.vue';

export type DeviceFaultKind =
  | 'insecure'
  | 'browser-blocked'
  | 'system-blocked'
  | 'no-device'
  | 'occupied'
  | 'start-failed';

/** Which device the copy talks about. */
export type DeviceFaultTarget = 'camera' | 'microphone' | 'screen';

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
const isH5 = getPlatform() !== 'pc';

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
    };
    return `x-apple.systempreferences:com.apple.preference.security?${pane[target]}`;
  }
  if (isWindows) {
    if (target === 'microphone') {
      return 'ms-settings:privacy-microphone';
    }
    if (target === 'camera') {
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
/** The fault the last click asked the dialog to explain. */
const dialogFault = ref<{ kind: DeviceFaultKind; target: DeviceFaultTarget } | null>(null);
const errorTitle = ref('');
const errorDesc = ref('');

function closeDialog() {
  faultDialogOpen.value = false;
  dialogFault.value = null;
}

/* Leaves the dialog open: the user has to come back from the settings pane and act on
   it again, and its body is the instruction for doing so. */
function openSystemSettings() {
  const url = getPermissionSettingsUrl(dialogFault.value?.target ?? 'camera');
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

const CONTINUE_CAM: DeviceFaultAction = { labelKey: 'Device.Fault.ContinueCamOff', run: closeDialog };
const CONTINUE_MIC: DeviceFaultAction = { labelKey: 'Device.Fault.ContinueMicOff', run: closeDialog };
const OPEN_SETTINGS: DeviceFaultAction = { labelKey: 'Device.Fault.OpenSystemSettings', run: openSystemSettings };
const REFRESH: DeviceFaultAction = { labelKey: 'Device.Fault.Refresh', run: reloadPage };
const NOT_NOW: DeviceFaultAction = { labelKey: 'Device.Fault.NotNow', run: closeDialog };
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

type FaultText = Pick<FaultCopy, 'titleKey' | 'bodyKey'>;

/** Camera and microphone share this wording; each entry only adds its own continue action. */
const BROWSER_BLOCKED_TEXT: FaultText = {
  titleKey: 'Device.Fault.BrowserTitle',
  bodyKey: 'Device.Fault.BrowserDialogBody',
};

/* macOS applies a privacy grant on the next launch, so a reload there fails the same way. */
const SYSTEM_CAPTURE_TEXT: FaultText = {
  titleKey: 'Device.Fault.SystemTitle',
  bodyKey: isMac
    ? 'Device.Fault.SystemRestartDialogBody'
    : 'Device.Fault.SystemDialogBody',
};
const SYSTEM_CAPTURE_LEADING: DeviceFaultAction[] = isMac
  ? [OPEN_SETTINGS]
  : [OPEN_SETTINGS, REFRESH];

const OCCUPIED_TEXT: FaultText = {
  titleKey: 'Device.Fault.OccupiedTitle',
  bodyKey: 'Device.Fault.OccupiedDialogBody',
};

const START_FAILED_TEXT: FaultText = {
  titleKey: 'Device.Fault.StartFailedTitle',
  bodyKey: 'Device.Fault.StartFailedDialogBody',
};

const COPY: Record<DeviceFaultKind, Record<DeviceFaultTarget, FaultCopy>> = {
  'insecure': {
    camera: INSECURE_COPY,
    microphone: INSECURE_COPY,
    screen: INSECURE_COPY,
  },
  'browser-blocked': {
    camera: { ...BROWSER_BLOCKED_TEXT, actions: [REFRESH, CONTINUE_CAM] },
    microphone: { ...BROWSER_BLOCKED_TEXT, actions: [REFRESH, CONTINUE_MIC] },
    screen: SHARE_FAILED_COPY,
  },
  'system-blocked': {
    camera: { ...SYSTEM_CAPTURE_TEXT, actions: [...SYSTEM_CAPTURE_LEADING, CONTINUE_CAM] },
    microphone: { ...SYSTEM_CAPTURE_TEXT, actions: [...SYSTEM_CAPTURE_LEADING, CONTINUE_MIC] },
    /* No reload offered: granting screen recording on macOS only takes effect after the
       browser itself restarts, so a refresh would leave the share failing the same way. */
    screen: {
      titleKey: 'Device.Fault.ScreenSystemTitle',
      bodyKey: 'Device.Fault.ScreenSystemDialogBody',
      actions: [OPEN_SETTINGS, CLOSE],
    },
  },
  'no-device': {
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
    camera: { ...OCCUPIED_TEXT, actions: [REFRESH, CONTINUE_CAM] },
    microphone: { ...OCCUPIED_TEXT, actions: [REFRESH, CONTINUE_MIC] },
    screen: SHARE_FAILED_COPY,
  },
  'start-failed': {
    camera: { ...START_FAILED_TEXT, actions: [REFRESH, CONTINUE_CAM] },
    microphone: { ...START_FAILED_TEXT, actions: [REFRESH, CONTINUE_MIC] },
    /* The only non-permission share failure the engine reports is an unsupported browser,
       which a reload cannot change. */
    screen: {
      titleKey: 'Device.Fault.ScreenUnsupportedTitle',
      bodyKey: 'Device.Fault.ScreenUnsupportedDialogBody',
      actions: [CLOSE],
    },
  },
};

/**
 * H5 title and body follow the previous RoomKit mobile strings. A phone has no system
 * settings deep link, so permission faults offer a refresh and a dismiss. Occupied and
 * missing devices stay a single acknowledgement, as they did there.
 */
const H5_RETRY: DeviceFaultAction[] = [REFRESH, NOT_NOW];
const H5_ACK: DeviceFaultAction[] = [CLOSE];

const H5_INSECURE_TEXT: FaultText = {
  titleKey: 'Device.Fault.InsecureTitle',
  bodyKey: 'Device.Fault.H5InsecureBody',
};
const H5_BROWSER_CAM_TEXT: FaultText = {
  titleKey: 'Device.Fault.H5BrowserTitleCam',
  bodyKey: 'Device.Fault.H5BrowserBodyCam',
};
const H5_BROWSER_MIC_TEXT: FaultText = {
  titleKey: 'Device.Fault.H5BrowserTitleMic',
  bodyKey: 'Device.Fault.H5BrowserBodyMic',
};
const H5_SYSTEM_CAM_TEXT: FaultText = {
  titleKey: 'Device.Fault.H5SystemTitleCam',
  bodyKey: 'Device.Fault.H5SystemBodyCam',
};
const H5_SYSTEM_MIC_TEXT: FaultText = {
  titleKey: 'Device.Fault.H5SystemTitleMic',
  bodyKey: 'Device.Fault.H5SystemBodyMic',
};
const H5_NO_DEVICE_CAM_TEXT: FaultText = {
  titleKey: 'Device.Fault.H5NoDeviceTitleCam',
  bodyKey: 'Device.Fault.H5NoDeviceBodyCam',
};
const H5_NO_DEVICE_MIC_TEXT: FaultText = {
  titleKey: 'Device.Fault.H5NoDeviceTitleMic',
  bodyKey: 'Device.Fault.H5NoDeviceBodyMic',
};
const H5_OCCUPIED_CAM_TEXT: FaultText = {
  titleKey: 'Device.Fault.H5OccupiedTitleCam',
  bodyKey: 'Device.Fault.H5OccupiedBodyCam',
};
const H5_OCCUPIED_MIC_TEXT: FaultText = {
  titleKey: 'Device.Fault.H5OccupiedTitleMic',
  bodyKey: 'Device.Fault.H5OccupiedBodyMic',
};
const H5_START_CAM_TEXT: FaultText = {
  titleKey: 'Device.Fault.H5StartTitleCam',
  bodyKey: 'Device.Fault.H5StartBodyCam',
};
const H5_START_MIC_TEXT: FaultText = {
  titleKey: 'Device.Fault.H5StartTitleMic',
  bodyKey: 'Device.Fault.H5StartBodyMic',
};

/** Titles differ by device; the actions are the same for both. */
function h5Pair(
  camera: FaultText,
  microphone: FaultText,
  actions: DeviceFaultAction[],
): Record<'camera' | 'microphone', FaultCopy> {
  return {
    camera: { ...camera, actions },
    microphone: { ...microphone, actions },
  };
}

const H5_COPY: Record<DeviceFaultKind, Record<'camera' | 'microphone', FaultCopy>> = {
  'insecure': h5Pair(H5_INSECURE_TEXT, H5_INSECURE_TEXT, H5_ACK),
  'browser-blocked': h5Pair(H5_BROWSER_CAM_TEXT, H5_BROWSER_MIC_TEXT, H5_RETRY),
  'system-blocked': h5Pair(H5_SYSTEM_CAM_TEXT, H5_SYSTEM_MIC_TEXT, H5_RETRY),
  'no-device': h5Pair(H5_NO_DEVICE_CAM_TEXT, H5_NO_DEVICE_MIC_TEXT, H5_ACK),
  'occupied': h5Pair(H5_OCCUPIED_CAM_TEXT, H5_OCCUPIED_MIC_TEXT, H5_ACK),
  'start-failed': h5Pair(H5_START_CAM_TEXT, H5_START_MIC_TEXT, H5_RETRY),
};

export function resolveDeviceFaultView(
  kind: DeviceFaultKind,
  target: DeviceFaultTarget,
): DeviceFaultView {
  if (isH5 && target !== 'screen') {
    return { kind, target, ...H5_COPY[kind][target] };
  }
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

function openFaultView(): DeviceFaultView | null {
  const fault = dialogFault.value;
  return fault ? resolveDeviceFaultView(fault.kind, fault.target) : null;
}

function openFaultDialog(fault: { kind: DeviceFaultKind; target: DeviceFaultTarget }) {
  dialogFault.value = fault;
  const faultView = resolveDeviceFaultView(fault.kind, fault.target);
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
  openFaultDialog({ kind, target });
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
  openFaultDialog({ kind, target: 'screen' });
  return true;
}

/**
 * A start that finally works ends the fault. The lastError watchers cannot do it alone:
 * a fault raised while lastError stayed clean never changes that ref, so nothing fires.
 */
function clearDeviceFault(deviceType: DeviceType.Camera | DeviceType.Microphone) {
  const target = deviceType === DeviceType.Camera ? 'camera' : 'microphone';
  if (target === 'camera') {
    cameraFault.value = undefined;
  } else {
    microphoneFault.value = undefined;
  }
  if (dialogFault.value?.target !== target) {
    return;
  }
  dialogFault.value = null;
  errorTitle.value = '';
  errorDesc.value = '';
  faultDialogOpen.value = false;
}

let dialogContainer: HTMLElement | null = null;
function renderDialog() {
  const faultView = openFaultView();
  if (!faultDialogOpen.value || !faultView) {
    if (dialogContainer) {
      render(null, dialogContainer);
    }
    return;
  }
  /* Stay on the mounted scene provider so education green (or a host primaryColor)
     reaches the lock and the primary button. Fall back to a body host only when
     no RoomKitProvider is on the page. */
  const host = resolveOverlayHost().host.value;
  if (!host) {
    return;
  }
  dialogContainer ??= document.createElement('div');
  /* Screen share stays a centered dialog. Camera and microphone faults on H5 use the
     bottom sheet from the mobile design. */
  const sheet = isH5 && faultView.target !== 'screen';
  const vnode = h(sheet ? DeviceFaultSheet : DeviceFaultDialog, {
    open: true,
    faultView,
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

  watch([faultDialogOpen, dialogFault, errorTitle, errorDesc], renderDialog, { immediate: true });
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
