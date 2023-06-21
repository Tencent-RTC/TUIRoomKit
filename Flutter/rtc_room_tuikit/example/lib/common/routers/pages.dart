import 'package:get/get.dart';
import 'package:rtc_room_engine_example/page/login/index.dart';
import 'package:rtc_room_engine_example/page/room_entrance/index.dart';

import 'routes.dart';

class AppPages {
  static List<String> history = [];

  static final List<GetPage> routes = [
    GetPage(
      name: AppRoutes.login,
      page: () =>  LoginPage(),
    ),
    GetPage(
      name: AppRoutes.roomEntrance,
      page: () => RoomEntrancePage(),
    ),
  ];
}
