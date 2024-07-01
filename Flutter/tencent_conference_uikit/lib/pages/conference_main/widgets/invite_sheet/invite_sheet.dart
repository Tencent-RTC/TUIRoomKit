import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:tencent_conference_uikit/common/index.dart';

class InviteSheetWidget extends StatelessWidget {
  const InviteSheetWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return OrientationBuilder(
      builder: (BuildContext context, Orientation orientation) {
        return BottomSheetWidget(
          height: orientation == Orientation.portrait
              ? 186.0.scale375()
              : Get.height,
          orientation: orientation,
          child: Column(
            children: [
              Visibility(
                visible: orientation == Orientation.landscape,
                child: SizedBox(height: 24.0.scale375()),
              ),
              SizedBox(
                width: orientation == Orientation.portrait
                    ? Get.width
                    : 358.0.scale375(),
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
      },
    );
  }
}
