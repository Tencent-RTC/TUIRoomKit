import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:tencent_conference_uikit/common/index.dart';
import 'package:rtc_room_engine/api/room/tui_room_define.dart';

import '../../widgets.dart';
import 'widgets.dart';

class BottomButtonsWidget extends GetView<BottomViewController> {
  const BottomButtonsWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Obx(
      () => Column(
        mainAxisAlignment: MainAxisAlignment.start,
        children: [
          SizedBox(height: 8.0.scale375()),
          SizedBox(
            width: 343.0.scale375(),
            child: Row(children: _buildBaseButtons()),
          ),
          if (controller.isUnfold.value && controller.showMoreButton.value) ...[
            SizedBox(
              height: 8.0.scale375(),
              width: 343.0.scale375(),
            ),
            SizedBox(
              width: 343.0.scale375(),
              child: Row(children: _buildMoreButtons()),
            )
          ],
        ],
      ),
    );
  }

  List<Widget> _buildBottomButtons() {
    return [
      Obx(
        () => BottomButtonItemWidget(
          image: Image.asset(
            AssetsImages.roomMember,
            package: 'tencent_conference_uikit',
          ),
          onPressed: () {
            showConferenceBottomSheet(const UserListWidget());
          },
          text: '${'member'.roomTr}(${RoomStore.to.userInfoList.length})',
        ),
      ),
      Obx(
        () => Visibility(
          visible: controller.isMicAndCameraButtonVisible(),
          child: BottomButtonItemWidget(
            image: Image.asset(
              AssetsImages.roomMicOff,
              package: 'tencent_conference_uikit',
            ),
            selectedWidget: VolumeBarWidget(
              lineWidth: 1,
              volume: RoomStore.to.currentUser.volume,
              imageName: AssetsImages.roomUnMuteAudio,
            ),
            onPressed: () {
              controller.muteAudioAction();
            },
            isSelected: RoomStore.to.currentUser.hasAudioStream,
            text: 'unmute'.roomTr,
            selectedText: 'mute'.roomTr,
            opacity: RoomStore.to.isMicItemTouchable.value ? 1 : 0.5,
          ),
        ),
      ),
      Obx(
        () => Visibility(
          visible: controller.isMicAndCameraButtonVisible(),
          child: BottomButtonItemWidget(
            image: Image.asset(
              AssetsImages.roomCameraOff,
              package: 'tencent_conference_uikit',
            ),
            selectedImage: Image.asset(
              AssetsImages.roomCameraOn,
              package: 'tencent_conference_uikit',
            ),
            onPressed: () {
              controller.muteVideoAction();
            },
            isSelected: RoomStore.to.currentUser.hasVideoStream,
            text: 'openVideo'.roomTr,
            selectedText: 'closeVideo'.roomTr,
            opacity: RoomStore.to.isCameraItemTouchable.value ? 1 : 0.5,
          ),
        ),
      ),
      Obx(
        () => Visibility(
          visible: controller.isRaiseHandButtonVisible(),
          child: RoomStore.to.currentUser.isOnSeat.value
              ? BottomButtonItemWidget(
                  image: Image.asset(
                    AssetsImages.roomLeaveSeat,
                    package: 'tencent_conference_uikit',
                  ),
                  onPressed: () {
                    controller.leaveSeat();
                  },
                  text: 'leaveSeat'.roomTr,
                )
              : BottomButtonItemWidget(
                  image: Image.asset(
                    AssetsImages.roomApplyJoinStage,
                    package: 'tencent_conference_uikit',
                  ),
                  selectedImage: Image.asset(
                    AssetsImages.roomCancelRequest,
                    package: 'tencent_conference_uikit',
                  ),
                  onPressed: () {
                    controller.raiseHandAction();
                  },
                  isSelected: controller.isRequestingTakeSeat,
                  text: RoomStore.to.currentUser.userRole.value ==
                          TUIRole.administrator
                      ? 'joinStage'.roomTr
                      : 'applyJoinStage'.roomTr,
                  selectedText: 'cancelStage'.roomTr,
                ),
        ),
      ),
      Obx(
        () => Visibility(
          visible: controller.isRaiseHandListButtonVisible(),
          child: BottomButtonItemWidget(
            image: Image.asset(
              AssetsImages.roomHandRaiseList,
              package: 'tencent_conference_uikit',
            ),
            onPressed: () {
              showConferenceBottomSheet(const RaiseHandListWidget());
            },
            text: 'stageManagement'.roomTr,
          ),
        ),
      ),
      BottomButtonItemWidget(
        image: Image.asset(
          AssetsImages.roomShareScreenOn,
          package: 'tencent_conference_uikit',
        ),
        selectedImage: Image.asset(
          AssetsImages.roomShareScreenOff,
          package: 'tencent_conference_uikit',
        ),
        onPressed: () {
          controller.onScreenShareButtonPressed();
        },
        isSelected: RoomStore.to.currentUser.hasScreenStream,
        text: 'shareOn'.roomTr,
        selectedText: 'shareOff'.roomTr,
      ),
      Visibility(
        visible: controller.conferenceMainController.chatWidget != null,
        child: BottomButtonItemWidget(
          image: Image.asset(
            AssetsImages.roomChat,
            package: 'tencent_conference_uikit',
          ),
          onPressed: () {
            Get.to(() => controller.conferenceMainController.chatWidget!,
                arguments: {'from': 'ConferenceMainPage'});
          },
          text: 'chat'.roomTr,
        ),
      ),
      BottomButtonItemWidget(
        image: Image.asset(
          AssetsImages.roomInvite,
          package: 'tencent_conference_uikit',
        ),
        onPressed: () {
          showConferenceBottomSheet(const InviteSheetWidget());
        },
        text: 'invite'.roomTr,
      ),
      BottomButtonItemWidget(
        image: Image.asset(
          AssetsImages.roomFloat,
          package: 'tencent_conference_uikit',
        ),
        onPressed: () {
          controller.enableFloatWindow();
        },
        text: 'float'.roomTr,
      ),
      BottomButtonItemWidget(
        image: Image.asset(
          AssetsImages.roomSetting,
          package: 'tencent_conference_uikit',
        ),
        onPressed: () {
          showConferenceBottomSheet(const SettingWidget());
        },
        text: 'setting'.roomTr,
      ),
    ].where((widget) {
      if (widget is Obx) {
        final visibilityWidget = widget.builder();
        if (visibilityWidget is Visibility) {
          return visibilityWidget.visible;
        }
      }
      if (widget is Visibility) {
        return widget.visible;
      }
      return true;
    }).toList();
  }

  List<Widget> _buildBaseButtons() {
    var baseButtons = _buildBottomButtons()
        .sublist(0, 5)
        .expand((widget) => [widget, SizedBox(width: 10.0.scale375())])
        .toList();
    baseButtons.add(
      BottomButtonItemWidget(
        image: Image.asset(
          AssetsImages.roomMore,
          package: 'tencent_conference_uikit',
        ),
        selectedImage: Image.asset(
          AssetsImages.roomDrop,
          package: 'tencent_conference_uikit',
        ),
        onPressed: () {
          controller.changeFoldState();
        },
        isSelected: controller.isUnfold,
        text: 'unfold'.roomTr,
        selectedText: 'drop'.roomTr,
        width: 33,
      ),
    );
    return baseButtons;
  }

  List<Widget> _buildMoreButtons() {
    return _buildBottomButtons()
        .sublist(5)
        .expand((widget) => [widget, SizedBox(width: 10.0.scale375())])
        .toList();
  }
}
