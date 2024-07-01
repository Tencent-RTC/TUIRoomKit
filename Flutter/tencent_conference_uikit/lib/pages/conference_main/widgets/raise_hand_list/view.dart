import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:tencent_conference_uikit/common/index.dart';
import 'package:tencent_conference_uikit/pages/conference_main/widgets/widgets.dart';

import './widgets/widgets.dart';

class RaiseHandListWidget extends GetView<RaiseHandListController> {
  const RaiseHandListWidget({Key? key}) : super(key: key);

  Widget _buildView(Orientation orientation) {
    return BottomSheetWidget(
      height: orientation == Orientation.portrait
          ? 730.0.scale375Height()
          : Get.height,
      isNeedDropDownButton: false,
      orientation: orientation,
      padding: EdgeInsets.only(left: 16.0.scale375(), right: 16.0.scale375()),
      child: Column(
        children: [
          const TitleWidget(),
          SearchBarWidget(
            searchAction: (value) => controller.searchAction(value),
            width: 342,
          ),
          SizedBox(height: 10.0.scale375Height()),
          const UserTableWidget(),
          SizedBox(height: 10.0.scale375Height()),
          SizedBox(
            height: 46.0.scale375(),
            child: Row(
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
                      textAlign: TextAlign.center,
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
                      showConferenceBottomSheet(const UserListWidget());
                    },
                    child: Text(
                      RoomContentsTranslations.translate(
                          'inviteMemberToTakeSeat'),
                      style: RoomTheme.defaultTheme.textTheme.bodyMedium,
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
              ],
            ),
          ),
          SizedBox(height: 10.0.scale375Height()),
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
        return OrientationBuilder(
          builder: (BuildContext context, Orientation orientation) {
            return _buildView(orientation);
          },
        );
      },
    );
  }
}
