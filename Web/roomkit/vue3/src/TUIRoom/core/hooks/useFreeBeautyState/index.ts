import { ref, Ref } from 'vue';
import { FreeBeautyConfig } from '../../type';
import useRoomEngine from '../../../hooks/useRoomEngine';
import { TRTCBeautyStyle } from '../../../constants/room';
import logger from '../../../utils/common/logger';

const roomEngine = useRoomEngine();
let isBeautyReady = false;

const beautyConfig: Ref<FreeBeautyConfig> = ref({
  beautyLevel: 0,
  whitenessLevel: 0,
  ruddinessLevel: 0,
});

const cachedBeautyConfig: FreeBeautyConfig = {
  beautyLevel: 0,
  whitenessLevel: 0,
  ruddinessLevel: 0,
};

async function setFreeBeauty(config: FreeBeautyConfig) {
  cachedBeautyConfig.beautyLevel = config.beautyLevel;
  cachedBeautyConfig.whitenessLevel = config.whitenessLevel;
  cachedBeautyConfig.ruddinessLevel = config.ruddinessLevel;

  const beautyLevel = convertLevel(config.beautyLevel);
  const whitenessLevel = convertLevel(config.whitenessLevel);
  const ruddinessLevel = convertLevel(config.ruddinessLevel);
  await startCameraTestBeauty(beautyLevel, whitenessLevel, ruddinessLevel);
}

async function saveBeautySetting() {
  beautyConfig.value = { ...cachedBeautyConfig };

  const trtcCloud = roomEngine.instance?.getTRTCCloud();
  if (trtcCloud === undefined) {
    logger.error('trtcCloud is undefined');
    return;
  }
  logger.log('saveBeautySetting:', beautyConfig.value);
  const style = TRTCBeautyStyle.TRTCBeautyStyleNature;
  const beautyLevel = convertLevel(beautyConfig.value.beautyLevel);
  const whitenessLevel = convertLevel(beautyConfig.value.whitenessLevel);
  const ruddinessLevel = convertLevel(beautyConfig.value.ruddinessLevel);

  await checkInitBeauty();
  await trtcCloud.setBeautyStyle(
    style,
    beautyLevel,
    whitenessLevel,
    ruddinessLevel
  );
}

async function startCameraTestBeauty(
  beautyLevel: number,
  whitenessLevel: number,
  ruddinessLevel: number
) {
  const trtcCloud = roomEngine.instance?.getTRTCCloud();
  if (trtcCloud === undefined) {
    logger.error('trtcCloud is undefined');
    return;
  }

  await checkInitBeauty();
  await trtcCloud.callExperimentalAPI(
    JSON.stringify({
      api: 'enableTestBeautyStyle',
      params: {
        style: TRTCBeautyStyle.TRTCBeautyStyleNature,
        beautyLevel,
        whitenessLevel,
        ruddinessLevel,
      },
    })
  );
}

async function checkInitBeauty() {
  const trtcCloud = roomEngine.instance?.getTRTCCloud();
  if (trtcCloud === undefined) {
    logger.error('trtcCloud is undefined');
    return;
  }

  if (isBeautyReady === false) {
    try {
      await trtcCloud.useBeautyStyle();
      isBeautyReady = true;
    } catch (error) {
      logger.error('useBeautyStyle failed, error:', error);
      isBeautyReady = false;
    }
  }
}

function convertLevel(level: number) {
  return Math.floor((level / 100) * 9);
}

export default function useVideoEffectState() {
  return {
    beautyConfig,
    setFreeBeauty,
    saveBeautySetting,
  };
}
