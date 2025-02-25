import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:tencent_conference_uikit/common/index.dart';
import 'package:rtc_room_engine/api/room/tui_room_define.dart';

import 'index.dart';

class ExitWidget extends GetView<ExitController> {
  const ExitWidget({Key? key}) : super(key: key);

  Widget _buildView() {
    return BottomSheetWidget(
      width: Get.width,
      height: controller.isRoomOwner()
          ? 219.0.scale375()
          : 169.0.scale375(),
      padding: const EdgeInsets.only(
        left: 0,
        right: 0,
      ),
      child: Column(
        children: [
          SizedBox(
            height: 45.0.scale375(),
            child: Text(
              RoomStore.to.currentUser.userRole.value == TUIRole.roomOwner
                  ? 'leaveRoomTip'.roomTr
                  : 'sureLeaveRoomTip'.roomTr,
              style: RoomTheme.defaultTheme.textTheme.displaySmall,
              textAlign: TextAlign.center,
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
                  child: Text('leaveRoom'.roomTr,
                      style: RoomTheme.defaultTheme.textTheme.titleLarge),
                ),
              ),
            ),
            Divider(
                thickness: 1.0.scale375(),
                height: 0,
                color: RoomColors.dividerGrey),
          if (controller.isRoomOwner())
            GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTap: () {
                Get.back();
                controller.destroyRoomAction();
              },
              child: SizedBox(
                height: 50.0.scale375(),
                child: Center(
                  child: Text('dismissRoom'.roomTr,
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
        return OrientationBuilder(
          builder: (BuildContext context, Orientation orientation) {
            return _buildView();
          },
        );
      },
    );
  }
}
