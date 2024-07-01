import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:tencent_conference_uikit/common/index.dart';

import '../index.dart';
import 'widgets.dart';

class MeetingTitleWidget extends GetView<TopViewController> {
  final Orientation orientation;
  const MeetingTitleWidget(this.orientation, {super.key});

  @override
  Widget build(BuildContext context) {
    return orientation == Orientation.portrait
        ? _buildPortraitLayout()
        : _buildLandscapeLayout();
  }

  Widget _buildPortraitLayout() {
    return SizedBox(
      width: 145.0.scale375(),
      height: 53.0.scale375(),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: _meetingTitleContent(),
      ),
    );
  }

  Widget _buildLandscapeLayout() {
    return SizedBox(
      width: 210.0.scale375(),
      height: 24.0.scale375(),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: _meetingTitleContent(),
      ),
    );
  }

  List<Widget> _meetingTitleContent() {
    return [
      GestureDetector(
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            SizedBox(
              width: 125.0.scale375(),
              height: 24.0.scale375(),
              child: Text(
                controller.roomInfo.name ?? controller.roomInfo.roomId,
                style: RoomTheme.defaultTheme.textTheme.bodyLarge,
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            Image.asset(
              AssetsImages.roomDropDown,
              package: 'tencent_conference_uikit',
              width: 18.0.scale375(),
              height: 18.0.scale375(),
              color: RoomColors.hintGrey,
            ),
          ],
        ),
        onTap: () {
          controller.conferenceMainController.resetHideTimer();
          showConferenceBottomSheet(const RoomInfoSheet());
        },
      ),
      SizedBox(
        height: orientation == Orientation.portrait ? 5.0.scale375() : 0,
        width: orientation == Orientation.portrait ? 0 : 16.0.scale375(),
      ),
      Obx(
        () => SizedBox(
          width: 51.0.scale375(),
          child: Text(
            controller.timerText.value,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 12, color: RoomColors.textWhite),
          ),
        ),
      )
    ];
  }
}
