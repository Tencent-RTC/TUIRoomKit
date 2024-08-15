import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:tencent_conference_uikit/common/index.dart';

import 'index.dart';
import 'widgets/widgets.dart';

class SettingWidget extends GetView<SettingController> {
  const SettingWidget({Key? key}) : super(key: key);

  Widget _buildSettingPage(Orientation orientation) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Visibility(
            visible: orientation == Orientation.landscape,
            child: SizedBox(height: 25.0.scale375()),
          ),
          Text(
            'videoSetting'.roomTr,
            style: RoomTheme.defaultTheme.textTheme.bodyMedium,
          ),
          const SizedBox(height: 8.0),
          VideoSettingWidget(orientation: orientation),
          const SizedBox(height: 24.0),
          Text(
            'audioSetting'.roomTr,
            style: RoomTheme.defaultTheme.textTheme.bodyMedium,
          ),
          const SizedBox(height: 8.0),
          const AudioSettingWidget(),
          const SizedBox(height: 24.0),
          Text(
            'otherSettings'.roomTr,
            style: RoomTheme.defaultTheme.textTheme.bodyMedium,
          ),
          const SizedBox(height: 8.0),
          const OtherSettingWidget(),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<SettingController>(
      init: SettingController(),
      id: "setting",
      builder: (_) {
        return LayoutBuilder(
          builder: (BuildContext context, BoxConstraints constraints) {
            Orientation orientation = MediaQuery.of(context).orientation;
            return BottomSheetWidget(
              height: orientation == Orientation.portrait
                  ? Get.height * 0.88
                  : Get.height,
              orientation: orientation,
              child: _buildSettingPage(orientation),
            );
          },
        );
      },
    );
  }
}
