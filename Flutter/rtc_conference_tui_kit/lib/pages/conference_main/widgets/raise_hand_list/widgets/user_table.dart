import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';

import './widgets.dart';
import '../index.dart';

class UserTableWidget extends GetView<RaiseHandListController> {
  const UserTableWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Obx(
      () => Expanded(
        child: ListView.builder(
          padding: EdgeInsets.zero,
          itemCount: controller.isSearchBarEmpty.value
              ? RoomStore.to.inviteSeatList.length
              : controller.searchResults.length,
          itemBuilder: (context, index) {
            return Column(
              children: [
                controller.isSearchBarEmpty.value
                    ? UserItemWidget(
                        userModel: RoomStore.to.inviteSeatList[index])
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
