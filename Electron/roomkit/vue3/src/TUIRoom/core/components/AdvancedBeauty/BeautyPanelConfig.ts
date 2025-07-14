import { AdvancedBeautyPanelLevel, AdvancedBeautyType } from '../../type';
// beautyPanel Config Json

// A1_00
import beautyJsonA100 from './BeautyConfig/A1_00/beauty.json';
import lutJsonA100 from './BeautyConfig/A1_00/lut.json';

// A1_01
import beautyJsonA101 from './BeautyConfig/A1_01/beauty.json';
import lutJsonA101 from './BeautyConfig/A1_01/lut.json';

// A1_02
import beautyJsonA102 from './BeautyConfig/A1_02/beauty.json';
import lutJsonA102 from './BeautyConfig/A1_02/lut.json';
import motionsJsonA102 from './BeautyConfig/A1_02/motions.json';

// A1_03
import beautyJsonA103 from './BeautyConfig/A1_03/beauty.json';
import lutJsonA103 from './BeautyConfig/A1_03/lut.json';
import motionsJsonA103 from './BeautyConfig/A1_03/motions.json';

// A1_04
import beautyJsonA104 from './BeautyConfig/A1_04/beauty.json';
import lutJsonA104 from './BeautyConfig/A1_04/lut.json';

// A1_05
import beautyJsonA105 from './BeautyConfig/A1_05/beauty.json';
import lutJsonA105 from './BeautyConfig/A1_05/lut.json';
import motionsJsonA105 from './BeautyConfig/A1_05/motions.json';
import segmentationJsonA105 from './BeautyConfig/A1_05/segmentation.json';

// A1_06
import beautyJsonA106 from './BeautyConfig/A1_06/beauty.json';
import lutJsonA106 from './BeautyConfig/A1_06/lut.json';
import motionsJsonA106 from './BeautyConfig/A1_06/motions.json';

// S1_00
import beautyJsonS100 from './BeautyConfig/S1_00/beauty.json';
import lutJsonS100 from './BeautyConfig/S1_00/lut.json';

// S1_01
import beautyJsonS101 from './BeautyConfig/S1_01/beauty.json';
import lutJsonS101 from './BeautyConfig/S1_01/lut.json';
import MotionsJsonS101 from './BeautyConfig/S1_01/motions.json';

// S1_02
import beautyJsonS102 from './BeautyConfig/S1_02/beauty.json';
import lutJsonS102 from './BeautyConfig/S1_02/lut.json';
import MotionsJsonS102 from './BeautyConfig/S1_02/motions.json';

// S1_03
import beautyJsonS103 from './BeautyConfig/S1_03/beauty.json';
import lutJsonS103 from './BeautyConfig/S1_03/lut.json';
import MotionsJsonS103 from './BeautyConfig/S1_03/motions.json';
import segmentationJsonS103 from './BeautyConfig/S1_03/segmentation.json';

// S1_04
import beautyJsonS104 from './BeautyConfig/S1_04/beauty.json';
import lutJsonS104 from './BeautyConfig/S1_04/lut.json';
import MotionsJsonS104 from './BeautyConfig/S1_04/motions.json';
import segmentationJsonS104 from './BeautyConfig/S1_04/segmentation.json';

// S1_05
import beautyJsonS105 from './BeautyConfig/S1_05/beauty.json';
import lutJsonS105 from './BeautyConfig/S1_05/lut.json';
import MotionsJsonS105 from './BeautyConfig/S1_05/motions.json';
import segmentationJsonS105 from './BeautyConfig/S1_05/segmentation.json';

// S1_06
import beautyJsonS106 from './BeautyConfig/S1_06/beauty.json';
import lutJsonS106 from './BeautyConfig/S1_06/lut.json';
import MotionsJsonS106 from './BeautyConfig/S1_06/motions.json';
import segmentationJsonS106 from './BeautyConfig/S1_06/segmentation.json';

// S1_07
import beautyJsonS107 from './BeautyConfig/S1_07/beauty.json';
import beautyBodyJsonS107 from './BeautyConfig/S1_07/beauty_body.json';
import lutJsonS107 from './BeautyConfig/S1_07/lut.json';
import motionsJsonS107 from './BeautyConfig/S1_07/motions.json';
import segmentationJsonS107 from './BeautyConfig/S1_07/segmentation.json';

//
export const beautyPanelConfig = new Map<
  AdvancedBeautyPanelLevel,
  Map<AdvancedBeautyType, any>
>();

// A1_00
const mapA100 = new Map();
mapA100.set(AdvancedBeautyType.basicBeauty, beautyJsonA100);
mapA100.set(AdvancedBeautyType.filters, lutJsonA100);
beautyPanelConfig.set(AdvancedBeautyPanelLevel.A1_00, mapA100);

