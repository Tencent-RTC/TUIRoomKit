import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:tencent_conference_uikit/common/index.dart';

Future<void> showConferenceDialog({
  String title = '',
  String message = '',
  String cancelText = '',
  String confirmText = '',
  final TextStyle? titleTextStyle,
  final TextStyle? messageTextStyle,
  final TextStyle? cancelTextStyle,
  final TextStyle? confirmTextStyle,
  VoidCallback? onConfirm,
  VoidCallback? onCancel,
  bool barrierDismissible = true,
}) {
  return Get.dialog(
    Center(
      child: RoundedContainerWidget(
        width: 259.0.scale375(),
        color: Colors.white,
        padding: 0.0,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(
              height: 24,
            ),
            Padding(
              padding: const EdgeInsets.only(left: 16.0, right: 16.0),
              child: Text(
                title,
                style: titleTextStyle ??
                    RoomTheme.defaultTheme.textTheme.headlineMedium,
                textAlign: TextAlign.center,
              ),
            ),
            Visibility(
              visible: message.isNotEmpty,
              child: Column(
                children: [
                  const SizedBox(
                    height: 10,
                  ),
                  Padding(
                    padding: const EdgeInsets.only(left: 16.0, right: 16.0),
                    child: Text(
                      message,
                      style: messageTextStyle ??
                          RoomTheme.defaultTheme.textTheme.headlineSmall,
                      textAlign: TextAlign.center,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(
              height: 20,
            ),
            const Divider(
              height: 0.0,
              color: RoomColors.textWhite,
            ),
            IntrinsicHeight(
              child: Row(
                children: [
                  Visibility(
                    visible: cancelText.isNotEmpty,
                    child: Expanded(
                      child: TextButton(
                        style: RoomTheme.defaultTheme.textButtonTheme.style,
                        onPressed: () {
                          onCancel?.call();
                          Get.back();
                        },
                        child: Text(
                          cancelText,
                          style: cancelTextStyle ??
                              const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: RoomColors.btnGrey,
                              ),
                        ),
                      ),
                    ),
                  ),
                  Visibility(
                    visible: confirmText.isNotEmpty && cancelText.isNotEmpty,
                    child: const VerticalDivider(
                      width: 1,
                      color: RoomColors.textWhite,
                    ),
                  ),
                  Visibility(
                    visible: confirmText.isNotEmpty,
                    child: Expanded(
                      child: TextButton(
                        style: RoomTheme.defaultTheme.textButtonTheme.style,
                        onPressed: () {
                          onConfirm?.call();
                        },
                        child: Text(
                          confirmText,
                          textAlign: TextAlign.center,
                          style: confirmTextStyle ??
                              RoomTheme.defaultTheme.textTheme.displayMedium,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    ),
    barrierDismissible: barrierDismissible,
    routeSettings: const RouteSettings(name: '/dialog'),
  );
}
