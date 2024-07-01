import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:tencent_conference_uikit/common/index.dart';
import 'package:rtc_room_engine/api/room/tui_room_define.dart';

import '../index.dart';

class RoomInfoSheet extends GetView<TopViewController> {
  const RoomInfoSheet({super.key});

  @override
  Widget build(BuildContext context) {
    return OrientationBuilder(
      builder: (BuildContext context, Orientation orientation) {
        return BottomSheetWidget(
          height: orientation == Orientation.portrait
              ? 258.0.scale375()
              : Get.height,
          orientation: orientation,
          child: Column(
            children: [
              Visibility(
                visible: orientation == Orientation.landscape,
                child: SizedBox(height: 24.0.scale375()),
              ),
              SizedBox(
                width: Get.width,
                child: Text(
                    controller.roomInfo.name ?? controller.roomInfo.roomId,
                    style: RoomTheme.defaultTheme.textTheme.headlineLarge,
                    textAlign: TextAlign.left),
              ),
              SizedBox(height: 20.0.scale375()),
              InfoListItem(
                prefixText: RoomContentsTranslations.translate('host'),
                infoText: RoomStore.to.userInfoList
                    .firstWhere((element) =>
                        element.userId.value == controller.roomInfo.ownerId)
                    .userName
                    .value,
              ),
              SizedBox(height: 15.0.scale375()),
              InfoListItem(
                  prefixText: RoomContentsTranslations.translate('roomType'),
                  infoText: controller.roomInfo.isSeatEnabled == false &&
                          controller.roomInfo.seatMode == TUISeatMode.freeToTake
                      ? RoomContentsTranslations.translate('freeToSpeakRoom')
                      : RoomContentsTranslations.translate(
                          'raiseHandSpeakRoom')),
              SizedBox(height: 15.0.scale375()),
              InfoListItem(
                prefixText: RoomContentsTranslations.translate('roomId'),
                infoText: controller.roomInfo.roomId,
                child: CopyTextButton(
                  infoText: controller.roomInfo.roomId,
                  successToast:
                      RoomContentsTranslations.translate('copyRoomIdSuccess'),
                ),
              ),
              SizedBox(height: 15.0.scale375()),
              InfoListItem(
                prefixText: RoomContentsTranslations.translate('roomLink'),
                infoText: Constants.roomLink + controller.roomInfo.roomId,
                child: CopyTextButton(
                  infoText: Constants.roomLink + controller.roomInfo.roomId,
                  successToast:
                      RoomContentsTranslations.translate('copyRoomLinkSuccess'),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
