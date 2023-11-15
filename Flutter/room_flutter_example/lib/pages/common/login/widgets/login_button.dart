import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../index.dart';

class LoginButtonWidget extends GetView<LoginController> {
  const LoginButtonWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: () => controller.login(),
        child: Text(
          'login'.tr,
          style: Get.textTheme.bodyLarge,
        ),
      ),
    );
  }
}
