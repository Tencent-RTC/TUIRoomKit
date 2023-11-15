import 'package:flutter/material.dart';
import 'package:get/get.dart';

import 'index.dart';

class MainPage extends GetView<MainController> {
  const MainPage({Key? key}) : super(key: key);

  Widget _buildView() {
    return Padding(
      padding: const EdgeInsets.only(left: 48, right: 48),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
                onPressed: () => controller.enterConferenceUIKit(),
                child: Text(
                  "RTC Room Kit",
                  style: Get.textTheme.bodyLarge,
                )),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<MainController>(
      init: MainController(),
      id: "main",
      builder: (_) {
        return Scaffold(
          body: SafeArea(
            child: _buildView(),
          ),
        );
      },
    );
  }
}
