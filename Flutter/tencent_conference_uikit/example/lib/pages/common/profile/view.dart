import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:room_flutter_example/common/index.dart';

import 'index.dart';

class ProfilePage extends GetView<ProfileController> {
  const ProfilePage({Key? key}) : super(key: key);

  Widget _buildView() {
    return Padding(
      padding: const EdgeInsets.only(left: 16, right: 16),
      child: Column(
        children: [
          const SizedBox(
            height: 68,
          ),
          SizedBox(
            width: 100,
            height: 100,
            child: CircleAvatar(
              backgroundImage: NetworkImage(UserStore.to.userModel.avatarURL),
            ),
          ),
          const SizedBox(
            height: 30,
          ),
          TextField(
            style: Get.textTheme.displayMedium,
            controller: controller.userNameController,
            decoration: InputDecoration(
              hintText: 'userNameInputHint'.tr,
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
          ),
          const SizedBox(
            height: 10,
          ),
          Align(
              alignment: Alignment.centerLeft, child: Text('userNameTips'.tr)),
          const SizedBox(
            height: 30,
          ),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => controller.toMainPage(),
              child: Text(
                'register'.tr,
                style: Get.textTheme.bodyMedium,
              ),
            ),
          )
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<ProfileController>(
      init: ProfileController(),
      id: "profile",
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
