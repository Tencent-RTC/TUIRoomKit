import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';

import '../index.dart';
import 'widgets.dart';

class MeetingTitleWidget extends GetView<TopViewController> {
  const MeetingTitleWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
        width: 129.0.scale375(),
        height: 53.0.scale375(),
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          GestureDetector(
              child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    SizedBox(
                        width: 111.0.scale375(),
                        height: 24.0.scale375(),
                        child: Text(
                          controller.roomInfo.name! +
                              RoomContentsTranslations.translate(
                                  'quickConference'),
                          style: RoomTheme.defaultTheme.textTheme.bodyLarge,
                          textAlign: TextAlign.center,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        )),
                    Image.asset(
                      AssetsImages.roomDropDown,
                      package: 'rtc_conference_tui_kit',
                      width: 18.0.scale375(),
                      height: 18.0.scale375(),
                      color: RoomColors.hintGrey,
                    ),
                  ]),
              onTap: () => {Get.bottomSheet(const RoomInfoSheet())}),
          SizedBox(height: 5.0.scale375()),
          Obx(() => Text(controller.timerText.value,
              textAlign: TextAlign.center,
              style:
                  const TextStyle(fontSize: 12, color: RoomColors.textWhite)))
        ]));
  }
}
