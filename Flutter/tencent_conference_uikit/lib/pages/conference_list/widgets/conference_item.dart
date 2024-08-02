import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_room_engine/rtc_room_engine.dart';
import 'package:tencent_conference_uikit/common/index.dart';

import '../index.dart';

class ConferenceItem extends GetView<ConferenceListController> {
  const ConferenceItem({
    super.key,
    required this.conferenceInfo,
  });

  final TUIConferenceInfo conferenceInfo;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          height: 50,
          color: RoomColors.backgroundGrey,
          child: Row(
            children: [
              _buildConferenceInfo(),
              _buildSpacer(),
              _buildEnterButton(),
            ],
          ),
        ),
        Container(
          height: 20,
          color: RoomColors.backgroundGrey,
        ),
      ],
    );
  }

  Widget _buildConferenceInfo() {
    final String conferenceTime = controller.getConferenceTimeString(
        conferenceInfo.scheduleStartTime!, conferenceInfo.scheduleEndTime!);

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () => controller.onConferenceItemPressed(conferenceInfo),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                constraints: BoxConstraints(maxWidth: 240.0.scale375()),
                child: Text(
                  conferenceInfo.basicRoomInfo.name ?? "",
                  textAlign: TextAlign.start,
                  style: const TextStyle(
                    fontSize: 16,
                    color: RoomColors.btnGrey,
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Image.asset(
                AssetsImages.roomArrowRight,
                width: 16,
                height: 16,
                package: 'tencent_conference_uikit',
                color: RoomColors.btnGrey,
              ),
            ],
          ),
          Row(
            children: [
              Text(
                '$conferenceTime ❘ ${conferenceInfo.basicRoomInfo.roomId.formatStringWithSpaces()}',
                style: const TextStyle(
                  fontSize: 14,
                  color: RoomColors.btnGrey,
                ),
              ),
              conferenceInfo.status == TUIConferenceStatus.running
                  ? Row(
                      children: [
                        const Text(
                          ' ❘ ',
                          style: TextStyle(
                            fontSize: 14,
                            color: RoomColors.btnGrey,
                          ),
                        ),
                        Text(
                          'onGoing'.roomTr,
                          style: const TextStyle(
                            color: RoomColors.menuButtonBlue,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    )
                  : const SizedBox(),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSpacer() {
    return Expanded(
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () => controller.onConferenceItemPressed(conferenceInfo),
        child: const SizedBox.expand(),
      ),
    );
  }

  Widget _buildEnterButton() {
    return SizedBox(
      width: 68.0.scale375(),
      height: 32.0.scale375(),
      child: ElevatedButton(
        onPressed: () =>
            controller.enterConference(conferenceInfo.basicRoomInfo.roomId),
        style: ElevatedButton.styleFrom(
          elevation: 0,
          backgroundColor: RoomColors.newLightGrey,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(100),
          ),
          padding: EdgeInsets.zero,
        ),
        child: Text(
          'enter'.roomTr,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: RoomColors.btnTextBlack,
          ),
        ),
      ),
    );
  }
}
