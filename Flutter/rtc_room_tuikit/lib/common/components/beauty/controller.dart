import 'package:get/get.dart';
import 'package:tencent_trtc_cloud/trtc_cloud.dart';
import 'package:tencent_trtc_cloud/trtc_cloud_def.dart';
import 'package:tencent_trtc_cloud/tx_beauty_manager.dart';

class BeautyController extends GetxController {
  BeautyController();
  late TXBeautyManager _beautyManager;

  @override
  void onInit() async {
    super.onInit();
    var trtcCloud = (await TRTCCloud.sharedInstance())!;
    _beautyManager = trtcCloud.getBeautyManager();
  }

  applyBeautyValueChange(String curBeauty, double value) {
    switch (curBeauty) {
      case 'smooth':
        _beautyManager.setBeautyStyle(TRTCCloudDef.TRTC_BEAUTY_STYLE_SMOOTH);
        _beautyManager.setBeautyLevel(value.round());
        break;
      case 'nature':
        _beautyManager.setBeautyStyle(TRTCCloudDef.TRTC_BEAUTY_STYLE_NATURE);
        _beautyManager.setBeautyLevel(value.round());
        break;
      case 'pitu':
        _beautyManager.setBeautyStyle(TRTCCloudDef.TRTC_BEAUTY_STYLE_PITU);
        _beautyManager.setBeautyLevel(value.round());
        break;
      case 'whitening':
        _beautyManager.setWhitenessLevel(value.round());
        break;
      case 'ruddy':
        _beautyManager.setRuddyLevel(value.round());
        break;
      default:
        break;
    }
  }
}
