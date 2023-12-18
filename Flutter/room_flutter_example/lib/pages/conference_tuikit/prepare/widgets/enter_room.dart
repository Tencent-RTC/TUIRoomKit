import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../../common/index.dart';
import '../index.dart';

class EnterRoomWidget extends GetView<PrepareController> {
  const EnterRoomWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Image.asset(
            AssetsImages.enterRoom,
            width: 16,
            height: 16,
          ),
          const SizedBox(width: 5),
          Text(
            'enterRoom'.tr,
            style: const TextStyle(fontSize: 16, color: Colors.white),
          )
        ],
      ),
      onPressed: () => controller.toEnterRoomPage(),
    );
  }
}
