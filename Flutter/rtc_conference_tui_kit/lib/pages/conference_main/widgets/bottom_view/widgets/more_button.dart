import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';
import 'package:rtc_conference_tui_kit/pages/conference_main/widgets/widgets.dart';
import 'package:rtc_room_engine/api/room/tui_room_define.dart';

import 'widgets.dart';

class MoreButtonWidget extends GetView<BottomViewController> {
  const MoreButtonWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: RoomColors.lightGrey,
        borderRadius: BorderRadius.only(
            bottomLeft: Radius.circular(10), bottomRight: Radius.circular(10)),
      ),
      width: Get.width - 32.0.scale375(),
      child: Row(
        children: [
          Obx(
            () => Visibility(
              visible: !controller.isScreenShareButtonInBaseRow(),
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
              visible: !controller.isScreenShareButtonInBaseRow(),
              child: SizedBox(width: 10.0.scale375()),
            ),
          ),
          Obx(
            () => Visibility(
              visible: !controller.isInviteButtonInBaseRow(),
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
          ),
          Obx(
            () => Visibility(
              visible: !controller.isInviteButtonInBaseRow(),
              child: SizedBox(width: 10.0.scale375()),
            ),
          ),
          Obx(
            () => Visibility(
              visible: !controller.isRoomNeedTakeSeat.value ||
                  (RoomStore.to.currentUser.isOnSeat.value ||
                      RoomStore.to.currentUser.userRole.value ==
                          TUIRole.administrator),
              child: BottomButtonItemWidget(
                image: Image.asset(
                  AssetsImages.roomSetting,
                  package: 'rtc_conference_tui_kit',
                  width: 24,
                  height: 24,
                ),
                onPressed: () {
                  Get.bottomSheet(
                    const SettingWidget(),
                    isScrollControlled: true,
                  );
                },
                isSelected: false.obs,
                text: RoomContentsTranslations.translate('setting'),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
