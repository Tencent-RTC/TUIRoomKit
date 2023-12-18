import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';

import '../index.dart';

class BottomButtonItemWidget extends GetView<BottomViewController> {
  final Image image;
  final Image? selectedImage;
  final VoidCallback onPressed;
  final RxBool isSelected;
  final String text;
  final String? selectedText;
  final double width;

  const BottomButtonItemWidget({
    Key? key,
    required this.image,
    required this.onPressed,
    this.selectedImage,
    required this.isSelected,
    required this.text,
    this.selectedText,
    this.width = 52,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        onPressed();
      },
      child: Container(
        decoration: BoxDecoration(
          color: RoomColors.lightGrey,
          borderRadius: BorderRadius.circular(10),
        ),
        width: width.scale375(),
        height: 52.0.scale375(),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Obx(() => isSelected.value ? selectedImage ?? image : image),
            const SizedBox(height: 5),
            SizedBox(
              child: Obx(
                () => Text(
                  isSelected.value ? selectedText ?? text : text,
                  textAlign: TextAlign.center,
                  style: RoomTheme.defaultTheme.textTheme.labelSmall,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
