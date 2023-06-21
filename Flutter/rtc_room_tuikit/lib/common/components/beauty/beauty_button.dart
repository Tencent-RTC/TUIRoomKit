import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_room_tuikit/common/components/beauty/controller.dart';
import 'package:rtc_room_tuikit/common/index.dart';

import 'beauty_setting_panel.dart';

class BeautyButton extends GetView<BeautyController> {
  const BeautyButton({super.key});
  @override
  Widget build(BuildContext context) {
    return GetBuilder<BeautyController>(
      init: BeautyController(),
      id: "room_anchor",
      builder: (_) {
        return LiveImgButton(
          imgUrl: AssetsImages.beauty,
          imgSize: 52,
          onTap: () {
            showModalBottomSheet<void>(
              context: context,
              shape: const RoundedRectangleBorder(
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(20),
                  topRight: Radius.circular(20),
                ),
              ),
              builder: (BuildContext context) {
                return BeautySettingWidget(
                  //Todo beauty
                  onChanged: controller.applyBeautyValueChange,
                  onClose: () {
                    Navigator.of(context).pop(true);
                  },
                );
              },
            );
          },
        );
      },
    );
  }
}
