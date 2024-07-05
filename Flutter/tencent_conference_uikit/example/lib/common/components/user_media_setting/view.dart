import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../index.dart';
import 'widgets/widgets.dart';

class UserMediaSettingWidget extends GetView<UserMediaSettingController> {
  const UserMediaSettingWidget({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return GetBuilder<UserMediaSettingController>(
      init: UserMediaSettingController(),
      id: "user_media_setting",
      builder: (_) {
        return _buildView();
      },
    );
  }

  Widget _buildView() {
    return RoundedContainerWidget(
      children: [
        SwitchWidget(
            text: "openMicrophone".tr,
            value: UserStore.to.openMicrophone,
            onValueChanged: (value) => controller.openMicrophone(value)),
        const Divider(
          height: 8,
          indent: 0.0,
        ),
        SwitchWidget(
            text: "openCamera".tr,
            value: UserStore.to.openCamera,
            onValueChanged: (value) => controller.openCamera(value)),
        const Divider(
          height: 8,
          indent: 0.0,
        ),
        SwitchWidget(
            text: "useSpeaker".tr,
            value: UserStore.to.userSpeaker,
            onValueChanged: (value) => controller.userSpeaker(value)),
      ],
    );
  }
}
