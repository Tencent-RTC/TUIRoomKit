import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../index.dart';

class CreateRoomButtonWidget extends GetView<CreateRoomController> {
  const CreateRoomButtonWidget({super.key});

  @override
  Widget build(BuildContext context) {
    double screenWidth = Get.width;
    return SizedBox(
      width: screenWidth * 0.4,
      height: 52,
      child: ElevatedButton(
        onPressed: () => controller.createRoom(),
        child: Text('createRoom'.tr, style: Get.textTheme.bodyMedium),
      ),
    );
  }
}
