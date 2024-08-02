import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_room_engine/rtc_room_engine.dart';
import 'package:tencent_conference_uikit/common/index.dart';

class AttendeesSheet extends StatelessWidget {
  const AttendeesSheet({
    super.key,
    this.attendeesSet,
    this.attendeesList,
    this.scrollController,
    this.length,
  });

  final RxSet<UserInfo>? attendeesSet;
  final RxList<TUIUserInfo>? attendeesList;
  final ScrollController? scrollController;
  final int? length;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
        builder: (BuildContext context, BoxConstraints constraints) {
      Orientation orientation = MediaQuery.of(context).orientation;
      return Obx(() {
        int length =
            this.length ?? attendeesSet?.length ?? attendeesList?.length ?? 0;
        return BottomSheetWidget(
          height: orientation == Orientation.portrait
              ? 610.0.scale375Height()
              : Get.height,
          padding: EdgeInsets.zero,
          color: Colors.white,
          orientation: orientation,
          child: Column(
            children: [
              Visibility(
                visible: orientation == Orientation.landscape,
                child: const SizedBox(height: 16),
              ),
              Row(
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Text(
                      '${'selected'.roomTr} ($length)',
                      style: const TextStyle(
                          fontSize: 18, color: RoomColors.btnGrey),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Expanded(
                child: Scrollbar(
                  controller: scrollController,
                  child: ListView.builder(
                    padding: EdgeInsets.zero,
                    controller: scrollController,
                    itemCount:
                        attendeesSet?.length ?? attendeesList?.length ?? 0,
                    itemBuilder: (BuildContext context, int index) {
                      final attendee = attendeesSet?.elementAt(index) ??
                          attendeesList?[index];
                      return Column(
                        children: [
                          attendeesSet != null
                              ? AttendeeItem(
                                  avatarUrl: (attendee as UserInfo).avatarUrl,
                                  userName: attendee.userName,
                                  userID: attendee.userId,
                                  isDeleteItem: true,
                                  onDeleteButtonPressed: () =>
                                      attendeesSet?.remove(attendee),
                                )
                              : AttendeeItem(
                                  avatarUrl: (attendee as TUIUserInfo)
                                          .avatarUrl
                                          .isEmpty
                                      ? Constants.defaultAvatarUrl
                                      : attendee.avatarUrl,
                                  userName: attendee.userName,
                                  userID: attendee.userId,
                                  isNeedSelect: false,
                                ),
                          const Divider(
                            color: RoomColors.dividerLightGrey,
                            height: 1,
                          ),
                        ],
                      );
                    },
                  ),
                ),
              ),
            ],
          ),
        );
      });
    });
  }
}
