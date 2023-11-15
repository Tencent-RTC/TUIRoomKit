import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';

import '../index.dart';

class TitleWidget extends GetView<RaiseHandListController> {
  const TitleWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 60.0.scale375(),
      child: Row(
        children: [
          SizedBox(
            width: 20.0.scale375(),
            height: 20.0.scale375(),
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTap: () => Get.back(),
              child: Image.asset(AssetsImages.roomArrowLeft,
                  package: 'rtc_conference_tui_kit'),
            ),
          ),
          SizedBox(width: 10.0.scale375()),
          Text(
            RoomContentsTranslations.translate('raiseHandApplication'),
            style: RoomTheme.defaultTheme.textTheme.bodyLarge,
          ),
        ],
      ),
    );
  }
}
