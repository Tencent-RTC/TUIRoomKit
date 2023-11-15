import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';
import 'package:rtc_room_engine/api/room/tui_room_define.dart';

import '../index.dart';

class RoomInfoSheet extends GetView<TopViewController> {
  const RoomInfoSheet({super.key});

  @override
  Widget build(BuildContext context) {
    return BottomSheetWidget(
      width: Get.width,
      height: 258.0.scale375(),
      child: Column(
        children: [
          const DropDownButton(),
          SizedBox(
            width: Get.width,
            child: Text(
                controller.roomInfo.name! +
                    RoomContentsTranslations.translate('quickConference'),
                style: RoomTheme.defaultTheme.textTheme.headlineLarge,
                textAlign: TextAlign.left),
          ),
          SizedBox(height: 20.0.scale375()),
          InfoListItem(
              prefixText: RoomContentsTranslations.translate('host'),
              infoText: controller.roomInfo.ownerId),
          SizedBox(height: 15.0.scale375()),
          InfoListItem(
              prefixText: RoomContentsTranslations.translate('roomType'),
              infoText: controller.roomInfo.speechMode ==
                      TUISpeechMode.freeToSpeak
                  ? RoomContentsTranslations.translate('freeToSpeakRoom')
                  : RoomContentsTranslations.translate('raiseHandSpeakRoom')),
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
  }
}
