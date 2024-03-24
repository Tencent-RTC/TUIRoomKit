import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';
import 'package:rtc_conference_tui_kit/conference/conference_params.dart';
import 'package:rtc_conference_tui_kit/conference/conference_observer.dart';
import 'package:rtc_conference_tui_kit/pages/conference_main/widgets/bottom_view/widgets/widgets.dart';
import 'package:rtc_conference_tui_kit/pages/conference_main/widgets/widgets.dart';

import 'index.dart';

class ConferenceMainPage extends GetView<ConferenceMainController> {
  const ConferenceMainPage(
      {this.roomId,
      this.isCreateRoom,
      this.conferenceParams,
      this.conferenceObserver,
      Key? key})
      : super(key: key);

  final String? roomId;
  final bool? isCreateRoom;
  final ConferenceParams? conferenceParams;
  final ConferenceObserver? conferenceObserver;

  Widget _buildView() {
    return GestureDetector(
      onTap: () {
        controller.onMainViewClick();
      },
      behavior: HitTestBehavior.translucent,
      child: WillPopScope(
        onWillPop: () async {
          showConferenceBottomSheet(const ExitWidget());
          return false;
        },
        child: Stack(
          children: [
            Obx(
              () {
                return Column(
                  children: [
                    SizedBox(height: 100.0.scale375Height()),
                    Expanded(
                      child: SizedBox(
                        width: Get.width,
                        height: 660.0.scale375Height(),
                        child: controller.isEnteredRoom.value
                            ? RoomStore.to.currentUser.hasScreenStream.value
                                ? const LocalScreenSharingWidget()
                                : const VideoPageTurningPage()
                            : const SizedBox.shrink(),
                      ),
                    ),
                    SizedBox(height: 50.0.scale375Height()),
                  ],
                );
              },
            ),
            Obx(
              () => Visibility(
                visible: controller.areWidgetsVisible.value &&
                    controller.isEnteredRoom.value,
                child: const TopViewWidget(),
              ),
            ),
            Column(
              children: [
                const Expanded(child: SizedBox()),
                Obx(
                  () => Visibility(
                    visible: controller.areWidgetsVisible.value &&
                        controller.isEnteredRoom.value,
                    child: const BottomViewWidget(),
                  ),
                ),
                Obx(
                  () => Visibility(
                    visible: !controller.areWidgetsVisible.value &&
                        RoomStore.to.isMicItemTouchable.value,
                    child: const MicButton(),
                  ),
                ),
              ],
            )
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<ConferenceMainController>(
      init: ConferenceMainController(
          roomId: roomId,
          isCreateRoom: isCreateRoom,
          conferenceParams: conferenceParams,
          conferenceObserver: conferenceObserver),
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
