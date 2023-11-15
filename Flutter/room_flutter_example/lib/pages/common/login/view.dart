import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:room_flutter_example/common/index.dart';

import 'index.dart';
import 'widgets/widgets.dart';

class LoginPage extends GetView<LoginController> {
  const LoginPage({Key? key}) : super(key: key);
  Widget _buildView(TextEditingController controller) {
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
                  decoration: InputDecoration(hintText: 'userIdInputHint'.tr),
                  keyboardType: TextInputType.number,
                  controller: controller,
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
          body: SafeArea(
            child: _buildView(controller.userIdController),
          ),
        );
      },
    );
  }
}
