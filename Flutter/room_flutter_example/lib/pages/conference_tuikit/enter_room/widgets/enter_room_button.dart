import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../index.dart';

class EnterRoomButton extends GetView<EnterRoomController> {
  const EnterRoomButton({super.key});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 53,
      child: ElevatedButton(
        onPressed: () => controller.enterRoom(),
        child: Text(
          'enterRoom'.tr,
          style: Get.textTheme.bodyLarge,
        ),
      ),
    );
  }
}
