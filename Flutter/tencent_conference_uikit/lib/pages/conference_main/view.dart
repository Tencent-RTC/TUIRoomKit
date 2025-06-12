import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:tencent_conference_uikit/common/index.dart';
import 'package:tencent_conference_uikit/conference/conference_params.dart';
import 'package:tencent_conference_uikit/conference/conference_observer.dart';
import 'package:tencent_conference_uikit/pages/conference_main/widgets/bottom_view/widgets/widgets.dart';
import 'package:tencent_conference_uikit/pages/conference_main/widgets/widgets.dart';
import 'package:tencent_float_chat_widget/tencent_float_chat_widget.dart';

import 'index.dart';

class ConferenceMainPage extends GetView<ConferenceMainController> {
  const ConferenceMainPage(
      {this.conferenceId,
      this.isCreateConference,
      this.conferenceParams,
      this.conferenceObserver,
      this.chatWidget,
      Key? key})
      : super(key: key);

  /// The Id of the conference to be created or joined.
  ///
  /// Note: This parameter is only required when directly navigating to `ConferenceMainPage`.
  /// If you use `ConferenceSession` to create or join the conference successfully, this parameter will be invalid.
  ///
  /// This parameter is used to specify the unique identifier for the conference.
  /// When creating a new conference, this ID will be used as the conference ID.
  /// When joining an existing conference, this ID should match the ID of the conference you wish to join.
  ///
  /// For more details, please refer to the documentation at [RoomKit API](https://trtc.io/document/60356).
  final String? conferenceId;

  /// Used to determine whether to join an existing conference or create a new one.
  ///
  /// Note: This parameter is only required when directly navigating to `ConferenceMainPage`.
  /// If you use `ConferenceSession` to create or join the conference successfully, this parameter will be invalid.
  ///
  /// This parameter is used to determine the action to be taken:
  /// - `true`: Create a new conference.
  /// - `false`: Join an existing conference.
  ///
  /// For more details, please refer to the documentation at [RoomKit API](https://trtc.io/document/60356).
  final bool? isCreateConference;

  /// Parameters related to the creation or joining of a conference.
  ///
  /// This parameter is used to specify various settings and options for the conference, such as microphone and camera settings, speaker usage, and permissions for all users.
  ///
  /// Note: This parameter is only required when directly navigating to `ConferenceMainPage`.
  /// If you use `ConferenceSession` to join the conference successfully, this parameter will be invalid.
  ///
  /// For more details, please refer to the documentation at [RoomKit API](https://trtc.io/document/60356).
  final ConferenceParams? conferenceParams;

  /// Callback listener for conference state changes.
  ///
  /// This parameter is used to handle various events related to the conference, such as when the conference starts, joins, finishes, or exits.
  ///
  /// Note: This parameter is only required when directly navigating to `ConferenceMainPage`.
  /// If you use `ConferenceSession` to join the conference successfully, this parameter will be invalid.
  ///
  /// For more details, please refer to the documentation at [RoomKit API](https://trtc.io/document/60356).
  final ConferenceObserver? conferenceObserver;

  /// The chat widget to be displayed in the conference page.
  ///
  /// This widget is used to enable real-time chat functionality within the conference.
  /// By passing this widget to the `ConferenceMainPage`, a chat button will appear in the bottom toolbar.
  /// Clicking the chat button will navigate to the chat interface, allowing participants to send and receive messages.
  ///
  /// To use this feature, you need to add the `tencent_cloud_chat_message` plugin dependency to your project's `pubspec.yaml` file.
  /// Make sure to initialize and configure the chat component properly before using it in the conference page.
  /// For detailed usage, please refer to the documentation at [In-Conference Chat](https://example.com) or the example project.
  final Widget? chatWidget;

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
            Obx(
              () => Visibility(
                visible: RoomStore.to.isFloatChatVisible.value,
                child: Positioned(
                  bottom: orientation == Orientation.portrait
                      ? 88.0.scale375()
                      : 70.0.scale375(),
                  left: orientation == Orientation.portrait
                      ? 16.0.scale375()
                      : 52.0.scale375(),
                  child: FloatChatWidget(roomId: RoomStore.to.roomInfo.roomId),
                ),
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
            ),
            Obx(
              () => Visibility(
                visible: RoomStore.to.isFloatChatVisible.value,
                child: const InputWidget(),
              ),
            ),
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
        conferenceObserver: conferenceObserver,
        chatWidget: chatWidget,
      ),
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
