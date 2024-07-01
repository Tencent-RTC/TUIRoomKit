import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:tencent_conference_uikit/common/index.dart';

import '../index.dart';

class ButtonItemWidget extends GetView<UserListController> {
  final VoidCallback onPressed;
  final String text;
  final String? selectedText;
  final RxBool isSelected;

  const ButtonItemWidget({
    Key? key,
    required this.onPressed,
    required this.text,
    this.selectedText,
    required this.isSelected,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 108.0.scale375(),
      height: 40.0.scale375Height(),
      child: Obx(
        () => ElevatedButton(
          style: RoomTheme.defaultTheme.elevatedButtonTheme.style,
          onPressed: onPressed,
          child: Text(
            isSelected.value ? selectedText ?? text : text,
            style: isSelected.value
                ? RoomTheme.defaultTheme.textTheme.labelMedium
                : RoomTheme.defaultTheme.textTheme.labelLarge,
            textAlign: TextAlign.center,
          ),
        ),
      ),
    );
  }
}
