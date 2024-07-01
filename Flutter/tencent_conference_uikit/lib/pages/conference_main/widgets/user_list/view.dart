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
                  '${RoomContentsTranslations.translate('member')}（${RoomStore.to.userInfoList.length}）',
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
                  ButtonItemWidget(
                    onPressed: () {
                      controller.muteAllAudioAction();
                    },
                    text: RoomContentsTranslations.translate('allMute'),
                    selectedText:
                        RoomContentsTranslations.translate('unAllMute'),
                    isSelected: controller.isAllMute,
                  ),
                  SizedBox(width: 9.0.scale375()),
                  ButtonItemWidget(
                    onPressed: () {
                      controller.muteAllVideoAction();
                    },
                    text: RoomContentsTranslations.translate('disableAllVideo'),
                    selectedText:
                        RoomContentsTranslations.translate('enableAllVideo'),
                    isSelected: controller.isAllCameraDisable,
                  ),
                  SizedBox(width: 9.0.scale375()),
                  ButtonItemWidget(
                    onPressed: () {
                      Get.back();
                      showConferenceBottomSheet(const InviteSheetWidget());
                    },
                    text: RoomContentsTranslations.translate('more'),
                    isSelected: false.obs,
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
        return OrientationBuilder(
            builder: (BuildContext context, Orientation orientation) {
          return _buildView(orientation);
        });
      },
    );
  }
}
