import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';
import 'package:rtc_room_engine/api/room/tui_room_define.dart';

import 'widgets.dart';

class VideoUserInfoWidget extends StatelessWidget {
  final UserModel userModel;
  const VideoUserInfoWidget({super.key, required this.userModel});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
          color: RoomColors.translucentLightBlack,
          borderRadius: BorderRadius.circular(12)),
      height: 24,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Obx(
            () => Visibility(
              visible: userModel.userRole.value == TUIRole.roomOwner,
              child: SizedBox(
                width: 24,
                height: 24,
                child: ClipOval(
                  child: Image.asset(
                    AssetsImages.roomOwner,
                    package: 'rtc_conference_tui_kit',
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(
            width: 4,
          ),
          SizedBox(
            width: 14,
            height: 14,
            child: VolumeBarWidget(
              userModel: userModel,
            ),
          ),
          const SizedBox(
            width: 4,
          ),
          Text(
            userModel.userName.value.isEmpty
                ? userModel.userId.value
                : userModel.userName.value,
            style: RoomTheme.defaultTheme.textTheme.bodyMedium,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(
            width: 4,
          ),
        ],
      ),
    );
  }
}
