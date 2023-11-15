import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';

class DropDownButton extends StatelessWidget {
  const DropDownButton({super.key});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 40.0.scale375Height(),
      child: IconButton(
        icon: Image.asset(
          AssetsImages.roomLineImage,
          package: 'rtc_conference_tui_kit',
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
