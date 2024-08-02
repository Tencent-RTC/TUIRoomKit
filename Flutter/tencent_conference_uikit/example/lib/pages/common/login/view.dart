import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:room_flutter_example/common/index.dart';

import 'index.dart';
import 'widgets/widgets.dart';

class LoginPage extends GetView<LoginController> {
  const LoginPage({Key? key}) : super(key: key);
  Widget _buildView() {
    return Container(
      padding: const EdgeInsets.only(left: 24.0, right: 24.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Expanded(
            flex: 1,
            child: Center(
              heightFactor: double.infinity,
              child: Image.asset(AssetsImages.tencentCloud),
            ),
          ),
          Expanded(
            flex: 1,
            child: Column(
              children: [
                TextField(
                  focusNode: controller.focusNode,
                  style: Get.textTheme.displayMedium,
                  decoration: InputDecoration(
                    hintText: 'userIdInputHint'.tr,
                    hintStyle: const TextStyle(
                      color: AppColors.textHintGrey,
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: const BorderSide(
                        color: AppColors.btnBackgroundBlue,
                      ),
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: const BorderSide(
                        color: AppColors.btnBackgroundBlue,
                      ),
                    ),
                  ),
                  controller: controller.userIdController,
                ),
                const SizedBox(height: 30),
                const LoginButtonWidget(),
              ],
            ),
          )
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<LoginController>(
      init: LoginController(),
      id: "login",
      builder: (_) {
        return Scaffold(
          appBar: AppBar(
            backgroundColor: Colors.transparent,
          ),
          body: SafeArea(
            child: _buildView(),
          ),
        );
      },
    );
  }
}
