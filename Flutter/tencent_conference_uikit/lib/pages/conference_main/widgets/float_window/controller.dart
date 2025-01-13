import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:tencent_conference_uikit/common/index.dart';
import 'package:tencent_conference_uikit/common/store/float_window_store.dart';
import 'package:tencent_conference_uikit/pages/conference_main/view.dart';

class FloatWindowController extends GetxController
    with GetTickerProviderStateMixin {
  AnimationController? _controller;

  final VoidCallback? onFloatWindowTap;

  final defaultWidth = 100.0;
  final defaultHeight = 200.0;
  final left = 0.0.obs;
  final top = 0.0.obs;

  double maxX = 0;
  double maxY = 0;

  var parentKey = GlobalKey();
  var childKey = GlobalKey();

  var parentSize = Get.size;
  var childSize = const Size(0, 0);

  FloatWindowController(double left, double top, this.onFloatWindowTap) {
    this.left.value = left;
    this.top.value = top;
  }

  @override
  void onInit() {
    WidgetsBinding.instance.addPostFrameCallback((d) {
      childSize = _getWidgetSize(childKey);
      maxX = parentSize.width - childSize.width;
      maxY = parentSize.height - childSize.height;
    });
    super.onInit();
  }

  Size _getWidgetSize(GlobalKey key) {
    final RenderBox renderBox =
        key.currentContext?.findRenderObject() as RenderBox;
    return renderBox.size;
  }

  @override
  void onClose() {
    super.onClose();
    _controller?.dispose();
  }

  double getValue(double value, double max) {
    if (value < 0) {
      return 0;
    } else if (value > max) {
      return max;
    } else {
      return value;
    }
  }

  void _adsorb() {
    bool isLeft = (left.value + childSize.width / 2) < parentSize.width / 2;
    _controller = AnimationController(vsync: this)
      ..duration = const Duration(milliseconds: 100);
    var animation = Tween<double>(begin: left.value, end: isLeft ? 0 : maxX)
        .animate(_controller!);
    animation.addListener(() {
      left.value = animation.value;
    });
    _controller!.forward();
  }

  void onPanUpdate(DragUpdateDetails details) {
    var delta = details.delta;
    left.value += delta.dx;
    top.value += delta.dy;
  }

  void onPanEnd(DragEndDetails details) {
    left.value = getValue(left.value, maxX);
    top.value = getValue(top.value, maxY);
    _adsorb();
  }

  void onTap() {
    onFloatWindowTap?.call();
    Get.to(const ConferenceMainPage());
  }

  bool isCurrentUser() {
    return FloatWindowStore.to.currentFloatWindowUserModel.value.userId.value ==
        RoomStore.to.currentUser.userId.value;
  }
}
