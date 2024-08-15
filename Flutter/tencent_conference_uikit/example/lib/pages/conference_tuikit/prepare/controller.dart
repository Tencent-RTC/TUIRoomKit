import 'dart:io';
import 'dart:ui';

import 'package:get/get.dart';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:room_flutter_example/common/index.dart';
import 'package:tencent_conference_uikit/tencent_conference_uikit.dart';

import 'widgets/widgets.dart';

class PrepareController extends GetxController {
  PrepareController();

  Directory? currentDirectory;

  toCreateRoomPage() {
    Get.toNamed(RouteNames.conferenceCreateRoom);
  }

  toEnterRoomPage() {
    Get.toNamed(RouteNames.conferenceEnterRoom);
  }

  toScheduleRoomPage() {
    Get.to(() => const ScheduleConferencePage());
  }

  finishPage() {
    Get.back();
  }

  switchLanguage() {
    if (Get.locale!.languageCode ==
        TranslationService.fallbackLocale.languageCode) {
      Get.updateLocale(const Locale('zh', 'CN'));
      TranslationService.saveLanguage('zh');
    } else {
      Get.updateLocale(TranslationService.fallbackLocale);
      TranslationService.saveLanguage(
          TranslationService.fallbackLocale.languageCode);
    }
  }

  showFileBrowser() async {
    currentDirectory = await getApplicationDocumentsDirectory();
    Get.to(() => const FileBrowser());
  }
}
