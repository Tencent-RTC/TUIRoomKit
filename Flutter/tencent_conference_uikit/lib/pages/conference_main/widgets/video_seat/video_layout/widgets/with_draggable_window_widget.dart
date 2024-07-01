import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../controller.dart';

class WithDraggableWindowWidget extends GetView<VideoLayoutController> {
  final Widget mainWidget;
  final Widget? draggableWidget;
  final double draggableWidgetWidth;
  final double draggableWidgetHeight;
  final Orientation orientation;

  const WithDraggableWindowWidget({
    super.key,
    required this.mainWidget,
    this.draggableWidget,
    this.draggableWidgetWidth = 100.0,
    this.draggableWidgetHeight = 100.0,
    this.orientation = Orientation.portrait,
  });

  Widget _buildView() {
    controller.updateVideoLayoutSize(orientation);
    controller.updatePadding(
        orientation, draggableWidgetWidth, draggableWidgetHeight);
    return Stack(
      children: [
        mainWidget,
        Obx(
          () => Positioned(
            right: controller.rightPadding,
            top: controller.topPadding,
            child: RawGestureDetector(
              gestures: {
                CustomPanGestureRecognizer:
                    GestureRecognizerFactoryWithHandlers<
                        CustomPanGestureRecognizer>(
                  () => CustomPanGestureRecognizer(),
                  (CustomPanGestureRecognizer instance) {
                    instance
                      ..onUpdate = (details) {
                        controller.onPanUpdate(details, draggableWidgetWidth,
                            draggableWidgetHeight);
                      }
                      ..onEnd = (details) {
                        controller.onPanEnd(details, draggableWidgetWidth,
                            draggableWidgetHeight);
                      };
                  },
                ),
              },
              behavior: HitTestBehavior.opaque,
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
    return _buildView();
  }
}

class CustomPanGestureRecognizer extends PanGestureRecognizer {
  @override
  void addPointer(PointerDownEvent event) {
    super.addPointer(event);
    resolve(GestureDisposition.accepted);
  }
}
