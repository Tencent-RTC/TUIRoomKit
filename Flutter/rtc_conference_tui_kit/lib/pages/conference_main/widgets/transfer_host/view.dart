import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';

import 'index.dart';
import 'widgets/widgets.dart';

class TransferHostWidget extends GetView<TransferHostController> {
  const TransferHostWidget({Key? key}) : super(key: key);

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
              height: 54.0.scale375Height(),
            ),
          ),
          BottomSheetWidget(
            width: Get.width,
            height: 758.0.scale375Height(),
            child: Column(
              children: [
                const TitleWidget(),
                SearchBarWidget(
                  searchAction: (value) => controller.searchAction(value),
                  width: 342,
                ),
                SizedBox(height: 10.0.scale375Height()),
                const UserTableWidget(),
                SizedBox(
                  height: 49.0.scale375Height(),
                  width: 340.0.scale375(),
                  child: ElevatedButton(
                    style: RoomTheme.defaultTheme.menuButtonTheme.style,
                    onPressed: () => controller.appointAndLeaveAction(),
                    child: Text(
                      RoomContentsTranslations.translate('appointAndLeave'),
                      style: RoomTheme.defaultTheme.textTheme.bodyLarge,
                    ),
                  ),
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
    return GetBuilder<TransferHostController>(
        init: TransferHostController(),
        id: "transfer_host",
        builder: (_) {
          return _buildView();
        });
  }
}
