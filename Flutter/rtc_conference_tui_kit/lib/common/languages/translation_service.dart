import 'dart:ui';

import 'package:get/get.dart';

import 'en_us.dart';
import 'zh_cn.dart';

class RoomContentsTranslations {
  static const Map<String, Map<String, String>> translations = {
    'en': roomContentsEnUS,
    'zh': roomContentsZhCN,
  };

  static const String fallbackLocale = 'en';

  static String translate(String key) {
    final locale = Get.locale ?? const Locale(fallbackLocale);
    final language = locale.languageCode;
    return translations[language]?[key] ?? key;
  }
}
