import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:tencent_conference_uikit/common/index.dart';

import '../index.dart';
import 'widgets.dart';

class UserControlWidget extends GetView<UserListController> {
  final UserModel userModel;

  const UserControlWidget({Key? key, required this.userModel})
      : super(key: key);

  Widget _buildUserControl(Orientation orientation) {
    return Column(
      children: [
        Visibility(
          visible: orientation == Orientation.landscape,
          child: SizedBox(height: 20.0.scale375()),
        ),
        UserInfoWidget(userModel: userModel),
        SizedBox(height: 10.0.scale375()),
        SizedBox(
          height:
              orientation == Orientation.landscape ? 295.0.scale375() : null,
          child: SingleChildScrollView(
            child: Column(
              children: [
                Visibility(
                  visible: userModel.isOnSeat.value ||
                      !controller.isRoomNeedTakeSeat(),
                  child: UserControlItemWidget(
                    onPressed: () {
                      Get.back();
                      controller.muteAudioAction(userModel);
                    },
                    text: RoomContentsTranslations.translate(
                        controller.isSelf(userModel)
                            ? 'unmute'
                            : 'requestOpenAudio'),
                    selectedText: RoomContentsTranslations.translate('mute'),
                    image: Image.asset(
                      AssetsImages.roomMuteAudio,
                      package: 'tencent_conference_uikit',
                      width: 20.0.scale375(),
                      height: 20.0.scale375(),
                    ),
                    selectedImage: Image.asset(
                      AssetsImages.roomUnMuteAudio,
                      package: 'tencent_conference_uikit',
                      width: 20.0.scale375(),
                      height: 20.0.scale375(),
                    ),
                    isSelected: userModel.hasAudioStream,
                  ),
                ),
                Visibility(
                  visible: userModel.isOnSeat.value ||
                      !controller.isRoomNeedTakeSeat(),
                  child: UserControlItemWidget(
                    onPressed: () {
                      Get.back();
                      controller.muteVideoAction(userModel);
                    },
                    text: RoomContentsTranslations.translate(
                        controller.isSelf(userModel)
                            ? 'openVideo'
                            : 'requestOpenVideo'),
                    selectedText:
                        RoomContentsTranslations.translate('closeVideo'),
                    image: Image.asset(
                      AssetsImages.roomMuteVideo,
                      package: 'tencent_conference_uikit',
                      width: 20.0.scale375(),
                      height: 20.0.scale375(),
                    ),
                    selectedImage: Image.asset(
                      AssetsImages.roomUnMuteVideo,
                      package: 'tencent_conference_uikit',
                      width: 20.0.scale375(),
                      height: 20.0.scale375(),
                    ),
                    isSelected: userModel.hasVideoStream,
                  ),
                ),
                if (controller.isOwner() && !controller.isSelf(userModel)) ...[
                  UserControlItemWidget(
                    onPressed: () {
                      Get.back();
                      controller.transferHostAction(userModel);
                    },
                    text: RoomContentsTranslations.translate('changeHost'),
                    image: Image.asset(
                      AssetsImages.roomChangeHost,
                      package: 'tencent_conference_uikit',
                      width: 20.0.scale375(),
                      height: 20.0.scale375(),
                    ),
                    isSelected: false.obs,
                  ),
                  UserControlItemWidget(
                    onPressed: () {
                      Get.back();
                      controller.changeAdministratorAction(userModel);
                    },
                    text: RoomContentsTranslations.translate(
                        'setAsAdministrator'),
                    selectedText:
                        RoomContentsTranslations.translate('undoAdministrator'),
                    image: Image.asset(
                      AssetsImages.roomSetAdministrator,
                      package: 'tencent_conference_uikit',
                      width: 20.0.scale375(),
                      height: 20.0.scale375(),
                    ),
                    selectedImage: Image.asset(
                      AssetsImages.roomUndoAdministrator,
                      package: 'tencent_conference_uikit',
                      width: 20.0.scale375(),
                      height: 20.0.scale375(),
                    ),
                    isSelected: controller.isAdministrator(userModel).obs,
                  ),
                  Divider(
                      height: 3.0.scale375(),
                      thickness: 3.0.scale375(),
                      color: RoomColors.dividerGrey),
                ],
                Visibility(
                  visible: !controller.isSelf(userModel) &&
                      (controller.isOwner() ||
                          controller.isAdministrator(RoomStore.to.currentUser)),
                  child: UserControlItemWidget(
                    onPressed: () {
                      Get.back();
                      controller.disableMessageAction(userModel);
                    },
                    text: RoomContentsTranslations.translate('enableMessage'),
                    selectedText:
                        RoomContentsTranslations.translate('disableMessage'),
                    image: Image.asset(
                      AssetsImages.roomEnableMessage,
                      package: 'tencent_conference_uikit',
                      width: 20.0.scale375(),
                      height: 20.0.scale375(),
                    ),
                    selectedImage: Image.asset(
                      AssetsImages.roomDisableMessage,
                      package: 'tencent_conference_uikit',
                      width: 20.0.scale375(),
                      height: 20.0.scale375(),
                    ),
                    isSelected: userModel.ableSendingMessage,
                  ),
                ),
                Visibility(
                  visible: !controller.isSelf(userModel) &&
                      controller.isRoomNeedTakeSeat() &&
                      (controller.isOwner() ||
                          controller.isAdministrator(RoomStore.to.currentUser)),
                  child: UserControlItemWidget(
                    onPressed: () {
                      controller.changeSeatStatusAction(userModel);
                      Get.back();
                    },
                    text:
                        RoomContentsTranslations.translate('inviteToTakeSeat'),
                    selectedText:
                        RoomContentsTranslations.translate('kickOffSeat'),
                    image: Image.asset(
                      AssetsImages.roomRequestOnSeat,
                      package: 'tencent_conference_uikit',
                      width: 20.0.scale375(),
                      height: 20.0.scale375(),
                    ),
                    selectedImage: Image.asset(
                      AssetsImages.roomKickOffSeat,
                      package: 'tencent_conference_uikit',
                      width: 20.0.scale375(),
                      height: 20.0.scale375(),
                    ),
                    isSelected: userModel.isOnSeat,
                  ),
                ),
                Visibility(
                  visible:
                      controller.isOwner() && !controller.isSelf(userModel),
                  child: UserControlItemWidget(
                    onPressed: () {
                      Get.back();
                      controller.kickOutAction(userModel);
                    },
                    text: RoomContentsTranslations.translate('kick'),
                    image: Image.asset(
                      AssetsImages.roomKickOutRoom,
                      package: 'tencent_conference_uikit',
                      width: 20.0.scale375(),
                      height: 20.0.scale375(),
                    ),
                    isSelected: false.obs,
                    textStyle: RoomTheme.defaultTheme.textTheme.labelMedium,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return OrientationBuilder(
      builder: (BuildContext context, Orientation orientation) {
        return BottomSheetWidget(
            height: orientation == Orientation.portrait
                ? controller.getUserControlWidgetHeight(userModel)
                : Get.height,
            orientation: orientation,
            child: _buildUserControl(orientation));
      },
    );
  }
}
