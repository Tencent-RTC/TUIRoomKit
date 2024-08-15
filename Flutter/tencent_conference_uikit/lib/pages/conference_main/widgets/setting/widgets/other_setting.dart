import 'package:get/get.dart';
import 'package:flutter/material.dart';
import 'package:tencent_conference_uikit/common/index.dart';
import 'package:tencent_conference_uikit/pages/conference_main/widgets/widgets.dart';

class OtherSettingWidget extends GetView<SettingController> {
  const OtherSettingWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return RoundedContainerWidget(
      child: SettingItemWidget(
        title: 'openFloatingChat'.roomTr,
        child: SizedBox(
          height: 24,
          child: Obx(
            () => SwitchWidget(
              value:
                  controller.conferenceMainController.isFloatChatVisible.value,
              onChanged: (value) {
                controller.enableFloatingChat(value);
              },
            ),
          ),
        ),
      ),
    );
  }
}
