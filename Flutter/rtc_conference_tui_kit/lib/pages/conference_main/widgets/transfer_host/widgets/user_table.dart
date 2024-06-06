import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';
import 'package:rtc_room_engine/api/room/tui_room_define.dart';

import '../index.dart';
import 'widgets.dart';

class UserTableWidget extends GetView<TransferHostController> {
  const UserTableWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Obx(
      () => Expanded(
        child: ListView.builder(
          padding: EdgeInsets.zero,
          itemCount: controller.isSearchBarEmpty.value
              ? RoomStore.to.userInfoList.length
              : controller.searchResults.length,
          itemBuilder: (context, index) {
            if (controller.isSearchBarEmpty.value &&
                RoomStore.to.userInfoList[index].userRole.value ==
                    TUIRole.roomOwner) {
              return const SizedBox.shrink();
            }
            if (!controller.isSearchBarEmpty.value &&
                controller.searchResults[index].userRole.value ==
                    TUIRole.roomOwner) {
              return const SizedBox.shrink();
            }
            return Column(
              children: [
                controller.isSearchBarEmpty.value
                    ? UserItemWidget(
                        userModel: RoomStore.to.userInfoList[index])
                    : UserItemWidget(
                        userModel: controller.searchResults[index]),
                Divider(
                  height: 1.0.scale375(),
                  color: RoomTheme.defaultTheme.dividerColor,
                  indent: 52.0.scale375(),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}
