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
      height: 53.0.scale375(),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: _meetingTitleContent(Orientation.portrait),
      ),
    );
  }

  Widget _buildLandscapeLayout() {
    return SizedBox(
      height: 24.0.scale375(),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: _meetingTitleContent(Orientation.landscape),
      ),
    );
  }

  List<Widget> _meetingTitleContent(Orientation orientation) {
    return [
      GestureDetector(
        behavior: HitTestBehavior.opaque,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              constraints: BoxConstraints(
                  maxWidth: orientation == Orientation.portrait
                      ? 160.0.scale375()
                      : 220.0.scale375()),
              child: Obx(
                () => Text(
                  controller.roomName.value,
                  style: RoomTheme.defaultTheme.textTheme.bodyLarge,
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
            const SizedBox(width: 2),
            Image.asset(
              AssetsImages.roomDropDown,
              package: 'tencent_conference_uikit',
              width: 18.0,
              height: 18.0,
              fit: BoxFit.contain,
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
