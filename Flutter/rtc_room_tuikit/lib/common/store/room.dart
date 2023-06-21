import 'package:get/get.dart';

class RoomStore extends GetxController {
  static RoomStore get to => Get.find();
  var roomId = "";
  var roomName = "";
  var ownerId = "";
}
