import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:tencent_conference_uikit/common/index.dart';

class InviteSheetWidget extends StatelessWidget {
  const InviteSheetWidget({
    this.title,
    this.roomId,
    this.backgroundColor,
    this.titleColor,
    this.infoTextColor,
    this.copyButtonColor,
    this.copyButtonTextColor,
    super.key,
  });

  final Color? backgroundColor;
  final Color? titleColor;
  final Color? infoTextColor;
  final Color? copyButtonColor;
  final Color? copyButtonTextColor;
  final String? title;
  final String? roomId;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (BuildContext context, BoxConstraints constraints) {
        Orientation orientation = MediaQuery.of(context).orientation;
        return BottomSheetWidget(
          height: orientation == Orientation.portrait
              ? 160.0.scale375()
              : Get.height,
          color: backgroundColor,
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
                child: Text(
                  title ?? 'inviteMember'.roomTr,
                  style: titleColor == null
                      ? RoomTheme.defaultTheme.textTheme.headlineLarge
                      : TextStyle(
                          color: titleColor,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                  textAlign: TextAlign.left,
                ),
              ),
              SizedBox(height: 20.0.scale375()),
              InfoItemWidget(
                prefixText: 'roomId'.roomTr,
                infoText: roomId ?? RoomStore.to.roomInfo.roomId,
                prefixTextStyle: RoomTheme.defaultTheme.textTheme.titleSmall,
                infoTextStyle: infoTextColor == null
                    ? RoomTheme.defaultTheme.textTheme.bodyMedium
                    : TextStyle(
                        color: infoTextColor,
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                isLeftAlign: true,
                child: CopyTextButton(
                  infoText: roomId ?? RoomStore.to.roomInfo.roomId,
                  successToast: 'copyRoomIdSuccess'.roomTr,
                  backgroundColor: copyButtonColor,
                  textColor: copyButtonTextColor,
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
