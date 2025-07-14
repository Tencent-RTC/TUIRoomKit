import logger from '../../../utils/common/logger';
import { AdvancedBeautyPanelLevel, AdvancedBeautyType } from '../../type';
import { beautyPanelConfig } from './BeautyPanelConfig';

export type BeautyItem = {
  key: string;
  icon: string;
  name: string;
  nameEn: string;
  effectName: string;
  resourcePath: string;
  backgroundPath: string;
  minValue?: number;
  maxValue?: number;
};

export type BeautyItemMap = {
  name: string;
  nameEn: string;
  items: BeautyItem[];
};

export type BeautyPanelInfo = {
  key: AdvancedBeautyType;
  name: string;
  nameEn: string;
  items: BeautyItem[] | Map<string, BeautyItemMap>;
};

type BeautyItems = {
  name: string;
  nameEn: string;
  items: any;
};

const beautyPanels = new Map<AdvancedBeautyType, BeautyPanelInfo>();

export function generateBeautyPanel(level: AdvancedBeautyPanelLevel) {
  readBeautyPanel(level);
  readAdvancedBeautyPanel(level);
  readImageQualityPanel(level);
  readMakeupPanel(level);
  readBeautyBodyPanel(level);
  readAdvancedMakeupPanel(level);
  readFiltersPanel(level);
  readMotionPanel(level);
  readVirtualBackgroundPanel(level);
  return beautyPanels;
}

function checkPanelConfig(
  level: AdvancedBeautyPanelLevel,
  advancedBeautyType: AdvancedBeautyType
) {
  const beauty = beautyPanelConfig.get(level);
  if (!beauty) {
    logger.error(`beautyPanelConfig[${level}] is undefined`);
    return undefined;
  }

  const beautyItems = beauty.get(advancedBeautyType);
  if (!beautyItems) {
    logger.error(
      `beautyPanelConfig[${level}][${advancedBeautyType}] is undefined`
    );
    return undefined;
  }

  return beautyItems;
}

function readBeautyPanel(level: AdvancedBeautyPanelLevel) {
  const beautyItems = checkPanelConfig(level, AdvancedBeautyType.basicBeauty);
  if (!beautyItems) {
    return;
  }

  const dataArray: BeautyItems[] = [];
  dataArray.push({ name: '美白', nameEn: 'white', items: beautyItems.white });
  dataArray.push({ name: '磨皮', nameEn: 'smooth', items: beautyItems.smooth });
  dataArray.push({ name: '红润', nameEn: 'rosy', items: beautyItems.rosy });
  readComplexBeautyPanel(
    AdvancedBeautyType.basicBeauty,
    '基础美颜',
    AdvancedBeautyType.basicBeauty as string,
    dataArray
  );
}

function readAdvancedBeautyPanel(level: AdvancedBeautyPanelLevel) {
  const beautyItems = checkPanelConfig(
    level,
    AdvancedBeautyType.advancedBeauty
  );
  if (!beautyItems) {
    return;
  }

  const dataArray: BeautyItems[] = [];
  dataArray.push({ name: '眼部', nameEn: 'eye', items: beautyItems.eye });
  dataArray.push({
    name: '眉部',
    nameEn: 'eyebrow',
    items: beautyItems.eyebrow,
  });
  dataArray.push({ name: '鼻部', nameEn: 'nose', items: beautyItems.nose });
  dataArray.push({ name: '嘴部', nameEn: 'mouse', items: beautyItems.mouse });
  dataArray.push({ name: '面部', nameEn: 'face', items: beautyItems.face });

  readComplexBeautyPanel(
    AdvancedBeautyType.advancedBeauty,
    '高级美颜',
    AdvancedBeautyType.advancedBeauty as string,
    dataArray
  );
}

function readImageQualityPanel(level: AdvancedBeautyPanelLevel) {
  const beautyItems = checkPanelConfig(level, AdvancedBeautyType.imageQuality);
  if (!beautyItems) {
    return;
  }

  readSimpleBeautyPanel(
    AdvancedBeautyType.imageQuality,
    '画质',
    AdvancedBeautyType.imageQuality as string,
    beautyItems.imageQuality
  );
}

function readMakeupPanel(level: AdvancedBeautyPanelLevel) {
  const beautyItems = checkPanelConfig(level, AdvancedBeautyType.makeup);
  if (!beautyItems) {
    return;
  }

  const dataArray: BeautyItems[] = [];
  dataArray.push({
    name: '唇妆',
    nameEn: 'lipstick',
    items: beautyItems.lipstick,
  });
  dataArray.push({
    name: '腮红',
    nameEn: 'blush',
    items: beautyItems.blush,
  });
  dataArray.push({
    name: '染发',
    nameEn: 'hair',
    items: beautyItems.hair,
  });
  dataArray.push({
    name: '眼影',
    nameEn: 'eyeShadow',
    items: beautyItems.eyeShadow,
  });
  dataArray.push({
    name: '眼线',
    nameEn: 'eyeLiner',
    items: beautyItems.eyeLiner,
  });
  dataArray.push({
    name: '睫毛',
    nameEn: 'eyelash',
    items: beautyItems.eyelash,
  });
  dataArray.push({
    name: '美瞳',
    nameEn: 'eyeball',
    items: beautyItems.eyeball,
  });
  dataArray.push({
    name: '眉影',
    nameEn: 'eyebrowShadow',
    items: beautyItems.eyebrowShadow,
  });
  dataArray.push({
    name: '立体',
    nameEn: 'contour',
    items: beautyItems.contour,
  });

  readComplexBeautyPanel(
    AdvancedBeautyType.makeup,
    '美妆',
    AdvancedBeautyType.makeup as string,
    dataArray
  );
}

