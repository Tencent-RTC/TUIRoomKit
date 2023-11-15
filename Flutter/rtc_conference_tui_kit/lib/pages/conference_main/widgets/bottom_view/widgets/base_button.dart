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
                Get.bottomSheet(
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
          BottomButtonItemWidget(
            image: Image.asset(
              AssetsImages.roomMicOff,
              package: 'rtc_conference_tui_kit',
              width: 24,
              height: 24,
            ),
            selectedImage: Image.asset(
              AssetsImages.roomMicOn,
              package: 'rtc_conference_tui_kit',
              width: 24,
              height: 24,
            ),
            onPressed: () {
              controller.muteAudioAction();
            },
            isSelected: RoomStore.to.currentUser.hasAudioStream,
            text: RoomContentsTranslations.translate('unmute'),
            selectedText: RoomContentsTranslations.translate('mute'),
          ),
          SizedBox(width: 10.0.scale375()),
          BottomButtonItemWidget(
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
          ),
          SizedBox(width: 10.0.scale375()),
          Visibility(
            visible: controller.isSeatMode(),
            child: Obx(
              () => RoomStore.to.currentUser.isOnSeat.value &&
                      RoomStore.to.currentUser.userRole.value !=
                          TUIRole.roomOwner
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
                        AssetsImages.roomHand,
                        package: 'rtc_conference_tui_kit',
                        width: 24,
                        height: 24,
                      ),
                      onPressed: () {
                        if (RoomStore.to.currentUser.userRole.value ==
                            TUIRole.roomOwner) {
                          Get.bottomSheet(const RaiseHandListWidget(),
                              isScrollControlled: true);
                        } else {
                          controller.raiseHandAction();
                        }
                      },
                      isSelected: RoomStore.to.currentUser.userRole.value ==
                              TUIRole.roomOwner
                          ? false.obs
                          : controller.isRequestingTakeSeat,
                      text: RoomStore.to.currentUser.userRole.value ==
                              TUIRole.roomOwner
                          ? RoomContentsTranslations.translate(
                              'raiseHandApplication')
                          : RoomContentsTranslations.translate('raiseHand'),
                      selectedText:
                          RoomContentsTranslations.translate('handDown'),
                    ),
            ),
          ),
          Visibility(
            visible: controller.isSeatMode(),
            child: SizedBox(width: 10.0.scale375()),
          ),
          BottomButtonItemWidget(
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
          SizedBox(width: 10.0.scale375()),
          Visibility(
            visible: !controller.isSeatMode(),
            child: BottomButtonItemWidget(
              image: Image.asset(
                AssetsImages.roomInvite,
                package: 'rtc_conference_tui_kit',
                width: 24,
                height: 24,
              ),
              onPressed: () {
                Get.bottomSheet(const InviteSheetWidget());
              },
              isSelected: false.obs,
              text: RoomContentsTranslations.translate('invite'),
            ),
          ),
          Visibility(
            visible: !controller.isSeatMode(),
            child: SizedBox(width: 10.0.scale375()),
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
              Future.delayed(const Duration(milliseconds: 300), () {
                controller.showMoreButton.value = controller.isUnfold.value;
              });
              controller.isUnfold.value = !controller.isUnfold.value;
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