// A1_01
const mapA101 = new Map();
mapA101.set(AdvancedBeautyType.basicBeauty, beautyJsonA101);
mapA101.set(AdvancedBeautyType.imageQuality, beautyJsonA101);
mapA101.set(AdvancedBeautyType.advancedBeauty, beautyJsonA101);
mapA101.set(AdvancedBeautyType.filters, lutJsonA101);
beautyPanelConfig.set(AdvancedBeautyPanelLevel.A1_01, mapA101);

// A1_02
const mapA102 = new Map();
mapA102.set(AdvancedBeautyType.basicBeauty, beautyJsonA102);
mapA102.set(AdvancedBeautyType.imageQuality, beautyJsonA102);
mapA102.set(AdvancedBeautyType.advancedBeauty, beautyJsonA102);
mapA102.set(AdvancedBeautyType.filters, lutJsonA102);
mapA102.set(AdvancedBeautyType.motion, motionsJsonA102);
beautyPanelConfig.set(AdvancedBeautyPanelLevel.A1_02, mapA102);

// A1_03
const mapA103 = new Map();
mapA103.set(AdvancedBeautyType.basicBeauty, beautyJsonA103);
mapA103.set(AdvancedBeautyType.advancedBeauty, beautyJsonA103);
mapA103.set(AdvancedBeautyType.imageQuality, beautyJsonA103);
mapA103.set(AdvancedBeautyType.filters, lutJsonA103);
mapA103.set(AdvancedBeautyType.motion, motionsJsonA103);
beautyPanelConfig.set(AdvancedBeautyPanelLevel.A1_03, mapA103);

// A1_04
const mapA104 = new Map();
mapA104.set(AdvancedBeautyType.basicBeauty, beautyJsonA104);
mapA104.set(AdvancedBeautyType.imageQuality, beautyJsonA104);
mapA104.set(AdvancedBeautyType.advancedBeauty, beautyJsonA104);
mapA104.set(AdvancedBeautyType.filters, lutJsonA104);
beautyPanelConfig.set(AdvancedBeautyPanelLevel.A1_04, mapA104);

// A1_05
const mapA105 = new Map();
mapA105.set(AdvancedBeautyType.basicBeauty, beautyJsonA105);
mapA105.set(AdvancedBeautyType.imageQuality, beautyJsonA105);
mapA105.set(AdvancedBeautyType.advancedBeauty, beautyJsonA105);
mapA105.set(AdvancedBeautyType.filters, lutJsonA105);
mapA105.set(AdvancedBeautyType.motion, motionsJsonA105);
mapA105.set(AdvancedBeautyType.virtualBackground, segmentationJsonA105);
beautyPanelConfig.set(AdvancedBeautyPanelLevel.A1_05, mapA105);

// A1_06
const mapA106 = new Map();
mapA106.set(AdvancedBeautyType.basicBeauty, beautyJsonA106);
mapA106.set(AdvancedBeautyType.imageQuality, beautyJsonA106);
mapA106.set(AdvancedBeautyType.advancedBeauty, beautyJsonA106);
mapA106.set(AdvancedBeautyType.filters, lutJsonA106);
mapA106.set(AdvancedBeautyType.motion, motionsJsonA106);
mapA106.set(AdvancedBeautyType.advancedMakeup, motionsJsonA106);
beautyPanelConfig.set(AdvancedBeautyPanelLevel.A1_06, mapA106);

// S1_00
const mapS100 = new Map();
mapS100.set(AdvancedBeautyType.basicBeauty, beautyJsonS100);
mapS100.set(AdvancedBeautyType.imageQuality, beautyJsonS100);
mapS100.set(AdvancedBeautyType.advancedBeauty, beautyJsonS100);
mapS100.set(AdvancedBeautyType.makeup, beautyJsonS100);
mapS100.set(AdvancedBeautyType.filters, lutJsonS100);
beautyPanelConfig.set(AdvancedBeautyPanelLevel.S1_00, mapS100);

// S1_01
const mapS101 = new Map();
mapS101.set(AdvancedBeautyType.basicBeauty, beautyJsonS101);
mapS101.set(AdvancedBeautyType.imageQuality, beautyJsonS101);
mapS101.set(AdvancedBeautyType.advancedBeauty, beautyJsonS101);
mapS101.set(AdvancedBeautyType.makeup, beautyJsonS101);
mapS101.set(AdvancedBeautyType.filters, lutJsonS101);
mapS101.set(AdvancedBeautyType.motion, MotionsJsonS101);
mapS101.set(AdvancedBeautyType.advancedMakeup, MotionsJsonS101);
beautyPanelConfig.set(AdvancedBeautyPanelLevel.S1_01, mapS101);

