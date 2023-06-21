import 'dart:ui';

import 'package:get/get.dart';
import 'package:rtc_room_engine_example/common/languages/zh_cn.dart';
import 'package:rtc_room_tuikit/common/i18n/room_contents_en_us.dart';
import 'package:rtc_room_tuikit/common/i18n/room_contents_zh_cn.dart';

import 'en_us.dart';

class TranslationService extends Translations {
  static Locale? get locale => Get.deviceLocale;
  static const fallbackLocale = Locale('en', 'US');
  @override
  Map<String, Map<String, String>> get keys => {
        'en_us': {...enUS, ...roomContentsEnUS},
        'zh_cn': {...zhCN, ...roomContentsZhCN},
      };
}
