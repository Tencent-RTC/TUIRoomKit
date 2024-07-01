import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:tencent_conference_uikit/common/index.dart';

import '../index.dart';

class BottomButtonItemWidget extends GetView<BottomViewController> {
  final Image image;
  final Image? selectedImage;
  final Widget? selectedWidget;
  final VoidCallback onPressed;
  final RxBool? isSelected;
  final String text;
  final String? selectedText;
  final double width;
  final double height;
  final double opacity;

  const BottomButtonItemWidget({
    Key? key,
    required this.image,
    required this.onPressed,
    this.selectedImage,
    this.selectedWidget,
    this.isSelected,
    this.text = "",
    this.selectedText,
    this.width = 52,
    this.height = 52,
    this.opacity = 1,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    var isButtonSelected = isSelected ?? false.obs;
    return GestureDetector(
      onTap: () {
        if (text.isNotEmpty) {
          controller.conferenceMainController.resetHideTimer();
        }
        onPressed();
      },
      child: Opacity(
        opacity: opacity,
        child: Container(
          decoration: BoxDecoration(
            color: RoomColors.lightGrey,
            borderRadius: BorderRadius.circular(10),
          ),
          width: width.scale375(),
          height: height.scale375(),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              SizedBox(
                height: 24,
                width: 24,
                child: Obx(() => isButtonSelected.value
                    ? selectedImage ?? selectedWidget ?? image
                    : image),
              ),
              const SizedBox(height: 5),
              if (text.isNotEmpty)
                SizedBox(
                  child: Obx(
                    () => Text(
                      isButtonSelected.value ? selectedText ?? text : text,
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
      ),
    );
  }
}
