import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';
import 'package:rtc_room_engine/api/room/tui_room_define.dart';

import 'index.dart';
import './widgets/widgets.dart';

class UserListWidget extends GetView<UserListController> {
  const UserListWidget({Key? key}) : super(key: key);

  Widget _buildView() {
    return SingleChildScrollView(
      child: Column(
        children: [
          GestureDetector(
            onTap: () {
              Get.back();
            },
            child: Container(
              color: Colors.transparent,
              height: 92.0.scale375Height(),
            ),
          ),
          BottomSheetWidget(
            width: Get.width,
            height: 720.0.scale375Height(),
            child: Obx(
              () => Column(
                children: [
                  const DropDownButton(),
                  SizedBox(height: 10.0.scale375Height()),
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
                  const Spacer(),
                  if (RoomStore.to.currentUser.userRole.value ==
                      TUIRole.roomOwner)
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
                          text: RoomContentsTranslations.translate(
                              'disableAllVideo'),
                          selectedText: RoomContentsTranslations.translate(
                              'enableAllVideo'),
                          isSelected: controller.isAllCameraDisable,
                        ),
                        SizedBox(width: 9.0.scale375()),
                        ButtonItemWidget(
                          onPressed: () {
                            Get.back();
                            Get.bottomSheet(const InviteSheetWidget());
                          },
                          text: RoomContentsTranslations.translate('more'),
                          isSelected: false.obs,
                        ),
                      ],
                    ),
                  SizedBox(height: 34.0.scale375Height()),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<UserListController>(
      init: UserListController(),
      id: "user_list",
      builder: (_) {
        return _buildView();
      },
    );
  }
}
