import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';

import '../index.dart';

class TopButtonItemWidget extends GetView<TopViewController> {
  final Image image;
  final Image? selectedImage;
  final VoidCallback onPressed;
  final RxBool isSelected;
  final String? text;

  const TopButtonItemWidget({
    Key? key,
    required this.image,
    required this.onPressed,
    this.selectedImage,
    required this.isSelected,
    this.text,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: text != null ? 80.0.scale375() : 40.0.scale375(),
      height: 53.0.scale375(),
      child: GestureDetector(
        onTap: () {
          onPressed();
        },
        child: Row(
          mainAxisAlignment:
              text != null ? MainAxisAlignment.end : MainAxisAlignment.center,
          children: [
            Obx(() => isSelected.value ? selectedImage ?? image : image),
            if (text != null) ...[
              SizedBox(width: 3.0.scale375()),
              Text(
                text!,
                style: RoomTheme.defaultTheme.textTheme.labelMedium,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
