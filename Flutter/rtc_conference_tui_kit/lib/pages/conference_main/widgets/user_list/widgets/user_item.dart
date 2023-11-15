import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';
import 'package:rtc_room_engine/api/room/tui_room_define.dart';

import '../index.dart';
import 'widgets.dart';

class UserListItem extends GetView<UserListController> {
  final UserModel userModel;

  const UserListItem({
    Key? key,
    required this.userModel,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Obx(
      () => SizedBox(
        height: 50.0.scale375(),
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: () {
            if (RoomStore.to.currentUser.userRole.value == TUIRole.roomOwner ||
                RoomStore.to.currentUser.userId.value ==
                    userModel.userId.value) {
              Get.bottomSheet(UserControlWidget(userModel: userModel));
            }
          },
          child: Row(
            children: [
              UserInfoWidget(userModel: userModel),
              const Expanded(child: SizedBox()),
              Visibility(
                visible: !userModel.isOnSeat.value &&
                    controller.isSeatMode() &&
                    controller.isOwner(),
                child: TextButton(
                  style: RoomTheme.defaultTheme.menuButtonTheme.style,
                  onPressed: () {
                    controller.takeUserOnSeat(userModel);
                  },
                  child: Text(
                    RoomContentsTranslations.translate('inviteToTakeSeat'),
                    style: RoomTheme.defaultTheme.textTheme.bodyMedium,
                  ),
                ),
              ),
              Visibility(
                visible: userModel.isOnSeat.value || !controller.isSeatMode(),
                child: Row(
                  children: [
                    userModel.hasAudioStream.value
                        ? Image.asset(
                            AssetsImages.roomUnMuteAudio,
                            package: 'rtc_conference_tui_kit',
                            width: 20.0.scale375(),
                            height: 20.0.scale375(),
                          )
                        : Image.asset(
                            AssetsImages.roomMuteAudioRed,
                            package: 'rtc_conference_tui_kit',
                            width: 20.0.scale375(),
                            height: 20.0.scale375(),
                          ),
                    SizedBox(width: 20.0.scale375()),
                    userModel.hasVideoStream.value
                        ? Image.asset(
                            AssetsImages.roomUnMuteVideo,
                            package: 'rtc_conference_tui_kit',
                            width: 20.0.scale375(),
                            height: 20.0.scale375(),
                          )
                        : Image.asset(
                            AssetsImages.roomMuteVideoRed,
                            package: 'rtc_conference_tui_kit',
                            width: 20.0.scale375(),
                            height: 20.0.scale375(),
                          ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
