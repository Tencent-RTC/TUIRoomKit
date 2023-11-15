import 'package:get/get.dart';
import 'package:room_flutter_example/common/index.dart';

class PrepareController extends GetxController {
  PrepareController();

  toCreateRoomPage() {
    Get.toNamed(RouteNames.conferenceCreateRoom);
  }

  toEnterRoomPage() {
    Get.toNamed(RouteNames.conferenceEnterRoom);
  }

  finishPage() {
    Get.back();
  }
}
