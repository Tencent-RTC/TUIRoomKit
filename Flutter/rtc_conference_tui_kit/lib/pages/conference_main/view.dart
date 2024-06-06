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
      {this.conferenceId,
      this.isCreateConference,
      this.conferenceParams,
      this.conferenceObserver,
      Key? key})
      : super(key: key);

  final String? conferenceId;
  final bool? isCreateConference;
  final ConferenceParams? conferenceParams;
  final ConferenceObserver? conferenceObserver;

  Widget _buildView(Orientation orientation) {
    return GestureDetector(
      onTap: () {
        controller.onMainViewClick();
      },
      behavior: HitTestBehavior.translucent,
      child: WillPopScope(
        onWillPop: () async {
          showConferenceBottomSheet(const ExitWidget(), alwaysFromBottom: true);
          return false;
        },
        child: Stack(
          children: [
            Column(
              children: [
                Visibility(
                  visible: orientation == Orientation.portrait,
                  child: SizedBox(height: 90.0.scale375Height()),
                ),
                Center(
                  child: SizedBox(
                    width: orientation == Orientation.portrait
                        ? Get.width
                        : 648.0.scale375(),
                    height: orientation == Orientation.portrait
                        ? 665.0.scale375Height()
                        : Get.height,
                    child: Obx(
                      () => controller.isEnteredRoom.value
                          ? RoomStore.to.currentUser.hasScreenStream.value
                              ? const LocalScreenSharingWidget()
                              : const VideoPageTurningPage()
                          : const SizedBox.shrink(),
                    ),
                  ),
                ),
              ],
            ),
            Obx(
              () => Visibility(
                visible: controller.areWidgetsVisible.value &&
                    controller.isEnteredRoom.value,
                child: TopViewWidget(orientation),
              ),
            ),
            Column(
              children: [
                const Expanded(child: SizedBox()),
                Obx(
                  () => Visibility(
                    visible: controller.areWidgetsVisible.value &&
                        controller.isEnteredRoom.value,
                    child: BottomViewWidget(orientation),
                  ),
                ),
                Obx(
                  () => Visibility(
                    visible: !controller.areWidgetsVisible.value &&
                        RoomStore.to.isMicItemTouchable.value,
                    child: Column(
                      children: [
                        const MicButton(),
                        SizedBox(
                            height: orientation == Orientation.landscape
                                ? 10.0.scale375()
                                : 29.0.scale375()),
                      ],
                    ),
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
          conferenceId: conferenceId,
          isCreateConference: isCreateConference,
          conferenceParams: conferenceParams,
          conferenceObserver: conferenceObserver),
      id: "conference_main",
      builder: (_) {
        return Scaffold(
          resizeToAvoidBottomInset: false,
          backgroundColor: RoomTheme.defaultTheme.scaffoldBackgroundColor,
          body: OrientationBuilder(
            builder: (BuildContext context, Orientation orientation) {
              return _buildView(orientation);
            },
          ),
        );
      },
    );
  }
}
