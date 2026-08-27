/**
 * WeChat live-pusher qualification errors.
 *
 * trtc-component-wx handles live-pusher binderror internally and forwards it
 * as TRTCCloud.on('onError'). CallKit treats errno 103 as "live-pusher
 * qualification is not enabled".
 */
import { TUIRoomEngine } from '@tencentcloud/tuiroom-engine-wx';
import useGetRoomEngine from '../../hooks/useRoomEngine';
import i18n from '../../locales';
import logger from '../../utils/common/logger';
import { reportTUIKeyFeature, TUIKeyFeature } from '../../utils/tuiKeyFeatures';

declare const uni: any;

const logPrefix = '[livePusherError]';

let hasHandledLivePusherNoPermission = false;
let hasBoundTrtcCloudError = false;

function collectErrorText(event: any): string {
  const detail = event?.detail ?? {};
  return [
    event?.message,
    event?.errMsg,
    event?.code,
    event?.errCode,
    detail?.errMsg,
    detail?.message,
    detail?.detail,
    detail?.errCode,
    detail?.errno,
  ]
    .filter(value => value !== undefined && value !== null && value !== '')
    .join(' ')
    .toLowerCase();
}

function isLivePusherNoPermission(event: any): boolean {
  const errno = Number(
    event?.detail?.errno ?? event?.errno ?? event?.code ?? event?.errCode
  );
  if (errno === 103) {
    return true;
  }
  const text = collectErrorText(event);
  return (
    text.includes('jsapi has no permission') ||
    text.includes('fail:access denied')
  );
}

function showLivePusherNoPermissionTip() {
  const t = i18n.global.t.bind(i18n);
  uni.showModal({
    title: t('Tip'),
    content: t('The current mini program does not have live-pusher permission'),
    showCancel: false,
    confirmText: t('I got it (short)'),
  });
}

export function handleLivePusherError(event: any) {
  if (!isLivePusherNoPermission(event) || hasHandledLivePusherNoPermission) {
    return;
  }
  hasHandledLivePusherNoPermission = true;
  reportTUIKeyFeature(TUIKeyFeature.livePusherNoPermission);
  logger.warn(
    `${logPrefix}live-pusher qualification missing`,
    TUIKeyFeature.livePusherNoPermission.code
  );
  showLivePusherNoPermissionTip();
}

function onTrtcCloudError(code: any, message?: any) {
  handleLivePusherError({
    code,
    message,
    errMsg: typeof message === 'string' ? message : undefined,
    errno: code,
    detail: {
      errno: code,
      errCode: code,
      errMsg: message,
    },
  });
}

export function bindTrtcCloudLivePusherError() {
  const attach = () => {
    const trtcCloud = useGetRoomEngine().instance?.getTRTCCloud?.();
    if (!trtcCloud?.on || hasBoundTrtcCloudError) {
      return;
    }
    hasBoundTrtcCloudError = true;
    trtcCloud.on('onError', onTrtcCloudError);
  };
  if (useGetRoomEngine().instance) {
    attach();
    return;
  }
  TUIRoomEngine.once('ready', attach);
}
