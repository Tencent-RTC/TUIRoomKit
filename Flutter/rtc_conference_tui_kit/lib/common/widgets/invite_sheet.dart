import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';

class InviteSheetWidget extends StatelessWidget {
  const InviteSheetWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return BottomSheetWidget(
      width: Get.width,
      height: 186.0.scale375(),
      child: Column(
        children: [
          const DropDownButton(),
          SizedBox(
            width: Get.width,
            child: Text(RoomContentsTranslations.translate('inviteMember'),
                style: RoomTheme.defaultTheme.textTheme.headlineLarge,
                textAlign: TextAlign.left),
          ),
          SizedBox(height: 20.0.scale375()),
          InfoListItem(
            prefixText: RoomContentsTranslations.translate('roomId'),
            infoText: RoomStore.to.roomInfo.roomId,
            child: CopyTextButton(
              infoText: RoomStore.to.roomInfo.roomId,
              successToast:
                  RoomContentsTranslations.translate('copyRoomIdSuccess'),
            ),
          ),
          SizedBox(height: 15.0.scale375()),
          InfoListItem(
            prefixText: RoomContentsTranslations.translate('roomLink'),
            infoText: Constants.roomLink + RoomStore.to.roomInfo.roomId,
            child: CopyTextButton(
              infoText: Constants.roomLink + RoomStore.to.roomInfo.roomId,
              successToast:
                  RoomContentsTranslations.translate('copyRoomLinkSuccess'),
            ),
          ),
        ],
      ),
    );
  }
}
