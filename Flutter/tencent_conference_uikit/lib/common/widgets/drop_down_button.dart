import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:tencent_conference_uikit/common/index.dart';

class DropDownButton extends StatelessWidget {
  final Orientation? orientation;
  const DropDownButton({super.key, this.orientation = Orientation.portrait});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: orientation == Orientation.portrait ? 40.0.scale375() : null,
      width: orientation == Orientation.portrait ? null : 24.0.scale375(),
      child: IconButton(
        icon: Image.asset(
          orientation == Orientation.portrait
              ? AssetsImages.roomLineImage
              : AssetsImages.roomRightArrow,
          package: 'tencent_conference_uikit',
          width: 24.0.scale375(),
          height: 24.0.scale375(),
        ),
        onPressed: () {
          Get.back();
        },
      ),
    );
  }
}
