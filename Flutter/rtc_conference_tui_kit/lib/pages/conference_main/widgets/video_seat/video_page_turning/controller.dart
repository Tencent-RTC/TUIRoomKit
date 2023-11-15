import 'dart:math';
import 'package:get/get.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';
import 'package:rtc_room_engine/rtc_room_engine.dart';

class VideoPageTurningController extends GetxController {
  VideoPageTurningController();

  final pageSize = 6;
  final _currentIndex = 0.obs;
  int get currentIndex => _currentIndex.value;
  set currentIndex(int value) => _currentIndex.value = value;

  int getStartIndex(int pageIndex) {
    return pageIndex * pageSize;
  }

  int getPageStarIndex(int pageIndex) {
    return RoomStore.to.isSharing.value
        ? getStartIndex(pageIndex - 1)
        : getStartIndex(pageIndex);
  }

  int getPageEndIndex(int pageIndex) {
    return min(
        (RoomStore.to.isSharing.value
                ? getStartIndex(pageIndex - 1)
                : getStartIndex(pageIndex)) +
            pageSize -
            1,
        _getUserListLength() - 1);
  }

  bool isScreenShareLayout(int pageIndex) {
    return RoomStore.to.isSharing.value && pageIndex == 0;
  }

  bool isTwoUserLayout() {
    if (_getUserListLength() > 2 || RoomStore.to.isSharing.value) {
      return false;
    }
    if (_getUserListLength() == 2 && _noVideoAvailable()) {
      return false;
    }
    return true;
  }

  bool _noVideoAvailable() {
    if (RoomStore.to.roomInfo.speechMode ==
        TUISpeechMode.speakAfterTakingSeat) {
      for (var element in RoomStore.to.seatedUserList) {
        if (element.hasVideoStream.value) {
          return false;
        }
      }
    } else {
      for (var element in RoomStore.to.userInfoList) {
        if (element.hasVideoStream.value) {
          return false;
        }
      }
    }
    return true;
  }

  int getTotalPageCount() {
    return RoomStore.to.isSharing.value
        ? (_getUserListLength() / pageSize).ceil() + 1
        : (_getUserListLength() / pageSize).ceil();
  }

  bool getIndicatorVisibility() {
    return RoomStore.to.isSharing.value
        ? true
        : (_getUserListLength() / pageSize).ceil() > 1;
  }

  int _getUserListLength() {
    return RoomStore.to.roomInfo.speechMode ==
            TUISpeechMode.speakAfterTakingSeat
        ? RoomStore.to.seatedUserList.length
        : RoomStore.to.userInfoList.length;
  }
}
