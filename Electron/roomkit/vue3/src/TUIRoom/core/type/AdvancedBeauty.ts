export enum AdvancedBeautyType {
  basicBeauty = 'basicBeauty',
  advancedBeauty = 'advancedBeauty',
  imageQuality = 'imageQuality',
  makeup = 'makeup',
  bodyBeauty = 'bodyBeauty',
  advancedMakeup = 'advancedMakeup',
  filters = 'filters',
  motion = 'motion',
  virtualBackground = 'virtualBackground',
}

export type AdvancedBeautyConfig = {
  beautyType: AdvancedBeautyType;
  beautyPanelKey: string;
  resourcePath: string;
  backgroundPath: string;
  effectKey: string;
  effectValue: number;
};

export enum AdvancedBeautyPanelLevel {
  A1_00 = 'A1_00',
  A1_01 = 'A1_01',
  A1_02 = 'A1_02',
  A1_03 = 'A1_03',
  A1_04 = 'A1_04',
  A1_05 = 'A1_05',
  A1_06 = 'A1_06',
  S1_00 = 'S1_00',
  S1_01 = 'S1_01',
  S1_02 = 'S1_02',
  S1_03 = 'S1_03',
  S1_04 = 'S1_04',
  S1_05 = 'S1_05',
  S1_06 = 'S1_06',
  S1_07 = 'S1_07',
}

export type AdvancedBeautyLicenseInfo = {
  panelLevel: AdvancedBeautyPanelLevel;
  licenseUrl: string;
  licenseKey: string;
};
