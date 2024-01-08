import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';

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
              Get.bottomSheet(UserControlWidget(userModel: userModel));
            }
          },
          child: Row(
            children: [
              UserInfoWidget(userModel: userModel),
              const Expanded(child: SizedBox()),
              Visibility(
                visible: !controller.isSelf(userModel) &&
                    !userModel.isOnSeat.value &&
                    controller.isSeatMode() &&
                    (controller.isOwner() ||
                        controller.isAdministrator(RoomStore.to.currentUser) &&
                            !controller.isAdministrator(userModel)),
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
