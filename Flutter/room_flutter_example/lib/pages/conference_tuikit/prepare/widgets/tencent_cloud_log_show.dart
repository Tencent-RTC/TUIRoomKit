import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../../common/index.dart';
import '../index.dart';

class TencentCloudLogShowWidget extends GetView<PrepareController> {
  const TencentCloudLogShowWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Image.asset(
          AssetsImages.tencentCloud,
          width: 136,
          height: 36,
        ),
        const SizedBox(
          height: 8,
        ),
        ShaderMask(
          blendMode: BlendMode.srcIn,
          shaderCallback: (Rect bounds) {
            return const LinearGradient(
              colors: [AppColors.gradientStart, AppColors.gradientEnd],
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
              tileMode: TileMode.clamp,
            ).createShader(bounds);
          },
          child: Text(
            'multiVideoConferencing'.tr,
            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            textAlign: TextAlign.center,
          ),
        )
      ],
    );
  }
}
