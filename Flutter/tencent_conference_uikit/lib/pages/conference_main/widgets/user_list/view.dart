import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:tencent_conference_uikit/common/index.dart';
import 'package:tencent_conference_uikit/pages/conference_main/widgets/widgets.dart';

import './widgets/widgets.dart';

class UserListWidget extends GetView<UserListController> {
  const UserListWidget({Key? key}) : super(key: key);

  Widget _buildView(Orientation orientation) {
    return BottomSheetWidget(
      height: orientation == Orientation.portrait
          ? 720.0.scale375Height()
          : Get.height,
      orientation: orientation,
      child: Obx(
        () => Column(
          children: [
            SizedBox(
                height: orientation == Orientation.portrait
                    ? 10.0.scale375()
                    : 21.0.scale375()),
            SizedBox(
              height: 24.0.scale375Height(),
              width: Get.width - 32.0.scale375(),
              child: Text(
                  '${'member'.roomTr}（${RoomStore.to.roomUserCount.value}）',
                  textAlign: TextAlign.left,
                  style: RoomTheme.defaultTheme.textTheme.bodyLarge),
            ),
            SizedBox(height: 15.0.scale375()),
            const UserTableWidget(),
            SizedBox(height: 15.0.scale375()),
            if (controller.isOwner() ||
                controller.isAdministrator(RoomStore.to.currentUser))
              Row(
                children: [
                  Expanded(
                    child: ButtonItemWidget(
                      onPressed: () {
                        controller.muteAllAudioAction();
                      },
                      text: 'allMute'.roomTr,
                      selectedText: 'unAllMute'.roomTr,
                      isSelected: controller.isAllMute,
                    ),
                  ),
                  SizedBox(width: 9.0.scale375()),
                  Expanded(
                    child: ButtonItemWidget(
                      onPressed: () {
                        controller.muteAllVideoAction();
                      },
                      text: 'disableAllVideo'.roomTr,
                      selectedText: 'enableAllVideo'.roomTr,
                      isSelected: controller.isAllCameraDisable,
                    ),
                  ),
                  SizedBox(width: 9.0.scale375()),
                  Expanded(
                    child: ButtonItemWidget(
                      onPressed: () {
                        Get.back();
                        showConferenceBottomSheet(const InviteSheetWidget());
                      },
                      text: 'more'.roomTr,
                      isSelected: false.obs,
                    ),
                  ),
                ],
              ),
            SizedBox(
              height: orientation == Orientation.portrait
                  ? 34.0.scale375Height()
                  : 22.0.scale375(),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<UserListController>(
      init: UserListController(),
      id: "user_list",
      builder: (_) {
        return LayoutBuilder(
            builder: (BuildContext context, BoxConstraints constraints) {
          Orientation orientation = MediaQuery.of(context).orientation;
          return _buildView(orientation);
        });
      },
    );
  }
}
