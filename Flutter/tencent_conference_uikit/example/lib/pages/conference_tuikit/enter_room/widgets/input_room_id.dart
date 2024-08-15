import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../index.dart';

class InputRoomIdWidget extends GetView<EnterRoomController> {
  const InputRoomIdWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          flex: 1,
          child: Text(
            "roomId".tr,
            style: Get.textTheme.bodyMedium,
          ),
        ),
        Expanded(
            flex: 3,
            child: TextField(
              controller: controller.roomIdController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                  hintText: "roomIdInputHint".tr,
                  hintStyle: Get.textTheme.labelMedium,
                  border: InputBorder.none,
                  enabledBorder: InputBorder.none,
                  isCollapsed: true),
              style: Get.textTheme.bodyMedium,
            ))
      ],
    );
  }
}
