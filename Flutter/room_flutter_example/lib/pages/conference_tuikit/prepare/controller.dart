import 'package:flutter/material.dart';
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

  switchLanguage() {
    if (Get.locale!.languageCode ==
        TranslationService.fallbackLocale.languageCode) {
      Get.updateLocale(const Locale('zh', 'CN'));
    } else {
      Get.updateLocale(TranslationService.fallbackLocale);
    }
  }
}
