import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:tencent_conference_uikit/common/index.dart';

import '../index.dart';

class TimeZoneSelector extends GetView<ScheduleConferenceController> {
  const TimeZoneSelector({super.key});

  Widget _buildView() {
    return Scrollbar(
      controller: controller.scrollController,
      child: ListView.builder(
        controller: controller.scrollController,
        itemCount: controller.timeZones.length,
        itemBuilder: (context, index) {
          return SizedBox(
            height: 50,
            child: ListTile(
              title: Text(
                controller.timeZones[index].formatTimeZoneName(),
                style: TextStyle(
                  color: controller.timeZones[index].isSelected
                      ? RoomColors.menuButtonBlue
                      : RoomColors.textBlack,
                ),
              ),
              onTap: () => controller.updateTimeZone(index),
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'selectTimeZone'.roomTr,
          style: const TextStyle(fontSize: 16, color: RoomColors.titleBlack),
        ),
        iconTheme: const IconThemeData(color: RoomColors.titleBlack, size: 22),
        backgroundColor: Colors.white,
        scrolledUnderElevation: 0,
      ),
      backgroundColor: Colors.white,
      resizeToAvoidBottomInset: false,
      body: SafeArea(child: _buildView()),
    );
  }
}
