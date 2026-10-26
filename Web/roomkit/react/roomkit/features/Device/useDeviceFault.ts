import { createElement, useEffect, useRef, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { TUIErrorCode } from '@tencentcloud/tuiroom-engine-js';
import { getPlatform } from '@tencentcloud/universal-api';
import { DeviceError, DeviceType, useDeviceState } from 'tuikit-atomicx-react/room';
import { TUIToast } from '../../base';
import { t } from '../../i18n';
import { ensureAppendHost } from '../../base/command/appendTo';
import DeviceFaultDialog from './DeviceFaultDialog';
import DeviceFaultSheet from './DeviceFaultSheet';

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
interface DialogFault {
  kind: DeviceFaultKind;
  target: DeviceFaultTarget;
}

interface DeviceFaultState {
  cameraFault: DeviceFaultKind | undefined;
  microphoneFault: DeviceFaultKind | undefined;
  screenFault: DeviceFaultKind | undefined;
  faultDialogOpen: boolean;
  /** The fault the last click asked the dialog to explain. */
  dialogFault: DialogFault | null;
  errorTitle: string;
  errorDesc: string;
}

let state: DeviceFaultState = {
  cameraFault: undefined,
  microphoneFault: undefined,
  screenFault: undefined,
  faultDialogOpen: false,
  dialogFault: null,
  errorTitle: '',
  errorDesc: '',
};
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): DeviceFaultState {
  return state;
}

function setState(patch: Partial<DeviceFaultState>) {
  state = { ...state, ...patch };
  listeners.forEach(listener => listener());
  scheduleWatchers();
}

function closeDialog() {
  setState({ faultDialogOpen: false, dialogFault: null });
}

/* Leaves the dialog open: the user has to come back from the settings pane and act on
   it again, and its body is the instruction for doing so. */
