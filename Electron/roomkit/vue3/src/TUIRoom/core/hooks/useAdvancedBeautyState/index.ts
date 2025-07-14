import {
  AdvancedBeautyType,
  AdvancedBeautyConfig,
  AdvancedBeautyPanelLevel,
  AdvancedBeautyLicenseInfo,
} from './../../type';

import { getResourcePath } from './usePluginConfig';
import { plugin } from './usePlugin';
import { reactive, ref } from 'vue';

const virtualBackgroundImages = ref<string[]>([]);

const beautyConfigs = reactive<
  Map<AdvancedBeautyType, Map<string, AdvancedBeautyConfig[]>>
>(new Map());

const beautyLicenseInfo = {
  panelLevel: AdvancedBeautyPanelLevel.S1_00,
  licenseUrl: '',
  licenseKey: '',
};

function setAdvancedBeautyLicenseInfo(licenseInfo: AdvancedBeautyLicenseInfo) {
  beautyLicenseInfo.panelLevel = licenseInfo.panelLevel;
  beautyLicenseInfo.licenseUrl = licenseInfo.licenseUrl;
  beautyLicenseInfo.licenseKey = licenseInfo.licenseKey;

  plugin.initPlugin(licenseInfo.licenseUrl, licenseInfo.licenseKey);
}

function setVirtualBackgroundImages(images: string[]) {
  virtualBackgroundImages.value = images;
}

function setAdvancedBeauty(
  type: AdvancedBeautyType,
  config: AdvancedBeautyConfig
) {
  const newConfig = { ...config };
  if (newConfig.effectKey.length === 0) {
    clearBeautyConfigsByBeautyKey(type, newConfig.beautyPanelKey);
  } else {
    cacheBeautyConfigs(type, newConfig);
  }
}

function cacheBeautyConfigs(
  type: AdvancedBeautyType,
  config: AdvancedBeautyConfig
) {
  let configArray = beautyConfigs.get(type)?.get(config.beautyPanelKey);
  if (configArray) {
    if (isReplaceConfig(type)) {
      configArray.length = 0;
      configArray.push(config);
    } else {
      let needToAdd = true;
      configArray.forEach((cachedConfig: AdvancedBeautyConfig) => {
        if (config.effectKey === cachedConfig.effectKey) {
          cachedConfig.effectValue = config.effectValue;
          needToAdd = false;
        }
      });
      if (needToAdd) {
        configArray.push(config);
      }
    }
  } else {
    let panelMap = beautyConfigs.get(type);
    if (!panelMap) {
      panelMap = new Map();
      beautyConfigs.set(type, panelMap);
    }
    configArray = [];
    configArray.push(config);
    panelMap.set(config.beautyPanelKey, configArray);
  }

  clearConflictBeautyConfigs(type);
  setBeauty(type, config);
}

function clearConflictBeautyConfigs(type: AdvancedBeautyType) {
  const conflictBeauty = [
    AdvancedBeautyType.motion,
    AdvancedBeautyType.virtualBackground,
    AdvancedBeautyType.advancedMakeup,
  ];
  if (!conflictBeauty.includes(type)) {
    return;
  }
  conflictBeauty.forEach(beautyType => {
    if (beautyType !== type) {
      const configArray = beautyConfigs.get(beautyType)?.get(beautyType);
      if (configArray) {
        configArray.length = 0;
      }
    }
  });
}

function clearBeautyConfigsByBeautyKey(
  type: AdvancedBeautyType,
  beautyKey: string
) {
  clearConflictBeautyConfigs(type);
  const configArray = beautyConfigs.get(type)?.get(beautyKey);
  if (configArray) {
    configArray?.forEach(config => {
      config.effectValue = 0;
      setBeauty(type, config);
    });
  }
}

function isReplaceConfig(type: AdvancedBeautyType) {
  switch (type) {
    case AdvancedBeautyType.basicBeauty:
    case AdvancedBeautyType.makeup:
    case AdvancedBeautyType.advancedMakeup:
    case AdvancedBeautyType.filters:
    case AdvancedBeautyType.motion:
    case AdvancedBeautyType.virtualBackground:
      return true;
    default:
      return false;
  }
}

function setBeauty(type: AdvancedBeautyType, config: AdvancedBeautyConfig) {
  const beautySetting = [
    {
      category: getBeautyCategory(type),
      effKey: config.effectKey,
      effValue: config.effectValue,
      resPath: generateResourcePath(type, config),
      bgPath: config.backgroundPath,
    },
  ];
  const param = JSON.stringify({
    beautySetting,
  });
  plugin.setParameter(param);
}

function generateResourcePath(
  type: AdvancedBeautyType,
  config: AdvancedBeautyConfig
) {
  if (config.resourcePath && type !== AdvancedBeautyType.makeup) {
    return getResourcePath() + config.resourcePath;
  }
  return config.resourcePath;
}

function clearBeautySetting() {
  const beautySetting: any = [];
  beautyConfigs.forEach((configPanel, type) => {
    configPanel.forEach(configs => {
      configs.forEach((config: AdvancedBeautyConfig) => {
        if (config.effectValue !== 0) {
          const setting = {
            category: getBeautyCategory(type),
            effKey: config.effectKey,
            effValue: 0,
            resPath: generateResourcePath(type, config),
            bgPath: config.backgroundPath,
          };
          beautySetting.push(setting);
        }
      });
    });
  });

  if (beautySetting.length > 0) {
    const param = JSON.stringify({
      beautySetting,
    });
    plugin.setParameter(param);
  }

  beautyConfigs.clear();
  plugin.clearBeautyEffect();
}

function getBeautyCategory(type: AdvancedBeautyType) {
  switch (type) {
    case AdvancedBeautyType.basicBeauty:
    case AdvancedBeautyType.advancedBeauty:
    case AdvancedBeautyType.imageQuality:
    case AdvancedBeautyType.makeup:
      return 0;
    case AdvancedBeautyType.bodyBeauty:
      return 1;
    case AdvancedBeautyType.filters:
      return 2;
    case AdvancedBeautyType.motion:
      return 3;
    case AdvancedBeautyType.virtualBackground:
      return 4;
    case AdvancedBeautyType.advancedMakeup:
      return 5;
    default:
      return -1;
  }
}

export default function useAdvancedBeautyState() {
  return {
    beautyConfigs,
    beautyLicenseInfo,
    virtualBackgroundImages,
    setAdvancedBeautyLicenseInfo,
    setAdvancedBeauty,
    clearBeautySetting,
    setVirtualBackgroundImages,
  };
}
