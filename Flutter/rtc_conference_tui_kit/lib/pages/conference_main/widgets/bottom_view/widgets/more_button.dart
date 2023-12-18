import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';
import 'package:rtc_conference_tui_kit/pages/conference_main/widgets/widgets.dart';

import 'widgets.dart';

class MoreButtonWidget extends GetView<BottomViewController> {
  const MoreButtonWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: RoomColors.lightGrey,
        borderRadius: BorderRadius.only(
            bottomLeft: Radius.circular(10), bottomRight: Radius.circular(10)),
      ),
      width: Get.width - 32.0.scale375(),
      child: Row(
        children: [
          Visibility(
            visible: controller.isSeatMode(),
            child: BottomButtonItemWidget(
              image: Image.asset(
                AssetsImages.roomInvite,
                package: 'rtc_conference_tui_kit',
                width: 24,
                height: 24,
              ),
              onPressed: () {
                Get.bottomSheet(const InviteSheetWidget());
              },
              isSelected: false.obs,
              text: RoomContentsTranslations.translate('invite'),
            ),
          ),
          Visibility(
            visible: controller.isSeatMode(),
            child: SizedBox(width: 10.0.scale375()),
          ),
          BottomButtonItemWidget(
            image: Image.asset(
              AssetsImages.roomSetting,
              package: 'rtc_conference_tui_kit',
              width: 24,
              height: 24,
            ),
            onPressed: () {
              Get.bottomSheet(
                const SettingWidget(),
                isScrollControlled: true,
              );
            },
            isSelected: false.obs,
            text: RoomContentsTranslations.translate('setting'),
          ),
        ],
      ),
    );
  }
}
