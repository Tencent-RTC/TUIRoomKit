import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../index.dart';

class ShowUserNameWidget extends GetView<EnterRoomController> {
  const ShowUserNameWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          flex: 1,
          child: Text(
            "userName".tr,
            style: Get.textTheme.bodyLarge,
          ),
        ),
        Expanded(
          flex: 3,
          child: Text(
            controller.getUserName(),
            style: Get.textTheme.bodyLarge,
          ),
        )
      ],
    );
  }
}
