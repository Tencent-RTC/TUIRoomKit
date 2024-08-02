import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:tencent_conference_uikit/common/index.dart';

import '../index.dart';

class TitleWidget extends GetView<TransferHostController> {
  const TitleWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 60.0.scale375(),
      child: Row(
        children: [
          SizedBox(
            width: 20.0.scale375(),
            height: 20.0.scale375(),
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTap: () => Get.back(),
              child: Image.asset(AssetsImages.roomArrowLeft,
                  package: 'tencent_conference_uikit'),
            ),
          ),
          SizedBox(width: 10.0.scale375()),
          Text(
            'transferHost'.roomTr,
            style: RoomTheme.defaultTheme.textTheme.bodyLarge,
          ),
        ],
      ),
    );
  }
}
