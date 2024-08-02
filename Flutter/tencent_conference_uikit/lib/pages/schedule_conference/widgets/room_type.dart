import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:tencent_conference_uikit/common/index.dart';

import '../index.dart';

class RoomTypeWidget extends GetView<ScheduleConferenceController> {
  const RoomTypeWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return BottomSheetWidget(
      height: 221.0.scale375Height(),
      color: Colors.white,
      padding: EdgeInsets.zero,
      isNeedDropDownButton: false,
      child: Column(
        children: [
          _buildRoomTypeButton('freeToSpeakRoom'),
          const Divider(thickness: 1, color: RoomColors.dividerWhite),
          _buildRoomTypeButton('onStageSpeakingRoom'),
          const Divider(thickness: 7, color: RoomColors.dividerWhite),
          _buildRoomTypeButton('cancel', isCancelButton: true),
        ],
      ),
    );
  }

  Widget _buildRoomTypeButton(String buttonText,
      {bool isCancelButton = false}) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      child: SizedBox(
        height: 58.0.scale375Height(),
        width: Get.width < Get.height ? Get.width : Get.height,
        child: Center(
          child: Text(
            buttonText.roomTr,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 16, color: RoomColors.textBlack),
          ),
        ),
      ),
      onTap: () {
        if (!isCancelButton) {
          controller.changeRoomType(buttonText);
        }
        Get.back();
      },
    );
  }
}
