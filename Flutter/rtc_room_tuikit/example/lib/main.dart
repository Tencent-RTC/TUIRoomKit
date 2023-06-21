import 'package:flutter/material.dart';
import 'package:get/get.dart';


import 'common/languages/translation_service.dart';
import 'common/routers/routes.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return GetMaterialApp(
      locale: Get.deviceLocale,
      fallbackLocale: TranslationService.fallbackLocale,
      initialRoute: AppRoutes.login,
      debugShowCheckedModeBanner: false,
      getPages: AppPages.routes,
      translations: TranslationService(),
    );
  }
}
