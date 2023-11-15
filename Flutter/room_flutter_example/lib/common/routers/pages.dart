import 'package:get/get.dart';
import 'package:room_flutter_example/common/routers/names.dart';
import 'package:room_flutter_example/pages/common/login/index.dart';
import 'package:room_flutter_example/pages/common/main/index.dart';
import 'package:room_flutter_example/pages/common/profile/index.dart';
import 'package:room_flutter_example/pages/conference_tuikit/index.dart';

class RoutePages {
  // 列表
  static List<GetPage> list = [
    GetPage(
      name: RouteNames.commonLogin,
      page: () => const LoginPage(),
    ),
    GetPage(
      name: RouteNames.commonMain,
      page: () => const MainPage(),
    ),
    GetPage(
      name: RouteNames.commonProfile,
      page: () => const ProfilePage(),
    ),
    GetPage(
      name: RouteNames.conferencePrepare,
      page: () => const PreparePage(),
    ),
    GetPage(
      name: RouteNames.conferenceCreateRoom,
      page: () => const ConferenceCreateRoomPage(),
    ),
    GetPage(
        name: RouteNames.conferenceEnterRoom,
        page: () => const ConferenceEnterRoomPage()),
  ];
}
