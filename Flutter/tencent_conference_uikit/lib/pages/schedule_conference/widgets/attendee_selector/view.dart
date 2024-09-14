import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:tencent_conference_uikit/common/index.dart';

import 'index.dart';
import 'widgets/widgets.dart';

class AttendeesSelectorPage extends GetView<AttendeesSelectorController> {
  const AttendeesSelectorPage({Key? key}) : super(key: key);

  Widget _buildView() {
    return Column(
      children: [
        const SizedBox(height: 12),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: SearchBarWidget(
            height: 42,
            backgroundColor: RoomColors.searchBarGrey,
            textColor: Colors.black,
            iconColor: RoomColors.hintGrey,
            radius: 50,
            hintText: 'enterIdOrName'.roomTr,
            searchAction: (String text) => controller.searchAttendees(text),
          ),
        ),
        const SizedBox(height: 16),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              Text(
                '${'allMembers'.roomTr} (${controller.scheduleConferenceController.friendList.length})',
                style:
                    const TextStyle(color: RoomColors.textBlack, fontSize: 14),
                textAlign: TextAlign.left,
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Expanded(
          child: Obx(
            () {
              final isSearchBarEmpty = controller.isSearchBarEmpty.value;
              final attendees = isSearchBarEmpty
                  ? controller.scheduleConferenceController.friendList
                  : controller.searchResults;
              return Scrollbar(
                child: ListView.builder(
                  itemCount: attendees.length,
                  itemBuilder: (BuildContext context, int index) {
                    return Obx(() {
                      final attendeeItem = attendees[index];
                      final isSelected =
                          controller.selectedAttendees.contains(attendeeItem);
                      return Column(
                        children: [
                          AttendeeItem(
                            avatarUrl: attendeeItem.avatarUrl,
                            userName: attendeeItem.userName,
                            userID: attendeeItem.userId,
                            isSelected: isSelected,
                            onTap: () => controller.onAttendeesPressed(
                                isSelected, attendeeItem),
                          ),
                          const Divider(
                            color: RoomColors.dividerLightGrey,
                            height: 1,
                          ),
                        ],
                      );
                    });
                  },
                ),
              );
            },
          ),
        ),
        const SelectedAttendeesWidget(),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<AttendeesSelectorController>(
      init: AttendeesSelectorController(),
      id: "attendees_selector",
      builder: (_) {
        return Scaffold(
          appBar: AppBar(
            title: Text(
              'selectAttendees'.roomTr,
              style:
                  const TextStyle(fontSize: 16, color: RoomColors.titleBlack),
            ),
            iconTheme:
                const IconThemeData(color: RoomColors.titleBlack, size: 22),
            backgroundColor: Colors.white,
            elevation: 0,
          ),
          backgroundColor: Colors.white,
          resizeToAvoidBottomInset: false,
          body: SafeArea(
            child: _buildView(),
          ),
        );
      },
    );
  }
}
