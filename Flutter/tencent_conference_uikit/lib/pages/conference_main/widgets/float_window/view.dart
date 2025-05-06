import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:tencent_conference_uikit/common/index.dart';
import 'package:tencent_conference_uikit/common/store/float_window_store.dart';
import 'package:tencent_conference_uikit/common/store/index.dart';
import 'package:tencent_conference_uikit/common/style/colors.dart';

import '../video_seat/video_layout/widgets/video_item/view.dart';
import 'index.dart';

class FloatWindowWidget extends GetView<FloatWindowController> {
  final double top;
  final double left;
  final VoidCallback? onFloatWindowTap;

  const FloatWindowWidget({
    Key? key,
    required this.top,
    required this.left,
    this.onFloatWindowTap,
  }) : super(key: key);

  Widget _buildFloatWidget() {
    return Stack(
      fit: StackFit.expand,
      children: [
        Obx(
          () => Positioned(
            key: controller.childKey,
            left: controller.left.value,
            top: controller.top.value,
            child: GestureDetector(
              onPanUpdate: (details) {
                controller.onPanUpdate(details);
              },
              onPanEnd: (details) {
                controller.onPanEnd(details);
              },
              child: GestureDetector(
                onTap: () {
                  controller.onTap();
                },
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16.0),
                    color: RoomColors.darkBlack,
                  ),
                  padding: const EdgeInsets.all(0),
                  width: controller.defaultWidth,
                  height: controller.defaultHeight,
                  child: Obx(
                    () => VideoItemWidget(
                      radius: 0,
                      userModel: Get.isRegistered<FloatWindowStore>()
                          ? FloatWindowStore
                              .to.currentFloatWindowUserModel.value
                          : UserModel(),
                      isScreenStream: RoomStore.to.isSharing.value &&
                          !controller.isCurrentUser(),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<FloatWindowController>(
      autoRemove: false,
      init: FloatWindowController(left, top, onFloatWindowTap),
      builder: (_) {
        return _buildFloatWidget();
      },
    );
  }
}
