import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:room_flutter_example/common/index.dart';
import 'package:tencent_cloud_chat_intl/localizations/tencent_cloud_chat_localizations.dart';

void main() {
  Get.put<UserStore>(UserStore());
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return GetMaterialApp(
      locale: Get.deviceLocale,
      initialRoute: RouteNames.commonLogin,
      getPages: RoutePages.list,
      translations: TranslationService(),
      fallbackLocale: TranslationService.fallbackLocale,
      theme: AppTheme.defaultTheme,
      localizationsDelegates: const [
        ...TencentCloudChatLocalizations.localizationsDelegates,
      ],
      supportedLocales: const [
        ...TencentCloudChatLocalizations.supportedLocales,
      ],
    );
  }
}
