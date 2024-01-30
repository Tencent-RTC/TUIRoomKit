import 'dart:ui';

import 'package:get/get.dart';
import 'package:room_flutter_example/common/index.dart';

import 'en_us.dart';
import 'zh_cn.dart';

class TranslationService extends Translations {
  static Locale? get locale => Get.deviceLocale;
  static const fallbackLocale = Locale('en', 'US');
  @override
  Map<String, Map<String, String>> get keys => {
        'en_us': enUS,
        'zh_cn': zhCN,
      };

  static bool isSetLanguageBefore() {
    return StorageService.to.containsKey(Constants.storageLanguageKey);
  }

  static void saveLanguage(String language) {
    StorageService.to.setString(Constants.storageLanguageKey, language);
  }

  static String loadLanguage() {
    return StorageService.to.getString(Constants.storageLanguageKey);
  }
}
