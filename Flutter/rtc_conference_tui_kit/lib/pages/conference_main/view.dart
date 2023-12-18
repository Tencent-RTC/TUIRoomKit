import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';
import 'package:rtc_conference_tui_kit/pages/conference_main/widgets/widgets.dart';

import 'index.dart';

class ConferenceMainPage extends GetView<ConferenceMainController> {
  const ConferenceMainPage({Key? key}) : super(key: key);

  Widget _buildView() {
    return WillPopScope(
      onWillPop: () async {
        Get.bottomSheet(const ExitWidget());
        return false;
      },
      child: Column(
        children: [
          const TopViewWidget(),
          Expanded(
            child: Obx(
              () {
                return RoomStore.to.currentUser.hasScreenStream.value
                    ? const LocalScreenSharingWidget()
                    : const VideoPageTurningPage();
              },
            ),
          ),
          const BottomViewWidget(),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<ConferenceMainController>(
      init: ConferenceMainController(),
      id: "conference_main",
      builder: (_) {
        return Scaffold(
          resizeToAvoidBottomInset: true,
          backgroundColor: RoomTheme.defaultTheme.scaffoldBackgroundColor,
          body: SafeArea(
            top: false,
            child: _buildView(),
          ),
        );
      },
    );
  }
}
