import 'package:get/get.dart';
import 'package:room_flutter_example/common/routers/names.dart';
import 'package:room_flutter_example/pages/common/login/index.dart';
import 'package:room_flutter_example/pages/common/profile/index.dart';
import 'package:room_flutter_example/pages/conference_tuikit/index.dart';

class RoutePages {
  static List<GetPage> list = [
    GetPage(
      name: RouteNames.commonLogin,
      page: () => const LoginPage(),
    ),
    GetPage(
      name: RouteNames.commonProfile,
      page: () => const ProfilePage(),
    ),
    GetPage(
      name: RouteNames.conferencePrepare,
      page: () => const ConferencePreparePage(),
    ),
    GetPage(
      name: RouteNames.conferenceCreateRoom,
      page: () => const ConferenceCreateRoomPage(),
    ),
    GetPage(
      name: RouteNames.conferenceEnterRoom,
      page: () => const ConferenceEnterRoomPage(),
    ),
  ];
}
