import 'package:get/get.dart';
import 'package:tencent_conference_uikit/common/index.dart';
import 'package:tencent_conference_uikit/pages/schedule_conference/controller.dart';

class AttendeesSelectorController extends GetxController {
  AttendeesSelectorController();

  final scheduleConferenceController = Get.find<ScheduleConferenceController>();

  RxBool isSearchBarEmpty = true.obs;
  RxList<UserInfo> searchResults = RxList<UserInfo>();
  var selectedAttendees = RxSet<UserInfo>();

  @override
  void onInit() {
    selectedAttendees =
        Set<UserInfo>.from(scheduleConferenceController.selectedAttendees).obs;
    super.onInit();
  }

  void searchAttendees(String value) {
    if (value.isNotEmpty) {
      List<UserInfo> results = scheduleConferenceController.friendList
          .where((user) =>
              user.userId.toLowerCase().contains(value.toLowerCase()) ||
              (user.userName).toLowerCase().contains(value.toLowerCase()))
          .toList();
      searchResults.assignAll(results);
      isSearchBarEmpty.value = false;
    } else {
      searchResults.clear();
      isSearchBarEmpty.value = true;
    }
  }

  void onAttendeesPressed(bool isSelected, UserInfo attendee) {
    if (isSelected) {
      selectedAttendees.remove(attendee);
    } else {
      selectedAttendees.add(attendee);
    }
  }

  void confirmAttendees() {
    scheduleConferenceController.selectedAttendees.clear();
    scheduleConferenceController.selectedAttendees =
        selectedAttendees.toList().obs;
    scheduleConferenceController.selectedAttendeesUserId =
        selectedAttendees.map((attendee) => attendee.userId).toList();
    Get.back();
  }
}
