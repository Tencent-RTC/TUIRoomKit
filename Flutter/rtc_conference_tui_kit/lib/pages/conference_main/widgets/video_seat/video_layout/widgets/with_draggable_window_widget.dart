import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../controller.dart';

class WithDraggableWindowWidget extends GetView<VideoLayoutController> {
  final Widget mainWidget;
  final Widget? draggableWidget;
  final double draggableWidgetWidth;
  final double draggableWidgetHeight;

  const WithDraggableWindowWidget({
    super.key,
    required this.mainWidget,
    this.draggableWidget,
    this.draggableWidgetWidth = 100.0,
    this.draggableWidgetHeight = 100.0,
  });

  Widget _buildView() {
    return Stack(
      children: [
        mainWidget,
        Obx(
          () => Positioned(
            right: controller.rightPadding,
            top: controller.topPadding,
            child: GestureDetector(
              onTap: () {},
              onPanUpdate: (details) {
                controller.onPanUpdate(details, draggableWidgetWidth);
              },
              onPanEnd: (details) {
                controller.onPanEnd(details, draggableWidgetWidth);
              },
              child: SizedBox(
                width: draggableWidgetWidth,
                height: draggableWidgetHeight,
                child: draggableWidget,
              ),
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<VideoLayoutController>(
      init: VideoLayoutController(),
      id: "with_draggable_window",
      builder: (_) {
        return SafeArea(
          child: _buildView(),
        );
      },
    );
  }
}