// S1_02
const mapS102 = new Map();
mapS102.set(AdvancedBeautyType.basicBeauty, beautyJsonS102);
mapS102.set(AdvancedBeautyType.imageQuality, beautyJsonS102);
mapS102.set(AdvancedBeautyType.advancedBeauty, beautyJsonS102);
mapS102.set(AdvancedBeautyType.makeup, beautyJsonS102);
mapS102.set(AdvancedBeautyType.filters, lutJsonS102);
mapS102.set(AdvancedBeautyType.motion, MotionsJsonS102);
mapS102.set(AdvancedBeautyType.advancedMakeup, MotionsJsonS102);
beautyPanelConfig.set(AdvancedBeautyPanelLevel.S1_02, mapS102);

// S1_03
const mapS103 = new Map();
mapS103.set(AdvancedBeautyType.basicBeauty, beautyJsonS103);
mapS103.set(AdvancedBeautyType.imageQuality, beautyJsonS103);
mapS103.set(AdvancedBeautyType.advancedBeauty, beautyJsonS103);
mapS103.set(AdvancedBeautyType.makeup, beautyJsonS103);
mapS103.set(AdvancedBeautyType.filters, lutJsonS103);
mapS103.set(AdvancedBeautyType.motion, MotionsJsonS103);
mapS103.set(AdvancedBeautyType.advancedMakeup, MotionsJsonS103);
mapS103.set(AdvancedBeautyType.virtualBackground, segmentationJsonS103);
beautyPanelConfig.set(AdvancedBeautyPanelLevel.S1_03, mapS103);

// S1_04
const mapS104 = new Map();
mapS104.set(AdvancedBeautyType.basicBeauty, beautyJsonS104);
mapS104.set(AdvancedBeautyType.imageQuality, beautyJsonS104);
mapS104.set(AdvancedBeautyType.advancedBeauty, beautyJsonS104);
mapS104.set(AdvancedBeautyType.makeup, beautyJsonS104);
mapS104.set(AdvancedBeautyType.filters, lutJsonS104);
mapS104.set(AdvancedBeautyType.motion, MotionsJsonS104);
mapS104.set(AdvancedBeautyType.advancedMakeup, MotionsJsonS104);
mapS104.set(AdvancedBeautyType.virtualBackground, segmentationJsonS104);
beautyPanelConfig.set(AdvancedBeautyPanelLevel.S1_04, mapS104);

// S1_05
const mapS105 = new Map();
mapS105.set(AdvancedBeautyType.basicBeauty, beautyJsonS105);
mapS105.set(AdvancedBeautyType.imageQuality, beautyJsonS105);
mapS105.set(AdvancedBeautyType.advancedBeauty, beautyJsonS105);
mapS105.set(AdvancedBeautyType.makeup, beautyJsonS105);
mapS105.set(AdvancedBeautyType.filters, lutJsonS105);
mapS105.set(AdvancedBeautyType.motion, MotionsJsonS105);
mapS105.set(AdvancedBeautyType.advancedMakeup, MotionsJsonS105);
mapS105.set(AdvancedBeautyType.virtualBackground, segmentationJsonS105);
beautyPanelConfig.set(AdvancedBeautyPanelLevel.S1_05, mapS105);

// S1_06
const mapS106 = new Map();
mapS106.set(AdvancedBeautyType.basicBeauty, beautyJsonS106);
mapS106.set(AdvancedBeautyType.imageQuality, beautyJsonS106);
mapS106.set(AdvancedBeautyType.advancedBeauty, beautyJsonS106);
mapS106.set(AdvancedBeautyType.makeup, beautyJsonS106);
mapS106.set(AdvancedBeautyType.filters, lutJsonS106);
mapS106.set(AdvancedBeautyType.motion, MotionsJsonS106);
mapS106.set(AdvancedBeautyType.advancedMakeup, MotionsJsonS106);
mapS106.set(AdvancedBeautyType.virtualBackground, segmentationJsonS106);
beautyPanelConfig.set(AdvancedBeautyPanelLevel.S1_06, mapS106);

// S1_07
const mapS107 = new Map();
mapS107.set(AdvancedBeautyType.basicBeauty, beautyJsonS107);
mapS107.set(AdvancedBeautyType.advancedBeauty, beautyJsonS107);
mapS107.set(AdvancedBeautyType.imageQuality, beautyJsonS107);
mapS107.set(AdvancedBeautyType.makeup, beautyJsonS107);
mapS107.set(AdvancedBeautyType.bodyBeauty, beautyBodyJsonS107);
mapS107.set(AdvancedBeautyType.filters, lutJsonS107);
mapS107.set(AdvancedBeautyType.advancedMakeup, motionsJsonS107);
mapS107.set(AdvancedBeautyType.motion, motionsJsonS107);
mapS107.set(AdvancedBeautyType.virtualBackground, segmentationJsonS107);
beautyPanelConfig.set(AdvancedBeautyPanelLevel.S1_07, mapS107);
