import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';
import 'package:rtc_conference_tui_kit/pages/conference_main/widgets/widgets.dart';

import './widgets/widgets.dart';

class RaiseHandListWidget extends GetView<RaiseHandListController> {
  const RaiseHandListWidget({Key? key}) : super(key: key);

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
            child: Column(
              children: [
                const TitleWidget(),
                SearchBarWidget(
                  searchAction: (value) => controller.searchAction(value),
                  width: 342,
                ),
                SizedBox(height: 10.0.scale375Height()),
                const UserTableWidget(),
                Row(
                  children: [
                    SizedBox(width: 8.0.scale375()),
                    SizedBox(
                      height: 46.0.scale375Height(),
                      width: 157.0.scale375(),
                      child: ElevatedButton(
                        style: RoomTheme.defaultTheme.elevatedButtonTheme.style,
                        onPressed: () => controller.allAgreeAction(),
                        child: Text(
                          RoomContentsTranslations.translate('agreeAll'),
                          style: RoomTheme.defaultTheme.textTheme.bodyMedium,
                        ),
                      ),
                    ),
                    SizedBox(width: 13.0.scale375()),
                    SizedBox(
                      height: 46.0.scale375Height(),
                      width: 157.0.scale375(),
                      child: ElevatedButton(
                        style: RoomTheme.defaultTheme.elevatedButtonTheme.style,
                        onPressed: () {
                          Get.back();
                          Get.bottomSheet(const UserListWidget(),
                              isScrollControlled: true);
                        },
                        child: Text(
                          RoomContentsTranslations.translate(
                              'inviteMemberToTakeSeat'),
                          style: RoomTheme.defaultTheme.textTheme.bodyMedium,
                        ),
                      ),
                    ),
                  ],
                )
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<RaiseHandListController>(
      init: RaiseHandListController(),
      id: "raise_hand_list",
      builder: (_) {
        return _buildView();
      },
    );
  }
}
