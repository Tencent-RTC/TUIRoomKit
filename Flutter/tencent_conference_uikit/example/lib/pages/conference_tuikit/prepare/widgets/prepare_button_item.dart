import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:room_flutter_example/common/index.dart';
import 'package:tencent_conference_uikit/common/index.dart';

import '../index.dart';

class PrepareButtonItem extends GetView<PrepareController> {
  const PrepareButtonItem({
    required this.imagePath,
    required this.text,
    required this.onPressed,
    super.key,
  });

  final String imagePath;
  final String text;
  final Function onPressed;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.gradientStart, AppColors.btnBackgroundBlue],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(10),
      ),
      height: 80.0.scale375(),
      width: 90.0.scale375(),
      child: ElevatedButton(
        onPressed: () => onPressed.call(),
        style: ButtonStyle(
          backgroundColor: MaterialStateProperty.all<Color>(Colors.transparent),
          shape: MaterialStateProperty.all(
            RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
          padding: MaterialStateProperty.all(const EdgeInsets.all(0)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Image.asset(
              imagePath,
              height: 24,
              width: 24,
              fit: BoxFit.contain,
            ),
            const SizedBox(height: 9),
            Text(
              text,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 14,
                color: Colors.white,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
