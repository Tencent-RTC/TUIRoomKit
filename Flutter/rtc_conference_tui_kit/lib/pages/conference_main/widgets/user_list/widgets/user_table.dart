import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';
import 'package:rtc_conference_tui_kit/pages/conference_main/widgets/widgets.dart';

import 'widgets.dart';

class UserTableWidget extends GetView<UserListController> {
  const UserTableWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Obx(
      () => SizedBox(
        height: controller.isOwner() ||
                controller.isAdministrator(RoomStore.to.currentUser)
            ? 550.0.scale375Height()
            : 590.0.scale375Height(),
        child: Column(
          children: [
            Row(
              children: [
                SearchBarWidget(searchAction: (String value) {
                  controller.searchAction(value);
                }),
                SizedBox(width: 12.0.scale375()),
                SizedBox(
                  height: 36.0.scale375(),
                  width: 68.0.scale375(),
                  child: ElevatedButton(
                    onPressed: () {
                      Get.back();
                      Get.bottomSheet(const InviteSheetWidget());
                    },
                    style: ButtonStyle(
                      backgroundColor:
                          MaterialStateProperty.all<Color>(Colors.transparent),
                      side: MaterialStateProperty.all<BorderSide>(
                        BorderSide(
                            color: RoomColors.btnBlue, width: 1.0.scale375()),
                      ),
                      shape: MaterialStateProperty.all<RoundedRectangleBorder>(
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
                          package: 'rtc_conference_tui_kit',
                          width: 20.0.scale375(),
                          height: 20.0.scale375(),
                        ),
                        SizedBox(width: 4.0.scale375()),
                        Text(
                          RoomContentsTranslations.translate('invite'),
                          style: const TextStyle(
                              fontSize: 14, color: RoomColors.btnBlue),
                        )
                      ],
                    ),
                  ),
                )
              ],
            ),
            SizedBox(height: 14.0.scale375()),
            Expanded(
              child: ListView.builder(
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
