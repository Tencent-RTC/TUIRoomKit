import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:tencent_conference_uikit/common/index.dart';

import '../index.dart';

class UserControlItemWidget extends GetView<UserListController> {
  final VoidCallback onPressed;
  final String text;
  final String? selectedText;
  final Image image;
  final Image? selectedImage;
  final RxBool isSelected;
  final TextStyle? textStyle;

  const UserControlItemWidget({
    Key? key,
    required this.onPressed,
    required this.text,
    this.selectedText,
    required this.image,
    this.selectedImage,
    required this.isSelected,
    this.textStyle = const TextStyle(
      fontSize: 14,
      color: RoomColors.textWhite,
    ),
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () {
        onPressed();
      },
      child: Column(
        children: [
          SizedBox(
            height: 50.0.scale375(),
            width: Get.width,
            child: Obx(
              () => Row(
                children: [
                  isSelected.value ? selectedImage ?? image : image,
                  SizedBox(width: 10.0.scale375()),
                  Text(isSelected.value ? selectedText ?? text : text,
                      style: textStyle),
                  const Expanded(child: SizedBox()),
                ],
              ),
            ),
          ),
          const Divider(height: 0, color: RoomColors.dividerGrey),
        ],
      ),
    );
  }
}