function openSystemSettings() {
  const url = getPermissionSettingsUrl(state.dialogFault?.target ?? 'camera');
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

const COPY: Record<DeviceFaultKind, Record<DeviceFaultTarget, FaultCopy>> = {
  'insecure': {
    camera: INSECURE_COPY,
    microphone: INSECURE_COPY,
    screen: INSECURE_COPY,
  },
  'browser-blocked': {
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

/**
 * H5 title and body follow the previous RoomKit mobile strings. A phone has no system
 * settings deep link, so permission faults offer a refresh and a dismiss. Occupied and
 * missing devices stay a single acknowledgement, as they did there.
 */
const H5_INSECURE: FaultCopy = {
  titleKey: 'Device.Fault.InsecureTitle',
  bodyKey: 'Device.Fault.H5InsecureBody',
  actions: [CLOSE],
};

function h5Pair(
  camera: FaultCopy,
  microphone: FaultCopy,
): Record<'camera' | 'microphone', FaultCopy> {
  return { camera, microphone };
}

const H5_COPY: Record<DeviceFaultKind, Record<'camera' | 'microphone', FaultCopy>> = {
  'insecure': h5Pair(H5_INSECURE, H5_INSECURE),
  'browser-blocked': h5Pair(
    {
      titleKey: 'Device.Fault.H5BrowserTitleCam',
      bodyKey: 'Device.Fault.H5BrowserBodyCam',
      actions: [REFRESH, NOT_NOW],
    },
    {
      titleKey: 'Device.Fault.H5BrowserTitleMic',
      bodyKey: 'Device.Fault.H5BrowserBodyMic',
      actions: [REFRESH, NOT_NOW],
    },
  ),
  'system-blocked': h5Pair(
    {
      titleKey: 'Device.Fault.H5SystemTitleCam',
      bodyKey: 'Device.Fault.H5SystemBodyCam',
      actions: [REFRESH, NOT_NOW],
    },
    {
      titleKey: 'Device.Fault.H5SystemTitleMic',
      bodyKey: 'Device.Fault.H5SystemBodyMic',
      actions: [REFRESH, NOT_NOW],
    },
  ),
  'no-device': h5Pair(
    {
      titleKey: 'Device.Fault.H5NoDeviceTitleCam',
      bodyKey: 'Device.Fault.H5NoDeviceBodyCam',
      actions: [CLOSE],
    },
    {
      titleKey: 'Device.Fault.H5NoDeviceTitleMic',
      bodyKey: 'Device.Fault.H5NoDeviceBodyMic',
      actions: [CLOSE],
    },
  ),
  'occupied': h5Pair(
    {
      titleKey: 'Device.Fault.H5OccupiedTitleCam',
      bodyKey: 'Device.Fault.H5OccupiedBodyCam',
      actions: [CLOSE],
    },
    {
      titleKey: 'Device.Fault.H5OccupiedTitleMic',
      bodyKey: 'Device.Fault.H5OccupiedBodyMic',
      actions: [CLOSE],
    },
  ),
  'start-failed': h5Pair(
    {
      titleKey: 'Device.Fault.H5StartTitleCam',
      bodyKey: 'Device.Fault.H5StartBodyCam',
      actions: [REFRESH, NOT_NOW],
    },
    {
      titleKey: 'Device.Fault.H5StartTitleMic',
      bodyKey: 'Device.Fault.H5StartBodyMic',
      actions: [REFRESH, NOT_NOW],
    },
  ),
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

function openFaultDialog(fault: DialogFault) {
  const faultView = resolveDeviceFaultView(fault.kind, fault.target);
  setState({
    dialogFault: fault,
    errorTitle: faultText(faultView.titleKey, faultView.target),
    errorDesc: faultText(faultView.bodyKey, faultView.target),
    faultDialogOpen: true,
  });
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
    setState({ cameraFault: kind });
  } else {
    setState({ microphoneFault: kind });
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
  setState({ screenFault: kind });
  openFaultDialog({ kind, target: 'screen' });
  return true;
}

/**
 * A start that finally works ends the fault. The lastError watchers cannot do it alone:
 * a fault raised while lastError stayed clean never changes that value, so nothing fires.
 */
function clearDeviceFault(deviceType: DeviceType.Camera | DeviceType.Microphone) {
  const target = deviceType === DeviceType.Camera ? 'camera' : 'microphone';
  if (target === 'camera') {
    setState({ cameraFault: undefined });
  } else {
    setState({ microphoneFault: undefined });
  }
  /* The dialog is only cleared when it was about the device that recovered; a dialog
     about the other device stays open so the user still sees its instruction. */
  if (state.dialogFault?.target !== target) {
    return;
  }
  setState({
    dialogFault: null,
    errorTitle: '',
    errorDesc: '',
    faultDialogOpen: false,
  });
}

function getDialogView(): DeviceFaultView | null {
  const fault = state.dialogFault;
  return fault ? resolveDeviceFaultView(fault.kind, fault.target) : null;
}

let dialogRoot: Root | null = null;
function renderDialog() {
  const dialogView = getDialogView();
  if (!state.faultDialogOpen || !dialogView) {
    if (dialogRoot) {
      dialogRoot.render(null);
    }
    return;
  }
  /* The dialog belongs to no room or page, so it goes to a host on the body. That host
     is a RoomKitProvider of its own, which is what carries the theme tokens. */
  const { host } = ensureAppendHost(document.body);
  if (!host) {
    return;
  }
  dialogRoot ??= createRoot(document.createElement('div'));
  /* Screen share stays a centered dialog. Camera and microphone faults on H5 use the
     bottom sheet from the mobile design. */
  const sheet = isH5 && dialogView.target !== 'screen';
  dialogRoot.render(createElement(sheet ? DeviceFaultSheet : DeviceFaultDialog, {
    open: true,
    faultView: dialogView,
    host,
    title: state.errorTitle,
    description: state.errorDesc,
    close: closeDialog,
  }));
}

let watching = false;
let watchersPending = false;
let watchedOpen = state.faultDialogOpen;

/* Mirrors a batched watcher flush: runs once per tick after the fault state changed. */
function scheduleWatchers() {
  if (!watching || watchersPending) {
    return;
  }
  watchersPending = true;
  queueMicrotask(runWatchers);
}

function runWatchers() {
  watchersPending = false;
  // No device state backs a share fault, so closing the dialog is what ends it.
  if (watchedOpen !== state.faultDialogOpen) {
    watchedOpen = state.faultDialogOpen;
    if (!state.faultDialogOpen && state.screenFault) {
      state = { ...state, screenFault: undefined };
      listeners.forEach(listener => listener());
    }
  }
  renderDialog();
}

function startWatching() {
  watchedOpen = state.faultDialogOpen;
  renderDialog();
}

export interface DeviceFaultController {
  errorTitle: string;
  errorDesc: string;
  cameraFault: DeviceFaultKind | undefined;
  microphoneFault: DeviceFaultKind | undefined;
  handleDeviceError: typeof handleDeviceError;
  clearDeviceFault: typeof clearDeviceFault;
  handleScreenShareError: typeof handleScreenShareError;
}

export function useDeviceFault(): DeviceFaultController {
  if (!watching) {
    watching = true;
    startWatching();
  }

  /* The device state comes from a hook, so the lastError watchers live in every caller;
     clearing a fault is idempotent, so several callers reacting together is harmless. */
  const { cameraLastError, microphoneLastError } = useDeviceState();
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  /* lastError recovering only clears the matching fault; opening a dialog still goes
     through handleDeviceError with the thrown error from the caller's catch. */
  const cameraFirstRunRef = useRef(true);
  useEffect(() => {
    if (cameraFirstRunRef.current) {
      cameraFirstRunRef.current = false;
      return;
    }
    if (cameraLastError === DeviceError.NoError) {
      clearDeviceFault(DeviceType.Camera);
    }
  }, [cameraLastError]);

  const microphoneFirstRunRef = useRef(true);
  useEffect(() => {
    if (microphoneFirstRunRef.current) {
      microphoneFirstRunRef.current = false;
      return;
    }
    if (microphoneLastError === DeviceError.NoError) {
      clearDeviceFault(DeviceType.Microphone);
    }
  }, [microphoneLastError]);

  return {
    errorTitle: snapshot.errorTitle,
    errorDesc: snapshot.errorDesc,
    cameraFault: snapshot.cameraFault,
    microphoneFault: snapshot.microphoneFault,
    handleDeviceError,
    clearDeviceFault,
    handleScreenShareError,
  };
}
