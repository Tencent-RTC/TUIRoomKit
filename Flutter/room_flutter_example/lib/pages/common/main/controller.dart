import 'package:get/get.dart';
import 'package:room_flutter_example/common/index.dart';

class MainController extends GetxController {
  MainController();

  @override
  void onInit() {
    UserStore.to.loadUserModel();
    super.onInit();
  }

  enterConferenceUIKit() {
    Get.toNamed(RouteNames.conferencePrepare);
  }
}