function readBeautyBodyPanel(level: AdvancedBeautyPanelLevel) {
  const beautyItems = checkPanelConfig(level, AdvancedBeautyType.bodyBeauty);
  if (!beautyItems) {
    return;
  }

  readSimpleBeautyPanel(
    AdvancedBeautyType.bodyBeauty,
    '美体',
    AdvancedBeautyType.bodyBeauty as string,
    beautyItems.propertyList
  );
}

function readAdvancedMakeupPanel(level: AdvancedBeautyPanelLevel) {
  const beautyItems = checkPanelConfig(level, AdvancedBeautyType.motion);
  if (!beautyItems) {
    return;
  }

  readSimpleBeautyPanel(
    AdvancedBeautyType.advancedMakeup,
    `高级美妆`,
    AdvancedBeautyType.advancedMakeup as string,
    beautyItems.advancedMakeup
  );
}

function readFiltersPanel(level: AdvancedBeautyPanelLevel) {
  const beautyItems = checkPanelConfig(level, AdvancedBeautyType.filters);
  if (!beautyItems) {
    return;
  }

  readSimpleBeautyPanel(
    AdvancedBeautyType.filters,
    `滤镜`,
    AdvancedBeautyType.filters as string,
    beautyItems.propertyList
  );
}

function readMotionPanel(level: AdvancedBeautyPanelLevel) {
  const beautyItems = checkPanelConfig(level, AdvancedBeautyType.motion);
  if (!beautyItems) {
    return;
  }

  let motions: BeautyItem[] = [];
  if (beautyItems.motions2D && Array.isArray(beautyItems.motions2D)) {
    motions = motions.concat(
      readBeautyItems(beautyItems.motions2D, 'motions2D')
    );
  }
  if (beautyItems.motions3D && Array.isArray(beautyItems.motions3D)) {
    motions = motions.concat(
      readBeautyItems(beautyItems.motions3D, 'motions3D')
    );
  }
  if (beautyItems.stickerhand && Array.isArray(beautyItems.stickerhand)) {
    motions = motions.concat(
      readBeautyItems(beautyItems.stickerhand, 'stickerhand')
    );
  }

  const panel = {
    key: AdvancedBeautyType.motion,
    name: '动效',
    nameEn: AdvancedBeautyType.motion as string,
    items: motions,
  };
  beautyPanels.set(AdvancedBeautyType.motion, panel);
}

function readVirtualBackgroundPanel(level: AdvancedBeautyPanelLevel) {
  const beautyItems = checkPanelConfig(
    level,
    AdvancedBeautyType.virtualBackground
  );
  if (!beautyItems) {
    return;
  }

  readSimpleBeautyPanel(
    AdvancedBeautyType.virtualBackground,
    '虚拟背景',
    AdvancedBeautyType.virtualBackground as string,
    beautyItems.propertyList
  );
}

// read config
function readSimpleBeautyPanel(
  type: AdvancedBeautyType,
  name: string,
  nameEn: string,
  arrayData: any
) {
  if (arrayData && Array.isArray(arrayData)) {
    const panel = {
      key: type,
      name,
      nameEn,
      items: readBeautyItems(arrayData, type),
    };
    if (panel.items && panel.items.length > 0) {
      beautyPanels.set(type, panel);
    }
  }
}

function readComplexBeautyPanel(
  type: AdvancedBeautyType,
  name: string,
  nameEn: string,
  dataArray: BeautyItems[]
) {
  const beautyMap = new Map<string, BeautyItemMap>();
  dataArray.forEach(data => {
    const beautyItems: BeautyItemMap = {
      name: data.name,
      nameEn: data.nameEn,
      items: readBeautyItems(data.items, data.nameEn),
    };
    if (beautyItems.items && beautyItems.items.length > 0) {
      beautyMap.set(data.nameEn, beautyItems);
    }
  });
  const panel = {
    key: type,
    name,
    nameEn,
    items: beautyMap,
  };
  if (beautyMap.size > 0) {
    beautyPanels.set(type, panel);
  }
}

function readBeautyItems(jsonArray: any, keyHeader = '') {
  if (!jsonArray || !Array.isArray(jsonArray)) {
    return [];
  }
  const basicItems: BeautyItem[] = [];

  jsonArray.forEach((item: any) => {
    const url = new URL(
      `./BeautyConfig/PanelIcon/${item.icon}`,
      import.meta.url
    );
    const beautyItem: BeautyItem = {
      key: ``,
      icon: url.href,
      name: item.displayName,
      nameEn: item.displayNameEn,
      effectName: '',
      resourcePath: '',
      backgroundPath: '',
    };
    if (item.effectName) {
      beautyItem.effectName = item.effectName;
    }
    if (item.resourcePath) {
      beautyItem.resourcePath = item.resourcePath;
    }
    if (item.backgroundPath) {
      beautyItem.backgroundPath = item.backgroundPath;
    }
    if (item.minValue !== undefined) {
      beautyItem.minValue = item.minValue;
    }
    if (item.maxValue !== undefined) {
      beautyItem.maxValue = item.maxValue;
    }
    beautyItem.key = `${keyHeader}_${beautyItem.effectName}_${beautyItem.resourcePath}`;

    basicItems.push(beautyItem);
  });

  return basicItems;
}
