import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_room_engine/rtc_room_engine.dart';
import 'package:tencent_conference_uikit/common/index.dart';

import 'widgets/widgets.dart';
import 'index.dart';

/// Page for scheduling conferences.
///
/// Example of use:
/// ```dart
/// Get.to(() => ScheduleConferencePage());
/// ```
class ScheduleConferencePage extends GetView<ScheduleConferenceController> {
  const ScheduleConferencePage({
    Key? key,
    this.conferenceInfo,
    this.selectedAttendeesList,
  }) : super(key: key);

  /// Detailed information about the conference.
  /// This parameter is an internal parameter and does not need to be passed
  /// when using the scheduled conference function.
  final TUIConferenceInfo? conferenceInfo;

  /// The list of attendees to be invited to the conference.
  /// This parameter is an internal parameter and does not need to be passed
  /// when using the scheduled conference function.
  final List<TUIUserInfo>? selectedAttendeesList;

  Widget _buildView() {
    bool isModify = conferenceInfo != null;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: [
          SizedBox(height: 20.0.scale375Height()),
          RoomInfoWidget(isModify: isModify),
          SizedBox(height: 20.0.scale375Height()),
          Visibility(
            visible: !isModify,
            child: const RoomControlWidget(),
          ),
          Visibility(
            visible: !isModify,
            child: SizedBox(height: 20.0.scale375Height()),
          ),
          SizedBox(
            width: 343.0.scale375(),
            height: 44.0.scale375Height(),
            child: ElevatedButton(
              onPressed: () => controller.onButtonPressed(),
              style: RoomTheme.defaultTheme.menuButtonTheme.style,
              child: Text(
                isModify ? 'save'.roomTr : 'scheduleRoom'.roomTr,
                style: const TextStyle(fontSize: 16, color: Colors.white),
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<ScheduleConferenceController>(
      init: ScheduleConferenceController(conferenceInfo, selectedAttendeesList),
      id: "schedule_room",
      builder: (_) {
        return Scaffold(
          appBar: AppBar(
            title: Text(
              conferenceInfo == null
                  ? 'scheduleRoom'.roomTr
                  : 'modifyRoom'.roomTr,
              style:
                  const TextStyle(fontSize: 16, color: RoomColors.titleBlack),
            ),
            iconTheme:
                const IconThemeData(color: RoomColors.titleBlack, size: 22),
            backgroundColor: Colors.white,
            centerTitle: true,
          ),
          backgroundColor: RoomColors.backgroundGrey,
          resizeToAvoidBottomInset: false,
          body: SafeArea(
            child: SingleChildScrollView(
              child: _buildView(),
            ),
          ),
        );
      },
    );
  }
}
