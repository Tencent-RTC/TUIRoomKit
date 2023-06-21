import 'package:get/get.dart';

import '../../pages/index.dart';
import 'names.dart';

class RoutePages {
  // 列表
  // static List<GetPage> list = [];
  static final List<GetPage> routes = [
    GetPage(
      name: RouteNames.roomAnchor,
      page: () => const RoomAnchorPage(),
    ),
    GetPage(
      name: RouteNames.roomAudience,
      page: () => const RoomAudiencePage(),
    ),
  ];
}
