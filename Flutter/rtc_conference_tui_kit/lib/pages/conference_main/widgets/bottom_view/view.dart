import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';

import 'index.dart';
import 'widgets/widgets.dart';

class BottomViewWidget extends GetView<BottomViewController> {
  const BottomViewWidget({Key? key}) : super(key: key);

  Widget _buildView() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Obx(
          () => AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            decoration: BoxDecoration(
              color: controller.isUnfold.value
                  ? RoomColors.lightGrey
                  : RoomColors.darkBlack,
              borderRadius: BorderRadius.circular(10),
            ),
            width: controller.isUnfold.value
                ? Get.width - 16.0.scale375()
                : Get.width - 32.0.scale375(),
            height:
                controller.isUnfold.value ? 114.0.scale375() : 52.0.scale375(),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.start,
              children: [
                const BaseButtonWidget(),
                if (controller.isUnfold.value &&
                    controller.showMoreButton.value) ...[
                  Container(
                      height: 10.0.scale375(),
                      width: Get.width - 32.0.scale375(),
                      color: RoomColors.lightGrey),
                  const MoreButtonWidget(),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<BottomViewController>(
      init: BottomViewController(),
      id: "bottom_view",
      builder: (_) {
        return Container(
          color: RoomColors.darkBlack,
          child: _buildView(),
        );
      },
      autoRemove: false,
    );
  }
}
