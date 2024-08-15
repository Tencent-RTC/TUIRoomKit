import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:tencent_conference_uikit/common/index.dart';

import 'index.dart';
import 'widgets/widgets.dart';

class BottomViewWidget extends GetView<BottomViewController> {
  const BottomViewWidget(this.orientation, {Key? key}) : super(key: key);

  final Orientation orientation;

  Widget _buildView() {
    return Stack(
      children: [
        Positioned(
          left: 0,
          bottom: 0,
          height: orientation == Orientation.portrait
              ? 86.0.scale375()
              : 68.0.scale375(),
          width: Get.width,
          child: Container(color: RoomColors.darkBlack),
        ),
        Center(
          child: Column(
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
                      ? 359.0.scale375()
                      : 343.0.scale375(),
                  height: controller.isUnfold.value
                      ? 128.0.scale375()
                      : 62.0.scale375(),
                  child: const BottomButtonsWidget(),
                ),
              ),
              SizedBox(
                height: orientation == Orientation.landscape
                    ? 6.0.scale375()
                    : 24.0.scale375(),
              ),
            ],
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
        return _buildView();
      },
      autoRemove: false,
    );
  }
}
