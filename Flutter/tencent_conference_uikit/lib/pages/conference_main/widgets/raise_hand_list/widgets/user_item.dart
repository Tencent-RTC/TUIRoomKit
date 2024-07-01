import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:tencent_conference_uikit/common/index.dart';

import '../index.dart';

class UserItemWidget extends GetView<RaiseHandListController> {
  final UserModel userModel;

  const UserItemWidget({
    Key? key,
    required this.userModel,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        UserInfoWidget(userModel: userModel),
        const Expanded(child: SizedBox()),
        SizedBox(
          width: 62.0.scale375(),
          height: 24.0.scale375Height(),
          child: ElevatedButton(
              style: RoomTheme.defaultTheme.menuButtonTheme.style,
              onPressed: () =>
                  controller.agreeStageAction(userModel.userId.value, true),
              child: Text(
                RoomContentsTranslations.translate('agreeTakeSeat'),
                style: RoomTheme.defaultTheme.textTheme.bodySmall,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              )),
        ),
        const SizedBox(width: 10),
        SizedBox(
          width: 62.0.scale375(),
          height: 24.0.scale375Height(),
          child: ElevatedButton(
              style: RoomTheme.defaultTheme.outlinedButtonTheme.style,
              onPressed: () =>
                  controller.agreeStageAction(userModel.userId.value, false),
              child: Text(
                RoomContentsTranslations.translate('disagreeSeat'),
                style: RoomTheme.defaultTheme.textTheme.bodySmall,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              )),
        ),
      ],
    );
  }
}
