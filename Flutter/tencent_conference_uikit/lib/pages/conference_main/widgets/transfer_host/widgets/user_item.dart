import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:tencent_conference_uikit/common/index.dart';

import '../index.dart';

class UserItemWidget extends GetView<TransferHostController> {
  final UserModel userModel;

  const UserItemWidget({
    Key? key,
    required this.userModel,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Obx(
      () => SizedBox(
        height: 60.0.scale375(),
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: () {
            controller.chosenUserId.value = userModel.userId.value;
          },
          child: Row(
            children: [
              UserInfoWidget(userModel: userModel),
              const Expanded(child: SizedBox()),
              if (controller.chosenUserId.value == userModel.userId.value) ...[
                Image.asset(
                  AssetsImages.roomCheckMark,
                  package: 'tencent_conference_uikit',
                  width: 20.0.scale375(),
                  height: 20.0.scale375(),
                ),
                SizedBox(width: 5.0.scale375())
              ]
            ],
          ),
        ),
      ),
    );
  }
}
