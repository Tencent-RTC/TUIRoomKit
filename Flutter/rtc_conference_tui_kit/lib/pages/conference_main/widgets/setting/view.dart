import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';

import 'index.dart';
import 'widgets/widgets.dart';

class SettingWidget extends GetView<SettingController> {
  const SettingWidget({Key? key}) : super(key: key);

  Widget _buildSettingPage() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const DropDownButton(),
        Text(
          RoomContentsTranslations.translate('videoSetting'),
          style: RoomTheme.defaultTheme.textTheme.bodyMedium,
        ),
        const SizedBox(
          height: 8.0,
        ),
        const VideoSettingWidget(),
        const SizedBox(
          height: 24.0,
        ),
        Text(
          RoomContentsTranslations.translate('audioSetting'),
          style: RoomTheme.defaultTheme.textTheme.bodyMedium,
        ),
        const SizedBox(
          height: 8.0,
        ),
        const AudioSettingWidget(),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<SettingController>(
      init: SettingController(),
      id: "setting",
      builder: (_) {
        return BottomSheetWidget(
          width: double.infinity,
          height: Get.height * 0.88,
          child: _buildSettingPage(),
        );
      },
    );
  }
}
