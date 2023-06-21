import 'package:flutter/material.dart';
import 'package:get/get.dart';

import 'index.dart';

class LoginPage extends GetView<LoginController> {
  final _userIdController = TextEditingController();
  LoginPage({Key? key}) : super(key: key);

  Widget buildUserIdInputWidget(TextEditingController? userIdController) {
    return TextField(
      controller: userIdController,
      decoration: InputDecoration(
          enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(32.0),
              borderSide: const BorderSide(color: Colors.blue, width: 0.5)),
          focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(32.0),
              borderSide: const BorderSide(color: Colors.blue, width: 0.5)),
          labelText: "userId:",
          labelStyle: const TextStyle(color: Colors.blue),
          border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(32.0),
              borderSide: const BorderSide(color: Colors.blue))),
      style: const TextStyle(fontSize: 16, color: Colors.blue),
    );
  }

  Widget buildLoginButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: () => controller.login(_userIdController.text),
        style: ButtonStyle(
            shape: MaterialStateProperty.all(RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(35))),
            padding: MaterialStateProperty.all(const EdgeInsets.all(16))),
        child: Text("login".tr),
      ),
    );
  }

  // 主视图
  Widget _buildView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.only(left: 24.0, right: 24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            buildUserIdInputWidget(_userIdController),
            const SizedBox(height: 24),
            buildLoginButton(),
          ],
        ),
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
          appBar: AppBar(title: const Text("login")),
          body: SafeArea(
            child: _buildView(),
          ),
        );
      },
    );
  }
}
