import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:tencent_conference_uikit/pages/conference_main/widgets/float_window/view.dart';

class FloatWindowManager {
  static final FloatWindowManager _instance = FloatWindowManager._();

  factory FloatWindowManager() => _instance;

  FloatWindowManager._();

  OverlayEntry? overlayEntry;

  show(BuildContext context) {
    overlayEntry ??= OverlayEntry(builder: (BuildContext context) {
      return FloatWindowWidget(
        top: 100,
        left: Get.width - 100,
        onFloatWindowTap: () => _hide(),
      );
    });
    Overlay.of(context).insert(overlayEntry!);
  }

  void _hide() {
    overlayEntry?.remove();
    overlayEntry = null;
  }
}
