/**
 * IM `statTUIKeyFeatures` reporting for the WeChat mini program.
 * TIM must already be logged in; otherwise the experimental API is a no-op.
 */
import { TUIRoomEngine } from '@tencentcloud/tuiroom-engine-wx';
import useGetRoomEngine from '../hooks/useRoomEngine';
import logger from './common/logger';

const logPrefix = '[tuiKeyFeatures]';

export const TUIKeyFeature = {
  roomKitWx: {
    code: 192000,
    msg: 'TUIRoomKit-wx',
  },
  livePusherNoPermission: {
    code: 192001,
    msg: 'TUIRoomKit-wx-live-pusher-no-permission',
  },
} as const;

type TUIKeyFeatureItem = (typeof TUIKeyFeature)[keyof typeof TUIKeyFeature];

function getTim() {
  return useGetRoomEngine().instance?.getTIM();
}

export function reportTUIKeyFeature(feature: TUIKeyFeatureItem) {
  const send = () => {
    try {
      getTim()?.callExperimentalAPI('statTUIKeyFeatures', {
        code: feature.code,
        msg: `${feature.code}-${feature.msg}`,
      });
    } catch (error) {
      logger.warn(`${logPrefix}report failed:`, error);
    }
  };
  if (getTim()) {
    send();
    return;
  }
  TUIRoomEngine.once('ready', send);
}
