import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';
import 'package:rtc_room_engine/api/room/tui_room_define.dart';

import '../../widgets.dart';
import 'widgets.dart';

class BaseButtonWidget extends GetView<BottomViewController> {
  const BaseButtonWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: Get.width - 32.0.scale375(),
      child: Row(
        children: [
          Obx(
            () => BottomButtonItemWidget(
              image: Image.asset(
                AssetsImages.roomMember,
                package: 'rtc_conference_tui_kit',
                width: 24,
                height: 24,
              ),
              onPressed: () {
                showConferenceBottomSheet(
                  const UserListWidget(),
                  isScrollControlled: true,
                );
              },
              isSelected: false.obs,
              text:
                  '${RoomContentsTranslations.translate('member')}(${RoomStore.to.userInfoList.length})',
            ),
          ),
          SizedBox(width: 10.0.scale375()),
          Obx(
            () => Visibility(
              visible: controller.isMicAndCameraButtonVisible(),
              child: BottomButtonItemWidget(
                image: Image.asset(
                  AssetsImages.roomMicOff,
                  package: 'rtc_conference_tui_kit',
                  width: 24,
                  height: 24,
                ),
                selectedWidget: SizedBox(
                  width: 24,
                  height: 24,
                  child: VolumeBarWidget(
                    lineWidth: 1,
                    volume: RoomStore.to.currentUser.volume,
                    imageName: AssetsImages.roomUnMuteAudio,
                  ),
                ),
                onPressed: () {
                  controller.muteAudioAction();
                },
                isSelected: RoomStore.to.currentUser.hasAudioStream,
                text: RoomContentsTranslations.translate('unmute'),
                selectedText: RoomContentsTranslations.translate('mute'),
                opacity: RoomStore.to.isMicItemTouchable.value ? 1 : 0.5,
              ),
            ),
          ),
          Obx(
            () => Visibility(
              visible: controller.isMicAndCameraButtonVisible(),
              child: SizedBox(width: 10.0.scale375()),
            ),
          ),
          Obx(
            () => Visibility(
              visible: controller.isMicAndCameraButtonVisible(),
              child: BottomButtonItemWidget(
                image: Image.asset(
                  AssetsImages.roomCameraOff,
                  package: 'rtc_conference_tui_kit',
                  width: 24,
                  height: 24,
                ),
                selectedImage: Image.asset(
                  AssetsImages.roomCameraOn,
                  package: 'rtc_conference_tui_kit',
                  width: 24,
                  height: 24,
                ),
                onPressed: () {
                  controller.muteVideoAction();
                },
                isSelected: RoomStore.to.currentUser.hasVideoStream,
                text: RoomContentsTranslations.translate('openVideo'),
                selectedText: RoomContentsTranslations.translate('closeVideo'),
                opacity: RoomStore.to.isCameraItemTouchable.value ? 1 : 0.5,
              ),
            ),
          ),
          Obx(
            () => Visibility(
              visible: controller.isMicAndCameraButtonVisible(),
              child: SizedBox(width: 10.0.scale375()),
            ),
          ),
          Obx(
            () => Visibility(
              visible: controller.isRaiseHandButtonVisible(),
              child: RoomStore.to.currentUser.isOnSeat.value
                  ? BottomButtonItemWidget(
                      image: Image.asset(
                        AssetsImages.roomLeaveSeat,
                        package: 'rtc_conference_tui_kit',
                        width: 24,
                        height: 24,
                      ),
                      onPressed: () {
                        controller.leaveSeat();
                      },
                      isSelected: false.obs,
                      text: RoomContentsTranslations.translate('leaveSeat'),
                    )
                  : BottomButtonItemWidget(
                      image: Image.asset(
                        AssetsImages.roomApplyJoinStage,
                        package: 'rtc_conference_tui_kit',
                        width: 24,
                        height: 24,
                      ),
                      selectedImage: Image.asset(
                        AssetsImages.roomCancelRequest,
                        package: 'rtc_conference_tui_kit',
                        width: 24,
                        height: 24,
                      ),
                      onPressed: () {
                        controller.raiseHandAction();
                      },
                      isSelected: controller.isRequestingTakeSeat,
                      text: RoomStore.to.currentUser.userRole.value ==
                              TUIRole.administrator
                          ? RoomContentsTranslations.translate('joinStage')
                          : RoomContentsTranslations.translate(
                              'applyJoinStage'),
                      selectedText:
                          RoomContentsTranslations.translate('cancelStage'),
                    ),
            ),
          ),
          Obx(
            () => Visibility(
              visible: controller.isRaiseHandButtonVisible(),
              child: SizedBox(width: 10.0.scale375()),
            ),
          ),
          Obx(
            () => Visibility(
              visible: controller.isRaiseHandListButtonVisible(),
              child: BottomButtonItemWidget(
                image: Image.asset(
                  AssetsImages.roomHandRaiseList,
                  package: 'rtc_conference_tui_kit',
                  width: 24,
                  height: 24,
                ),
                onPressed: () {
                  showConferenceBottomSheet(const RaiseHandListWidget(),
                      isScrollControlled: true);
                },
                isSelected: false.obs,
                text: RoomContentsTranslations.translate('stageManagement'),
              ),
            ),
          ),
          Obx(
            () => Visibility(
              visible: controller.isRaiseHandListButtonVisible(),
              child: SizedBox(width: 10.0.scale375()),
            ),
          ),
          Obx(
            () => Visibility(
              visible: controller.isScreenShareButtonInBaseRow(),
              child: BottomButtonItemWidget(
                image: Image.asset(
                  AssetsImages.roomShareScreenOn,
                  package: 'rtc_conference_tui_kit',
                  width: 24,
                  height: 24,
                ),
                selectedImage: Image.asset(
                  AssetsImages.roomShareScreenOff,
                  package: 'rtc_conference_tui_kit',
                  width: 24,
                  height: 24,
                ),
                onPressed: () {
                  controller.onScreenShareButtonPressed();
                },
                isSelected: RoomStore.to.currentUser.hasScreenStream,
                text: RoomContentsTranslations.translate('shareOn'),
                selectedText: RoomContentsTranslations.translate('shareOff'),
              ),
            ),
          ),
          Obx(
            () => Visibility(
              visible: controller.isScreenShareButtonInBaseRow(),
              child: SizedBox(width: 10.0.scale375()),
            ),
          ),
          Obx(
            () => Visibility(
              visible: controller.isInviteButtonInBaseRow(),
              child: BottomButtonItemWidget(
                image: Image.asset(
                  AssetsImages.roomInvite,
                  package: 'rtc_conference_tui_kit',
                  width: 24,
                  height: 24,
                ),
                onPressed: () {
                  showConferenceBottomSheet(const InviteSheetWidget());
                },
                isSelected: false.obs,
                text: RoomContentsTranslations.translate('invite'),
              ),
            ),
          ),
          Obx(
            () => Visibility(
              visible: controller.isInviteButtonInBaseRow(),
              child: SizedBox(width: 10.0.scale375()),
            ),
          ),
          Obx(
            () => Visibility(
              visible: controller.isSettingButtonInBaseRow(),
              child: BottomButtonItemWidget(
                image: Image.asset(
                  AssetsImages.roomSetting,
                  package: 'rtc_conference_tui_kit',
                  width: 24,
                  height: 24,
                ),
                onPressed: () {
                  showConferenceBottomSheet(
                    const SettingWidget(),
                    isScrollControlled: true,
                  );
                },
                isSelected: false.obs,
                text: RoomContentsTranslations.translate('setting'),
              ),
            ),
          ),
          Obx(
            () => Visibility(
              visible: controller.isSettingButtonInBaseRow(),
              child: SizedBox(width: 10.0.scale375()),
            ),
          ),
          BottomButtonItemWidget(
            image: Image.asset(
              AssetsImages.roomMore,
              package: 'rtc_conference_tui_kit',
              width: 24,
              height: 24,
            ),
            selectedImage: Image.asset(
              AssetsImages.roomDrop,
              package: 'rtc_conference_tui_kit',
              width: 24,
              height: 24,
            ),
            onPressed: () {
              controller.changeFoldState();
            },
            isSelected: controller.isUnfold,
            text: RoomContentsTranslations.translate('unfold'),
            selectedText: RoomContentsTranslations.translate('drop'),
            width: 33,
          ),
        ],
      ),
    );
  }
}
