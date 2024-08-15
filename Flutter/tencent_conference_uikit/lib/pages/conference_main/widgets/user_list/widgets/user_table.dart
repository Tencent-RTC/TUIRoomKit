import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:tencent_conference_uikit/common/index.dart';
import 'package:tencent_conference_uikit/pages/conference_main/widgets/widgets.dart';

import 'widgets.dart';

class UserTableWidget extends GetView<UserListController> {
  const UserTableWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Obx(
      () => Expanded(
        child: Column(
          children: [
            Row(
              children: [
                Expanded(
                  flex: 7,
                  child: SearchBarWidget(searchAction: (String value) {
                    controller.searchAction(value);
                  }),
                ),
                SizedBox(width: 12.0.scale375()),
                Expanded(
                  flex: 2,
                  child: SizedBox(
                    height: 36.0.scale375(),
                    width: 68.0.scale375(),
                    child: ElevatedButton(
                      onPressed: () {
                        Get.back();
                        showConferenceBottomSheet(const InviteSheetWidget());
                      },
                      style: ButtonStyle(
                        backgroundColor: MaterialStateProperty.all<Color>(
                            Colors.transparent),
                        side: MaterialStateProperty.all<BorderSide>(
                          BorderSide(
                              color: RoomColors.btnBlue, width: 1.0.scale375()),
                        ),
                        shape:
                            MaterialStateProperty.all<RoundedRectangleBorder>(
                          RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(6)),
                        ),
                        padding:
                            MaterialStateProperty.all(const EdgeInsets.all(0)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Image.asset(
                            AssetsImages.roomInviteBlue,
                            package: 'tencent_conference_uikit',
                            width: 20.0,
                            height: 20.0,
                          ),
                          SizedBox(width: 4.0.scale375()),
                          Text(
                            'invite'.roomTr,
                            style: const TextStyle(
                                fontSize: 14, color: RoomColors.btnBlue),
                          )
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(height: 14.0.scale375()),
            Expanded(
              child: ListView.builder(
                padding: EdgeInsets.zero,
                itemCount: controller.isSearchBarEmpty.value
                    ? RoomStore.to.userInfoList.length
                    : controller.searchResults.length,
                itemBuilder: (context, index) {
                  return Column(
                    children: [
                      controller.isSearchBarEmpty.value
                          ? UserListItem(
                              userModel: RoomStore.to.userInfoList[index])
                          : UserListItem(
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
          ],
        ),
      ),
    );
  }
}
