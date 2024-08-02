import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:room_flutter_example/common/index.dart';
import 'package:tencent_conference_uikit/tencent_conference_uikit.dart';

import 'index.dart';
import 'widgets/widgets.dart';

class ConferencePreparePage extends GetView<PrepareController> {
  const ConferencePreparePage({Key? key}) : super(key: key);

  Widget _buildView() {
    return Column(
      children: [
        const SizedBox(height: 25),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            PrepareButtonItem(
              imagePath: AssetsImages.enterRoom,
              text: "enterRoom".tr,
              onPressed: controller.toEnterRoomPage,
            ),
            PrepareButtonItem(
              imagePath: AssetsImages.createRoom,
              text: "createRoom".tr,
              onPressed: controller.toCreateRoomPage,
            ),
            PrepareButtonItem(
              imagePath: AssetsImages.scheduleRoom,
              text: "scheduleRoom".tr,
              onPressed: controller.toScheduleRoomPage,
            ),
          ],
        ),
        const Divider(
          height: 40,
          thickness: 1,
          indent: 20,
          endIndent: 20,
          color: AppColors.dividerLightGrey,
        ),
        const ConferenceListWidget(),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<PrepareController>(
      init: PrepareController(),
      id: "prepare",
      builder: (_) {
        return Scaffold(
          appBar: AppBar(
            title: const ShowUserInfoWidget(),
            backgroundColor: AppColors.backgroundGrey,
            iconTheme: const IconThemeData(color: Colors.black),
            actions: [
              Visibility(
                visible: GetPlatform.isIOS,
                child: IconButton(
                  onPressed: () => controller.showFileBrowser(),
                  icon: Image.asset(
                    AssetsImages.debug,
                    width: 28,
                    height: 28,
                  ),
                ),
              ),
              IconButton(
                onPressed: () => controller.switchLanguage(),
                icon: Image.asset(
                  AssetsImages.switchLanguage,
                  width: 28,
                  height: 28,
                  fit: BoxFit.fill,
                ),
              ),
              const SizedBox(width: 10.0),
            ],
            scrolledUnderElevation: 0,
          ),
          resizeToAvoidBottomInset: false,
          backgroundColor: AppColors.backgroundGrey,
          body: SafeArea(child: _buildView()),
        );
      },
    );
  }
}
