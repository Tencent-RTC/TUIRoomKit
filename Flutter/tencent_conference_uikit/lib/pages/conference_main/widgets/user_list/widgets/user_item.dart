import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:tencent_conference_uikit/common/index.dart';

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
            if (controller.isAbleToControlUser(userModel)) {
              showConferenceBottomSheet(
                  UserControlWidget(userModel: userModel));
            }
          },
          child: Row(
            children: [
              UserInfoWidget(userModel: userModel),
              const Expanded(child: SizedBox()),
              Visibility(
                visible: !controller.isSelf(userModel) &&
                    !userModel.isOnSeat.value &&
                    controller.isRoomNeedTakeSeat() &&
                    (controller.isOwner() ||
                        controller.isAdministrator(RoomStore.to.currentUser) &&
                            !controller.isAdministrator(userModel)),
                child: TextButton(
                  style: RoomTheme.defaultTheme.menuButtonTheme.style,
                  onPressed: () {
                    controller.takeUserOnSeat(userModel);
                  },
                  child: Text(
                    'inviteToTakeSeat'.roomTr,
                    style: RoomTheme.defaultTheme.textTheme.bodyMedium,
                  ),
                ),
              ),
              Visibility(
                visible: userModel.isOnSeat.value ||
                    !controller.isRoomNeedTakeSeat(),
                child: Row(
                  children: [
                    userModel.hasAudioStream.value
                        ? Image.asset(
                            AssetsImages.roomUnMuteAudio,
                            package: 'tencent_conference_uikit',
                            width: 20.0.scale375(),
                            height: 20.0.scale375(),
                          )
                        : Image.asset(
                            AssetsImages.roomMuteAudioRed,
                            package: 'tencent_conference_uikit',
                            width: 20.0.scale375(),
                            height: 20.0.scale375(),
                          ),
                    SizedBox(width: 20.0.scale375()),
                    userModel.hasVideoStream.value
                        ? Image.asset(
                            AssetsImages.roomUnMuteVideo,
                            package: 'tencent_conference_uikit',
                            width: 20.0.scale375(),
                            height: 20.0.scale375(),
                          )
                        : Image.asset(
                            AssetsImages.roomMuteVideoRed,
                            package: 'tencent_conference_uikit',
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
