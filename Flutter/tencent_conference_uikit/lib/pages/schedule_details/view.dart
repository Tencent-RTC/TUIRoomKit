import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_room_engine/rtc_room_engine.dart';
import 'package:tencent_conference_uikit/common/index.dart';

import 'index.dart';
import 'widgets/widgets.dart';

class ScheduleDetailsPage extends GetView<ScheduleDetailsController> {
  const ScheduleDetailsPage({required this.conferenceInfo, Key? key})
      : super(key: key);

  final TUIConferenceInfo conferenceInfo;

  Widget _buildView() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: [
          SizedBox(height: 20.0.scale375Height()),
          RoomInfoWidget(conferenceInfo: conferenceInfo),
          SizedBox(height: 20.0.scale375Height()),
          DetailsButtonItem(
              onPressed: () => controller.enterConference(),
              title: 'enterTheRoom'.roomTr),
          SizedBox(height: 20.0.scale375Height()),
          Visibility(
            visible: controller.isRoomOwner(),
            child: DetailsButtonItem(
              onPressed: () => controller.showInviteSheet(),
              title: 'inviteMember'.roomTr,
            ),
          ),
          SizedBox(height: 20.0.scale375Height()),
          Obx(
            () => Visibility(
              visible: !controller.isConferenceStarted.value &&
                  controller.isRoomOwner(),
              child: DetailsButtonItem(
                onPressed: () => controller.onCancelBtnPressed(),
                title: 'cancelRoom'.roomTr,
                backgroundColor: RoomColors.lightPink,
                textColor: RoomColors.btnRed,
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<ScheduleDetailsController>(
      init: ScheduleDetailsController(conferenceInfo),
      id: "schedule_details",
      builder: (_) {
        return Scaffold(
          appBar: AppBar(
            title: Text(
              'roomDetails'.roomTr,
              style:
                  const TextStyle(fontSize: 16, color: RoomColors.titleBlack),
            ),
            centerTitle: true,
            iconTheme:
                const IconThemeData(color: RoomColors.titleBlack, size: 22),
            backgroundColor: Colors.white,
            elevation: 0,
            actions: [
              Obx(
                () => Visibility(
                  visible: !controller.isConferenceStarted.value &&
                      controller.isRoomOwner(),
                  child: InkWell(
                    onTap: () => controller.onModifyPressed(),
                    child: Center(
                      child: Text(
                        'revise'.roomTr,
                        style: const TextStyle(
                          color: RoomColors.menuButtonBlue,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 16),
            ],
          ),
          backgroundColor: RoomColors.backgroundGrey,
          resizeToAvoidBottomInset: false,
          body: SafeArea(child: SingleChildScrollView(child: _buildView())),
        );
      },
    );
  }
}
