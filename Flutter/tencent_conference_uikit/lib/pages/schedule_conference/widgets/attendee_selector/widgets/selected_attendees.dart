import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:tencent_conference_uikit/common/index.dart';

import '../index.dart';

class SelectedAttendeesWidget extends GetView<AttendeesSelectorController> {
  const SelectedAttendeesWidget({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 50.0,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            spreadRadius: -5,
            blurRadius: 7,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: Row(
        children: [
          Obx(
            () => Expanded(
              child: controller.selectedAttendees.length <= 10
                  ? _buildSelectedAttendees()
                  : _buildSelectedText(),
            ),
          ),
          const SizedBox(width: 8),
          SizedBox(
            height: 32.0,
            width: 100.0,
            child: ElevatedButton(
              style: ButtonStyle(
                backgroundColor:
                    MaterialStateProperty.all<Color>(RoomColors.menuButtonBlue),
                shape: MaterialStateProperty.all(
                  RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16)),
                ),
                padding: MaterialStateProperty.all(const EdgeInsets.all(0)),
              ),
              onPressed: () => controller.confirmAttendees(),
              child: Obx(
                () => Text(
                  '${'sure'.roomTr}(${controller.selectedAttendees.length})',
                  style: const TextStyle(color: Colors.white, fontSize: 14),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSelectedAttendees() {
    return ListView.builder(
      scrollDirection: Axis.horizontal,
      itemCount: controller.selectedAttendees.length,
      itemBuilder: (BuildContext context, int index) {
        return Row(
          children: [
            Image.network(
              controller.selectedAttendees.elementAt(index).avatarUrl,
              width: 32.0,
            ),
            const SizedBox(width: 8),
          ],
        );
      },
    );
  }

  Widget _buildSelectedText() {
    return GestureDetector(
      onTap: () => showConferenceBottomSheet(
        AttendeesSheet(attendeesSet: controller.selectedAttendees),
      ),
      child: Row(
        children: [
          Text(
            '${'selected'.roomTr}: ${controller.selectedAttendees.length}${'people'.roomTr}',
            style: const TextStyle(
              color: RoomColors.textBlack,
              fontSize: 14,
            ),
          ),
          const SizedBox(width: 4),
          Image.asset(
            AssetsImages.roomUpArrow,
            width: 16,
            height: 16,
            package: 'tencent_conference_uikit',
          ),
        ],
      ),
    );
  }
}
