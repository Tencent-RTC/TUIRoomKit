import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';
import 'package:rtc_room_engine/api/room/tui_room_define.dart';

import 'index.dart';

class ExitWidget extends GetView<ExitController> {
  const ExitWidget({Key? key}) : super(key: key);

  Widget _buildView() {
    return BottomSheetWidget(
      width: Get.width,
      height: RoomStore.to.currentUser.userRole.value == TUIRole.roomOwner
          ? 219.0.scale375()
          : 169.0.scale375(),
      padding: const EdgeInsets.only(
        left: 0,
        right: 0,
      ),
      child: Column(
        children: [
          const DropDownButton(),
          SizedBox(
            height: 45.0.scale375(),
            child: Text(
              RoomStore.to.currentUser.userRole.value == TUIRole.roomOwner
                  ? RoomContentsTranslations.translate('leaveRoomTip')
                  : RoomContentsTranslations.translate('sureLeaveRoomTip'),
              style: RoomTheme.defaultTheme.textTheme.displaySmall,
            ),
          ),
          Divider(
              thickness: 1.0.scale375(),
              height: 0,
              color: RoomColors.dividerGrey),
          GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: () {
              Get.back();
              controller.exitRoomAction();
            },
            child: SizedBox(
              height: 50.0.scale375(),
              child: Center(
                child: Text(RoomContentsTranslations.translate('leaveRoom'),
                    style: RoomTheme.defaultTheme.textTheme.titleLarge),
              ),
            ),
          ),
          Divider(
              thickness: 1.0.scale375(),
              height: 0,
              color: RoomColors.dividerGrey),
          if (RoomStore.to.currentUser.userRole.value == TUIRole.roomOwner)
            GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTap: () {
                Get.back();
                controller.destroyRoomAction();
              },
              child: SizedBox(
                height: 50.0.scale375(),
                child: Center(
                  child: Text(RoomContentsTranslations.translate('dismissRoom'),
                      style: RoomTheme.defaultTheme.textTheme.titleMedium),
                ),
              ),
            )
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<ExitController>(
      init: ExitController(),
      id: "exit",
      builder: (_) {
        return _buildView();
      },
    );
  }
}
