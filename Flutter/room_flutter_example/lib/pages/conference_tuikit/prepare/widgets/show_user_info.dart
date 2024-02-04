import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:room_flutter_example/common/index.dart';

import '../index.dart';

class ShowUserInfoWidget extends GetView<PrepareController> {
  const ShowUserInfoWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        SizedBox(
          width: 32,
          height: 32,
          child: CircleAvatar(
            backgroundImage: NetworkImage(UserStore.to.userModel.avatarURL),
          ),
        ),
        const SizedBox(
          width: 15,
        ),
        Text(
          UserStore.to.userModel.userName,
          style: AppTheme.defaultTheme.textTheme.headlineMedium,
        )
      ],
    );
  }
}
