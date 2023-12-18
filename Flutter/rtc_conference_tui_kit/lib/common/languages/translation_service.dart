import 'package:get/get.dart';

import 'en_us.dart';
import 'zh_cn.dart';

class RoomContentsTranslations {
  static const Map<String, Map<String, String>> translations = {
    'en_US': roomContentsEnUS,
    'zh_CN': roomContentsZhCN,
  };

  static const String fallbackLocale = 'en';

  static String translate(String key) {
    final locale = Get.locale!.languageCode == 'zh' ? 'zh_CN' : 'en_US';
    return translations[locale]?[key] ?? key;
  }
}
