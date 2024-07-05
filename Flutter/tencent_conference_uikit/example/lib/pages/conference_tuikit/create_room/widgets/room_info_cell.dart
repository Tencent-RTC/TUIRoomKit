import 'package:flutter/material.dart';
import 'package:get/get.dart';

class RoomInfoCellWidget extends StatelessWidget {
  final String prefixText;
  final String infoText;
  final Image? image;
  final VoidCallback? onTap;

  const RoomInfoCellWidget({
    Key? key,
    required this.prefixText,
    required this.infoText,
    this.image,
    this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      child: GestureDetector(
        onTap: onTap,
        child: Row(
          children: [
            Expanded(
              flex: 3,
              child: Text(prefixText, style: Get.textTheme.bodyMedium),
            ),
            const SizedBox(width: 20),
            Expanded(
              flex: 7,
              child: Text(
                infoText,
                textAlign: TextAlign.left,
                style: Get.textTheme.bodyMedium,
              ),
            ),
            Expanded(flex: 1, child: image ?? Container())
          ],
        ),
      ),
    );
  }
}
